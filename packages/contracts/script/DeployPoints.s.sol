// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PointsToken} from "../src/PointsToken.sol";

contract DeployFreedomScript is Script {
  function run() public returns (PointsToken) {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

    // Token parameters
    string memory name = "Freedom Points";
    string memory symbol = "FREEDOM";
    uint8 decimals = 6; // Be consistent with USDC
    uint256 initialSupply = 1_000_000_000 * 10 ** decimals; // 1 billion tokens with proper decimal adjustment

    console.log("Deploying Freedom Points Token with:");
    console.log("  Name:", name);
    console.log("  Symbol:", symbol);
    console.log("  Decimals:", decimals);
    console.log("  Initial Supply:", initialSupply);

    vm.startBroadcast(deployerPrivateKey);
    PointsToken pointsToken = new PointsToken(name, symbol, decimals, initialSupply);
    vm.stopBroadcast();

    console.log("Freedom Points Token deployed at:", address(pointsToken));
    return pointsToken;
  }
}
