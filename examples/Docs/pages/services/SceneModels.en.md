<!-- generated -->
# SceneModels

The models of a game, made of graphs and of code: no files, the same shape for the same seed. A model is a tree of pieces that move on their pivots (a body, its arms, a turret, the sails of a mill), each a geometry of Renderer, about 1 tall (or 1 wide when it is a building); the Size of a kind makes it as large as it should be.

- Names(filter) lists the models: filter {Group: fantasy, scifi, nature, space; Type: unit, animal, vehicle, plant, rock, building, ship}; Has(name), Info(name) ({Name, Group, Type, Size, Speed, Variants, Clips}).
- Define(name, recipe) adds one or replaces it: recipe {Group, Type, Size (in a game), Speed (a second), Variants, Sway (how far the wind bends it), Matte (false: it shines), Smooth (no flat faces), Clips, Build(tools, random)}. Build returns its pieces, tools.Piece(id, parts, {Parent, Pivot, Team}), of parts made by tools.Box(width, height, depth, at, color, turn), Cylinder(radius, top, height, at, color, turn, segments), Ball(radius, at, color, scale), Blob(radius, at, color, rough, scale), Lathe(points, at, color, segments) and Wedge(width, height, depth, at, color, turn); at is [x, y, z] in the space of the model, turn degrees round x, y and z, a piece with Team takes the color of its team, a part with Glass is seen through (a window: GlassMaterial, its color the tint); tools.Meshes (the shapes), tools.Math and tools.Rigs (Biped, Quadruped, Tracked: clips to reuse) are at hand. A recipe of data has Parts in place of Build (Assemble: shapes with their Piece, Tags, Mirror, Chance and Vary, its Pieces, Rig for its clips, Seed: its variants of it, not of its name), JSON to keep and to edit (ModelEditor); Tagged(name, tag) gives the pieces of a tag. A recipe of a graph has Graph in place of Build (a graph of the kind model of ModelBlueprints, or the name of one of the resources), its Parameters and Seed: the graph gives its parts for each variant. A recipe may name a file instead of Build (glb, gltf, fbx or obj: ModelFormats): Define('hero', {URL: 'assets/hero.glb', Type, Size, Speed, Clips: {walk: 'Run'}}) (Clips: the clips of the game and the animations of the file that play them; idle, walk, run, attack, die and work are found by their names). Load(name, callback) fetches it, (error, model), and Ready(name) tells whether it came; a model of a file stands on the ground and is 1 tall, as the others are. With Generate(callback) instead of a file it is made by that function, (error, asset) as Gltf gives one (SceneMannequin: the model mannequin), or a list of assets, one for each of its Variants (SceneFlora: a tree, each variant another). Make of one not come yet is null. Apart, a word of the name of a material or a node, cuts what a file keeps as one piece at its wide gaps: four wheels in one mesh. Bones ({role: the name of a node}) names the bones of the roles of a skeleton whose names tell nothing (Hips, Spine, Spine1, Spine2, Neck, Head, ShoulderL, ArmL, ForeL, HandL, ThighL, CalfL, FootL, ToeL and the same of R): the clips of other skeletons (Motions, Retarget) and its hips are found by it first, by the names of the bones else. Merge: true makes its pieces one for each material when it is made; a Scene draws what moves together of a model that plays no clips as one for each material anyway (each wheel, each opening), but for Merge: false. Bake(model) makes the moves of its skeletons an array of frames, for a shader that reads them; BakeStep(model, ms) makes them a little at a time, the clips of standing and going (idle, walk, run, sprint) first: Partial holds the clips made so far (each of those at once, the others a few times a second) and Partly(model, clip) tells whether a clip can be seen before the rest are made. Soft (0 to 1, or {material: value}) lets light under its surface, as in skin. Surfaces(model) is its geometry material by material.
- The Lamps of a model of a file are what shines in it (BuiltLamps): a Scene lights its world with them. A model built of parts tells its own: recipe Lamps [{Place [x, y, z] (in its units: its height is 1), Color, Power, Radius (in its units), Spot (degrees of its cone; none: all round), Aim, Night (true: lit only at night)}].
- BoneMatrix(model, bone, clip, time): the matrix of a bone at a second of a clip; Grip(bone, aim): where a thing in a hand stands.
- Make(name, {Variant}) returns a model, made once: {Name, Key, Group, Type, Size, Speed, Sway, Matte, Clips, Pieces: [{ID, Parent, Pivot, Team, Geometry}]}. Remake(name) has it made again on the next Make, under a Key of its own (what cut its pieces, the roles of its parts, changed).
- Whole(model) is a model as one geometry, Bounds(geometry) its {Radius, Middle} and Levels(name, {Variant}) its geometries from the finest down: for what is sown in masses and seen from afar. Extent(name): how large it stands, [x, y, z] in its units, once ready (a craft is drawn as long as its Length of its longest side).
- Pose(model, clip, time, {From, FromTime, Fade}) returns the matrix of each piece at a second of a clip, in the space of the model; Fade (0 to 1) mixes it from the pose of the clip From. Length(model, clip) is the seconds of a clip.

A clip is {Length, Loop, Hold, Stride, Tracks: {piece: [[time 0 to 1, rx, ry, rz, mx, my, mz]...]}, Spins: {piece: [x, y, z] degrees a second}}; Hold keeps the last pose when it ends, Stride is how far a walk goes in one cycle, in sizes of the model.

- Kinds, KindOf(type): the kind of a Scene a model of a type stands as (resources/models/kinds.json: a plant a tree, a building a house...), null for one not told. Rigs(): the clips of the rigs (resources/models/rigs.json).
- The models of the library (Builtin): each a graph of the kind model (blueprints/models/<name>; the loops of one graphs <name>-<loop> its Repeat calls, the bodies of two legs and of four the graphs biped and quadruped), told in resources/models/builtin.json (Group, Type, Size, Speed, Sway, Variants, Matte, Smooth, Lamps, Clips: {Rig} the clips of a rig and what is its own, Graph); the mannequin is of code (SceneMannequin).

The same functions run in Node: they read no page.

## Methods

- `KindOf(type)`
- `Define(name, recipe)`
- `Remake(name)`
- `Has(name)`
- `Ready(name)`
- `Load(name, callback)`
- `Names(filter)`
- `Info(name)`
- `Make(name, options)`
- `Whole(model)`
- `Extent(name)`
- `Surfaces(model)`
- `Bake(model)`
- `BakeStep(model, budget)`
- `Partly(model, clip)`
- `BoneMatrix(model, bone, clip, time)`
- `Grip(bone, aim)`
- `Bounds(geometry)`
- `Levels(name, options)`
- `Length(model, clip)`
- `Pose(model, clip, time, options)`
- `Tagged(name, tag)`
- `Rigs()`

## Example

```example
<pre class="elemenx-code" style="white-space: pre-wrap;">{{Text}}</pre>
<script>
({
	Text: '',

	$OnCreate: function () {
		var models = this.$Service('SceneModels');
		var graphics = this.$Service('Renderer');
		var knight = models.Make('knight');
		var foot = graphics.Apply(models.Pose(knight, 'walk', 0.2)['leg-l'], [-0.075, 0.03, 0.03]);

		models.Define('crate', {Group: 'fantasy', Type: 'prop', Size: 1, Build: function (tools) {
			return [tools.Piece('body', [tools.Box(1, 1, 1, [0, 0.5, 0], [0.5, 0.36, 0.23])])];
		}});

		this.Text = 'Units: ' + models.Names({Type: 'unit'}).join(', ') + '\n\nBuildings: ' + models.Names({Type: 'building'}).join(', ') + '\n\nKnight: ' + knight.Pieces.map(function (piece) {
			return piece.ID;
		}).join(', ') + '\nClips: ' + models.Info('knight').Clips.join(', ') + '\nFoot in the walk at 0.2 s: ' + foot.map(function (value) {
			return value.toFixed(2);
		}).join(', ') + '\n\nCrate: ' + models.Make('crate').Pieces[0].Geometry.Indices.length / 3 + ' triangles';
	}
})
</script>
```

## Tests

- [gives the parts of its blocks: floors a function makes, a rail as a tube, a mirror, its pieces](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-blueprints.test.js#L68) — `tests/regression/model-blueprints.test.js`
- [makes a model of a recipe of a graph, a tube laid along its path and no other way](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-blueprints.test.js#L108) — `tests/regression/model-blueprints.test.js`
- [makes a graph of every block of models code, the very parts and pieces of its run](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-blueprints.test.js#L129) — `tests/regression/model-blueprints.test.js`
- [defines a species as a model of SceneModels, each of its variants another plant, made in workers](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js#L382) — `libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js`
- [is a model of SceneModels, loaded as a file is, and others of options are defined of it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js#L141) — `libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js`
- [makes a Component of the game that defines its models, loads its scene and gives the keys to its hero](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-editor.test.js#L63) — `tests/regression/game-editor.test.js`
- [zips a project of Elemenx: the page, the Application of its root, the Component Game, and each model as a glb](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-editor.test.js#L135) — `tests/regression/game-editor.test.js`
- [lays the rooms of a ship out by its class: a fighter a cockpit, a corvette a bridge to a cargo hold on a ramp, a capital ship a command post](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-aboard.test.js#L55) — `tests/regression/library-aboard.test.js`
- [keeps the view of a walker in the rooms of a ship: never in its walls, ceilings or hull, its eyes off a wall it faces, the walker faded when it comes too close](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-aboard.test.js#L178) — `tests/regression/library-aboard.test.js`
- [walks in a ship in flight: its inside in its frame, the ship flying on by itself, the walker held in it, back in a seat by G](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-aboard.test.js#L576) — `tests/regression/library-aboard.test.js`
- [reads a catalogue of cars, each of a file of its own or in it, their models of their roles, their files from their folders](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-cars.test.js#L26) — `tests/regression/library-cars.test.js`
- [reads a catalogue: its sets of clips, its characters in their order, their files from its folder](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-characters.test.js#L26) — `tests/regression/library-characters.test.js`

+50 more in the same files
