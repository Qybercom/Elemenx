<!-- generated -->
# Models

The models of a game, made of code: no files, the same shape for the same seed. A model is a tree of pieces that move on their pivots (a body, its arms, a turret, the sails of a mill), each a geometry of Graphics3D, about 1 tall (or 1 wide when it is a building); the Size of a kind makes it as large as it should be.

- Names(filter) lists the models: filter {Group: fantasy, scifi, nature, space; Type: unit, animal, vehicle, plant, rock, building, ship}; Has(name), Info(name) ({Name, Group, Type, Size, Speed, Variants, Clips}).
- Define(name, recipe) adds one or replaces it: recipe {Group, Type, Size (in a game), Speed (a second), Variants, Sway (how far the wind bends it), Matte (false: it shines), Smooth (no flat faces), Clips, Build(tools, random)}. Build returns its pieces, tools.Piece(id, parts, {Parent, Pivot, Team}), of parts made by tools.Box(width, height, depth, at, color, turn), Cylinder(radius, top, height, at, color, turn, segments), Ball(radius, at, color, scale), Blob(radius, at, color, rough, scale), Lathe(points, at, color, segments) and Wedge(width, height, depth, at, color, turn); at is [x, y, z] in the space of the model, turn degrees round x, y and z, a piece with Team takes the color of its team; tools.Graphics and tools.Rigs (Biped, Quadruped, Tracked: clips to reuse) are at hand. A recipe may name a file instead of Build: Define('hero', {URL: 'assets/hero.glb', Type, Size, Speed, Clips: {walk: 'Run'}}) (Clips: the clips of the game and the animations of the file that play them; idle, walk, run, attack, die and work are found by their names). Load(name, callback) fetches it, (error, model), and Ready(name) tells whether it came; a model of a file stands on the ground and is 1 tall, as the others are. Make of one not come yet is null. Bake(model) makes the moves of its skeletons an array of frames, for a shader that reads them. Soft (0 to 1, or {material: value}) lets light under its surface, as in skin. Surfaces(model) is its geometry material by material.
- Make(name, {Variant}) returns a model, made once: {Name, Key, Group, Type, Size, Speed, Sway, Matte, Clips, Pieces: [{ID, Parent, Pivot, Team, Geometry}]}.
- Whole(model) is a model as one geometry, Bounds(geometry) its {Radius, Middle} and Levels(name, {Variant}) its geometries from the finest down: for what is sown in masses and seen from afar.
- Pose(model, clip, time, {From, FromTime, Fade}) returns the matrix of each piece at a second of a clip, in the space of the model; Fade (0 to 1) mixes it from the pose of the clip From. Length(model, clip) is the seconds of a clip.

A clip is {Length, Loop, Hold, Stride, Tracks: {piece: [[time 0 to 1, rx, ry, rz, mx, my, mz]...]}, Spins: {piece: [x, y, z] degrees a second}}; Hold keeps the last pose when it ends, Stride is how far a walk goes in one cycle, in sizes of the model. The same functions run in Node: they read no page.

## Methods

- `Define(name, recipe)`
- `Has(name)`
- `Ready(name)`
- `Load(name, callback)`
- `Names(filter)`
- `Info(name)`
- `Make(name, options)`
- `Whole(model)`
- `Surfaces(model)`
- `Bake(model)`
- `Bounds(geometry)`
- `Levels(name, options)`
- `Length(model, clip)`
- `Pose(model, clip, time, options)`

## Example

```example
<pre class="elemenx-code" style="white-space: pre-wrap;">{{Text}}</pre>
<script>
({
	Text: '',

	$OnCreate: function () {
		var models = this.$Service('Models');
		var graphics = this.$Service('Graphics3D');
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

- [has units, animals, vehicles, plants, rocks, buildings and ships, each of whole triangles, its parents before their pieces](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1531) — `tests/regression/library-scene.test.js`
- [makes the same shape of the same variant, another of another, and throws on an unknown model](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1564) — `tests/regression/library-scene.test.js`
- [poses the pieces of a clip on their pivots, children with their parents, and fades from a clip to another](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1576) — `tests/regression/library-scene.test.js`
- [spins what turns with no end, and leaves a model of one piece still](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1602) — `tests/regression/library-scene.test.js`
- [makes simpler levels of a model, with fewer faces and the same size](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1609) — `tests/regression/library-scene.test.js`
- [takes the models of an application](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1629) — `tests/regression/library-scene.test.js`
- [draws the model of a file by the same API: fetched, lit, moved and played](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L902) — `tests/regression/library-scene.test.js`
- [sows the model of a file as it sows the ones of code](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L969) — `tests/regression/library-scene.test.js`
- [lays out the same village of the same seed, on what is level and dry, moved there if it must](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1472) — `tests/regression/library-scene.test.js`
- [models stand in their shadows, play their clips, march and turn their shadows off](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L3172) — `tests/examples/ui-kit.spec.js`
