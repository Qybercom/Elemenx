# Elemenx simple example

The smallest Elemenx application: one page, `index.html`, with one Component, its template and its Application. It shows reactive state (`$Batch`), references (`#Increment`, `$Ref`) and the persistent `Storage` (the theme survives a reload).

This directory can be copied as a standalone project. It contains neither a copy of `elemenx.js` nor a private copy of the development server: they come from the `@qybercom/elemenx` package.

After copying the directory:

```bash
npm install
npm start
```

`npm start` runs `elemenx dev`, the development server of the package, which also serves the framework as `/elemenx.js`. From the Elemenx repository, `npm run example:simple` starts it the same way.

Everything is in `index.html`:

- `Elemenx.Component('SimpleApp', {$TemplateID: 'simple-app', ...})` defines the Component; its template is the `<template id="simple-app">` of the page;
- `Elemenx.Application('SimpleExample', {$Component: 'SimpleApp', $Mount: '#app'})` mounts it into `<div id="app">`.

A larger application keeps each Component in a folder of its own (`Counter/Counter.js` and `Counter/Counter.html`), as `npx elemenx generate application MyApp` makes it; see `examples/Advanced`.
