import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': ['error', { functions: false, classes: true, variables: true, typedefs: false }],
      'block-scoped-var': 'error',
      'comma-dangle': ['error', 'never'],
      'dot-notation': 'error',
      'func-name-matching': 'error',
      'max-params': ['error', 6],
      'new-cap': [
        'error',
        { capIsNew: false, newIsCap: true, properties: true }
      ],
      'no-self-compare': 'error',
      'no-this-before-super': 'error',
      'no-useless-assignment': 'error',
      'quotes': ['error', 'single'],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ]
    }
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'output/**',
    '.vercel/**',
    '.agent/**',
    '.agent-artifacts/**',
    '.devtools/**',
    'merchant-api-samples/**',
    'next-env.d.ts',
    'docs/md-docs/**',
    'docs/**/*.md',
    'src/components/klarna/dev/docs/**'
  ])
])

export default eslintConfig
