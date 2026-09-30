# Elemenx simple example

This directory can be copied as a standalone project. It contains neither a copy of `elemenx.js` nor a private copy of the development server.

After copying the directory:

```bash
npm install
npm start
```

The installed `elemenx` package provides the shared `tools/server.js` and the framework exposed by that server as `/elemenx.js`.

The component keeps its source and markup together:

```text
components/
  simple-app/
    simple-app.js
    simple-app.html
```

`simple-app.js` uses `$TemplateURL: 'simple-app.html'`, so the template is resolved next to the component definition script.