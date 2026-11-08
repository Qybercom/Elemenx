<!-- generated -->
# ScenePipes

ScenePipes: pipes of any size, from a tube of a few centimetres to a sewer a man walks in, as geometry and as what is in them. Nothing here knows a scene: a pipe goes in ({ID, Points [[x, z] or [x, z, y]...], Radius (0.3), Wall (the thickness of its wall, a tenth of the radius), Laid (above: on supports Lift (1.5) metres over the ground; ground: on it; buried: Depth (1) under it), Bend (the radius of its bends, three of its own), Ends ([start, end]: open or closed, open both), Flanges (metres between its joints, 6; 0 none), Spacing (metres between its supports), Color, Inside (the color in it), Metal (0 to 1), Fluid ({Type, Fill (how much of it the fluid fills, 0 to 1), Flow (metres a second along its points; below 0 back), Pressure (bars)}), Leaks ([{Along (metres), Angle (degrees round it from its top), Size (the radius of the hole, metres)}]: holes in its wall)}) and comes out laid out, as a model or as what it cuts out of the ground.

- Fluids(): the fluids a pipe may hold, {name: {Kind (liquid or gas), Density (kg/m3), Viscosity (as many times as water), Color, Opacity, Burns, Hot}}: water, sewage, mud, oil, fuel, gas, steam, air.
- Lay(spec, height): the pipe laid out: {ID, Radius, Wall, Laid, Ends, Fluid, Points: [{X, Y (of its axis), Z, Along, Tangent, Normal, Binormal}]}, height(x, z) the ground (0 with none); its corners rounded by its Bend.
- Asset(pipes, options): the model of pipes laid out (options Height: the ground, for the supports): its wall outside and inside (the inside darker), the rims of its open ends and the caps of its closed ones, its flanges, its supports, and the face of the liquid in it at the height its Fill says.
- Carves(pipes): what buried pipes cut out of the ground (Carves of tunnel, as round as they are): all of one a man may go in (Radius 0.4 and more), only its open ends of a smaller one.
- At(pipe, metres): its point at metres from its start ({X, Y, Z, Tangent, Normal, Binormal}).
- Near(pipe, point): the nearest point of its axis to a point: {Along, Distance (from the axis), At, Tangent, End (past its first or its last point: none of its wall there)}.
- Floor(pipes, x, z, y, climb): the floor a thing stands on at x, z, y of pipes: the bottom inside one it is in, the top of one it is on, no higher than climb (0.6) over y; -Infinity with none.
- Mouth(pipe): where what flows in a pipe comes out of it: the open end its Flow goes to ({At (in its mouth, in the middle of what the fluid fills), Way (out along it), Across (how wide the stream is), Rate (cubic metres a second)}), or null (closed there, nothing in it, nothing flowing).
- Hole(pipe, along, angle): a point of its wall, metres along it and degrees round it from its top: {At, Normal (out), Wet (whether the fluid in it reaches there: a liquid only under its level, a gas anywhere)}.
- Spurt(pipe, size): how fast what is in a pipe comes out of a hole of a radius (metres), and how much a second: {Speed (m/s, of its pressure over the air: as from a tap, at most 20), Rate (cubic metres a second)}.
- Blocks(pipes, x, z, y, round, heights): whether a body round as round, its points at heights over y (its knees and its chest, [0.5, 1.2]), goes into the wall of a pipe (from out of it or from in it; past its open ends nothing holds it).

## Methods

- `Fluids()`
- `Lay(spec, height)`
- `At(pipe, metres)`
- `Near(pipe, point)`
- `Floor(pipes, x, z, y, climb)`
- `Mouth(pipe)`
- `Hole(pipe, along, angle)`
- `Spurt(pipe, size)`
- `Blocks(pipes, x, z, y, round, heights)`
- `Asset(pipes, options)`
- `Carves(pipes)`

## Tests

- [lays a pipe out as it is laid, its corners rounded and its frames never twisted](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePipes/ScenePipes.node.test.js#L28) — `libraries/ElemenxGraphics/services/ScenePipes/ScenePipes.node.test.js`
- [holds a fluid of a known type, as full and as fast as told, water by default and none when none is told](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePipes/ScenePipes.node.test.js#L54) — `libraries/ElemenxGraphics/services/ScenePipes/ScenePipes.node.test.js`
- [makes its model: outside and inside, the rims of its ends, flanges, supports and the face of the liquid in it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePipes/ScenePipes.node.test.js#L65) — `libraries/ElemenxGraphics/services/ScenePipes/ScenePipes.node.test.js`
- [cuts the ground for all of a buried pipe a man may go in, and only at the open ends of a smaller one](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePipes/ScenePipes.node.test.js#L82) — `libraries/ElemenxGraphics/services/ScenePipes/ScenePipes.node.test.js`
- [finds the nearest point of its axis, and its point at metres along it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePipes/ScenePipes.node.test.js#L97) — `libraries/ElemenxGraphics/services/ScenePipes/ScenePipes.node.test.js`
- [stands what is in a pipe on its bottom and what is on it on its top, and keeps a body out of its wall but at its open ends](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePipes/ScenePipes.node.test.js#L107) — `libraries/ElemenxGraphics/services/ScenePipes/ScenePipes.node.test.js`
- [tells where what flows comes out of an open end and how much, where a hole of its wall is wet, and how fast a hole spurts](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePipes/ScenePipes.node.test.js#L127) — `libraries/ElemenxGraphics/services/ScenePipes/ScenePipes.node.test.js`
- [lays out a pipe of its points, draws it by a model in the world itself, and gives it to Pipes()](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/ScenePiping/ScenePiping.test.js#L57) — `libraries/ElemenxGraphics/traits/ScenePiping/ScenePiping.test.js`
