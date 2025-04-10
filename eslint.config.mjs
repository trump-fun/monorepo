import { FlatCompat } from '@eslint/eslintrc';
import unusedImports from 'eslint-plugin-unused-imports';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'dist/**', 'build/**', '.git/**', 'public/**'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'react-hooks/exhaustive-deps': [
        'warn',
        {
          enableDangerousAutofixThisMayCauseInfiniteLoops: true,
        },
      ],
    },
  },
];

export default eslintConfig;
