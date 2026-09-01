# Vendored Meta Business SDK

`facebook-nodejs-business-sdk-26.0.1.tgz` is the prebuilt package
used by this repository for Meta Business SDK v26.0.1 and Graph
API v26.0. The older v25 archive remains only as rollback
material and is not referenced by the package manifest.

## Provenance

- Official release:
  <https://github.com/facebook/facebook-nodejs-business-sdk/releases/tag/v26.0.1>
- Official source commit:
  `7da8e9cd5a1e4137650c0c9d7ffed29c36624606`
- Archive SHA-256:
  `f002439251678f3443181971f5f9ec0f040026ba744087468113b8a8e5d7f172`
- Package version: `26.0.1`

The archive's `src/`, `LICENSE`, and `README.md` were compared
byte-for-byte with the official source commit. The archive also
contains the generated `dist/cjs.js` and source map required by
the package's declared CommonJS entrypoint.

## Why the archive is checked in

Meta released v26.0.1 on GitHub while npm's `latest` tag still
resolved to an older major version. Installing the raw Git source
requires its legacy nested build toolchain during every clean
install. The prebuilt archive keeps local, CI, and Vercel
installs frozen and reproducible without allowing dependency
build scripts at install time.

Do not replace the archive without updating the source commit,
checksum, lockfile integrity, runtime import smoke test, and Meta
mapping tests.
