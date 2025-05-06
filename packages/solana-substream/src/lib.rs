mod idl;
mod pb;

use anchor_lang::AnchorDeserialize;
use anchor_lang::Discriminator;
use base64::prelude::*;
use pb::substreams::v1::program::Data;
use pb::substreams::v1::program::BetPlacedEvent;
use pb::substreams::v1::program::PayoutClaimedEvent;
use pb::substreams::v1::program::PoolClosedEvent;
use pb::substreams::v1::program::PoolCreatedEvent;
use pb::substreams::v1::program::PoolImageSetEvent;
use pb::substreams::v1::program::ClaimPayoutInstruction;
use pb::substreams::v1::program::CreatePoolInstruction;
use pb::substreams::v1::program::GradeBetInstruction;
use pb::substreams::v1::program::InitializeInstruction;
use pb::substreams::v1::program::PlaceBetInstruction;
use pb::substreams::v1::program::SetImageInstruction;

use pb::substreams::v1::program::TokenTypeEnum;

use sologger_log_context::programs_selector::ProgramsSelector;
use sologger_log_context::sologger_log_context::LogContext;
use substreams_solana::pb::sf::solana::r#type::v1::Block;

const PROGRAM_ID: &str = "i6PRmGAi4rZrvAJeLCskWCE8gTnYmUeoJaHpsu1XUtK";

#[substreams::handlers::map]
fn map_program_data(blk: Block) -> Data {
    let mut bet_placed_event_list: Vec<BetPlacedEvent> = Vec::new();
    let mut payout_claimed_event_list: Vec<PayoutClaimedEvent> = Vec::new();
    let mut pool_closed_event_list: Vec<PoolClosedEvent> = Vec::new();
    let mut pool_created_event_list: Vec<PoolCreatedEvent> = Vec::new();
    let mut pool_image_set_event_list: Vec<PoolImageSetEvent> = Vec::new();
    let mut claim_payout_instruction_list: Vec<ClaimPayoutInstruction> = Vec::new();
    let mut create_pool_instruction_list: Vec<CreatePoolInstruction> = Vec::new();
    let mut grade_bet_instruction_list: Vec<GradeBetInstruction> = Vec::new();
    let mut initialize_instruction_list: Vec<InitializeInstruction> = Vec::new();
    let mut place_bet_instruction_list: Vec<PlaceBetInstruction> = Vec::new();
    let mut set_image_instruction_list: Vec<SetImageInstruction> = Vec::new();

    blk.transactions().for_each(|transaction| {

        // ------------- EVENTS -------------
        let meta_wrapped = &transaction.meta;
        let meta = meta_wrapped.as_ref().unwrap();
        let programs_selector: ProgramsSelector = ProgramsSelector::new(&["*".to_string()]);
        let log_contexts = LogContext::parse_logs_basic(&meta.log_messages, &programs_selector);

        log_contexts
            .iter()
            .filter(|context| context.program_id == PROGRAM_ID)
            .for_each(|context| {
                context.data_logs.iter().for_each(|data| {
                    if let Ok(decoded) = BASE64_STANDARD.decode(data) {
                        let slice_u8: &mut &[u8] = &mut &decoded[..];
                        let slice_discriminator: [u8; 8] =
                            slice_u8[0..8].try_into().expect("error");
                        let static_discriminator_slice: &'static [u8] = Box::leak(Box::new(slice_discriminator));

                        match static_discriminator_slice {
                            idl::idl::program::events::BetPlaced::DISCRIMINATOR => {
                                if let Ok(event) =
                                    idl::idl::program::events::BetPlaced::deserialize(
                                        &mut &slice_u8[8..],
                                    )
                                {
                                    bet_placed_event_list.push(BetPlacedEvent {
                                        trx_hash: transaction.id(),
                                        bet_id: event.bet_id,
                                        pool_id: event.pool_id,
                                        user: event.user.to_string(),
                                        option_index: event.option_index,
                                        amount: event.amount,
                                        token_type: map_enum_token_type(event.token_type),
                                        created_at: event.created_at,
                                    });
                                }
                            }
                            idl::idl::program::events::PayoutClaimed::DISCRIMINATOR => {
                                if let Ok(event) =
                                    idl::idl::program::events::PayoutClaimed::deserialize(
                                        &mut &slice_u8[8..],
                                    )
                                {
                                    payout_claimed_event_list.push(PayoutClaimedEvent {
                                        trx_hash: transaction.id(),
                                        bet_id: event.bet_id,
                                        pool_id: event.pool_id,
                                        user: event.user.to_string(),
                                        amount: event.amount,
                                        token_type: map_enum_token_type(event.token_type),
                                    });
                                }
                            }
                            idl::idl::program::events::PoolClosed::DISCRIMINATOR => {
                                if let Ok(event) =
                                    idl::idl::program::events::PoolClosed::deserialize(
                                        &mut &slice_u8[8..],
                                    )
                                {
                                    pool_closed_event_list.push(PoolClosedEvent {
                                        trx_hash: transaction.id(),
                                        pool_id: event.pool_id,
                                        selected_option: event.selected_option,
                                        decision_time: event.decision_time,
                                    });
                                }
                            }
                            idl::idl::program::events::PoolCreated::DISCRIMINATOR => {
                                if let Ok(event) =
                                    idl::idl::program::events::PoolCreated::deserialize(
                                        &mut &slice_u8[8..],
                                    )
                                {
                                    pool_created_event_list.push(PoolCreatedEvent {
                                        trx_hash: transaction.id(),
                                        pool_id: event.pool_id,
                                        question: event.question,
                                        options: event.options.to_vec(),
                                        bets_close_at: event.bets_close_at,
                                        original_truth_social_post_id: event.original_truth_social_post_id,
                                        image_url: event.image_url,
                                        created_at: event.created_at,
                                    });
                                }
                            }
                            idl::idl::program::events::PoolImageSet::DISCRIMINATOR => {
                                if let Ok(event) =
                                    idl::idl::program::events::PoolImageSet::deserialize(
                                        &mut &slice_u8[8..],
                                    )
                                {
                                    pool_image_set_event_list.push(PoolImageSetEvent {
                                        trx_hash: transaction.id(),
                                        pool_id: event.pool_id,
                                        image_url: event.image_url,
                                    });
                                }
                            }
                            _ => {}
                        }
                    }
                });
            });// ------------- INSTRUCTIONS -------------
        transaction
        .walk_instructions()
        .into_iter()
        .filter(|inst| inst.program_id().to_string() == PROGRAM_ID)
        .for_each(|inst| {
            let slice_u8: &[u8] = &inst.data()[..];
            if &slice_u8[0..8] == idl::idl::program::client::args::ClaimPayout::DISCRIMINATOR {
                if let Ok(instruction) =
                    idl::idl::program::client::args::ClaimPayout::deserialize(&mut &slice_u8[8..])
                {
                    let accts = inst.accounts();
                    claim_payout_instruction_list.push(ClaimPayoutInstruction {
                        trx_hash: transaction.id(),
                        acct_betting_pools: accts[0].to_string(),
                        acct_pool: accts[1].to_string(),
                        acct_bet: accts[2].to_string(),
                        acct_bettor: accts[3].to_string(),
                        acct_bettor_token_account: accts[4].to_string(),
                        acct_program_token_account: accts[5].to_string(),
                    });
                }
            }
            if &slice_u8[0..8] == idl::idl::program::client::args::CreatePool::DISCRIMINATOR {
                if let Ok(instruction) =
                    idl::idl::program::client::args::CreatePool::deserialize(&mut &slice_u8[8..])
                {
                    let accts = inst.accounts();
                    create_pool_instruction_list.push(CreatePoolInstruction {
                        trx_hash: transaction.id(),
                        question: instruction.question,
                        options: instruction.options.to_vec(),
                        bets_close_at: instruction.bets_close_at,
                        original_truth_social_post_id: instruction.original_truth_social_post_id,
                        image_url: instruction.image_url,
                        acct_betting_pools: accts[0].to_string(),
                        acct_pool: accts[1].to_string(),
                        acct_authority: accts[2].to_string(),
                    });
                }
            }
            if &slice_u8[0..8] == idl::idl::program::client::args::GradeBet::DISCRIMINATOR {
                if let Ok(instruction) =
                    idl::idl::program::client::args::GradeBet::deserialize(&mut &slice_u8[8..])
                {
                    let accts = inst.accounts();
                    grade_bet_instruction_list.push(GradeBetInstruction {
                        trx_hash: transaction.id(),
                        response_option: instruction.response_option,
                        acct_betting_pools: accts[0].to_string(),
                        acct_pool: accts[1].to_string(),
                        acct_authority: accts[2].to_string(),
                    });
                }
            }
            if &slice_u8[0..8] == idl::idl::program::client::args::Initialize::DISCRIMINATOR {
                if let Ok(instruction) =
                    idl::idl::program::client::args::Initialize::deserialize(&mut &slice_u8[8..])
                {
                    let accts = inst.accounts();
                    initialize_instruction_list.push(InitializeInstruction {
                        trx_hash: transaction.id(),
                        usdc_mint: instruction.usdc_mint.to_string(),
                        freedom_mint: instruction.freedom_mint.to_string(),
                        acct_betting_pools: accts[0].to_string(),
                        acct_authority: accts[1].to_string(),
                    });
                }
            }
            if &slice_u8[0..8] == idl::idl::program::client::args::PlaceBet::DISCRIMINATOR {
                if let Ok(instruction) =
                    idl::idl::program::client::args::PlaceBet::deserialize(&mut &slice_u8[8..])
                {
                    let accts = inst.accounts();
                    place_bet_instruction_list.push(PlaceBetInstruction {
                        trx_hash: transaction.id(),
                        option_index: instruction.option_index,
                        amount: instruction.amount,
                        token_type: map_enum_token_type(instruction.token_type),
                        acct_betting_pools: accts[0].to_string(),
                        acct_pool: accts[1].to_string(),
                        acct_bet: accts[2].to_string(),
                        acct_bettor: accts[3].to_string(),
                        acct_bettor_token_account: accts[4].to_string(),
                        acct_program_token_account: accts[5].to_string(),
                    });
                }
            }
            if &slice_u8[0..8] == idl::idl::program::client::args::SetImage::DISCRIMINATOR {
                if let Ok(instruction) =
                    idl::idl::program::client::args::SetImage::deserialize(&mut &slice_u8[8..])
                {
                    let accts = inst.accounts();
                    set_image_instruction_list.push(SetImageInstruction {
                        trx_hash: transaction.id(),
                        image_url: instruction.image_url,
                        acct_pool: accts[0].to_string(),
                        acct_betting_pools: accts[1].to_string(),
                        acct_authority: accts[2].to_string(),
                    });
                }
            }
        });
    });


    Data {
        bet_placed_event_list,
        payout_claimed_event_list,
        pool_closed_event_list,
        pool_created_event_list,
        pool_image_set_event_list,
        claim_payout_instruction_list,
        create_pool_instruction_list,
        grade_bet_instruction_list,
        initialize_instruction_list,
        place_bet_instruction_list,
        set_image_instruction_list,
    }
}

fn map_enum_pool_status(value: idl::idl::program::types::PoolStatus) -> i32 {
    match value {
        idl::idl::program::types::PoolStatus::None => return 0,
        idl::idl::program::types::PoolStatus::Pending => return 1,
        idl::idl::program::types::PoolStatus::Graded => return 2,
        idl::idl::program::types::PoolStatus::Regraded => return 3,
        _ => 0,
    }
}
fn map_enum_token_type(value: idl::idl::program::types::TokenType) -> i32 {
    match value {
        idl::idl::program::types::TokenType::Usdc => return 0,
        idl::idl::program::types::TokenType::Points => return 1,
        _ => 0,
    }
}
