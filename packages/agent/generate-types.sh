#!/bin/bash

# This script generates the graphql types and removes the deprecated fields

echo "Generating GraphQL types..."
bun run graphql-codegen

# Define the files to process
FILES_TO_CLEAN=("graphql" "graphql-request")
TARGET_DIR="src/types/__generated__"

for BASE_NAME in "${FILES_TO_CLEAN[@]}"; do
    INPUT_FILE="${TARGET_DIR}/${BASE_NAME}.ts"
    TEMP_FILE="temp_${BASE_NAME}.ts"

    echo "Removing deprecated fields from ${INPUT_FILE}..."
    grep -v \
        -e "PoolId = 'pool__id'," \
        -e "BetId = 'bet__id'," \
        -e "UserAddress = 'user__address'" \
        "${INPUT_FILE}" > "${TEMP_FILE}"

    # Check if grep succeeded before moving
    if [ $? -eq 0 ]; then
        mv "${TEMP_FILE}" "${INPUT_FILE}"
    else
        echo "Error processing ${INPUT_FILE}. Skipping move."
        # Optionally remove the temp file if grep failed
        rm -f "${TEMP_FILE}"
    fi
done

echo "GraphQL types generated and cleaned successfully."
