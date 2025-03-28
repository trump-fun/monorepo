import { newMockEvent } from 'matchstick-as';
import { ethereum, BigInt, Address } from '@graphprotocol/graph-ts';
import {
  BetPlaced,
  BetWithdrawal,
  OwnershipTransferred,
  PayoutClaimed,
  PoolClosed,
  PoolCreated,
  Withdrawal,
} from '../generated/BettingContract/BettingContract';

export function createBetPlacedEvent(
  betId: BigInt,
  poolId: BigInt,
  user: Address,
  optionIndex: BigInt,
  amount: BigInt,
  tokenType: i32
): BetPlaced {
  const betPlacedEvent = changetype<BetPlaced>(newMockEvent());

  betPlacedEvent.parameters = [];

  betPlacedEvent.parameters.push(
    new ethereum.EventParam('betId', ethereum.Value.fromUnsignedBigInt(betId))
  );
  betPlacedEvent.parameters.push(
    new ethereum.EventParam('poolId', ethereum.Value.fromUnsignedBigInt(poolId))
  );
  betPlacedEvent.parameters.push(new ethereum.EventParam('user', ethereum.Value.fromAddress(user)));
  betPlacedEvent.parameters.push(
    new ethereum.EventParam('optionIndex', ethereum.Value.fromUnsignedBigInt(optionIndex))
  );
  betPlacedEvent.parameters.push(
    new ethereum.EventParam('amount', ethereum.Value.fromUnsignedBigInt(amount))
  );
  betPlacedEvent.parameters.push(
    new ethereum.EventParam(
      'tokenType',
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(tokenType))
    )
  );

  return betPlacedEvent;
}

export function createBetWithdrawalEvent(
  user: Address,
  betId: BigInt,
  amount: BigInt,
  tokenType: i32
): BetWithdrawal {
  const betWithdrawalEvent = changetype<BetWithdrawal>(newMockEvent());

  betWithdrawalEvent.parameters = [];

  betWithdrawalEvent.parameters.push(
    new ethereum.EventParam('user', ethereum.Value.fromAddress(user))
  );
  betWithdrawalEvent.parameters.push(
    new ethereum.EventParam('betId', ethereum.Value.fromUnsignedBigInt(betId))
  );
  betWithdrawalEvent.parameters.push(
    new ethereum.EventParam('amount', ethereum.Value.fromUnsignedBigInt(amount))
  );
  betWithdrawalEvent.parameters.push(
    new ethereum.EventParam(
      'tokenType',
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(tokenType))
    )
  );

  return betWithdrawalEvent;
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  const ownershipTransferredEvent = changetype<OwnershipTransferred>(newMockEvent());

  ownershipTransferredEvent.parameters = [];

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam('previousOwner', ethereum.Value.fromAddress(previousOwner))
  );
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam('newOwner', ethereum.Value.fromAddress(newOwner))
  );

  return ownershipTransferredEvent;
}

export function createPayoutClaimedEvent(
  betId: BigInt,
  poolId: BigInt,
  user: Address,
  amount: BigInt,
  tokenType: i32
): PayoutClaimed {
  const payoutClaimedEvent = changetype<PayoutClaimed>(newMockEvent());

  payoutClaimedEvent.parameters = [];

  payoutClaimedEvent.parameters.push(
    new ethereum.EventParam('betId', ethereum.Value.fromUnsignedBigInt(betId))
  );
  payoutClaimedEvent.parameters.push(
    new ethereum.EventParam('poolId', ethereum.Value.fromUnsignedBigInt(poolId))
  );
  payoutClaimedEvent.parameters.push(
    new ethereum.EventParam('user', ethereum.Value.fromAddress(user))
  );
  payoutClaimedEvent.parameters.push(
    new ethereum.EventParam('amount', ethereum.Value.fromUnsignedBigInt(amount))
  );
  payoutClaimedEvent.parameters.push(
    new ethereum.EventParam(
      'tokenType',
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(tokenType))
    )
  );

  return payoutClaimedEvent;
}

export function createPoolClosedEvent(poolId: BigInt, selectedOption: BigInt): PoolClosed {
  const poolClosedEvent = changetype<PoolClosed>(newMockEvent());

  poolClosedEvent.parameters = [];

  poolClosedEvent.parameters.push(
    new ethereum.EventParam('poolId', ethereum.Value.fromUnsignedBigInt(poolId))
  );
  poolClosedEvent.parameters.push(
    new ethereum.EventParam('selectedOption', ethereum.Value.fromUnsignedBigInt(selectedOption))
  );

  return poolClosedEvent;
}

export function createPoolCreatedEvent(poolId: BigInt, params: ethereum.Tuple): PoolCreated {
  const poolCreatedEvent = changetype<PoolCreated>(newMockEvent());

  poolCreatedEvent.parameters = [];

  poolCreatedEvent.parameters.push(
    new ethereum.EventParam('poolId', ethereum.Value.fromUnsignedBigInt(poolId))
  );
  poolCreatedEvent.parameters.push(
    new ethereum.EventParam('params', ethereum.Value.fromTuple(params))
  );

  return poolCreatedEvent;
}

export function createWithdrawalEvent(user: Address, amount: BigInt, tokenType: i32): Withdrawal {
  const withdrawalEvent = changetype<Withdrawal>(newMockEvent());

  withdrawalEvent.parameters = [];

  withdrawalEvent.parameters.push(
    new ethereum.EventParam('user', ethereum.Value.fromAddress(user))
  );
  withdrawalEvent.parameters.push(
    new ethereum.EventParam('amount', ethereum.Value.fromUnsignedBigInt(amount))
  );
  withdrawalEvent.parameters.push(
    new ethereum.EventParam(
      'tokenType',
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(tokenType))
    )
  );

  return withdrawalEvent;
}
