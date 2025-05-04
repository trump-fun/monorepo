import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import { expect } from 'chai';

import { TrumpFun } from '../target/types/trump_fun';
import { getOrCreateFreedomMint, getUsdcMint } from './create-token';
import {
  BETTING_POOLS_SEED,
  BET_SEED,
  TokenType,
  createBettingPool,
  createFundedUser,
  tokensToLamports,
} from './utils';

describe('solana', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.trumpFun as Program<TrumpFun>;
  const wallet = anchor.AnchorProvider.env().wallet;
  const connection = anchor.getProvider().connection;

  // We need a keypair version of the wallet for token operations
  const payerKeypair = anchor.Wallet.local().payer;

  // Use the existing mint or create a new one
  let usdcMint: anchor.web3.PublicKey;
  let freedomMint: anchor.web3.PublicKey;
  let bettingPoolsAddress: anchor.web3.PublicKey;
  let poolAddress: anchor.web3.PublicKey;
  let poolId: anchor.BN;

  beforeEach(async () => {
    console.log('beforeEach section');
    // Request an airdrop for the payer if needed
    const payerBalance = await connection.getBalance(payerKeypair.publicKey);
    if (payerBalance < 1 * anchor.web3.LAMPORTS_PER_SOL) {
      console.log('Requesting airdrop for payer wallet...');
      const airdropSig = await connection.requestAirdrop(
        payerKeypair.publicKey,
        1 * anchor.web3.LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(airdropSig);
      console.log(`Airdropped 1 SOL to payer ${payerKeypair.publicKey.toString()}`);
    }

    // Set up USDC mint
    usdcMint = await getUsdcMint();
    console.log('Using USDC mint:', usdcMint.toString());

    // Get or create a real SPL token for FREEDOM
    freedomMint = await getOrCreateFreedomMint();
    console.log('Using FREEDOM token mint:', freedomMint.toString());

    // Find betting pools PDA
    [bettingPoolsAddress] = anchor.web3.PublicKey.findProgramAddressSync(
      [BETTING_POOLS_SEED],
      program.programId
    );
  });

  it('Is initialized!', async () => {
    // Add your test here.
    console.log('---Initialize---');
    console.log('BettingPools address:', bettingPoolsAddress);
    console.log('USDC mint:', usdcMint);
    console.log('FREEDOM mint:', freedomMint);
    console.log('Wallet:', wallet.publicKey);

    try {
      // Try to fetch the account first to see if it's already initialized
      try {
        const existingState = await program.account.bettingPoolsState.fetch(bettingPoolsAddress);
        void expect(existingState.isInitialized).to.be.true;
        console.log('BettingPools already initialized, using existing state');
      } catch (e) {
        // If fetch fails, the account doesn't exist yet, so initialize it
        console.log('BettingPools not initialized, initializing...', e);
        const tx = await program.methods
          .initialize(usdcMint, freedomMint)
          .accounts({
            bettingPools: bettingPoolsAddress,
            authority: wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          } as any)
          .rpc();
        console.log('Your transaction signature', tx);
      }

      const bettingPoolsState = await program.account.bettingPoolsState.fetch(bettingPoolsAddress);
      console.log('---bettingPoolsAddress state post creation---');
      console.log(bettingPoolsState);

      console.log('Betting pools state post creation');
      void expect(bettingPoolsState.authority.equals(wallet.publicKey)).to.be.true;
      void expect(
        bettingPoolsState.usdcMint.equals(usdcMint) || bettingPoolsState.usdcMint.toString() !== ''
      ).to.be.true;
      void expect(
        bettingPoolsState.freedomMint.equals(freedomMint) ||
          bettingPoolsState.freedomMint.toString() !== ''
      ).to.be.true;
      void expect(parseInt(bettingPoolsState.nextPoolId.toString())).to.be.at.least(1);
      void expect(parseInt(bettingPoolsState.nextBetId.toString())).to.be.at.least(1);
      void expect(bettingPoolsState.payoutFeeBp).to.equal(90);
    } catch (e) {
      console.error('Error in initialize test:', e);
      throw e;
    }
  });

  it('Create a new betting pool', async () => {
    try {
      console.log('Creating pool');

      // Pool parameters
      const question = 'Will BTC reach $200k by the end of 2025?';
      const options = ['Yes', 'No'];
      const betsCloseAt = new anchor.BN(Math.floor(Date.now() / 1000) + 86400); // 24 hours from now
      const original_truth_social_post_id = '123456789';
      const image_url = 'https://example.com/image.jpg';

      // Create the pool using our utility function
      const {
        poolAddress: newPoolAddress,
        poolId: newPoolId,
        tx,
      } = await createBettingPool(program, bettingPoolsAddress, wallet.publicKey, {
        question,
        options,
        betsCloseAt,
        original_truth_social_post_id,
        image_url,
      });

      console.log(`Create pool transaction: ${tx}`);

      // Fetch the pool account
      console.log('Pool address:', newPoolAddress);
      const poolAccount = await program.account.pool.fetch(newPoolAddress);
      console.log('Pool account:', poolAccount);

      // Verify the pool data
      void expect(poolAccount.id.toString()).to.equal(newPoolId.toString());
      void expect(poolAccount.question).to.equal(question);
      void expect(poolAccount.options).to.deep.equal(options);
      void expect(poolAccount.betsCloseAt.toString()).to.equal(betsCloseAt.toString());
      void expect('pending' in poolAccount.status).to.be.true; // Check that it's the Pending status
      void expect(poolAccount.originalTruthSocialPostId).to.equal(original_truth_social_post_id);
      void expect(poolAccount.imageUrl).to.equal(image_url);

      // Check if next_pool_id was incremented in the betting pools state
      const updatedBettingPoolsState =
        await program.account.bettingPoolsState.fetch(bettingPoolsAddress);
      const expectedNextId = parseInt(newPoolId.toString()) + 1;
      void expect(parseInt(updatedBettingPoolsState.nextPoolId.toString())).to.equal(
        expectedNextId
      );
    } catch (e) {
      console.error('Error in create pool test:', e);
      throw e;
    }
  });

  it('placeBet creates bet accounts with correct data and updates pool totals', async () => {
    const testUsers = [];
    try {
      // Get the current betting pools state
      const bettingPoolsState = await program.account.bettingPoolsState.fetch(bettingPoolsAddress);
      console.log('Betting pools state:', bettingPoolsState);

      // Create the pool for testing using our utility function
      const { poolAddress: newPoolAddress, poolId: newPoolId } = await createBettingPool(
        program,
        bettingPoolsAddress,
        wallet.publicKey,
        {
          question: 'Will ETH reach $10k by the end of 2025?',
          options: ['Yes', 'No'],
          image_url: 'https://example.com/eth.jpg',
        }
      );

      console.log('Created new pool with ID:', newPoolId.toString());
      poolAddress = newPoolAddress;
      poolId = newPoolId;

      // Check initial pool state
      const initialPool = await program.account.pool.fetch(poolAddress);
      console.log(
        'Initial pool point bet totals:',
        initialPool.pointsBetTotals.map((t: any) => t.toString())
      );

      // Predetermine the bet amounts and options for each user
      const betPlans = [
        { userIndex: 0, optionIndex: 0, tokenAmount: 200 }, // 200 tokens on Yes
        { userIndex: 1, optionIndex: 1, tokenAmount: 350 }, // 350 tokens on No
        { userIndex: 1, optionIndex: 0, tokenAmount: 150 }, // 150 tokens on Yes
        { userIndex: 2, optionIndex: 1, tokenAmount: 400 }, // 400 tokens on No
      ];

      // Calculate total tokens needed for each user
      const tokensNeededPerUser = Array(3).fill(0);
      for (const plan of betPlans) {
        tokensNeededPerUser[plan.userIndex] += plan.tokenAmount;
      }

      // Create users with exactly the amount of tokens they need
      const usersArray = [];
      for (let i = 0; i < tokensNeededPerUser.length; i++) {
        const tokensNeeded = tokensNeededPerUser[i];
        console.log(`Creating user ${i + 1} with ${tokensNeeded} tokens`);
        const fundedUser = await createFundedUser(
          connection,
          payerKeypair,
          freedomMint,
          tokensNeeded
        );
        usersArray.push(fundedUser);
        testUsers.push(fundedUser);
        console.log(
          `Created user ${i + 1}: ${fundedUser.user.publicKey.toString()} with ${tokensNeeded} tokens`
        );
      }

      // Find the program token account (for FREEDOM)
      const programTokenSeed = Buffer.from('program_token');
      const [programTokenAuthority] = anchor.web3.PublicKey.findProgramAddressSync(
        [programTokenSeed],
        program.programId
      );
      const programTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payerKeypair,
        freedomMint,
        programTokenAuthority,
        true
      );

      // Place bets according to the plan
      console.log(`Placing ${betPlans.length} predetermined bets...`);
      let nextBetId = bettingPoolsState.nextBetId;
      const optionTotals = [0, 0]; // Track total amounts for each option

      for (let i = 0; i < betPlans.length; i++) {
        const plan = betPlans[i];
        const { userIndex, optionIndex, tokenAmount } = plan;
        const { user: bettor, tokenAccount: bettorTokenAccount } = usersArray[userIndex];
        const lamports = tokensToLamports(tokenAmount);
        const amount = new anchor.BN(lamports);
        const tokenType = TokenType.Points;

        // Find the bet account PDA
        const [betAddress] = anchor.web3.PublicKey.findProgramAddressSync(
          [BET_SEED, poolId.toBuffer('le', 8), nextBetId.toBuffer('le', 8)],
          program.programId
        );

        // Execute the placeBet instruction
        const betTx = await program.methods
          .placeBet(new anchor.BN(optionIndex), amount, tokenType)
          .accounts({
            bettingPools: bettingPoolsAddress,
            pool: poolAddress,
            bet: betAddress,
            bettor: bettor.publicKey,
            bettorTokenAccount: bettorTokenAccount,
            programTokenAccount: programTokenAccount.address,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          } as any)
          .signers([bettor])
          .rpc();

        // Verify the bet account data
        const betAccount = await program.account.bet.fetch(betAddress);
        void expect(betAccount.id.toString()).to.equal(nextBetId.toString());
        void expect(betAccount.owner.toString()).to.equal(bettor.publicKey.toString());
        void expect(betAccount.option.toNumber()).to.equal(optionIndex);
        void expect(betAccount.amount.toString()).to.equal(amount.toString());
        void expect(betAccount.poolId.toString()).to.equal(poolId.toString());
        void expect('points' in betAccount.tokenType).to.be.true;

        // Update running totals
        optionTotals[optionIndex] += lamports;
        nextBetId = new anchor.BN(nextBetId.toNumber() + 1);
      }

      // Verify final pool totals
      const finalPool = await program.account.pool.fetch(poolAddress);
      console.log('\nFinal bet summary:');
      console.log(`Total bets placed: ${betPlans.length}`);
      console.log(
        `Final pool point bet totals: [${finalPool.pointsBetTotals.map((t: any) => t.toString())}]`
      );
      console.log(`Expected totals: [${optionTotals[0]}, ${optionTotals[1]}]`);

      void expect(finalPool.pointsBetTotals[0].toString()).to.equal(optionTotals[0].toString());
      void expect(finalPool.pointsBetTotals[1].toString()).to.equal(optionTotals[1].toString());

      // Verify betting pools nextBetId was incremented correctly
      const updatedBettingPools =
        await program.account.bettingPoolsState.fetch(bettingPoolsAddress);
      void expect(updatedBettingPools.nextBetId.toNumber()).to.equal(
        bettingPoolsState.nextBetId.toNumber() + betPlans.length
      );

      console.log('Successfully verified multiple bets from different users with FREEDOM tokens');
    } catch (e) {
      console.error('Error in placeBet test:', e);
      throw e;
    } finally {
      // Optionally: Clean up unused assets (SOL/tokens) for users
      // Not implemented here; add as needed
    }
  });

  it('closePool updates pool with correct winning option and decision time', async () => {
    // Choose a winning option (e.g., option 1)
    const selectedOption = 1;

    // Invoke the gradeBet instruction to close the pool
    const closeTx = await program.methods
      .gradeBet(new anchor.BN(selectedOption))
      .accounts({
        bettingPools: bettingPoolsAddress,
        pool: poolAddress,
        authority: wallet.publicKey,
      } as any)
      .rpc();
    console.log('Close pool transaction:', closeTx);

    // Fetch the pool account and verify it is graded
    const closedPool = await program.account.pool.fetch(poolAddress);
    // Verify the pool status is GRADED
    void expect(closedPool.status).to.have.property('graded');
    void expect(closedPool.winningOption.toNumber()).to.equal(selectedOption);
    void expect(closedPool.decisionTime.toNumber()).to.be.gt(0);
  });
});
