#!/usr/bin/env node

void import('./trendsmcp.mjs')
  .then(({ startServer }) => startServer())
  .catch(error => {
    console.error(
      error instanceof Error ?
        error.message
      : 'TrendsMCP failed to start.'
    )
    process.exit(1)
  })
