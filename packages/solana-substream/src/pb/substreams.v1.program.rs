// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Data {
    #[prost(message, repeated, tag="1")]
    pub bet_placed_event_list: ::prost::alloc::vec::Vec<BetPlacedEvent>,
    #[prost(message, repeated, tag="2")]
    pub payout_claimed_event_list: ::prost::alloc::vec::Vec<PayoutClaimedEvent>,
    #[prost(message, repeated, tag="3")]
    pub pool_closed_event_list: ::prost::alloc::vec::Vec<PoolClosedEvent>,
    #[prost(message, repeated, tag="4")]
    pub pool_created_event_list: ::prost::alloc::vec::Vec<PoolCreatedEvent>,
    #[prost(message, repeated, tag="5")]
    pub pool_image_set_event_list: ::prost::alloc::vec::Vec<PoolImageSetEvent>,
    #[prost(message, repeated, tag="6")]
    pub claim_payout_instruction_list: ::prost::alloc::vec::Vec<ClaimPayoutInstruction>,
    #[prost(message, repeated, tag="7")]
    pub create_pool_instruction_list: ::prost::alloc::vec::Vec<CreatePoolInstruction>,
    #[prost(message, repeated, tag="8")]
    pub grade_bet_instruction_list: ::prost::alloc::vec::Vec<GradeBetInstruction>,
    #[prost(message, repeated, tag="9")]
    pub initialize_instruction_list: ::prost::alloc::vec::Vec<InitializeInstruction>,
    #[prost(message, repeated, tag="10")]
    pub place_bet_instruction_list: ::prost::alloc::vec::Vec<PlaceBetInstruction>,
    #[prost(message, repeated, tag="11")]
    pub set_image_instruction_list: ::prost::alloc::vec::Vec<SetImageInstruction>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct BetPlacedEvent {
    #[prost(string, tag="1")]
    pub trx_hash: ::prost::alloc::string::String,
    #[prost(uint64, tag="2")]
    pub bet_id: u64,
    #[prost(uint64, tag="3")]
    pub pool_id: u64,
    #[prost(string, tag="4")]
    pub user: ::prost::alloc::string::String,
    #[prost(uint64, tag="5")]
    pub option_index: u64,
    #[prost(uint64, tag="6")]
    pub amount: u64,
    #[prost(enumeration="TokenTypeEnum", tag="7")]
    pub token_type: i32,
    #[prost(int64, tag="8")]
    pub created_at: i64,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PayoutClaimedEvent {
    #[prost(string, tag="1")]
    pub trx_hash: ::prost::alloc::string::String,
    #[prost(uint64, tag="2")]
    pub bet_id: u64,
    #[prost(uint64, tag="3")]
    pub pool_id: u64,
    #[prost(string, tag="4")]
    pub user: ::prost::alloc::string::String,
    #[prost(uint64, tag="5")]
    pub amount: u64,
    #[prost(enumeration="TokenTypeEnum", tag="6")]
    pub token_type: i32,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PoolClosedEvent {
    #[prost(string, tag="1")]
    pub trx_hash: ::prost::alloc::string::String,
    #[prost(uint64, tag="2")]
    pub pool_id: u64,
    #[prost(uint64, tag="3")]
    pub selected_option: u64,
    #[prost(int64, tag="4")]
    pub decision_time: i64,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PoolCreatedEvent {
    #[prost(string, tag="1")]
    pub trx_hash: ::prost::alloc::string::String,
    #[prost(uint64, tag="2")]
    pub pool_id: u64,
    #[prost(string, tag="3")]
    pub question: ::prost::alloc::string::String,
    #[prost(string, repeated, tag="4")]
    pub options: ::prost::alloc::vec::Vec<::prost::alloc::string::String>,
    #[prost(int64, tag="5")]
    pub bets_close_at: i64,
    #[prost(string, tag="6")]
    pub original_truth_social_post_id: ::prost::alloc::string::String,
    #[prost(string, tag="7")]
    pub image_url: ::prost::alloc::string::String,
    #[prost(int64, tag="8")]
    pub created_at: i64,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PoolImageSetEvent {
    #[prost(string, tag="1")]
    pub trx_hash: ::prost::alloc::string::String,
    #[prost(uint64, tag="2")]
    pub pool_id: u64,
    #[prost(string, tag="3")]
    pub image_url: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ClaimPayoutInstruction {
    #[prost(string, tag="1")]
    pub trx_hash: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub acct_betting_pools: ::prost::alloc::string::String,
    #[prost(string, tag="3")]
    pub acct_pool: ::prost::alloc::string::String,
    #[prost(string, tag="4")]
    pub acct_bet: ::prost::alloc::string::String,
    #[prost(string, tag="5")]
    pub acct_bettor: ::prost::alloc::string::String,
    #[prost(string, tag="6")]
    pub acct_bettor_token_account: ::prost::alloc::string::String,
    #[prost(string, tag="7")]
    pub acct_program_token_account: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreatePoolInstruction {
    #[prost(string, tag="1")]
    pub trx_hash: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub question: ::prost::alloc::string::String,
    #[prost(string, repeated, tag="3")]
    pub options: ::prost::alloc::vec::Vec<::prost::alloc::string::String>,
    #[prost(int64, tag="4")]
    pub bets_close_at: i64,
    #[prost(string, tag="5")]
    pub original_truth_social_post_id: ::prost::alloc::string::String,
    #[prost(string, tag="6")]
    pub image_url: ::prost::alloc::string::String,
    #[prost(string, tag="7")]
    pub acct_betting_pools: ::prost::alloc::string::String,
    #[prost(string, tag="8")]
    pub acct_pool: ::prost::alloc::string::String,
    #[prost(string, tag="9")]
    pub acct_authority: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GradeBetInstruction {
    #[prost(string, tag="1")]
    pub trx_hash: ::prost::alloc::string::String,
    #[prost(uint64, tag="2")]
    pub response_option: u64,
    #[prost(string, tag="3")]
    pub acct_betting_pools: ::prost::alloc::string::String,
    #[prost(string, tag="4")]
    pub acct_pool: ::prost::alloc::string::String,
    #[prost(string, tag="5")]
    pub acct_authority: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct InitializeInstruction {
    #[prost(string, tag="1")]
    pub trx_hash: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub usdc_mint: ::prost::alloc::string::String,
    #[prost(string, tag="3")]
    pub freedom_mint: ::prost::alloc::string::String,
    #[prost(string, tag="4")]
    pub acct_betting_pools: ::prost::alloc::string::String,
    #[prost(string, tag="5")]
    pub acct_authority: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PlaceBetInstruction {
    #[prost(string, tag="1")]
    pub trx_hash: ::prost::alloc::string::String,
    #[prost(uint64, tag="2")]
    pub option_index: u64,
    #[prost(uint64, tag="3")]
    pub amount: u64,
    #[prost(enumeration="TokenTypeEnum", tag="4")]
    pub token_type: i32,
    #[prost(string, tag="5")]
    pub acct_betting_pools: ::prost::alloc::string::String,
    #[prost(string, tag="6")]
    pub acct_pool: ::prost::alloc::string::String,
    #[prost(string, tag="7")]
    pub acct_bet: ::prost::alloc::string::String,
    #[prost(string, tag="8")]
    pub acct_bettor: ::prost::alloc::string::String,
    #[prost(string, tag="9")]
    pub acct_bettor_token_account: ::prost::alloc::string::String,
    #[prost(string, tag="10")]
    pub acct_program_token_account: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SetImageInstruction {
    #[prost(string, tag="1")]
    pub trx_hash: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub image_url: ::prost::alloc::string::String,
    #[prost(string, tag="3")]
    pub acct_pool: ::prost::alloc::string::String,
    #[prost(string, tag="4")]
    pub acct_betting_pools: ::prost::alloc::string::String,
    #[prost(string, tag="5")]
    pub acct_authority: ::prost::alloc::string::String,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum TokenTypeEnum {
    TokenTypeUsdc = 0,
    TokenTypePoints = 1,
}
impl TokenTypeEnum {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            TokenTypeEnum::TokenTypeUsdc => "TOKEN_TYPE_USDC",
            TokenTypeEnum::TokenTypePoints => "TOKEN_TYPE_POINTS",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "TOKEN_TYPE_USDC" => Some(Self::TokenTypeUsdc),
            "TOKEN_TYPE_POINTS" => Some(Self::TokenTypePoints),
            _ => None,
        }
    }
}
// @@protoc_insertion_point(module)
