# The CLI

The package `@qybercom/elemenx` gives the command `elemenx` (`npx elemenx` in a project, or the script `elemenx-cli.js`). It makes projects and their parts, serves them while they are written, serves their builds as a production server would, builds them, and makes icon sets.

```text
elemenx generate application <Name> [path] [--native [desktop|mobile]] [--force]
elemenx generate <component|service|guard|directive> <path/Name> [project] [--application Name] [--force]
elemenx dev [project] [--port 4173] [--host 127.0.0.1]
elemenx serve [project] [--port 4175] [--host 127.0.0.1] [--out dist] [--compression true|false] [--compression-threshold 1024] [--cache-control "..."]
elemenx build [project] [options]
elemenx native add [desktop|mobile|all] [project]
elemenx icons <directory> <output.svg> [--current-color]
elemenx version
elemenx help [command]
```

`elemenx help <command>`, or `elemenx <command> --help`, shows the use and the options of one command; `g` is short for `generate`.

## generate

```bash
npx elemenx generate application Shop
npx elemenx g component pages/HomePage
npx elemenx g service services/Cart
npx elemenx g guard SignedIn
npx elemenx g directive Tooltip
```

- `generate application Shop` makes the folder of its sources, `Shop/`, with `index.js` and the root component `App`; and `app.js`, `index.html`, `elemenx.config.js` and `package.json` (with the scripts `dev`, `build`, `serve`) when the project has none. A second Application beside it (`generate application Admin`) keeps the files that are there. `--native` makes it ready for native programs (see [Builds](/guide/build)).
- An entity goes under the root of the sources of its Application (`Application` of `elemenx.config.js`, or `--application`): a component gets `<Name>/<Name>.js` and `<Name>/<Name>.html`, the others `<Name>.js`. Its path is yours (`pages/HomePage`, `./auth/Session`); the generator walks up from it to the nearest `index.js` and adds the entity there, relative to it, or to the `index.js` of the root. A path that leaves the root is refused.
- Nothing is written over without `--force`, and an entity already in a graph is not added twice.

## dev

`elemenx dev` serves the project as it is, with the framework and ElemenxUI of the package: the page loads the files of the graph one by one, and a reload shows every change. It answers every path that is not a file with `index.html`, so the routes of the router work on a reload. `--host 0.0.0.0` opens it to the other devices of the network.

## serve

`elemenx serve` serves the build in `dist` as a production server would: gzip and brotli for the responses of 1024 bytes and more, `ETag`, `Last-Modified`, `Cache-Control`, `Vary: Accept-Encoding`, `304` for the conditional requests, `HEAD` with the headers and no body. Development and production can run at once on their two ports.

## The configuration

`elemenx.config.js` in the root of a project gives the defaults; an option of the command line wins over it, and it wins over the defaults of Elemenx.

```js
module.exports = {
	Application: 'Shop',
	Entry: 'app.js',
	Index: 'index.html',
	Output: 'dist',
	Server: {
		DevelopmentPort: 4173,
		ProductionPort: 4175,
		Compression: true,
		CompressionThreshold: 1024,
		Request: function (request, response, pathname) {
			if (pathname !== '/api/hello') return false;

			response.writeHead(200, {'Content-Type': 'application/json'});
			response.end(JSON.stringify({Message: 'Hello'}));

			return true;
		},
		WebSocket: {
			Path: '/api/socket',
			Message: function (connection, message) {
				connection.Send(message);
			}
		}
	}
};
```

| Key | Meaning |
| --- | --- |
| `Application`, `Applications` | the root of the sources, or the list of the Applications of a project with several |
| `Entry`, `Index`, `Output` | the script of the Applications, the page, the folder of the build |
| `Server` | the ports and the compression; `Request(request, response, pathname)` answers paths of its own (an API of the project while it is developed: return `true` when it answered); `WebSocket: {Path, Message(connection, message)}` answers a socket (`connection.Send(text)`, `connection.Close()`) |
| `Single`, `Widget`, `Full`, `Precompile`, `Packs` | the defaults of the options of `build` |
| `Extension` | `Surface`, `Name`, `Description`, `Version`, `ID`, `Icons`, `Manifest` of a browser extension |
| `Native` | `Desktop` and `Mobile`: the settings of the native programs |

The server of this reference uses `Request` and `WebSocket` for the live examples of the section Network.

## icons

```bash
npx elemenx icons ./svg/lucide ./application/icons/lucide.svg --current-color
```

Every SVG file of the folder becomes a `<symbol>` of the sprite, named by its file (`Arrow Left.svg` becomes `arrow-left`), with its `viewBox` and the `fill` and `stroke` of its root; the ids inside an icon get its name before them, so icons do not collide. `--current-color` makes every color but `none` the color of the text. The `Icons` service of ElemenxUI shows the sprite as a set: `Icons.Register('lucide', 'icons/lucide.svg')`, then `<Icon Name="lucide:arrow-left" />`.

## native and version

`elemenx native add desktop` installs Electron and its packager into the project, `native add mobile` Capacitor and its plugins, `native add` both (see [Builds](/guide/build)). `elemenx version` prints the version.
