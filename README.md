# Elemenx

Elemenx is a browser UI framework for component-based applications with reactive state, routing, services, storage, messaging and network transports.

## Development

Install the development dependencies:

```bash
npm install
```

The browser regression suite uses the locally installed stable Google Chrome; no Playwright browser download is required.

Run the complete suite:

```bash
npm test
```

`npm test` runs Vitest Browser Mode for browser-level contracts and Playwright Test for top-level History API behavior.

## Examples

Every directory under `examples/` is a standalone project. Copy an example directory anywhere and run it independently from the Elemenx repository.

Simple example:

```bash
cd examples/simple
npm start
```

Application/router example:

```bash
cd examples/application
npm start
```

Then open the URL printed by the example server. Each example contains its own `elemenx.js`, `package.json`, server and README.

## Regression coverage

The maintained coverage map is in `tests/TEST-COVERAGE.md`. New public API should include an automated contract, and bug fixes should include a regression test.