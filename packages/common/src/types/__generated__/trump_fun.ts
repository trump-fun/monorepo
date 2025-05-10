/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/trump_fun.json`.
 */
export type TrumpFun = {
  address: 'Cc3juTiDWjZRR9XSVmXmcC2ntkNERjiyw4wbio7ioz2T';
  metadata: {
    name: 'trumpFun';
    version: '0.1.0';
    spec: '0.1.0';
    description: 'Created with Anchor';
  };
  instructions: [
    {
      name: 'claimPayout';
      docs: ['Claim payouts for a bet'];
      discriminator: [127, 240, 132, 62, 227, 198, 146, 133];
      accounts: [
        {
          name: 'bettingPools';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [98, 101, 116, 116, 105, 110, 103, 95, 112, 111, 111, 108, 115, 95, 118, 49];
              },
            ];
          };
        },
        {
          name: 'pool';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [112, 111, 111, 108, 95, 118, 49];
              },
              {
                kind: 'account';
                path: 'pool.id';
                account: 'pool';
              },
            ];
          };
        },
        {
          name: 'bet';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [98, 101, 116, 95, 118, 49];
              },
              {
                kind: 'account';
                path: 'pool.id';
                account: 'pool';
              },
              {
                kind: 'account';
                path: 'bet.id';
                account: 'bet';
              },
            ];
          };
        },
        {
          name: 'bettor';
          writable: true;
          signer: true;
        },
        {
          name: 'bettorTokenAccount';
          writable: true;
        },
        {
          name: 'programTokenAccount';
          writable: true;
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [];
    },
    {
      name: 'closeBettingPool';
      discriminator: [106, 107, 213, 179, 30, 148, 105, 114];
      accounts: [
        {
          name: 'bettingPools';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [98, 101, 116, 116, 105, 110, 103, 95, 112, 111, 111, 108, 115, 95, 118, 49];
              },
            ];
          };
        },
        {
          name: 'authority';
          writable: true;
          signer: true;
          relations: ['bettingPools'];
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [];
    },
    {
      name: 'createPool';
      docs: [
        'Create a new betting pool',
        'Similar to the createPool function in the Solidity version',
      ];
      discriminator: [233, 146, 209, 142, 207, 104, 64, 188];
      accounts: [
        {
          name: 'bettingPools';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [98, 101, 116, 116, 105, 110, 103, 95, 112, 111, 111, 108, 115, 95, 118, 49];
              },
            ];
          };
        },
        {
          name: 'pool';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [112, 111, 111, 108, 95, 118, 49];
              },
              {
                kind: 'account';
                path: 'betting_pools.next_pool_id';
                account: 'bettingPoolsState';
              },
            ];
          };
        },
        {
          name: 'authority';
          writable: true;
          signer: true;
          relations: ['bettingPools'];
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [
        {
          name: 'question';
          type: 'string';
        },
        {
          name: 'options';
          type: {
            array: ['string', 2];
          };
        },
        {
          name: 'betsCloseAt';
          type: 'i64';
        },
        {
          name: 'originalTruthSocialPostId';
          type: 'string';
        },
        {
          name: 'imageUrl';
          type: 'string';
        },
      ];
    },
    {
      name: 'gradeBet';
      docs: ['Grade a betting pool', 'Determines the winning option and releases payouts'];
      discriminator: [163, 14, 104, 39, 20, 221, 88, 64];
      accounts: [
        {
          name: 'bettingPools';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [98, 101, 116, 116, 105, 110, 103, 95, 112, 111, 111, 108, 115, 95, 118, 49];
              },
            ];
          };
        },
        {
          name: 'pool';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [112, 111, 111, 108, 95, 118, 49];
              },
              {
                kind: 'account';
                path: 'pool.id';
                account: 'pool';
              },
            ];
          };
        },
        {
          name: 'authority';
          writable: true;
          signer: true;
          relations: ['bettingPools'];
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [
        {
          name: 'responseOption';
          type: 'u64';
        },
      ];
    },
    {
      name: 'initialize';
      docs: [
        'Initialize the BettingPools program',
        'Similar to the constructor in the Solidity version',
      ];
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        {
          name: 'bettingPools';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [98, 101, 116, 116, 105, 110, 103, 95, 112, 111, 111, 108, 115, 95, 118, 49];
              },
            ];
          };
        },
        {
          name: 'authority';
          writable: true;
          signer: true;
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [
        {
          name: 'usdcMint';
          type: 'pubkey';
        },
        {
          name: 'freedomMint';
          type: 'pubkey';
        },
      ];
    },
    {
      name: 'placeBet';
      docs: ['Place a bet on a pool', 'Similar to the placeBet function in the Solidity version'];
      discriminator: [222, 62, 67, 220, 63, 166, 126, 33];
      accounts: [
        {
          name: 'bettingPools';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [98, 101, 116, 116, 105, 110, 103, 95, 112, 111, 111, 108, 115, 95, 118, 49];
              },
            ];
          };
        },
        {
          name: 'pool';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [112, 111, 111, 108, 95, 118, 49];
              },
              {
                kind: 'account';
                path: 'pool.id';
                account: 'pool';
              },
            ];
          };
        },
        {
          name: 'bet';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [98, 101, 116, 95, 118, 49];
              },
              {
                kind: 'account';
                path: 'pool.id';
                account: 'pool';
              },
              {
                kind: 'account';
                path: 'betting_pools.next_bet_id';
                account: 'bettingPoolsState';
              },
            ];
          };
        },
        {
          name: 'bettor';
          writable: true;
          signer: true;
        },
        {
          name: 'bettorTokenAccount';
          writable: true;
        },
        {
          name: 'programTokenAccount';
          writable: true;
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'rent';
          address: 'SysvarRent111111111111111111111111111111111';
        },
      ];
      args: [
        {
          name: 'optionIndex';
          type: 'u64';
        },
        {
          name: 'amount';
          type: 'u64';
        },
        {
          name: 'tokenType';
          type: {
            defined: {
              name: 'tokenType';
            };
          };
        },
      ];
    },
    {
      name: 'setImage';
      docs: ['Update the image URL for a pool'];
      discriminator: [92, 53, 60, 157, 76, 46, 6, 181];
      accounts: [
        {
          name: 'pool';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [112, 111, 111, 108, 95, 118, 49];
              },
              {
                kind: 'account';
                path: 'pool.id';
                account: 'pool';
              },
            ];
          };
        },
        {
          name: 'bettingPools';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [98, 101, 116, 116, 105, 110, 103, 95, 112, 111, 111, 108, 115, 95, 118, 49];
              },
            ];
          };
        },
        {
          name: 'authority';
          writable: true;
          signer: true;
          relations: ['bettingPools'];
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [
        {
          name: 'imageUrl';
          type: 'string';
        },
      ];
    },
  ];
  accounts: [
    {
      name: 'bet';
      discriminator: [147, 23, 35, 59, 15, 75, 155, 32];
    },
    {
      name: 'bettingPoolsState';
      discriminator: [136, 14, 114, 28, 173, 213, 192, 14];
    },
    {
      name: 'pool';
      discriminator: [241, 154, 109, 4, 17, 177, 109, 188];
    },
  ];
  events: [
    {
      name: 'betPlaced';
      discriminator: [88, 88, 145, 226, 126, 206, 32, 0];
    },
    {
      name: 'payoutClaimed';
      discriminator: [200, 39, 105, 112, 116, 63, 58, 149];
    },
    {
      name: 'poolClosed';
      discriminator: [106, 46, 29, 231, 42, 44, 73, 119];
    },
    {
      name: 'poolCreated';
      discriminator: [202, 44, 41, 88, 104, 220, 157, 82];
    },
    {
      name: 'poolImageSet';
      discriminator: [28, 145, 103, 123, 72, 188, 54, 168];
    },
  ];
  errors: [
    {
      code: 6000;
      name: 'betsCloseTimeInPast';
      msg: 'Bets close time must be in the future';
    },
    {
      code: 6001;
      name: 'poolNotOpen';
      msg: 'Pool is not open';
    },
    {
      code: 6002;
      name: 'bettingPeriodClosed';
      msg: 'Betting period is closed';
    },
    {
      code: 6003;
      name: 'invalidOptionIndex';
      msg: 'Invalid option index';
    },
    {
      code: 6004;
      name: 'alreadyInitialized';
      msg: 'BettingPools is already initialized';
    },
    {
      code: 6005;
      name: 'zeroAmount';
      msg: 'Zero amount';
    },
    {
      code: 6006;
      name: 'notAuthorized';
      msg: 'Not authorized';
    },
    {
      code: 6007;
      name: 'tokenTransferFailed';
      msg: 'Token transfer failed';
    },
    {
      code: 6008;
      name: 'poolNotGraded';
      msg: 'Pool is not graded';
    },
    {
      code: 6009;
      name: 'gradingError';
      msg: 'Grading error';
    },
    {
      code: 6010;
      name: 'betAlreadyWithdrawn';
      msg: 'Bet already withdrawn';
    },
    {
      code: 6011;
      name: 'notBetOwner';
      msg: 'Not bet owner';
    },
  ];
  types: [
    {
      name: 'bet';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'id';
            type: 'u64';
          },
          {
            name: 'owner';
            type: 'pubkey';
          },
          {
            name: 'option';
            type: 'u64';
          },
          {
            name: 'amount';
            type: 'u64';
          },
          {
            name: 'poolId';
            type: 'u64';
          },
          {
            name: 'createdAt';
            type: 'i64';
          },
          {
            name: 'updatedAt';
            type: 'i64';
          },
          {
            name: 'isWithdrawn';
            type: 'bool';
          },
          {
            name: 'tokenType';
            type: {
              defined: {
                name: 'tokenType';
              };
            };
          },
        ];
      };
    },
    {
      name: 'betPlaced';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'betId';
            type: 'u64';
          },
          {
            name: 'poolId';
            type: 'u64';
          },
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'optionIndex';
            type: 'u64';
          },
          {
            name: 'amount';
            type: 'u64';
          },
          {
            name: 'tokenType';
            type: {
              defined: {
                name: 'tokenType';
              };
            };
          },
          {
            name: 'createdAt';
            type: 'i64';
          },
        ];
      };
    },
    {
      name: 'bettingPoolsState';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'authority';
            type: 'pubkey';
          },
          {
            name: 'usdcMint';
            type: 'pubkey';
          },
          {
            name: 'freedomMint';
            type: 'pubkey';
          },
          {
            name: 'nextPoolId';
            type: 'u64';
          },
          {
            name: 'nextBetId';
            type: 'u64';
          },
          {
            name: 'payoutFeeBp';
            type: 'u16';
          },
          {
            name: 'isInitialized';
            type: 'bool';
          },
        ];
      };
    },
    {
      name: 'payoutClaimed';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'betId';
            type: 'u64';
          },
          {
            name: 'poolId';
            type: 'u64';
          },
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'amount';
            type: 'u64';
          },
          {
            name: 'tokenType';
            type: {
              defined: {
                name: 'tokenType';
              };
            };
          },
        ];
      };
    },
    {
      name: 'pool';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'id';
            type: 'u64';
          },
          {
            name: 'question';
            type: 'string';
          },
          {
            name: 'options';
            type: {
              array: ['string', 2];
            };
          },
          {
            name: 'betsCloseAt';
            type: 'i64';
          },
          {
            name: 'decisionTime';
            type: 'i64';
          },
          {
            name: 'usdcBetTotals';
            type: {
              array: ['u64', 2];
            };
          },
          {
            name: 'pointsBetTotals';
            type: {
              array: ['u64', 2];
            };
          },
          {
            name: 'winningOption';
            type: 'u64';
          },
          {
            name: 'status';
            type: {
              defined: {
                name: 'poolStatus';
              };
            };
          },
          {
            name: 'isDraw';
            type: 'bool';
          },
          {
            name: 'createdAt';
            type: 'i64';
          },
          {
            name: 'originalTruthSocialPostId';
            type: 'string';
          },
          {
            name: 'imageUrl';
            type: 'string';
          },
        ];
      };
    },
    {
      name: 'poolClosed';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'poolId';
            type: 'u64';
          },
          {
            name: 'selectedOption';
            type: 'u64';
          },
          {
            name: 'decisionTime';
            type: 'i64';
          },
        ];
      };
    },
    {
      name: 'poolCreated';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'poolId';
            type: 'u64';
          },
          {
            name: 'question';
            type: 'string';
          },
          {
            name: 'options';
            type: {
              array: ['string', 2];
            };
          },
          {
            name: 'betsCloseAt';
            type: 'i64';
          },
          {
            name: 'originalTruthSocialPostId';
            type: 'string';
          },
          {
            name: 'imageUrl';
            type: 'string';
          },
          {
            name: 'createdAt';
            type: 'i64';
          },
        ];
      };
    },
    {
      name: 'poolImageSet';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'poolId';
            type: 'u64';
          },
          {
            name: 'imageUrl';
            type: 'string';
          },
        ];
      };
    },
    {
      name: 'poolStatus';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'none';
          },
          {
            name: 'pending';
          },
          {
            name: 'graded';
          },
          {
            name: 'regraded';
          },
        ];
      };
    },
    {
      name: 'tokenType';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'usdc';
          },
          {
            name: 'points';
          },
        ];
      };
    },
  ];
};
