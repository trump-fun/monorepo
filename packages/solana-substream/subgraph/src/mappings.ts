import { BigInt } from '@graphprotocol/graph-ts';
import { Protobuf } from 'as-proto/assembly';
import {
  Bet,
  BetPlaced,
  PayoutClaimed,
  Pool,
  PoolClosed,
  PoolCreated,
  PoolMediaSet,
} from '../generated/schema';
import { Data as protoData } from './pb/substreams/v1/program/Data';

function mapTokenType(tokenType: i32): string {
  if (tokenType === 0) return 'USDC';
  if (tokenType === 1) return 'Freedom';
  return 'USDC';
}

function mapMediaType(mediaType: i32): string {
  if (mediaType === 0) return 'X';
  if (mediaType === 1) return 'TikTok';
  if (mediaType === 2) return 'Instagram';
  if (mediaType === 3) return 'Facebook';
  if (mediaType === 4) return 'Image';
  if (mediaType === 5) return 'Video';
  if (mediaType === 6) return 'ExternalLink';
  return 'Image';
}

function mapBetOutcome(outcome: i32): string {
  if (outcome === 0) return 'None';
  if (outcome === 1) return 'Won';
  if (outcome === 2) return 'Lost';
  if (outcome === 3) return 'Voided';
  if (outcome === 4) return 'Draw';
  return 'None';
}

function mapPoolStatus(status: i32): string {
  if (status === 0) return 'None';
  if (status === 1) return 'Pending';
  if (status === 2) return 'Graded';
  if (status === 3) return 'Regraded';
  return 'Pending';
}

export function handleTriggers(bytes: Uint8Array): void {
  const input = Protobuf.decode<protoData>(bytes, protoData.decode);

  // PoolCreated events
  input.poolCreatedEventList.forEach(event => {
    const pc = new PoolCreated(event.trxHash.toString());
    pc.txHash = event.trxHash;
    pc.poolId = BigInt.fromU64(event.poolId);
    pc.question = event.question;
    pc.options = event.options;
    pc.betsCloseAt = BigInt.fromI64(event.betsCloseAt);
    // Use imageUrl from event
    pc.imageUrl = event.imageUrl;
    // Default values for unused fields
    pc.category = '';
    pc.creatorName = '';
    pc.creatorId = '';
    pc.closureCriteria = '';
    pc.closureInstructions = '';
    pc.createdAt = BigInt.fromI64(event.createdAt);
    pc.save();

    const pool = new Pool(event.poolId.toString());
    pool.poolIntId = BigInt.fromU64(event.poolId);
    pool.question = event.question;
    pool.options = event.options;
    pool.betsCloseAt = BigInt.fromI64(event.betsCloseAt);
    pool.decisionTime = BigInt.fromI64(0);
    pool.usdcBetTotalsByOption = [BigInt.fromI64(0), BigInt.fromI64(0)];
    pool.pointsBetTotalsByOption = [BigInt.fromI64(0), BigInt.fromI64(0)];
    pool.usdcBetTotals = BigInt.fromI64(0);
    pool.pointsBetTotals = BigInt.fromI64(0);
    pool.winningOption = BigInt.fromI64(0);
    pool.status = 'Pending';
    pool.isDraw = false;
    pool.createdAt = BigInt.fromI64(event.createdAt);
    pool.category = '';
    pool.creatorName = '';
    pool.creatorId = '';
    pool.closureCriteria = '';
    pool.closureInstructions = '';
    // Use imageUrl from event
    pool.imageUrl = event.imageUrl;
    pool.originalTruthSocialPostId = event.originalTruthSocialPostId;
    pool.twitterPostId = '';
    pool.creationTxHash = event.trxHash;
    pool.save();
  });

  // BetPlaced events
  input.betPlacedEventList.forEach(event => {
    const betId = event.betId.toString();
    const bet = new Bet(betId);
    bet.betIntId = BigInt.fromU64(event.betId);
    bet.poolIntId = BigInt.fromU64(event.poolId);
    bet.pool = event.poolId.toString();
    bet.userAddress = event.user;
    bet.optionIndex = BigInt.fromU64(event.optionIndex);
    bet.amount = BigInt.fromU64(event.amount);
    bet.createdAt = BigInt.fromI64(event.createdAt);
    bet.isPayedOut = false;
    bet.outcome = 'None';
    bet.tokenType = mapTokenType(event.tokenType);
    bet.txHash = event.trxHash;
    bet.save();

    const bp = new BetPlaced(event.trxHash.concat('-').concat(betId));
    bp.betId = BigInt.fromU64(event.betId);
    bp.poolId = BigInt.fromU64(event.poolId);
    bp.user = event.user;
    bp.optionIndex = BigInt.fromU64(event.optionIndex);
    bp.amount = BigInt.fromU64(event.amount);
    bp.tokenType = mapTokenType(event.tokenType);
    bp.createdAt = BigInt.fromI64(event.createdAt);
    bp.txHash = event.trxHash;
    bp.bet = betId;
    bp.pool = event.poolId.toString();
    bp.save();

    const pool = Pool.load(event.poolId.toString());
    if (pool) {
      const idx = event.optionIndex as i32;
      const amt = BigInt.fromU64(event.amount);
      if (event.tokenType == 0) {
        const arr = pool.usdcBetTotalsByOption;
        if (idx < arr.length) arr[idx] = arr[idx].plus(amt);
        pool.usdcBetTotalsByOption = arr;
        // Update total USDC bets
        pool.usdcBetTotals = pool.usdcBetTotals.plus(amt);
      } else {
        const arr = pool.pointsBetTotalsByOption;
        if (idx < arr.length) arr[idx] = arr[idx].plus(amt);
        pool.pointsBetTotalsByOption = arr;
        // Update total point bets
        pool.pointsBetTotals = pool.pointsBetTotals.plus(amt);
      }
      pool.save();
    }
  });

  // PoolMediaSet events
  input.poolImageSetEventList.forEach(event => {
    const id = event.trxHash.concat('-').concat(event.poolId.toString());
    const pms = new PoolMediaSet(id);
    pms.poolId = BigInt.fromU64(event.poolId);
    pms.imageUrl = event.imageUrl;
    pms.txHash = event.trxHash;
    pms.pool = event.poolId.toString();
    pms.save();

    const pool = Pool.load(event.poolId.toString());
    if (pool) {
      pool.imageUrl = event.imageUrl;
      pool.save();
    }
  });

  // PayoutClaimed events
  input.payoutClaimedEventList.forEach(event => {
    const id = event.trxHash.toString();
    const pc = new PayoutClaimed(id);
    pc.txHash = event.trxHash;
    pc.betId = BigInt.fromU64(event.betId);
    pc.poolId = BigInt.fromU64(event.poolId);
    pc.user = event.user;
    pc.amount = BigInt.fromU64(event.amount);
    pc.tokenType = mapTokenType(event.tokenType);
    pc.save();

    // Update the Bet entity
    const betId = event.betId.toString();
    const bet = Bet.load(betId);
    if (bet) {
      bet.isPayedOut = true;

      // Determine bet outcome based on pool's winning option
      const poolId = event.poolId.toString();
      const pool = Pool.load(poolId);

      if (pool) {
        const betOption = bet.optionIndex;
        const winningOption = pool.winningOption;

        if (pool.isDraw) {
          bet.outcome = 'Draw';
        } else if (betOption.equals(winningOption)) {
          bet.outcome = 'Won';
        } else {
          bet.outcome = 'Lost';
        }
      }

      bet.save();
    }
  });

  // PoolClosed events
  input.poolClosedEventList.forEach(event => {
    const id = event.trxHash.toString();
    const pc = new PoolClosed(id);
    pc.txHash = event.trxHash;
    pc.poolId = BigInt.fromU64(event.poolId);
    pc.selectedOption = BigInt.fromU64(event.selectedOption);
    pc.decisionTime = BigInt.fromI64(event.decisionTime);
    pc.save();

    // Update the Pool entity
    const pool = Pool.load(event.poolId.toString());
    if (pool) {
      // In the Solana contract, response_option determines the outcome:
      // 0 -> option 0 wins, 1 -> option 1 wins, 2 -> draw
      const selectedOption = event.selectedOption;

      if (selectedOption === 2) {
        // This is a draw according to the Solana contract
        pool.isDraw = true;
        pool.winningOption = BigInt.fromI64(0); // No winner
      } else {
        pool.winningOption = BigInt.fromU64(selectedOption);
        pool.isDraw = false;
      }

      pool.decisionTime = BigInt.fromI64(event.decisionTime);
      pool.status = 'Graded';
      pool.save();
    }
  });
}
