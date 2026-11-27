<!-- generated -->
# NetworkBlueprints

NetworkBlueprints: networks made of graphs of Blueprints, declared in $Provides (Blueprints makes it when it meets such a graph or block): rivers, roads, rails, tracks. A graph of the kind network ends at Network, what it gives a network: {Nodes: [{ID, At, Kind, Rank}], Ways: [{ID, From, To, Points ([x, z] on a ground, [x, y, z] directions on a globe), Class, Closed, Values ({name: a number, or a number for each point})}]}. Its blocks are its steps, each an algorithm of code told by its properties and inputs, a network in and a network out; the blocks of numbers of a generator are there for their numbers. A graph of it is made code (Blueprints.Code, each block a call of this Service): it runs in a page and in a worker that carries this Service and those its blocks call (ScenePlanet, SceneTerrainGenerator, SceneRoads).

- Make(graph, parameters, inputs): runs one (an object, its JSON, or the name of a resource) and gives its network.
- Sample(graph): what it is run with to be seen ({name: value} of its Input blocks: Heights and Size of a small planet, Field a ground, Hubs a few towns, Passages and Trunks none).
- Code(graph): its code ({Source, Run, Keys}: Run(parameters, inputs) gives {Network}); Source is what a worker makes Run of (new Function('B', 'M', 'N', Source)(Blueprints, Math, Noise)).
- Its blocks (and the functions of this Service of the same names): Ways (List of lines, or of {Points, Class, ID, Values}, Class, Closed: a network of them), Merge (A, B: one after the other), Ring (Seed, Corners (0: 9 to 14 of the seed), Wild, Length, Squash: a closed way round a middle, its points nearer and farther, never crossing itself; Of random: the numbers of Random.Create; Values Draws: how many it drew), Fit (Length, Step: each closed way made that long, Places after the point), Connect (Hubs [{X, Z, Rank}], Passages ([x, z]: ways in from past the edge), Trunks (a network of the highways), Big (the rank of a town, 2), Gap (metres a highway is near, 30): its towns and cities joined by the shortest net of them (Prim), the biggest first, each smaller one to the nearest joined before it, a highway nearer than all joined taken; the passages each to the nearest), Route (Field: each way of none told along a ground by A* of SceneTerrainGenerator.RoadWay, MaxGrade, Bridge; Keep: one that cannot go stays straight, else it is dropped), Classify (Main, Minor, Paths: the class of each way of its rank: a highway of its own, Main between towns and cities, Minor to one, Paths else), Beside (Offset metres to the right, Rank, Class, On: a copy of each way of that rank or more beside it, Places after the point), Smooth (Rounds of Chaikin: its corners cut, its values along it; Sphere: its points kept on the unit ball), Round (Places of its points, Digits of its values) and Drainage (Heights, Size, Least: the rivers of a planet of the heights of its cells: ScenePlanet.DrainageWays, their Flow and Level along them).

The library's networks (ElemenxGraphics/network/<name>): rivers (of a planet: ScenePlanet.Drainage), roads (of a world: the step Roads of SceneWorld), track (a race track: SceneRoadGenerator.Track). The same functions run in Node.

## Methods

- `Make(graph, parameters, inputs)`
- `Code(graph)`
- `Sample(graph)`

## Tests

- [declares the kind network and its steps to Blueprints, made code](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/NetworkBlueprints/NetworkBlueprints.test.js#L27) — `libraries/ElemenxGraphics/services/NetworkBlueprints/NetworkBlueprints.test.js`
- [joins towns by the shortest net, each way of its class, a rail beside the main ones](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/NetworkBlueprints/NetworkBlueprints.test.js#L58) — `libraries/ElemenxGraphics/services/NetworkBlueprints/NetworkBlueprints.test.js`
- [lays a closed way round a middle as long as asked, and routes ways along a ground](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/NetworkBlueprints/NetworkBlueprints.test.js#L82) — `libraries/ElemenxGraphics/services/NetworkBlueprints/NetworkBlueprints.test.js`
- [gives a sample of the inputs of a graph to be seen, and draws it in BlueprintPreview](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/NetworkBlueprints/NetworkBlueprints.test.js#L103) — `libraries/ElemenxGraphics/services/NetworkBlueprints/NetworkBlueprints.test.js`
- [refuses a graph of another kind and one of no Network](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/NetworkBlueprints/NetworkBlueprints.test.js#L126) — `libraries/ElemenxGraphics/services/NetworkBlueprints/NetworkBlueprints.test.js`
- [runs the networks of the library as code, a worker's too](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/network-graphs.test.js#L88) — `tests/regression/network-graphs.test.js`
