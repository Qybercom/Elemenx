# Elemenx application example

This directory can be copied as a standalone project. It contains neither a copy of `elemenx.js` nor a private copy of the development server.

After copying the directory:

```bash
npm install
npm start
```

The installed `elemenx` package provides the shared `tools/server.js` and the framework exposed by that server as `/elemenx.js`.

Components keep source and markup together:

```text
components/
  index.js
  layout/
    Layout.js
    layout.html
  home/
    HomePage.js
    home.html
  project/
    ProjectPage.js
    project.html
```

`components/index.js` is the Elemenx Discovery enumerator. `Application.Root` points to `components`, so component scripts do not have to be listed manually in `index.html`.

A component uses a template path local to its own definition script, for example `TemplateURL: 'project.html'`. Elemenx resolves that relative URL from the component script URL.