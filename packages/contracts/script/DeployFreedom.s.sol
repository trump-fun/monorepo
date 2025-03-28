// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Freedom} from "../src/Freedom.sol";

contract DeployFreedomScript is Script {
    function run() public returns (Freedom) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Token parameters
        string memory name = "FREEDOM";
        string memory symbol = "FREEDOM";
        uint8 decimals = 6; // Be consistent with USDC
        uint256 initialSupply = 1_000_000_000_000_000 * 10 ** decimals; // 1 quadrillion tokens with proper decimal adjustment

        console.log("Deploying Freedom with:");
        console.log("  Name:", name);
        console.log("  Symbol:", symbol);
        console.log("  Decimals:", decimals);
        console.log("  Initial Supply:", initialSupply);

        vm.startBroadcast(deployerPrivateKey);
        Freedom freedom = new Freedom(name, symbol, decimals, initialSupply);
        vm.stopBroadcast();

        console.log("Freedom deployed at:", address(freedom));
        return freedom;
    }
}
