// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {BettingContract} from "../src/BettingContract.sol";

contract CreatePoolScript is Script {
    function run() public {
        uint256 ownerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Get contract address from environment
        try vm.envAddress("BETTING_CONTRACT_ADDRESS") returns (address contractAddress) {
            // Hardcoded pool parameters instead of using environment variables
            uint256 timestamp = block.timestamp;

            // Add timestamp to question to make it unique
            string memory question = string(
                abi.encodePacked(
                    "Will I WIN the case against the CORRUPT NY Attorney General? The case is RIGGED but the PEOPLE know the TRUTH! (",
                    vm.toString(timestamp),
                    ")"
                )
            );
            string[2] memory options = ["YES, TOTAL VICTORY!", "NO, DEEP STATE WINS"];
            uint40 betsCloseAt = uint40(block.timestamp + 7 days);
            string memory imageUrl =
                "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fa57.foxnews.com%2Fstatic.foxnews.com%2Ffoxnews.com%2Fcontent%2Fuploads%2F2024%2F03%2F1200%2F675%2FGettyImages-2046568057.jpg%3Fve%3D1%26tl%3D1&f=1&nofb=1&ipt=024458203d063e012384059b488227e0952a1ab564494040c9d0d182b6466965&ipo=images";

            console.log("Creating pool with:");
            console.log("  Question:", question);
            console.log("  Option 0:", options[0]);
            console.log("  Option 1:", options[1]);
            console.log("  Bets Close At:", betsCloseAt);
            console.log("  Contract:", contractAddress);
            console.log("  Image URL:", imageUrl);

            BettingContract.CreatePoolParams memory params = BettingContract.CreatePoolParams({
                question: "test",
                options: ["yes", "no"],
                betsCloseAt: 1742586969,
                originalTruthSocialPostId: "114200313009802638",
                imageUrl: imageUrl
            });

            BettingContract bettingContract = BettingContract(contractAddress);

            vm.startBroadcast(ownerPrivateKey);
            uint256 poolId = bettingContract.createPool(params);
            vm.stopBroadcast();

            console.log("Created pool with ID:", poolId);
        } catch {
            console.log("Error: BETTINGPOOLS_CONTRACT_ADDRESS environment variable not set");
            revert("BETTINGPOOLS_CONTRACT_ADDRESS not set");
        }
    }
}
