/*
 * GraphicsPage (/graphics): the demos of the 3D graphics of ElemenxGraphics and its editors, one at a time (?demo=Name;
 * the first by default), in a DemoFrame.
 */
Elemenx.Component('GraphicsPage', {
	$TemplateURL: 'GraphicsPage.html',
	Demos: [
		{Name: 'Terrain', Label: 'Terrain', Note: 'Scene · a ground of the Terrain Service: a drag turns, the wheel zooms, WASD moves, a click selects a unit, a right click sends it; fingers turn, carry and bring it near, a press sends'},
		{Name: 'Locations', Label: 'Locations', Note: 'Scene · a location of a model: a click takes the mouse, WASD walk, Shift runs, Space jumps, the right button looks round, V changes the camera, Escape frees the mouse; on a touch screen the gamepad walks'},
		{Name: 'Space', Label: 'Space', Note: 'Scene · SceneObject · Kinds: a drag turns, the wheel zooms, a click selects, a double click flies to a body'},
		{Name: 'DeepSpace', Label: 'Deep space', Note: 'Scene · SceneDeepSpace: a black hole with its disc, light bent round it; a wormhole to another sky; a comet; a quasar; a planetoid to land on'},
		{Name: 'Showcase', Label: 'Showcase world', Note: 'Scene · SceneShowcase: every primitive of the generation in one world of three kilometres, district by district; Benchmark tours them all and measures each'},
		{Name: 'Models', Label: 'Models', Note: 'Scene · the Models Service: units, animals, plants, buildings of fantasy and sci-fi made of code, with their clips, the shadows of the sun and the wind'},
		{Name: 'Plants', Label: 'Plants', Note: 'FloraEditor · SceneFlora: a species of plant of a photograph of it, grown at once in 3D, each number on a slider'},
		{Name: 'Textures', Label: 'Textures', Note: 'TextureLab · SceneTextures: textures of materials made of code, baked once into tiles with no seam'},
		{Name: 'Cinema', Label: 'Camera and cinema', Note: 'Scene · SceneCamera, SceneScreens, SceneCinema: lenses of real cameras, rigs, screens, cutscenes and their video'},
		{Name: 'SceneEditor', Label: 'Scene editor', Note: 'SceneEditor · as Unreal: the right button looks and W A S D Q E fly, Alt and the left button turn round, a click selects, W E R move, turn and scale'},
		{Name: 'SpaceEditor', Label: 'Space editor', Note: 'SceneEditor · a star system: the square carries a body on its orbit, the green axis tilts the orbit, the ring turns its axis'},
		{Name: 'ObjectEditor', Label: 'Object editor', Note: 'ModelEditor · a model of shapes: parts in pieces a rig moves, tags, a mirror, variants of a seed; Generate asks a generator of rules'}
	],

	/* The demo shown: the one the address names, else the first. */
	Shown: function (query) {
		var asked = query && query.demo;

		return (this.Demos || []).some(function (demo) {
			return demo.Name === asked;
		}) ? asked : this.Demos[0].Name;
	},

	Choose: function (event) {
		this.$Router().Replace('/graphics?demo=' + encodeURIComponent(event.Name));
	}
});
