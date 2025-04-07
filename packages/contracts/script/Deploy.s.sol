// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {BettingContract} from "../src/BettingContract.sol";

contract DeployScript is Script {
  function run() public returns (BettingContract) {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

    // Check if USDC_ADDRESS is set
    try vm.envAddress("USDC_ADDRESS") returns (address usdcAddress) {
      // Check if POINTS_TOKEN_ADDRESS is set
      try vm.envAddress("FREEDOM_ADDRESS") returns (address freedomAddress) {
        console.log("Deploying BettingContract with:");
        console.log("  USDC Address:", usdcAddress);
        console.log("  Freedom Address:", freedomAddress);

        vm.startBroadcast(deployerPrivateKey);
        BettingContract bettingContract = new BettingContract(usdcAddress, freedomAddress);
        vm.stopBroadcast();

        console.log("BettingContract deployed at:", address(bettingContract));
        return bettingContract;
      } catch {
        console.log("Error: FREEDOM_ADDRESS environment variable not set");
        revert("FREEDOM_ADDRESS not set");
      }
    } catch {
      console.log("Error: USDC_ADDRESS environment variable not set");
      revert("USDC_ADDRESS not set");
    }
  }
}
