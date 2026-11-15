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
		{Name: 'Galaxy', Label: 'Galaxy', Note: 'Scene · Setting galaxy, GalaxyData: a galaxy of each kind, its black hole, its stars sector by sector; a drag turns, the wheel brings it near, press a star, enter its system'},
		{Name: 'Showcase', Label: 'Showcase world', Note: 'Scene · SceneShowcase: every primitive of the generation in one world of three kilometres, district by district; Benchmark tours them all and measures each'},
		{Name: 'Models', Label: 'Models', Note: 'Scene · the Models Service: units, animals, plants, buildings of fantasy and sci-fi made of code, with their clips, the shadows of the sun and the wind'},
		{Name: 'Textures', Label: 'Textures', Note: 'TextureLab · SceneTextures: textures of materials made of code, baked once into tiles with no seam'},
		{Name: 'Cinema', Label: 'Camera and cinema', Note: 'Scene · SceneCamera, SceneScreens, SceneCinema: lenses of real cameras, rigs, screens, cutscenes and their video'},
		{Name: 'WorldEditor', Label: 'World editor', Note: 'WorldEditor · a world level in level: a galaxy, the system of a star, a planet, a location; its models, plants, cutscenes and materials in tabs beside it; saved as one file'}
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
