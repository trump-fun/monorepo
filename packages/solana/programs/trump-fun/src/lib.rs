use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("4EzVzZHcgpyn9sRMLfM9iZnBbmS3zGPFiHaz2zM5z9m1");

pub const BETTING_POOLS_SEED: &[u8] = b"betting_pools_v1";
pub const POOL_SEED: &[u8] = b"pool_v1";
pub const BET_SEED: &[u8] = b"bet_v1";

#[program]
pub mod trump_fun {
    use super::*;

    /// Initialize the BettingPools program
    /// Similar to the constructor in the Solidity version
    pub fn initialize(
        ctx: Context<Initialize>,
        usdc_mint: Pubkey,
        freedom_mint: Pubkey,
    ) -> Result<()> {
        let betting_pools = &mut ctx.accounts.betting_pools;

        msg!("Initializing BettingPools");
        // Check if already initialized
        if betting_pools.is_initialized {
            return err!(BettingPoolsError::AlreadyInitialized);
        }

        // Mark as initialized
        betting_pools.is_initialized = true;

        // Set the authority to the signer
        betting_pools.authority = ctx.accounts.authority.key();

        // Set up token mints
        betting_pools.usdc_mint = usdc_mint;
        betting_pools.freedom_mint = freedom_mint;

        // Initialize counters
        betting_pools.next_pool_id = 1;
        betting_pools.next_bet_id = 1;

        // Set payout fee basis points (0.9% like in Solidity)
        betting_pools.payout_fee_bp = 90;

        msg!("BettingPools program initialized");
        Ok(())
    }

    /// Create a new betting pool
    /// Similar to the createPool function in the Solidity version
    pub fn create_pool(
        ctx: Context<CreatePool>,
        question: String,
        options: [String; 2],
        bets_close_at: i64,
        original_truth_social_post_id: String,
        image_url: String,
    ) -> Result<()> {
        let betting_pools = &mut ctx.accounts.betting_pools;
        let pool = &mut ctx.accounts.pool;

        // Check if bets close time is in the future
        let clock = Clock::get()?;
        if bets_close_at <= clock.unix_timestamp {
            return err!(BettingPoolsError::BetsCloseTimeInPast);
        }

        // Set the pool ID and increment the counter
        let pool_id = betting_pools.next_pool_id;
        betting_pools.next_pool_id += 1;

        // Initialize the pool
        pool.id = pool_id;
        pool.question = question;
        pool.options = options;
        pool.bets_close_at = bets_close_at;
        pool.usdc_bet_totals = [0, 0];
        pool.points_bet_totals = [0, 0];
        pool.winning_option = 0;
        pool.status = PoolStatus::Pending;
        pool.is_draw = false;
        pool.created_at = clock.unix_timestamp;
        pool.original_truth_social_post_id = original_truth_social_post_id;
        pool.image_url = image_url;

        emit!(PoolCreated {
            pool_id,
            question: pool.question.clone(),
            options: pool.options.clone(),
            bets_close_at: pool.bets_close_at,
            original_truth_social_post_id: pool.original_truth_social_post_id.clone(),
            image_url: pool.image_url.clone(),
            created_at: pool.created_at
        });

        Ok(())
    }

    /// Place a bet on a pool
    /// Similar to the placeBet function in the Solidity version
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        option_index: u64,
        amount: u64,
        token_type: TokenType,
    ) -> Result<()> {
        let betting_pools = &ctx.accounts.betting_pools;
        let pool = &mut ctx.accounts.pool;
        let bet = &mut ctx.accounts.bet;
        let bettor = &ctx.accounts.bettor;
        let clock = Clock::get()?;

        // Check if betting period is closed
        if clock.unix_timestamp > pool.bets_close_at {
            return err!(BettingPoolsError::BettingPeriodClosed);
        }

        // Check if pool is open for betting
        if pool.status != PoolStatus::Pending {
            return err!(BettingPoolsError::PoolNotOpen);
        }

        // Check if option index is valid
        if option_index >= 2 {
            return err!(BettingPoolsError::InvalidOptionIndex);
        }

        // Check if amount is valid
        if amount == 0 {
            return err!(BettingPoolsError::ZeroAmount);
        }

        // Transfer tokens from bettor to program account
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.bettor_token_account.to_account_info(),
                    to: ctx.accounts.program_token_account.to_account_info(),
                    authority: bettor.to_account_info(),
                },
            ),
            amount,
        )?;

        // Initialize the bet
        let bet_id = betting_pools.next_bet_id;

        bet.id = bet_id;
        bet.owner = bettor.key();
        bet.option = option_index;
        bet.amount = amount;
        bet.pool_id = pool.id;
        bet.created_at = clock.unix_timestamp;
        bet.updated_at = clock.unix_timestamp;
        bet.is_withdrawn = false;
        bet.token_type = token_type;

        // Update totals in the pool
        if token_type == TokenType::Usdc {
            pool.usdc_bet_totals[option_index as usize] += amount;
        } else {
            pool.points_bet_totals[option_index as usize] += amount;
        }

        // Emit the BetPlaced event
        emit!(BetPlaced {
            bet_id,
            pool_id: pool.id,
            user: bettor.key(),
            option_index,
            amount,
            token_type,
            created_at: clock.unix_timestamp,
        });

        // Increment the bet ID counter
        let betting_pools = &mut ctx.accounts.betting_pools;
        betting_pools.next_bet_id += 1;

        Ok(())
    }

    /// Grade a betting pool
    /// Determines the winning option and releases payouts
    pub fn grade_bet(ctx: Context<GradeBet>, response_option: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        // Check if pool is already graded
        if pool.status != PoolStatus::Pending {
            return err!(BettingPoolsError::PoolNotOpen);
        }

        pool.status = PoolStatus::Graded;

        if response_option == 0 {
            pool.winning_option = 0;
        } else if response_option == 1 {
            pool.winning_option = 1;
        } else if response_option == 2 {
            pool.is_draw = true;
        } else {
            return err!(BettingPoolsError::GradingError);
        }

        // Set decision time to current time
        let clock = Clock::get()?;
        pool.decision_time = clock.unix_timestamp;

        emit!(PoolClosed {
            pool_id: pool.id,
            selected_option: response_option,
            decision_time: pool.decision_time,
        });

        Ok(())
    }

    /// Claim payouts for a bet
    pub fn claim_payout(ctx: Context<ClaimPayout>) -> Result<()> {
        let pool = &ctx.accounts.pool;
        let bet = &mut ctx.accounts.bet;
        let betting_pools = &ctx.accounts.betting_pools;

        // Check if the pool is graded
        if pool.status != PoolStatus::Graded {
            return err!(BettingPoolsError::PoolNotGraded);
        }

        // Check if bet is already withdrawn
        if bet.is_withdrawn {
            return err!(BettingPoolsError::BetAlreadyWithdrawn);
        }

        // Mark bet as withdrawn
        bet.is_withdrawn = true;

        let token_type = bet.token_type;

        // Get the appropriate betTotals based on token type
        let bet_totals = if token_type == TokenType::Usdc {
            pool.usdc_bet_totals
        } else {
            pool.points_bet_totals
        };

        let amount_to_transfer: u64;

        // If it is a draw or there are no bets on one side or the other for this token type, refund the bet
        if pool.is_draw || bet_totals[0] == 0 || bet_totals[1] == 0 {
            amount_to_transfer = bet.amount;
        } else {
            let losing_option = if pool.winning_option == 0 { 1 } else { 0 };

            if bet.option == pool.winning_option {
                // Calculate winnings
                let win_amount = (bet.amount * bet_totals[losing_option as usize])
                    / bet_totals[pool.winning_option as usize]
                    + bet.amount;
                let fee = (win_amount * betting_pools.payout_fee_bp as u64) / 10000;
                amount_to_transfer = win_amount - fee;

                // Fee stays in the program account
            } else {
                // Losing bets get nothing
                amount_to_transfer = 0;
            }
        }

        // If there's an amount to transfer, do the transfer
        if amount_to_transfer > 0 {
            // Get the right mint based on token type
            let mint = if token_type == TokenType::Usdc {
                betting_pools.usdc_mint
            } else {
                betting_pools.freedom_mint
            };

            // Transfer tokens from program account to bettor
            let betting_pools_seeds = &[BETTING_POOLS_SEED, &[ctx.bumps.betting_pools]];
            let signer = &[&betting_pools_seeds[..]];

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.program_token_account.to_account_info(),
                        to: ctx.accounts.bettor_token_account.to_account_info(),
                        authority: ctx.accounts.betting_pools.to_account_info(),
                    },
                    signer,
                ),
                amount_to_transfer,
            )?;

            emit!(PayoutClaimed {
                bet_id: bet.id,
                pool_id: pool.id,
                user: bet.owner,
                amount: amount_to_transfer,
                token_type,
            });
        }

        Ok(())
    }

    /// Update the image URL for a pool
    pub fn set_image(ctx: Context<SetImage>, image_url: String) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        // Update the image URL
        pool.image_url = image_url.clone();

        // Emit the PoolImageSet event
        emit!(PoolImageSet {
            pool_id: pool.id,
            image_url,
        });

        Ok(())
    }

    pub fn close_betting_pool(ctx: Context<CloseBettingPool>) -> Result<()> {
        Ok(())
    }
}

//--------- STATE STRUCTS ---------//

// Initialize context
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + BettingPoolsState::INIT_SPACE,
        seeds = [BETTING_POOLS_SEED],
        bump
    )]
    pub betting_pools: Account<'info, BettingPoolsState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// BettingPools state
#[account]
#[derive(InitSpace)]
pub struct BettingPoolsState {
    pub authority: Pubkey,
    pub usdc_mint: Pubkey,
    pub freedom_mint: Pubkey,
    pub next_pool_id: u64,
    pub next_bet_id: u64,
    pub payout_fee_bp: u16,
    pub is_initialized: bool,
}

// Create pool context
#[derive(Accounts)]
#[instruction(
    question: String,
    options: [String; 2],
    bets_close_at: i64,
    original_truth_social_post_id: String,
    image_url: String
)]
pub struct CreatePool<'info> {
    #[account(
        mut,
        seeds = [BETTING_POOLS_SEED],
        bump,
        has_one = authority @ BettingPoolsError::NotAuthorized
    )]
    pub betting_pools: Account<'info, BettingPoolsState>,

    #[account(
        init,
        payer = authority,
        space = 8 + Pool::INIT_SPACE,
        seeds = [POOL_SEED, betting_pools.next_pool_id.to_le_bytes().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// Place bet context
#[derive(Accounts)]
#[instruction(option_index: u64, amount: u64, token_type: TokenType)]
pub struct PlaceBet<'info> {
    #[account(
        mut,
        seeds = [BETTING_POOLS_SEED],
        bump
    )]
    pub betting_pools: Account<'info, BettingPoolsState>,

    #[account(
        mut,
        seeds = [POOL_SEED, pool.id.to_le_bytes().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        init,
        payer = bettor,
        space = 8 + Bet::INIT_SPACE,
        seeds = [BET_SEED, pool.id.to_le_bytes().as_ref(), betting_pools.next_bet_id.to_le_bytes().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    #[account(mut)]
    pub bettor: Signer<'info>,

    #[account(
        mut,
        token::authority = bettor,
        token::mint = if token_type == TokenType::Usdc { betting_pools.usdc_mint } else { betting_pools.freedom_mint }
    )]
    pub bettor_token_account: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        token::mint = if token_type == TokenType::Usdc { betting_pools.usdc_mint } else { betting_pools.freedom_mint }
    )]
    pub program_token_account: Account<'info, token::TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// Grade bet context
#[derive(Accounts)]
#[instruction(response_option: u64)]
pub struct GradeBet<'info> {
    #[account(
        mut,
        seeds = [BETTING_POOLS_SEED],
        bump,
        has_one = authority @ BettingPoolsError::NotAuthorized
    )]
    pub betting_pools: Account<'info, BettingPoolsState>,

    #[account(
        mut,
        seeds = [POOL_SEED, pool.id.to_le_bytes().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// Claim payout context
#[derive(Accounts)]
pub struct ClaimPayout<'info> {
    #[account(
        seeds = [BETTING_POOLS_SEED],
        bump
    )]
    pub betting_pools: Account<'info, BettingPoolsState>,

    #[account(
        seeds = [POOL_SEED, pool.id.to_le_bytes().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [BET_SEED, pool.id.to_le_bytes().as_ref(), bet.id.to_le_bytes().as_ref()],
        bump,
        constraint = bet.owner == bettor.key() @ BettingPoolsError::NotBetOwner
    )]
    pub bet: Account<'info, Bet>,

    #[account(mut)]
    pub bettor: Signer<'info>,

    #[account(
        mut,
        token::authority = bettor,
        token::mint = if bet.token_type == TokenType::Usdc { betting_pools.usdc_mint } else { betting_pools.freedom_mint }
    )]
    pub bettor_token_account: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        token::mint = if bet.token_type == TokenType::Usdc { betting_pools.usdc_mint } else { betting_pools.freedom_mint }
    )]
    pub program_token_account: Account<'info, token::TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// Set image context
#[derive(Accounts)]
#[instruction(image_url: String)]
pub struct SetImage<'info> {
    #[account(
        mut,
        seeds = [POOL_SEED, pool.id.to_le_bytes().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        seeds = [BETTING_POOLS_SEED],
        bump,
        has_one = authority @ BettingPoolsError::NotAuthorized
    )]
    pub betting_pools: Account<'info, BettingPoolsState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseBettingPool<'info> {
    #[account(
        mut,
        seeds = [BETTING_POOLS_SEED],
        bump,
        has_one = authority @ BettingPoolsError::NotAuthorized,
        close = authority
    )]
    pub betting_pools: Account<'info, BettingPoolsState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>
}

//--------- DATA STRUCTURES ---------//

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum PoolStatus {
    None,
    Pending,
    Graded,
    Regraded, // Disputed (unused for now)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum TokenType {
    Usdc,
    Points,
}

#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub id: u64,
    #[max_len(150)]
    pub question: String,
    #[max_len(50, 50)]
    pub options: [String; 2],
    pub bets_close_at: i64,
    pub decision_time: i64,
    pub usdc_bet_totals: [u64; 2],
    pub points_bet_totals: [u64; 2],
    pub winning_option: u64,
    pub status: PoolStatus,
    pub is_draw: bool,
    pub created_at: i64,
    #[max_len(100)]
    pub original_truth_social_post_id: String,
    #[max_len(200)]
    pub image_url: String,
}

#[account]
#[derive(InitSpace)]
pub struct Bet {
    pub id: u64,
    pub owner: Pubkey,
    pub option: u64,
    pub amount: u64,
    pub pool_id: u64,
    pub created_at: i64,
    pub updated_at: i64,
    pub is_withdrawn: bool,
    pub token_type: TokenType,
}

//--------- EVENTS ---------//

#[event]
pub struct PoolCreated {
    pub pool_id: u64,
    pub question: String,
    pub options: [String; 2],
    pub bets_close_at: i64,
    pub original_truth_social_post_id: String,
    pub image_url: String,
    pub created_at: i64,
}

#[event]
pub struct BetPlaced {
    pub bet_id: u64,
    pub pool_id: u64,
    pub user: Pubkey,
    pub option_index: u64,
    pub amount: u64,
    pub token_type: TokenType,
    pub created_at: i64,
}

#[event]
pub struct PoolClosed {
    pub pool_id: u64,
    pub selected_option: u64,
    pub decision_time: i64,
}

#[event]
pub struct PayoutClaimed {
    pub bet_id: u64,
    pub pool_id: u64,
    pub user: Pubkey,
    pub amount: u64,
    pub token_type: TokenType,
}

#[event]
pub struct PoolImageSet {
    pub pool_id: u64,
    pub image_url: String,
}

//--------- ERRORS ---------//

#[error_code]
pub enum BettingPoolsError {
    #[msg("Bets close time must be in the future")]
    BetsCloseTimeInPast,
    #[msg("Pool is not open")]
    PoolNotOpen,
    #[msg("Betting period is closed")]
    BettingPeriodClosed,
    #[msg("Invalid option index")]
    InvalidOptionIndex,
    #[msg("BettingPools is already initialized")]
    AlreadyInitialized,
    #[msg("Zero amount")]
    ZeroAmount,
    #[msg("Not authorized")]
    NotAuthorized,
    #[msg("Token transfer failed")]
    TokenTransferFailed,
    #[msg("Pool is not graded")]
    PoolNotGraded,
    #[msg("Grading error")]
    GradingError,
    #[msg("Bet already withdrawn")]
    BetAlreadyWithdrawn,
    #[msg("Not bet owner")]
    NotBetOwner,
}
