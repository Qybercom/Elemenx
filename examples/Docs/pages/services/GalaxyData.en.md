<!-- generated -->
# GalaxyData

GalaxyData: a galaxy as data (docs/SPACE-FORMAT.md): its passport, its supermassive black hole at its centre (always there), its stars made of its seed sector by sector as many as a galaxy has (none of them stored), what was changed of it, and the systems of its stars (SystemData) made of their seeds or written. Units: light-years; time in millions of years (Myr). Its plane is X and Z, its north +Y.

- Kinds: spiral, barred (a bar across its middle), lenticular (a disc with no arms), elliptical, irregular (clumps of young stars), dwarf (a small faint sphere), ring (a ring of young stars round an old core).
- Make(options): the data of a galaxy of options {Seed, Kind, Name, Radius (ly), Arms, Pitch (degrees), Mass (of its black hole, Suns), Coordinates ([x, y, z] in megaparsecs: where it is in its universe)}; what is not told, of its seed and its kind. data is {Manifest, Edits {Overrides: {id: {Name...}}, Removed: [id], Added: [free bodies: {ID, Kind, Name, Place [x, y, z] ly, Velocity [x, y, z] ly/Myr, Values, Traits}]}, Systems: {id: system data}}.
- Density(data, place): stars a cubic light-year at a place (about 0.004 where the Sun is in a galaxy like ours).
- Sector(data, x, y, z, limit): the stars of a sector (a cube of Manifest.Sector ly, 100; x, y, z its place in the grid) made of the seed, the same each time: {Count (how many there are), Stars: [{ID, Name, Place [x, y, z] ly, Mass, Temperature, Color, Luminosity, Class, Type (Astronomy.Types: a few white and brown dwarfs, rare giants and what heavy stars left), Kind (of a Scene)}] (limit of them at most, an even draw of all)}; its edits over them.
- Star(data, id): one star of its ID ('x.y.z-index'), or its black hole ('centre': {ID, Name, Place [0, 0, 0], Mass, Kind 'blackhole', Luminosity 0}); Position(data, place, time): where a place is after time Myr of the turning of the galaxy (a flat curve: 220 km/s, 734 ly a Myr at any radius; solid inside 500 ly).
- Added(data, time): what was put in it by hand (AddBody) where it is after time Myr: a star (Kind star) goes round the centre as the others do and is among the stars of its sector, with a system of its own; a body of no system goes along its Velocity (ly a Myr).
- Glow(data, count): points of all of it seen from far, made of its seed: {Positions (ly), Colors (r, g, b, brightness), Knots, Disc, Bulge}: its light and its dust are drawn of Density along rays by a Scene (SceneGalaxy).
- System(data, id): the system of a star (SystemData): written (Systems), else made of its seed with the mass of the star; of its black hole ('centre'): the hole with its disc and the young stars that go round it close and fast (as S2 round ours: hundreds to thousands of AU, long thin orbits), made of the seed of the galaxy. Hole(data): its black hole as a body; HoleSystem(data): the system of it as made of its seed, its stars with the planets their room round the hole leaves them, the old stars of its nuclear cluster a swarm round it (Cluster).
- Cluster(options): a star cluster as a system {Seed, Type (open, globular, nuclear), Name, Count, Radius (ly), Mass}: its middle with the trait Cluster {Type, Radius, Count, Seed} (the swarm of its stars not told one by one), its stars round it on orbits of the profile of Plummer, each with the planets and stations its sphere of Hill leaves it.
- Search(data, options): what of it lies round a place and is as asked (a type, a class, a mass, a temperature, a text, what was edited), the nearest first, at most Limit: {Items, More, Partial}.
- Knots(data): the knots where its stars are born, as its picture draws them ({Grids: [{Cell, Count, Half, Data}]}): each one of its nebulae, a region where stars are born.
- Objects(data): its nebulae and star clusters made of its seed ({ID, Kind, Type, Subtype, Name, Place, Radius, Seed}), ObjectOf(data, id) one of them, ObjectSystem(data, id) its scene as a system (Star and System take their IDs too: they are entered as a star is).
- Cosmos(data, id): the backdrop of the sky of a system of a star (Cosmos of a Scene): the band of this very galaxy across it, as seen from where the star lies (Galaxy: its manifest, Place), its pole the north of the galaxy as the system lies, its stars as many as round it.
- Code(), IR(): the arms of a galaxy of one source (Kernel, the kernel language: gx_turn, gx_bend, gx_wave, gx_arm on the noise of gradients of Noise) as js and as the IR of a graph of Blueprints; Spiral(data): the arms of a galaxy of its graph (data.Graph, a Scene gives it its own; SceneBlueprints.Galaxy), what its stars, its knots and its picture alike lie on; SeedNumber(manifest): the number of its seed for its noise.
- Rename(data, id, name), Remove(data, id), AddBody(data, body), SetSystem(data, id, system): what is changed of it.
- Use(key, data), DataOf(key); Open(source, callback), Write(data, store, callback, whole), Save(data), Pack(data, callback): as SystemData (parts {Kind: 'galaxy'}, {Kind: 'edits'}, those of a system written with System: id).

## Methods

- `Make(options)`
- `Code()`
- `IR()`
- `SeedNumber(manifest)`
- `Spiral(data)`
- `Density(data, place)`
- `Sector(data, x, y, z, limit)`
- `Search(data, options)`
- `Objects(data)`
- `Knots(data)`
- `ObjectOf(data, id)`
- `ObjectSystem(data, id)`
- `Star(data, id)`
- `Hole(data)`
- `HoleSystem(data)`
- `Cluster(options)`
- `Added(data, time)`
- `Position(data, place, time)`
- `Glow(data, count)`
- `System(data, id)`
- `Cosmos(data, id)`
- `Rename(data, id, name)`
- `Remove(data, id)`
- `AddBody(data, body)`
- `SetSystem(data, id, system)`
- `Use(key, data)`
- `DataOf(key)`
- `Write(data, store, callback, whole)`
- `Save(data)`
- `Pack(data, callback)`
- `Open(source, callback)`

## Tests

- [makes a galaxy of a seed and of a kind, with its supermassive black hole at its centre](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L25) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [is as dense as a real galaxy: about 0.004 stars a cubic light-year where the Sun is, more in its core, few above it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L38) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [makes the stars of a sector the same each time, as many as its density, the first ones the same however many are asked for](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L54) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [turns its stars round its centre on a flat curve: a star far out turns more slowly](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L81) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [glows of points of its kind, and gives the system of a star of its seed with the mass of the star](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L91) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [Astronomy.Generate takes the mass of its star (a star of a galaxy), the rest of the system still of its seed](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L113) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [keeps its edits, a written system and a free body, saved as a file and opened again](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L124) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [takes a star put in by hand among the stars of its sector, with a system of its mass, and moves a body of no system along its velocity](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L146) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [gives its black hole as a body with a system of its own: the hole and its disc, the young stars close round it on long thin orbits](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L177) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [gives the stars round its black hole the planets and stations their room leaves them, and the swarm of its nuclear cluster](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L203) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [makes star clusters of three kinds of a seed: open ones loose and young, globular ones old and packed, nuclear ones round a black hole](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L230) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [gives its stars their kinds: a few white and brown dwarfs, rare giants and what heavy stars left, each of the kind of a Scene, with a system of that star](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L287) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`

+15 more in the same files
