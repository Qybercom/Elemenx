<!-- generated -->
# SceneRoads

SceneRoads: the roads of a scene, of any kind, and what they are made of: motorways, streets, country roads, tracks of a race, paths, runways and railways. A road is a line through its points and a type: its cross-section, strips from its left edge to its right one.

- Surfaces: what a strip is made of, by name (asphalt, concrete, cobbles, paving, gravel, dirt, sand, grass, ballast, runoff, rumble, cycle, steel, wood): {Color, Rough, Metal, Grip (1 holds as dry asphalt does), Drag (0: none), Material (its pattern: a material of SceneMaterials, none: plain)}. Surface(name, surface) adds one or replaces it, Surface(name) gives it.
- Types: Define(name, type) adds one or replaces it, Type(name) gives it, Types() lists the names. A type is {Title, Group (road, street, path, race, air, rail), Strips: [{Kind (lane, shoulder, verge, kerb, sidewalk, median, parking, cycle, runoff, rumble, bed, ditch...), Width (m), Surface, Height (over the level of the road; a kerb, a sidewalk, the bed of a railway), Way (of a lane: 1 the way of the line, -1 back, 0 both), Left and Right (the marking of its edge: solid, dashed, double, dotted or none), Marking (its color)}], Rails ([{Offset (from the middle), Gauge (m)}]: rails on sleepers), Sleepers ({Step, Length, Surface}), Speed (km/h), Catenary (wires over it: a railway or a tram)}. Types of any Library come declared in $Provides ({SceneRoads: {Types: [...]}}).
- Line(points, options): a road's line made smooth and even: points [[x, z] or [x, z, y]] through which it goes (Closed: a ring), sampled every Step metres (2): [{X, Y, Z, Way [x, z], Along (metres from its start), Bend}]; Height(x, z), when given, is the height of a point with none of its own; with Follow too (and no knot of a height of its own) the line keeps to the ground between its knots, smoothed over 40 m and no steeper than Grade.
- Grade(type): how steep a road of a type may climb (rise over run): its Grade, else by its kind and speed (a railway 2.5%, a runway 1.5%, a race track 6%, a road 5% from 110 km/h, 7% from 80, 9% under, a street 10%, a path 15%).
- Meeting(a, b): what two roads of two types do where they cross: junction (streets and roads, at one level), crossing (a railway and a road: a level crossing), interchange (two motorways, 110 km/h or more), over (one over the other).
- Network(specs, junctions, options): roads that meet and their junctions ({ID, X, Y, Z, Radius, Surface, Roads, Arms [{Road, Angle, Half, Rail}], Kind (T, Y, X, star, ring, railway), Deck (a level crossing: the road at the heads of the rails), Closed (its barriers down), Under (under the ground: where roads in their tunnels meet or one ends in the tunnel of another, or told; at the level of the roads through it, a chamber cut and lined for it)}), the roads at the level of each; roads that meet one over the other get an overpass (Overpasses: false of options, none): the one over climbs by its grade to the Clearance of the other and a bridge over it, a road under an airfield or in a tunnel there goes down into a tunnel.
- Interchanges: where two roads meet one over the other (or one ends on a motorway) Network makes ramps between them (one-way roads of type ramp, Ramp: the ID of their interchange): stack, cloverleaf, diamond, roundabout, trumpet, by InterchangeForm(a, b, ending) or told by a junction given there of that Kind (none: no interchange); none where the crossing or a ramp's end is in a tunnel, nor of a road too short. Its result has Interchanges: [{ID, Form, X, Z, Roads, Ramps}]; Interchanges: false of options makes none.
- TunnelGraph(roads, junctions): the tunnels of roads as a graph of passages ({Nodes: portals and junctions under the ground, Ways}), for SceneTerrainGenerator.PassageRoute. Carves(roads, junctions): what their tunnels and chambers cut.
- Clearance(type): the room a road of a type needs over it (its Clearance, 5.5 m, 7 m over a railway with wires).
- Road(spec): a road made of {ID, Type, Points, Closed, Width (in place of the width of the type: its strips scaled), Height, Follow (false: not along the ground), Grade, Elevated ([[from, to, height]]: on a viaduct there, so high over the ground, 7), Viaducts (false: none found), Bank (8)} with its Line, its Width and its strips at their offsets ({Left, Right} from the middle). Over water (the ground under 0) a road keeps 5.5 m, on a bridge; on a bank higher than Bank it stands on a viaduct (Viaducts: false of the options of Network, none for all).
- Near(road, x, z, hint): {Offset (from the middle, left below 0, across the way), Far (how far the point is from the line: past an end, more than its Offset), Along (the index of the point nearest), At (the metres from its start), Way, Y (of the road there)}; hint, the Along of a moment ago, looks only round it.
- Under(roads, x, z, hints): what is under a point, the road on top: {Road (its ID), Strip (its kind), Surface, Height, Grip, Drag, Offset, Along} or null off every road.
- Sketch(roads): the lines a ground is made level under ({Type: road, Points, Width, Shoulder}).
- Asset(roads): the roads as a model of SceneModels (Define(name, {URL: name, Asset, Fit: false})): their strips, the sides of what is raised, the markings, the rails and sleepers.
- AssetOf(roads, options) is the same in a worker (Work(): the pool of its workers, made once, with the surfaces there are then): options {Ground (the options of the flat ground the piers of its bridges stand on, SceneTerrainGenerator.Flat, or the name a worker keeps them under by Share of Workers), Junctions}.

The same functions run in Node: they read no page.

## Methods

- `Surface(name, surface)`
- `Define(name, type)`
- `Type(name)`
- `Types()`
- `Line(given, options)`
- `Grade(type)`
- `Road(spec, options)`
- `Network(specs, given, options)`
- `InterchangeForm(a, b, ending)`
- `Meeting(a, b)`
- `Clearance(type)`
- `Near(road, x, z, hint)`
- `Under(roads, x, z, hints)`
- `Sketch(roads, junctions)`
- `Carves(roads, junctions)`
- `TunnelGraph(roads, junctions)`
- `Asset(roads, options)`
- `AssetOf(roads, options)`
- `Work()`

## Tests

- [knows roads, streets, paths, tracks, runways and railways, each a cross-section of strips](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L20) — `tests/regression/scene-roads.test.js`
- [takes a type of its own and a surface of its own, and refuses a type of no strips](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L42) — `tests/regression/scene-roads.test.js`
- [makes a line smooth and even through its points, with its ways, metres and heights](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L56) — `tests/regression/scene-roads.test.js`
- [closes a ring on itself, and finds where a point is on it, near a hint](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L86) — `tests/regression/scene-roads.test.js`
- [tells what is under a point: its strip, surface, height and grip, the higher of two roads, none off them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L100) — `tests/regression/scene-roads.test.js`
- [scales the strips of a type to a width given](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L120) — `tests/regression/scene-roads.test.js`
- [gives the lines a ground is made level under](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L128) — `tests/regression/scene-roads.test.js`
- [takes bridges and tunnels given, or finds them where the road leaves the ground, and levels no ground there](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L137) — `tests/regression/scene-roads.test.js`
- [makes a model of the roads: their surfaces, markings, and the rails and sleepers of a railway](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L181) — `tests/regression/scene-roads.test.js`
- [hangs the wires of a railway or a tram on masts, and lays the rails of a tram in the road, with no sleepers](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L211) — `tests/regression/scene-roads.test.js`
- [has barriers only where asked, of their kinds, sides and stretches, and they stop what drives into them from either side](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L233) — `tests/regression/scene-roads.test.js`
- [finds the junctions of a network where roads cross or end on one another, brings the roads to one level there and stops their paint](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L261) — `tests/regression/scene-roads.test.js`

+43 more in the same files
