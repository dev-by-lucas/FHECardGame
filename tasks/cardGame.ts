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
  .addParam("index", "Card index between 0 and 4")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const deployment = await getCardGameDeployment(taskArguments, hre);
    const { ethers } = hre;

    const index = parseInt(taskArguments.index, 10);
    if (!Number.isInteger(index) || index < 0 || index >= 5) {
      throw new Error("Index must be an integer between 0 and 4");
    }

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("CardGame", deployment.address);

    const tx = await contract.connect(signer).playCard(index);
    console.log(`playCard tx: ${tx.hash}`);
    await tx.wait();
    console.log(`Played card at index ${index}`);
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
      playerHand: game[0].map((value: string) => String(value)),
      playerUsed: game[1].map((value: boolean) => value),
      systemHand: game[2].map((value: string) => String(value)),
      systemRevealed: game[3].map((value: boolean) => value),
      roundsPlayed: Number(game[4]),
      playerScore: String(game[5]),
      systemScore: String(game[6]),
      active: game[7],
      lastSystemCard: String(game[8]),
    };

    console.log(JSON.stringify(formatted, null, 2));
  });
