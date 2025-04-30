import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'https://api.studio.thegraph.com/query/105510/trump-fun-solana/version/latest',
  documents: ['src/**/*.tsx', 'src/**/*.ts', 'lib/queries/**/*.graphql'],
  generates: {
    'src/types/__generated__/': {
      preset: 'client',
      plugins: [],
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: false,
      },
      config: {
        useTypeImports: true,
        skipTypename: false,
        withHooks: true,
        withHOC: false,
        withComponent: false,
        namingConvention: 'keep',
      },
    },
    'src/types/__generated__/hooks.tsx': {
      plugins: ['typescript-react-apollo'],
      config: {
        withHooks: true,
        withHOC: false,
        importOperationTypesFrom: 'Types',
        typesNamespace: 'Types',
        importDocumentNodeExternallyFrom: './',
      },
      preset: undefined,
    },
    'src/types/__generated__/schema.graphql': {
      plugins: ['schema-ast'],
    },
  },
  ignoreNoDocuments: true,
};

export default config;
