# Elemenx Libraries

A Library is a first-class Elemenx extension graph. It can provide Components, Services, Guards, Directives and Traits (`Elemenx.Trait`, in `traits/`: the props, methods and hooks Components take with `$Traits`) through the same Discovery and production Bundle mechanisms used by an Application. A Trait is loaded the first time a Component that takes it is used; a build carries every Trait of a Library, and the base a Component names in `$Extends`.

External libraries are registered before the Application that uses them:

```js
Elemenx.Library('Mosaic', {
	$Root: 'libraries/Mosaic'
});

Elemenx.Application('Application', {
	$Use: ['Mosaic'],
	$Component: 'Root',
	$Root: 'application'
});
```

`$Use` accepts a library name or an Array. The Application exposes the declaration as it names it through `$Libraries()`.

A Library may stand on others: its definition has a `$Use` of its own (`Elemenx.Library('Charts3D', {$Root: 'libraries/Charts3D', $Use: ['ElemenxGraphics']})`). An Application that uses it gets those first, and theirs before them, each once: what a Library uses is loaded before it, one Library after another in that order. A Library that uses itself, through others or not, throws `Elemenx Library uses itself: A > B > A` as the Application starts; two Libraries that define an entity of the same name fail its startup (`Elemenx Library B defines Name, which A defines too`): which of them would be found depended on their order.

In development, Elemenx builds a Discovery graph for every used Library. Component resolution falls back to those graphs when an entity is not present in the Application graph. Library Services and Directives are loaded before the Application root starts. CSS files listed by the Library `index.js` are attached once per Library. Unknown names in `$Use` are skipped with a warning and do not block Application startup; errors while loading an existing Library remain fatal for that startup.

In production, Builder scans Library roots declared in the entry file. Non-Component entities remain available to the Application, while Components are included by reachability from bundled Application templates and then transitively from selected Library Component templates. Unused Library Components are omitted. External templates/styles owned by selected Components are inlined by the normal Bundle pass, while CSS assets declared by the Library graph are copied to their Library path in `dist`. The runtime therefore does not require Library Discovery source graphs to start bundled entities.

Packs. A Library may name in `packs.json`, in its root, the large files that few pages need: `{"brands": {"Files": ["icons/brands.svg"], "Uses": ["brands:"]}}`. `Files` are paths from the root (files of the `index.js` graph), `Uses` the texts that show an Application needs them, `Language` makes a pack of one language, `Bundled` keeps it in the standalone bundle of `npm run dist` (a build of an Application still takes it only when it is used). A pack changes nothing at run time, its files load as any other; the tools use it: a build takes a pack only when the Application uses it (or `--packs` asks for it), `elemenx build --single` embedding it, a build in a folder copying its files, and the standalone bundles of `npm run dist` carry a pack in a script of its own (see `docs/BUILDER.md`). ElemenxUI has the packs `emoji`, `emoji.ru`, `cities`, `cities.ru`, `brands`, `files`, and the themes `contrast`, `darcula`, `soft` (bundled), `fantasy`, `scifi` and `glassy` (a pack of a stylesheet: a build carries a theme only when the Application names it, as `Theme.Use('darcula')` or `data-theme="darcula"` does, or lists them all, `Theme.Themes()`, and a site build links only those from its page).

The system Libraries are built in, each in `libraries/<name>`, each on the ones before it: `ElemenxCommon` (what needs no page: algorithms, physics, data; it runs in Node and in workers too), `ElemenxUI` on it (the Components of a page), `ElemenxGraphics` on ElemenxUI (scenes in 3D) and `ElemenxGaming` on ElemenxGraphics (what makes a scene a game). They are available without an explicit `Elemenx.Library(...)` declaration; an Application only needs `$Use: ['ElemenxUI']` (and has ElemenxCommon with it), or `$Use: ['ElemenxGaming']` for all four. Each has its own dictionaries (`locales/`, keys `common.*`, `ui.*`, `graphics.*`, `gaming.*`), its own `data/meta.json` (`elemenx meta` writes them all), its own bundles in `dist` and its own tree in the Docs. The development server exposes package libraries through `/libraries/`, so examples and installed-package consumers use the same canonical source instead of carrying private copies. The executable catalogue is the Advanced example route `/ui`.

The layout of a Library. Each entity has a folder of its own, named as it is: `components/Card/Card.js` (with `Card.html`, `Card.css`), `services/Math/Math.js`, `directives/Swipe/Swipe.js`; a Service or a Directive may still be a single file of its kind folder (`services/Math.js`), and the tools take both. What is beside an entity for its authors goes with it and never ships (the bundles, the files of a Library in `dist`, the copies of the editors and the npm package leave it out):

- `docs/`: its description in other languages (`Math.ru.md`, the English one is the comment at the head of its source) and the example of its page in the Docs (`Math.html`); `npm run docs:pages` makes the pages of the Docs of them;
- `Math.test.js`: its contract tests, of it alone and of what it uses (`Math.node.test.js` for those that run in Node); the tests of several entities stay in `tests/regression`;
- `locales/<language>.json`: its phrases, under the keys of its Library (`{"common": {"virtualGamepad": {...}}}`). `npm run locales` (`tools/locales.js`) merges the pieces of a Library into its dictionaries, `locales/<language>.json`: the phrases no one entity has first (`locales/shared/<language>.json`), then those of each entity; a phrase given twice is an error, and a test checks that the dictionaries are their pieces merged.

A Library has a `docs/` folder too: its page (`libraries/ElemenxCommon/docs/ElemenxCommon.md`).

Registries. A Service that others add to (formats of `DataFormats`, `FieldFormats`, languages of `Syntax`, kinds of `SceneKinds` and of `Seeded`, lands of `SceneBiomes`, kinds of graphs and blocks of `Blueprints`) takes what a Service of any Library declares to it in `$Provides`: `{DataFormats: {Formats: ['vox']}, Blueprints: {Nodes: ['Rust']}}`. Nothing is made for it: when the registry meets a name it does not know, or is asked for the list of all of them, it calls `this.$Provide(kind, name)`, and the Services that declare it are made then, in the same Application; their `$OnCreate` adds what they declared. A build of an Application takes the Services that provide to a registry the Application uses (see `docs/PUBLIC-API.md`).

## The system Libraries

- [ElemenxCommon](../libraries/ElemenxCommon/docs/ElemenxCommon.md): what needs no page, in a page, a worker and Node: numbers, physics, paths, data, formats, syntax, blueprints, input devices, achievements.
- [ElemenxUI](../libraries/ElemenxUI/docs/ElemenxUI.md): the Components of a page, their phrases, styles and icons, and the Services and Directives they use.
- [ElemenxGraphics](../libraries/ElemenxGraphics/docs/ElemenxGraphics.md): scenes in three dimensions, their worlds, models, light, roads and editors.
- [ElemenxGaming](../libraries/ElemenxGaming/docs/ElemenxGaming.md): what makes a scene a game: races, strategy.
