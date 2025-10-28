import { expect } from "chai";
import { deployments, ethers } from "hardhat";

const HAND_SIZE = 5;

describe("CardGame", function () {
  async function init() {
    await deployments.fixture(["CardGame"]);
    const deployment = await deployments.get("CardGame");
    const contract = await ethers.getContractAt("CardGame", deployment.address);
    const [player] = await ethers.getSigners();
    return { contract, player };
  }

  it("deals unique non-overlapping hands", async function () {
    const { contract, player } = await init();

    await contract.connect(player).startGame();
    const game = await contract.getGame(player.address);

    const playerHand = game[0].map((card: bigint) => Number(card));
    const systemHand = game[2].map((card: bigint) => Number(card));

    expect(playerHand).to.have.lengthOf(HAND_SIZE);
    expect(systemHand).to.have.lengthOf(HAND_SIZE);

    const playerSet = new Set(playerHand);
    const systemSet = new Set(systemHand);

    expect(playerSet.size).to.equal(HAND_SIZE);
    expect(systemSet.size).to.equal(HAND_SIZE);

    for (const card of playerHand) {
      expect(systemSet.has(card)).to.equal(false);
    }

    const metadata = {
      rounds: Number(game[4]),
      playerScore: Number(game[5]),
      systemScore: Number(game[6]),
      active: game[7],
    };

    expect(metadata.rounds).to.equal(0);
    expect(metadata.playerScore).to.equal(0);
    expect(metadata.systemScore).to.equal(0);
    expect(metadata.active).to.equal(true);
  });

  it("tracks used cards and rounds", async function () {
    const { contract, player } = await init();

    await contract.connect(player).startGame();
    const initialGame = await contract.getGame(player.address);
    const playerHand = initialGame[0].map((card: bigint) => Number(card));

    const firstCard = playerHand[0];
    const secondCard = playerHand[1];

    await contract.connect(player).playCard(firstCard);
    let updatedGame = await contract.getGame(player.address);

    expect(updatedGame[1][0]).to.equal(true);
    expect(Number(updatedGame[4])).to.equal(1);
    expect(Number(updatedGame[8])).to.be.greaterThan(0);

    await contract.connect(player).playCard(secondCard);
    updatedGame = await contract.getGame(player.address);

    expect(updatedGame[1][0]).to.equal(true);
    expect(updatedGame[1][1]).to.equal(true);
    expect(Number(updatedGame[4])).to.equal(2);
  });

  it("completes a full game and resets", async function () {
    const { contract, player } = await init();

    await contract.connect(player).startGame();
    let currentGame = await contract.getGame(player.address);
    const playerCards = currentGame[0].map((card: bigint) => Number(card));

    for (const card of playerCards) {
      await contract.connect(player).playCard(card);
    }

    currentGame = await contract.getGame(player.address);
    expect(Number(currentGame[4])).to.equal(HAND_SIZE);
    expect(currentGame[7]).to.equal(false);

    await contract.connect(player).startGame();
    const newGame = await contract.getGame(player.address);
    expect(newGame[7]).to.equal(true);
    expect(Number(newGame[4])).to.equal(0);
  });

  it("prevents playing unused or invalid cards", async function () {
    const { contract, player } = await init();

    await contract.connect(player).startGame();
    const game = await contract.getGame(player.address);
    const card = Number(game[0][0]);

    await contract.connect(player).playCard(card);
    await expect(contract.connect(player).playCard(card)).to.be.revertedWith("Card unavailable");
    await expect(contract.connect(player).playCard(99)).to.be.revertedWith("Card unavailable");
  });

  it("prevents extra rounds", async function () {
    const { contract, player } = await init();

    await contract.connect(player).startGame();
    const game = await contract.getGame(player.address);
    const cards = game[0].map((card: bigint) => Number(card));

    for (const card of cards) {
      await contract.connect(player).playCard(card);
    }

    await expect(contract.connect(player).playCard(cards[0])).to.be.revertedWith("Game not active");
  });
});
