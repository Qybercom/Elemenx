# Elemenx

Elemenx v0.43.5 package baseline.

## Install development dependencies

```bash
npm install
npx playwright install chromium
```

## Test

```bash
npm test
```

Tests run in a real headless Chromium through Vitest Browser Mode + Playwright.

## Examples

```bash
npm run examples
```

Then open:

- `/examples/simple/`
- `/examples/application/`

`simple` demonstrates the minimum Application + Component + reactive State flow.
`application` is a small routed application using nested components, a Service, a Guard, route Params/Query/Hash and lifecycle.

The historical hand-written regression pages are intentionally not the primary test runner anymore. Confirmed behaviors are being converted into normal automated browser tests.