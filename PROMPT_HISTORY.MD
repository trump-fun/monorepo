# Well written prompts used in the project

## Port a function from Smart Contracts to Program

```markdown
Can you please help me port the setTwitterPostId function from @BettingPools.sol to my Solana program at @lib.rs? This is an involved update, please consider the following:

1. You must port the relevant enums, event types, and any supporting functions.
2. We will not be using the permit system in Solana, so you can drop those parameters and their logic.
3. After adding this, do `RUSTUP_TOOLCHAIN=nightly-2025-04-14 anchor build` to generate a new idl
4. Then add a new test for each function in @tests/betting-pools-2
5. Run `RUSTUP_TOOLCHAIN=nightly-2025-04-14 anchor test` to confirm your test is working
6. Now that we've finished adding the function to the Program, replace @program.json with the newly generated idl from the build located at solana/target/idl/betting_pools_2.json (you can't see this file in context because its in gitignore, so do an ls on the path to confirm location before copying)
4. Then you must update the substream protobuf at @program.proto, and add handlers in @lib.rs. Then run `substreams build` in solana/canibeton_solana.
5. Then add the new entities for the events and bet, plus the relationship from pool to bet at least, in the graphql schema at @schema.graphql (@reference-old-schema.graphql can be used as a reference for what the schema entries might look like)
6. Then run `bun run generate` in solana/canibeton_solana/subgraph
7. Then update @mappings.ts with logic to capture the new entities
8. Finally confirm your mappings.ts change worked with `bun run build` in solana/canibeton_solana/subgraph
```


# (Solana) Instructions for adding or modifying instructions, struct, enums, or events.


After you finish making your additions and modifications to lib.rs, please do the following:

1. First start by running  `RUSTUP_TOOLCHAIN=nightly-2025-04-14 anchor build` to generate a new idl
2. If you added an instruction, create a test for it in @betting-pools-2.ts. If you modified anything, check @betting-pools-2.ts to make sure we don't have anything to update.
3. After updating tests, run Run `RUSTUP_TOOLCHAIN=nightly-2025-04-14 anchor test` to confirm your test is working


After you have tests working, if you added a new instruction or modified any existing instructions, accounts, events, or enums, we need to update the substream.

To update the substream:
1. Replace @program.json with the newly generated idl from the build located at solana/target/idl/betting_pools_2.json. Do not try to analyze @program.json, just replace it with a cp command to replace the file (ex: `cp target/idl/betting_pools_2.json target/canibeton_solana/idls/program.json`)
2. If you created a new instruction or modified fields in an existing instruction, account, or event, you must update the substream protobuf at @program.proto
3. If you had to update the substream protobuf, you now must update the handlers in @lib.rs (notice that this lib.rs is not our main program, it's the one in the substream's src folder)
4. Finally run `substreams build` in solana/canibeton_solana to confirm that the substream can build.

After you have the substream building, if you had to modify any code in the substreams, you need to update the subgraph.

1. We will start by changing @schema.graphql. You may have to make multiple changes to this file depending on what you have added or modified.
    - If you added a new event, you must add an entity representing that event to schema.graphql, and you should check if you need to update any of the aggregate/non-event types (Pool, Bet, and if it exists User).
    - If you modified or added fields to an existing event, you should update the entity representing that event in schema.graphql and check if any of the aggregate types have a copy of those event fields and update it as well.
    - If you added or modified fields in an account, you most likely have to update one of the aggregate types to include those fields.
    - Make sure to add relationships where they exist
2. If you had to make changes to @schema.graphql, run `bun run generate` in solana/canibeton_solana/subgraph to get new types
3. If you had to update @schema.graphql, update @mappings.ts with logic to capture the new or modified entities
4. Finally confirm your new schema changes and mappings.ts change worked with `bun run build` in solana/canibeton_solana/subgraph
