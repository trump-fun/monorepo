// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {BettingContract} from "../src/BettingContract.sol";
import {Freedom} from "../src/Freedom.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract EndToEndTestScript is Script {
    function run() public {
        uint256 ownerPrivateKey = vm.envUint("PRIVATE_KEY");
        address ownerAddress = vm.addr(ownerPrivateKey);

        // User private keys (skip index 0 for clarity)
        uint256[] memory userPrivateKeys = new uint256[](4);
        userPrivateKeys[1] = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80; // Account #1
        userPrivateKeys[2] = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d; // Account #2
        userPrivateKeys[3] = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a; // Account #3

        // Setup corresponding user addresses
        address[] memory userAddresses = new address[](4);
        userAddresses[1] = vm.addr(userPrivateKeys[1]);
        userAddresses[2] = vm.addr(userPrivateKeys[2]);
        userAddresses[3] = vm.addr(userPrivateKeys[3]);

        // Broadcast setup transactions
        vm.startBroadcast(ownerPrivateKey);

        // 1. Deploy test tokens
        // Create a mock ERC20 for USDC with 6 decimals
        Freedom usdc = new Freedom("USD Coin", "USDC", 6, 0);
        // Create a Freedom token with 18 decimals
        Freedom freedom = new Freedom("Freedom", "FREEDOM", 18, 0);

        // 2. Deploy betting contract
        BettingContract bettingContract = new BettingContract(address(usdc), address(freedom));

        // 3. Mint tokens to owner and test users
        uint256 usdcMintAmount = 1000 * 10 ** 6; // 1000 USDC
        uint256 freedomMintAmount = 1000 * 10 ** 18; // 1000 FREEDOM

        // Mint to owner
        usdc.mint(ownerAddress, usdcMintAmount);
        freedom.mint(ownerAddress, freedomMintAmount);

        // Mint to test users
        for (uint256 i = 1; i <= 3; i++) {
            usdc.mint(userAddresses[i], usdcMintAmount);
            freedom.mint(userAddresses[i], freedomMintAmount);
        }

        vm.stopBroadcast();

        // Setup contract to test
        // -------------------------
        console.log("");
        console.log("==== Contract Addresses ====");
        console.log("USDC Token:", address(usdc));
        console.log("FREEDOM Token:", address(freedom));
        console.log("Betting Contract:", address(bettingContract));
        console.log("");

        // Create pool
        // -------------------------
        console.log("==== Creating Betting Pool ====");
        vm.startBroadcast(ownerPrivateKey);

        // Create pool with Trump-themed prediction about pardons
        BettingContract.CreatePoolParams memory poolParams = BettingContract.CreatePoolParams({
            question: "Will I PARDON MYSELF when I become president? The DEEP STATE is TERRIFIED!",
            options: ["YES, ABSOLUTELY!", "NO, DON'T NEED TO!"],
            betsCloseAt: uint40(block.timestamp + 1 days),
            originalTruthSocialPostId: "1",
            imageUrl: "https://example.com/image1.jpg"
        });

        uint256 poolId = bettingContract.createPool(poolParams);
        console.log("Created Pool ID:", poolId);

        vm.stopBroadcast();

        // User 1 places bet on option 0 (YES) with USDC
        // -------------------------
        console.log("");
        console.log("==== User 1 Betting (YES with USDC) ====");
        vm.startBroadcast(userPrivateKeys[1]);

        // Approve USDC spending
        uint256 user1BetAmount = 10 * 10 ** 6; // 10 USDC
        usdc.approve(address(bettingContract), user1BetAmount);

        // Place bet: poolId=1, option=0 (YES), amount=10 USDC
        uint256 betId1 =
            bettingContract.placeBet(poolId, 0, user1BetAmount, userAddresses[1], BettingContract.TokenType.USDC);
        console.log("User 1 placed bet with ID:", betId1);

        vm.stopBroadcast();

        // User 2 places bet on option 1 (NO) with USDC
        // -------------------------
        console.log("");
        console.log("==== User 2 Betting (NO with USDC) ====");
        vm.startBroadcast(userPrivateKeys[2]);

        // Approve USDC spending
        uint256 user2BetAmount = 20 * 10 ** 6; // 20 USDC
        usdc.approve(address(bettingContract), user2BetAmount);

        // Place bet: poolId=1, option=1 (NO), amount=20 USDC
        uint256 betId2 =
            bettingContract.placeBet(poolId, 1, user2BetAmount, userAddresses[2], BettingContract.TokenType.USDC);
        console.log("User 2 placed bet with ID:", betId2);

        vm.stopBroadcast();

        // User 3 places bet on option 0 (YES) with FREEDOM
        // -------------------------
        console.log("");
        console.log("==== User 3 Betting (YES with FREEDOM) ====");
        vm.startBroadcast(userPrivateKeys[3]);

        // Approve FREEDOM spending
        uint256 user3BetAmount = 15 * 10 ** 18; // 15 FREEDOM
        freedom.approve(address(bettingContract), user3BetAmount);

        // Place bet: poolId=1, option=0 (YES), amount=15 FREEDOM
        uint256 betId3 =
            bettingContract.placeBet(poolId, 0, user3BetAmount, userAddresses[3], BettingContract.TokenType.POINTS);
        console.log("User 3 placed bet with ID:", betId3);

        vm.stopBroadcast();

        // Create second pool
        // -------------------------
        console.log("");
        console.log("==== Creating Second Betting Pool ====");
        vm.startBroadcast(ownerPrivateKey);

        // Create pool about FBI Director
        BettingContract.CreatePoolParams memory poolParams2 = BettingContract.CreatePoolParams({
            question: "Will I FIRE the FBI Director on day ONE? Time to clean up the CORRUPT Deep State!",
            options: ["YES, HE'S GONE!", "NO, KEEPING HIM"],
            betsCloseAt: uint40(block.timestamp + 2 days),
            originalTruthSocialPostId: "2",
            imageUrl: "https://example.com/image2.jpg"
        });

        uint256 poolId2 = bettingContract.createPool(poolParams2);
        console.log("Created Pool ID:", poolId2);

        vm.stopBroadcast();

        // Create third pool
        // -------------------------
        console.log("");
        console.log("==== Creating Third Betting Pool ====");
        vm.startBroadcast(ownerPrivateKey);

        // Create pool about debate
        BettingContract.CreatePoolParams memory poolParams3 = BettingContract.CreatePoolParams({
            question: "Will I DOMINATE the debate against SLEEPY JOE? The ratings will be TREMENDOUS!",
            options: ["YES, TOTAL VICTORY!", "NO, IT'S RIGGED"],
            betsCloseAt: uint40(block.timestamp + 3 days),
            originalTruthSocialPostId: "3",
            imageUrl: "https://example.com/image3.jpg"
        });

        uint256 poolId3 = bettingContract.createPool(poolParams3);
        console.log("Created Pool ID:", poolId3);

        vm.stopBroadcast();

        // Owner grades first pool (option 0 wins - YES)
        // -------------------------
        console.log("");
        console.log("==== Grading First Pool (YES wins) ====");
        vm.startBroadcast(ownerPrivateKey);

        // Grade pool: poolId=1, responseOption=0 (YES wins)
        bettingContract.gradeBet(poolId, 0);
        console.log("Pool", poolId, "graded with option 0 (YES) as winner");

        vm.stopBroadcast();

        // User 1 and User 3 withdraw their winnings
        // -------------------------
        console.log("");
        console.log("==== Users Withdrawing Winnings ====");

        // User 1 withdraws USDC winnings
        vm.startBroadcast(userPrivateKeys[1]);
        bettingContract.withdrawAll(BettingContract.TokenType.USDC);
        console.log("User 1 withdrew USDC winnings");
        vm.stopBroadcast();

        // User 3 withdraws FREEDOM winnings
        vm.startBroadcast(userPrivateKeys[3]);
        bettingContract.withdrawAll(BettingContract.TokenType.POINTS);
        console.log("User 3 withdrew FREEDOM winnings");
        vm.stopBroadcast();

        // Print final balances
        // -------------------------
        console.log("");
        console.log("==== Final Token Balances ====");
        console.log("User 1 USDC:", usdc.balanceOf(userAddresses[1]) / 10 ** 6);
        console.log("User 2 USDC:", usdc.balanceOf(userAddresses[2]) / 10 ** 6);
        console.log("User 3 FREEDOM:", freedom.balanceOf(userAddresses[3]) / 10 ** 18);
        console.log("Owner USDC fees:", usdc.balanceOf(ownerAddress) / 10 ** 6 - 1000);
        console.log("Owner FREEDOM fees:", freedom.balanceOf(ownerAddress) / 10 ** 18 - 1000);
        console.log("");
        console.log("==== End-to-End Test Complete ====");
    }
}
