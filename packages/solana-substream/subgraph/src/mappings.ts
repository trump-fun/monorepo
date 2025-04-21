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
  if (tokenType === 1) return 'POINTS';
  return 'USDC';
}

function mapMediaType(mediaType: i32): string {
  if (mediaType === 0) return 'X';
  if (mediaType === 1) return 'TIKTOK';
  if (mediaType === 2) return 'INSTAGRAM';
  if (mediaType === 3) return 'FACEBOOK';
  if (mediaType === 4) return 'IMAGE';
  if (mediaType === 5) return 'VIDEO';
  if (mediaType === 6) return 'EXTERNAL_LINK';
  return 'IMAGE';
}

function mapBetOutcome(outcome: i32): string {
  if (outcome === 0) return 'NONE';
  if (outcome === 1) return 'WON';
  if (outcome === 2) return 'LOST';
  if (outcome === 3) return 'VOIDED';
  if (outcome === 4) return 'DRAW';
  return 'NONE';
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
    pc.mediaUrl = event.imageUrl;
    // No mediaType provided, default to IMAGE
    pc.mediaType = 'IMAGE';
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
    pool.winningOption = BigInt.fromI64(0);
    pool.status = 'PENDING';
    pool.isDraw = false;
    pool.createdAt = BigInt.fromI64(event.createdAt);
    pool.category = '';
    pool.creatorName = '';
    pool.creatorId = '';
    pool.closureCriteria = '';
    pool.closureInstructions = '';
    // Use imageUrl from event
    pool.mediaUrl = event.imageUrl;
    // No mediaType provided, default to IMAGE
    pool.mediaType = 'IMAGE';
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
    bet.outcome = 'NONE';
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
      } else {
        const arr = pool.pointsBetTotalsByOption;
        if (idx < arr.length) arr[idx] = arr[idx].plus(amt);
        pool.pointsBetTotalsByOption = arr;
      }
      pool.save();
    }
  });

  // PoolMediaSet events
  input.poolImageSetEventList.forEach(event => {
    const id = event.trxHash.concat('-').concat(event.poolId.toString());
    const pms = new PoolMediaSet(id);
    pms.poolId = BigInt.fromU64(event.poolId);
    pms.mediaUrl = event.imageUrl;
    pms.mediaType = mapMediaType(4); //image
    pms.txHash = event.trxHash;
    pms.pool = event.poolId.toString();
    pms.save();

    const pool = Pool.load(event.poolId.toString());
    if (pool) {
      pool.mediaUrl = event.imageUrl;
      pool.mediaType = mapMediaType(4); //image
      pool.save();
    }
  });

  // PayoutClaimed events
  input.payoutClaimedEventList.forEach(event => {
    const id = event.trxHash.toString();
    const pc = new PayoutClaimed(id);
    pc.txHash = event.trxHash;
    pc.save();
  });

  // PoolClosed events
  input.poolClosedEventList.forEach(event => {
    const id = event.trxHash.toString();
    const pc = new PoolClosed(id);
    pc.txHash = event.trxHash;
    pc.save();
  });
}
