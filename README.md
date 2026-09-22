# Elemenx

Elemenx v0.43.5 package baseline.

## Install development dependencies

```bash
npm install
```

No Playwright browser download is required. The test suite uses the locally installed stable Google Chrome.

## Test

```bash
npm test
```

`npm test` runs two layers:

1. Vitest Browser Mode in the locally installed Google Chrome for component/state/lifecycle/template/service/network/router regressions.
2. Playwright Test in the same locally installed Google Chrome for real top-level History API / popstate regressions that must not run inside an iframe.

## Examples

```bash
npm run examples
```

Then open:

- `/examples/simple/`
- `/examples/application/`

The important contracts from the three-day manual regression campaign are tracked in `tests/REGRESSION-MIGRATION.md`. New regressions should be added as automated tests instead of new numbered HTML phases.