import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'https://api.studio.thegraph.com/query/105510/trump-fun-solana/version/latest',
  documents: ['src/**/*.tsx', 'src/**/*.ts', 'src/**/*.graphql'],
  generates: {
    'src/types/__generated__/graphql-request.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-graphql-request'],
      config: {
        rawRequest: false,
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
