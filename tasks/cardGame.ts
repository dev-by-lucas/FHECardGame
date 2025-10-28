import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

const getCardGameDeployment = async (taskArguments: TaskArguments, hre: any) => {
  const { deployments } = hre;
  if (taskArguments.address) {
    return { address: taskArguments.address };
  }
  return deployments.get("CardGame");
};

task("game:address", "Prints the CardGame address").setAction(async (taskArguments: TaskArguments, hre) => {
  const deployment = await getCardGameDeployment(taskArguments, hre);
  console.log(`CardGame address: ${deployment.address}`);
});

task("game:start", "Starts a new game").setAction(async (taskArguments: TaskArguments, hre) => {
  const deployment = await getCardGameDeployment(taskArguments, hre);
  const { ethers } = hre;

  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("CardGame", deployment.address);

  const tx = await contract.connect(signer).startGame();
  console.log(`startGame tx: ${tx.hash}`);
  await tx.wait();
  console.log("Game started");
});

task("game:play", "Plays a card in the current game")
  .addParam("card", "Card value between 1 and 13")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const deployment = await getCardGameDeployment(taskArguments, hre);
    const { ethers } = hre;

    const card = parseInt(taskArguments.card, 10);
    if (!Number.isInteger(card) || card < 1 || card > 13) {
      throw new Error("Card must be an integer between 1 and 13");
    }

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("CardGame", deployment.address);

    const tx = await contract.connect(signer).playCard(card);
    console.log(`playCard tx: ${tx.hash}`);
    await tx.wait();
    console.log(`Played card ${card}`);
  });

task("game:view", "Displays the current game state")
  .addOptionalParam("player", "Player address to inspect")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const deployment = await getCardGameDeployment(taskArguments, hre);
    const { ethers } = hre;

    const [signer] = await ethers.getSigners();
    const playerAddress = taskArguments.player ?? signer.address;

    const contract = await ethers.getContractAt("CardGame", deployment.address);
    const game = await contract.getGame(playerAddress);

    const formatted = {
      playerHand: game[0].map((value: bigint) => Number(value)),
      playerUsed: game[1].map((value: boolean) => value),
      systemHand: game[2].map((value: bigint) => Number(value)),
      systemRevealed: game[3].map((value: boolean) => value),
      roundsPlayed: Number(game[4]),
      playerScore: Number(game[5]),
      systemScore: Number(game[6]),
      active: game[7],
      lastSystemCard: Number(game[8]),
    };

    console.log(JSON.stringify(formatted, null, 2));
  });
