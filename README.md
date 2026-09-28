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

`npm test` runs the browser contract suite, Node/tooling regressions, and real-browser Playwright end-to-end tests.

## Examples

The maintained examples are `examples/Simple` and `examples/Advanced`. From the Elemenx repository they can be started with:

```bash
npm run example:simple
npm run example:advanced
```

`Advanced` is also a standalone package consumer: after copying it outside the repository, run `npm install` and `npm run dev`. Its `elemenx` dependency provides the framework and CLI; the example does not carry a private copy of `elemenx.js` or the server.

The production path is exercised with:

```bash
npm run build:advanced
npm run example:advanced:dist
```

## Regression coverage

The maintained coverage map is in `tests/TEST-COVERAGE.md`. New public API should include an automated contract, and bug fixes should include a regression test.