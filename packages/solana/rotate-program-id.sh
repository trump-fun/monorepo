#!/bin/bash

set -e

# 1. Get old program id from lib.rs
LIB_RS_PATH="./programs/trump-fun/src/lib.rs"
OLD_PROGRAM_ID=$(grep -o 'declare_id!("[^"]*")' $LIB_RS_PATH | grep -o '"[^"]*"' | tr -d '"')
echo "Old Program ID: $OLD_PROGRAM_ID"

# 2. Generate new keypair
echo "Generating new keypair..."
solana-keygen new -o target/deploy/trump_fun-keypair.json --force --no-passphrase

# 3. Run anchor keys sync
echo "Syncing keys with Anchor..."
anchor keys sync


# Build project with specified Rust nightly toolchain
echo "Building project..."
anchor build


# 4. Get new program id from lib.rs after anchor keys sync
NEW_PROGRAM_ID=$(grep -o 'declare_id!("[^"]*")' $LIB_RS_PATH | grep -o '"[^"]*"' | tr -d '"')
echo "New Program ID: $NEW_PROGRAM_ID"

# 5. Replace old id in specified files
echo "Replacing program ID in files..."

# Update Anchor.toml
sed -i '' "s/$OLD_PROGRAM_ID/$NEW_PROGRAM_ID/g" Anchor.toml
echo "Updated Anchor.toml"

# Update substreams library
sed -i '' "s/$OLD_PROGRAM_ID/$NEW_PROGRAM_ID/g" ../solana-substream/src/lib.rs
echo "Updated ../solana-substream/src/lib.rs"

# Update IDL
sed -i '' "s/$OLD_PROGRAM_ID/$NEW_PROGRAM_ID/g" ../common/src/config.ts
echo "Updated ../common/src/config.ts"

sed -i '' "s/$OLD_PROGRAM_ID/$NEW_PROGRAM_ID/g" ../solana-substream/substreams.yaml
echo "Updated ../solana-substream/substreams.yaml"

sed -i '' "s/$OLD_PROGRAM_ID/$NEW_PROGRAM_ID/g" ../solana-substream/src/lib.rs
echo "Updated ../solana-substream/src/lib.rs"


echo "Program ID rotation complete! New ID: $NEW_PROGRAM_ID"

# Copy the IDL to the substreams directory
echo "Copying IDL file to ../solana-substream/idls/program.json..."
mkdir -p "./../solana-substream/idls"
cp "./target/idl/trump_fun.json" "./../solana-substream/idls/program.json"
echo "IDL file updated in ../solana-substream/idls/program.json"

# Copy the IDL to the fronend directory
echo "Copying IDL file to ../frontend/lib/__generated__/idl.json..."
cp "./target/idl/trump_fun.json" "./../frontend/src/types/__generated__/trump_fun.json"
echo "IDL file updated in ../frontend/src/types/__generated__/trump_fun.json"

echo "Copying generated types to ../frontend/lib/__generated__/idl.ts..."
cp "./target/types/trump_fun.ts" "./../frontend/src/types/__generated__/trump_fun.ts"
echo "Generated types file updated in ../frontend/src/types/__generated__/trump_fun.ts"


# Copy the IDL to the common directory
echo "Copying IDL file to ../common/src/types/__generated__/trump_fun.json..."
cp "./target/idl/trump_fun.json" "./../common/src/types/__generated__/trump_fun.json"
echo "IDL file updated in ../common/src/types/__generated__/trump_fun.json"

# Copy the IDL to the common directory
echo "Copying IDL file to ../common/src/types/__generated__/trump_fun.ts..."
cp "./target/types/trump_fun.ts" "./../common/src/types/__generated__/trump_fun.ts"
echo "IDL file updated in ../common/src/types/__generated__/trump_fun.ts"


# Copy the IDL to the common directory
echo "Copying IDL file to ../agent/src/types/__generated__..."
cp "./target/idl/trump_fun.json" "./../agent/src/types/__generated__/trump_fun.json"
echo "IDL file updated in ../agent/src/types/__generated__/trump_fun.json"


echo "Program ID rotation complete!"
echo "Old Program ID: $OLD_PROGRAM_ID"
echo "New Program ID: $NEW_PROGRAM_ID"
