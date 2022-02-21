const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { PROFIT_UNITY_CONTRACT_ADDRESS } = require("../constants"); 

async function main(){
    const ProfitUnityContract = PROFIT_UNITY_CONTRACT_ADDRESS; //address of my nftCollection contract
    const profitUnityTokenContract = await ethers.getContractFactory("ProfitUnityToken");
    const deployedProfitUnityTokenContract = await profitUnityTokenContract.deploy(ProfitUnityContract);
    console.log("Profit Unity Token Contract Address:", deployedProfitUnityTokenContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });