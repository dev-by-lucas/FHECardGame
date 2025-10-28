import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedCardGame = await deploy("CardGame", {
    from: deployer,
    log: true,
  });

  console.log(`CardGame contract: `, deployedCardGame.address);
};
export default func;
func.id = "deploy_card_game"; // id required to prevent reexecution
func.tags = ["CardGame"];
