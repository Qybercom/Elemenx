# Elemenx application example

This directory can be copied as a standalone project. It intentionally contains neither a copy of `elemenx.js` nor a private copy of the development server.

After copying the directory:

```bash
npm install
npm start
```

The installed `elemenx` package provides both the shared `tools/server.js` and the framework exposed by that server as `/elemenx.js`.

Component source and markup live together:

```text
components/
  layout/
    layout.js
    layout.html
  home/
    home.js
    home.html
  project/
    project.js
    project.html
```

Each component references the `.html` file in its own directory through `TemplateURL`.