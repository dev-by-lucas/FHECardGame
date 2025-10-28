import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import hre, { deployments, ethers } from "hardhat";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const HAND_SIZE = 5;

describe("CardGame", function () {
  async function init() {
    await deployments.fixture(["CardGame"]);
    const deployment = await deployments.get("CardGame");
    const contract = await ethers.getContractAt("CardGame", deployment.address);
    const [player] = await ethers.getSigners();
    await hre.fhevm.assertCoprocessorInitialized(contract, "CardGame");
    return { contract, player, deployment };
  }

  async function decryptHandForPlayer(
    handles: readonly string[],
    contractAddress: string,
    player: HardhatEthersSigner,
  ): Promise<number[]> {
    const decrypted: number[] = [];
    for (const handle of handles) {
      const value = await hre.fhevm.userDecryptEuint(FhevmType.euint8, handle, contractAddress, player);
      decrypted.push(Number(value));
    }
    return decrypted;
  }

  async function decryptHandWithDebugger(handles: readonly string[]): Promise<number[]> {
    const decrypted: number[] = [];
    for (const handle of handles) {
      const value = await hre.fhevm.debugger.decryptEuint(FhevmType.euint8, handle);
      decrypted.push(Number(value));
    }
    return decrypted;
  }

  function asHandleArray(value: any): string[] {
    return (value as string[]).map((handle) => handle);
  }

  it("deals unique non-overlapping hands", async function () {
    const { contract, player, deployment } = await init();

    await contract.connect(player).startGame();
    const game = await contract.getGame(player.address);

    const playerHandHandles = asHandleArray(game[0]);
    const systemHandHandles = asHandleArray(game[2]);

    const playerHand = await decryptHandForPlayer(playerHandHandles, deployment.address, player);
    const systemHand = await decryptHandWithDebugger(systemHandHandles);

    expect(playerHand).to.have.lengthOf(HAND_SIZE);
    expect(systemHand).to.have.lengthOf(HAND_SIZE);

    const playerSet = new Set(playerHand);
    const systemSet = new Set(systemHand);

    expect(playerSet.size).to.equal(HAND_SIZE);
    expect(systemSet.size).to.equal(HAND_SIZE);

    for (const card of playerHand) {
      expect(systemSet.has(card)).to.equal(false);
    }

    const rounds = Number(game[4]);
    const playerScore = await hre.fhevm.userDecryptEuint(FhevmType.euint8, game[5], deployment.address, player);
    const systemScore = await hre.fhevm.userDecryptEuint(FhevmType.euint8, game[6], deployment.address, player);

    expect(rounds).to.equal(0);
    expect(playerScore).to.equal(0n);
    expect(systemScore).to.equal(0n);
    expect(game[7]).to.equal(true);
  });

  it("tracks used cards, rounds and last system card", async function () {
    const { contract, player, deployment } = await init();

    await contract.connect(player).startGame();
    const initialGame = await contract.getGame(player.address);
    const playerHandHandles = asHandleArray(initialGame[0]);

    await contract.connect(player).playCard(0);
    let updatedGame = await contract.getGame(player.address);

    expect(updatedGame[1][0]).to.equal(true);
    expect(Number(updatedGame[4])).to.equal(1);

    const lastSystemCard = await hre.fhevm.userDecryptEuint(
      FhevmType.euint8,
      updatedGame[8],
      deployment.address,
      player,
    );
    expect(lastSystemCard).to.be.greaterThan(0n);

    await contract.connect(player).playCard(1);
    updatedGame = await contract.getGame(player.address);

    expect(updatedGame[1][0]).to.equal(true);
    expect(updatedGame[1][1]).to.equal(true);
    expect(Number(updatedGame[4])).to.equal(2);

    const decryptedPlayerCard = await decryptHandForPlayer([playerHandHandles[0]], deployment.address, player);
    expect(decryptedPlayerCard[0]).to.be.greaterThanOrEqual(1);
  });

  it("completes a full game and resets", async function () {
    const { contract, player, deployment } = await init();

    await contract.connect(player).startGame();

    for (let index = 0; index < HAND_SIZE; index++) {
      await contract.connect(player).playCard(index);
    }

    let currentGame = await contract.getGame(player.address);
    expect(Number(currentGame[4])).to.equal(HAND_SIZE);
    expect(currentGame[7]).to.equal(false);

    const finalPlayerScore = await hre.fhevm.userDecryptEuint(
      FhevmType.euint8,
      currentGame[5],
      deployment.address,
      player,
    );
    const finalSystemScore = await hre.fhevm.userDecryptEuint(
      FhevmType.euint8,
      currentGame[6],
      deployment.address,
      player,
    );

    expect(finalPlayerScore).to.be.at.least(0n);
    expect(finalSystemScore).to.be.at.least(0n);

    await contract.connect(player).startGame();
    currentGame = await contract.getGame(player.address);

    const resetPlayerScore = await hre.fhevm.userDecryptEuint(
      FhevmType.euint8,
      currentGame[5],
      deployment.address,
      player,
    );

    expect(currentGame[7]).to.equal(true);
    expect(Number(currentGame[4])).to.equal(0);
    expect(resetPlayerScore).to.equal(0n);
  });

  it("prevents playing reused or invalid indices", async function () {
    const { contract, player } = await init();

    await contract.connect(player).startGame();

    await contract.connect(player).playCard(0);
    await expect(contract.connect(player).playCard(0)).to.be.revertedWith("Card already used");
    await expect(contract.connect(player).playCard(5)).to.be.revertedWith("Invalid card index");
  });

  it("prevents extra rounds", async function () {
    const { contract, player } = await init();

    await contract.connect(player).startGame();

    for (let index = 0; index < HAND_SIZE; index++) {
      await contract.connect(player).playCard(index);
    }

    await expect(contract.connect(player).playCard(0)).to.be.revertedWith("Game not active");
  });
});
