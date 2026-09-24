# Elemenx simple example

This directory can be copied as a standalone project. It intentionally contains neither a copy of `elemenx.js` nor a private copy of the development server.

After copying the directory:

```bash
npm install
npm start
```

The installed `elemenx` package provides both the shared `tools/server.js` and the framework exposed by that server as `/elemenx.js`.

Each component owns its files in one directory, following the same component-local layout used by frameworks such as Angular:

```text
components/
  simple-app/
    simple-app.js
    simple-app.html
```

`simple-app.js` references its neighboring markup through `TemplateURL`.