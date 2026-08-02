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
      'react/jsx-no-undef': 'error'
    }
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'docs/md-docs/**',
    'docs/**/*.md',
    'src/components/klarna/dev/docs/**'
  ])
])

export default eslintConfig
