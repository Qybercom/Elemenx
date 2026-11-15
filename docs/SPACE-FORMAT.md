# The space format

The planet format (`docs/PLANET-FORMAT.md`) makes a planet data: a passport, layers of tiles, vectors, edits and objects, read part by part. Space is made the same way, one kind of document for each level of it: a universe of galaxies, a galaxy of star systems, a star system of bodies, a body of its own data. Each is a passport, what it was made of (`Origin`: a seed and options of the generator), what was changed of it after (`Edits`), what was put in it (`Objects`), and is read in parts as the eye comes near, from the same stores (below).

Decisions of 2026-11-13: a galaxy and a star system are kinds of their own; the bodies of a system are a tree of orbits of any depth; a galaxy has a supermassive black hole at its centre; galaxies have places in space and no orbit; a galaxy holds bodies of no system too.

## The levels

| Kind | What it is | Its parts |
|---|---|---|
| Universe | galaxies, each at its coordinates | its passport; its galaxies made of its seed, those changed in its edits |
| Galaxy | its centre (a supermassive black hole, always), its star systems going round it, bodies of no system | its passport; its sectors (a part each: the systems and free bodies in it); its edits |
| System | a tree of orbits round its centre | its passport; its tree; its bodies' data |
| Body | a planet, a planetoid, a moon, a star, a black hole, a wormhole, a belt, a ring, a station, a craft... | its passport and its data: a terrestrial body is the planet format |

Units: places in a universe in megaparsecs, in a galaxy in light-years, in a system in astronomical units, of a body in kilometres; time in days of the body and years of its orbit, as a Scene has them.

## The tree of orbits

A system is a tree. Each node is `{ID, Kind, Name, Parent (the ID of what it goes round; none at the centre), Orbit {Distance, Eccentricity, Inclination, Node, Periapsis, Anomaly, Period}, Body (the part of its data, if it has any), Values}`.

- Natural bodies go round natural ones: planets and planetoids round a star, round a black hole, or round a group; moons round planets and planetoids, and moons round moons, to any depth; rings and belts round anything that can hold them.
- A group is a node of kind `barycentre`: two or more stars and black holes going round their common centre (a binary, a triple, a star with a black hole). A star may also go round another star as a planet does: both are trees.
- Black holes and wormholes are bodies like planets: they go round a star or a group, and things go round them.
- Made things (stations, docks, satellites, crafts, fleets) go round any natural body: the tree holds them as it holds a moon.
- The centre of a system is its root: one star, a black hole, or a barycentre.

A galaxy is the same idea one level up: its root is its supermassive black hole, its systems go round it (each an orbit, slow), and a body of no system (a rogue planet, an interstellar station, a wandering black hole) is a node of the galaxy itself, with a place and a velocity instead of an orbit.

A universe has no tree: its galaxies stand at their coordinates.

## Generated and changed

Each level is made of a seed by a generator and changed by edits, as a planet is: `Origin {Kind: generated, Seed, Options}` says how to make it again, `Edits` what was changed of what was made (a star renamed or moved, a system written by hand in place of the one made, a body added or taken away), `Objects` what was put in it. A part made of the seed and not changed is never stored: a galaxy of a hundred billion stars is its passport, its edits and the sectors someone changed.

- A sector of a galaxy (a cell of its grid) gives its systems and its free bodies of its seed and its place: the same every time, so its stars are where they were.
- A system made of the seed of its sector is a tree made by the generator of systems; one written or changed is its tree as stored.
- A body made of the seed of its system has the options of its generator (a terrestrial body: ScenePlanet options); a body baked or edited has its data (a planet file of its own, or its part in the system).

## Parts and stores

What is read and written is a part, told by a descriptor, never by a path or the name of a file:

```js
{Kind: 'galaxy', ID: 'milky'}
{Kind: 'sector', Galaxy: 'milky', X: 12, Y: -4, Z: 0}
{Kind: 'system', ID: 'sol'}
{Kind: 'body', ID: 'earth'}
{Kind: 'tile', Body: 'earth', Layer: 'Height', Face: 0, Level: 3, X: 5, Y: 2}
{Kind: 'objects', Body: 'earth', ID: '4:107:48:200'}
```

A store answers `Read(part, callback(error, bytes))`, `Write(part, bytes, callback(error))`, and may answer `ReadMany` and `WriteMany` (many parts in one request) and `Watch(callback(part))` (a part changed elsewhere: another editor of the same world). The same stores serve every level:

- **Remote** (`PlanetData.Remote({Transport})`): parts carried by `Elemenx.Network.Transfer` over the Transport the application gives, or a function of the part and the action giving one. Which part a request is for is the application's, not the network's: a transport of one request (XHR) is one part, at the URL, with the method and the headers the application gave it (`Read` takes the bytes of its answer, 404 is none; `Write` sends the bytes of the part); a transport of messages (a WebSocket, a WebRTC channel, a window) carries messages of the application, `{Planet: {Action, ID, Part, Error}, Bytes}`, packed by Transfer as structured data, its answers (`Result`, `Error`) and its news (`Changed`) coming back by a `TransferReceiver`. Where its files are, what they are called and who may read them is the application's.
- **Browser**: IndexedDB, a key for each part.
- **File**: one file of the world (a zip), whole or by ranges of its bytes; the names of its files are this store's alone.

Only what changed is written: a location edited is one part, a brush its edits and the tiles it touched, a star renamed the edits of its galaxy.

## What a Scene draws

A Scene reads the levels as its eye goes: the galaxy round it (what lies behind a system, the trait Cosmos, then of its place in its galaxy), the sector it is in, the system it is in (its tree as the objects of the scene, each with its trait Orbit), the bodies near (their data as a planet's: tiles round the eye). The kinds of a Scene today (star, planet, moon, belt, ring, station, craft, fleet, wormhole, black hole) are the kinds of the nodes.

## Steps

1. This document (2026-11-13).
2. The objects of a planet and the stores (Remote over Transfer, Browser, File), with `Watch` foreseen and its protocol later; the Game editor keeping its game in the browser by parts and its world downloaded and opened as one file.
3. The system (done 2026-11-13): `SystemData` (its passport, its tree of orbits, its edits, the planets of its bodies by their parts or their URLs, read and written by the stores of parts; `Save`, `Pack`, `Open`), a Scene of `System='{"Data": ...}'`, the kind `barycentre` of a Scene (its mass of `Mass`, its `Members`, or the stars round it), bodies round a black hole by its mass; `scripts/system-make.js`; the Space demo of `/graphics` draws `data/systems/binary.system` (two suns round their barycentre, Terra of its planet file, a black hole with a shard). SceneEditor saves its star system as a file of the system format and opens one (done 2026-11-13): its scene as a system (`SystemData.FromRecipe`, `Recipe`: its seed, its Added, Removed and Overrides as its edits), its list of objects the tree of orbits, its palette with barycentres, planetoids, black holes and wormholes.
4. The galaxy (done 2026-11-13): `GalaxyData` (its passport: `Kind` spiral, barred, lenticular, elliptical, irregular, dwarf or ring, `Radius` in light-years, `Arms`, `Pitch`, `Seed`, `Coordinates`; its supermassive black hole, `Centre`, always there), its density as real galaxies have it (about 0.004 stars a cubic light-year where the Sun is, many times more in the core, few above the disc), its stars made sector by sector (cubes of 100 light-years) of its seed, as many as its density, most of them red dwarfs (a mass of each as stars are born), the first ones of a sector the same however many are asked for; the system of a star (`System`) made of the seed of the star with its mass (`Astronomy.Generate` takes `Mass`) or written in it; its turning on a flat curve (220 km/s: the inner stars round sooner); its edits (a star renamed or taken away, a body of no system with its place and its velocity) and its systems written in it as parts with `System: id`; `Save`, `Pack`, `Open`. A Scene of `Setting="galaxy"` (`SceneGalaxy`) draws a galaxy of `Galaxy` (its glow from far, its stars one by one as the view comes near, its black hole), `GalaxyTime` turns it, a star is picked and its system entered (`EnterSystem`: its sky the band of its galaxy as the star lies in it, `GalaxyData.Cosmos`) and left (`LeaveSystem`); the Galaxy demo of `/graphics` shows each kind. Stars put in by hand (`AddBody` with `Kind: 'star'`) are among the stars of their sector with a system of their own; a body of no system goes along its `Velocity` (`Added(data, time)`). `WorldEditor` (done 2026-11-14) edits the levels one in another: the galaxy, the system of a star, a planet, a location; its file is a zip of `world.json` and the parts of the galaxy under `galaxy/`.
5. The universe: galaxies at their coordinates.
6. Layers of gas giants and of stars (bands, storms, spots), after the detail rules of planets.
