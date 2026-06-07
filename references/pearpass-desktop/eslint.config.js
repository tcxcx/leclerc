import { eslintConfig } from '@tetherto/tether-dev-docs'
import globals from 'globals'

export default [
  { ignores: ['src/PearPass/**'] },
  ...eslintConfig,
  {
    files: ['**/*.test.{js,jsx,mjs,cjs,ts,tsx}'],
    languageOptions: {
      globals: globals.jest
    }
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    rules: {
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^React$',
          ignoreRestSiblings: true
        }
      ]
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^React$',
          ignoreRestSiblings: true
        }
      ]
    }
  }
]
