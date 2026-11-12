/*
 * WorldDemo (Gaming): a strategy game on a ground (GameStrategy): a press or a frame selects, a right press orders (on a
 * foe: attack), Ctrl and the right button turn the view, S stops, Ctrl+A all; by fingers a tap selects, a press orders,
 * one finger carries the map (or draws a frame, Frame by a finger), two bring it near, turn and tilt it.
 */
Elemenx.Component('WorldDemo', {
	$TemplateURL: 'WorldDemo.html',
	$StyleURL: 'WorldDemo.css',
	$Traits: ['SceneDemo'],
	WorldDied: function (detail) {
		this.WorldNote = detail.ID + ' fell to ' + detail.By;
	},
	WorldNote: '',
	WorldOrdered: function (detail) {
		this.WorldNote = detail.Kind === 'stop' ? 'Stop: ' + detail.IDs.join(', ') : detail.Kind === 'attack' ? 'Attack ' + detail.Target + ': ' + detail.IDs.length + ' units' : 'Move to ' + Math.round(detail.X) + ', ' + Math.round(detail.Z) + ': ' + detail.IDs.length + ' units';
	},
	WorldSelected: function (detail) {
		this.WorldNote = detail.IDs.length ? detail.IDs.length + ' selected: ' + detail.IDs.join(', ') : 'Nothing selected';
	},
	/* The units of the Game world, in metres from the middle of its land: the player is blue. */
	WorldUnits: [
		{ID: 'archer-1', Name: 'Archer', X: -62, Y: -22, Team: 'blue', Model: 'archer', Health: 40, Damage: 8, Range: 12},
		{ID: 'archer-2', Name: 'Archer', X: -58, Y: -22, Team: 'blue', Model: 'archer', Health: 32, Damage: 8, Range: 12},
		{ID: 'archer-3', Name: 'Archer', X: -62, Y: -18, Team: 'blue', Model: 'archer', Health: 40, Damage: 8, Range: 12},
		{ID: 'knight-1', Name: 'Knight', X: -55, Y: -16, Team: 'blue', Model: 'knight', Health: 100, Damage: 14, Range: 2.5},
		{ID: 'knight-2', Name: 'Knight', X: -58, Y: -13, Team: 'blue', Model: 'knight', Health: 60, Damage: 14, Range: 2.5},
		{ID: 'raider-1', Name: 'Orc', X: 60, Y: 30, Team: 'red', Model: 'orc', Health: 100, Damage: 12, Range: 2.5},
		{ID: 'raider-2', Name: 'Orc', X: 64, Y: 34, Team: 'red', Model: 'orc', Health: 100, Damage: 12, Range: 2.5},
		{ID: 'raider-3', Name: 'Orc', X: 58, Y: 36, Team: 'red', Model: 'orc', Health: 100, Damage: 12, Range: 2.5}
	],
	/* The scene of the game and its GameStrategy, kept for the buttons of the section. */
	WorldReady: function (scene) {
		this.World = function () {
			return scene;
		};

		this.Strategy = function () {
			var element = scene.$Element().querySelector('.elemenx-game-strategy');

			return element ? Elemenx.Instance(element) : null;
		};

		this.WorldToUnits();
	},
	/*
	 * The land of the game: a clearing round each base, nothing grows there (a sketch of the world). Regression: the view
	 * started in the crown of a tree over the units, and none of them was seen.
	 */
	WorldGround: {Size: 320, Height: 18, Water: 0.12, Scale: 260, Ridges: 0.15, Seed: 'world', Sketch: {Layers: [{ID: 'bases', Name: 'bases', Visible: true, Strength: 1, Items: [
		{ID: 'blue', Type: 'clearing', Strength: 1, Points: [[-100, -60], [-36, -60], [-36, 2], [-100, 2]]},
		{ID: 'red', Type: 'clearing', Strength: 1, Points: [[40, 16], [110, 16], [110, 72], [40, 72]]}
	]}]}},
	/*
	 * The view on the units of the team, all of them in it: farther on a screen standing upright (a phone), whose view is
	 * narrow across.
	 */
	WorldToUnits: function () {
		var scene = this.World ? this.World() : null;
		var mine;
		var box;
		var middle;
		var size;
		var element;
		var narrow;

		if (!scene) return;

		/* Where they stand: in the world, or by their values before the first frame has placed them. */
		mine = scene.Objects().filter(function (object) {
			return object.Team === 'blue' && object.Kind === 'unit';
		}).map(function (object) {
			var placed = object.World && (object.World[0] || object.World[2]);

			return {World: placed ? [object.World[0], 4, object.World[2]] : [Number(object.Values.X) || 0, 4, Number(object.Values.Y) || 0]};
		});

		if (!mine.length) {
			scene.SetViewpoint({Target: [-60, 4, -20], Yaw: 2.4, Pitch: 0.8, Distance: 70});

			return;
		}

		box = mine.reduce(function (made, object) {
			return [Math.min(made[0], object.World[0]), Math.min(made[1], object.World[2]), Math.max(made[2], object.World[0]), Math.max(made[3], object.World[2])];
		}, [Infinity, Infinity, -Infinity, -Infinity]);
		middle = [(box[0] + box[2]) / 2, mine[0].World[1], (box[1] + box[3]) / 2];
		size = Math.max(12, box[2] - box[0], box[3] - box[1]);
		element = scene.$Element();
		narrow = element.clientHeight > element.clientWidth;

		scene.SetViewpoint({Target: middle, Yaw: 2.4, Pitch: 0.8, Distance: size * (narrow ? 3.2 : 2.2) + 14});
	},
	/* What the pointer marks is for the game to say (HoverMark): units outlined in gold, bodies of space by a beating ring. */
	WorldMark: {Look: 'outline', Color: '#ffd27a', Width: 2, Cursor: 'pointer'},
	WorldFraming: false,
	/* One finger draws a frame that selects, or carries the map (GameStrategy.Framing). */
	WorldFramed: function (value) {
		var game = this.Strategy ? this.Strategy() : null;

		this.WorldFraming = !!value;

		if (game)
			game.Framing(this.WorldFraming);
	},
	/* A unit added by the code at the barracks, and sent out by the GameStrategy: beside what its template declares. */
	WorldRecruited: function () {
		var scene = this.World ? this.World() : null;
		var id = 'recruit-' + (this.WorldAdded + 1);

		if (!scene) return;

		this.WorldAdded++;

		scene.Add('unit', {ID: id, Name: 'Recruit', X: -74, Y: -32, Team: 'blue', Model: 'villager', Health: 30, Damage: 4, Range: 2});

		if (this.Strategy())
			this.Strategy().Order([id], [-66 + this.WorldAdded % 4 * 3, -26]);

		this.WorldNote = 'Recruited ' + id;
	},
	WorldAdded: 0,
	WorldCentered: function () {
		if (this.World)
			this.World().SetViewpoint({Target: [-80, 4, -40], Yaw: 2.4, Pitch: 0.8, Distance: 60});
	},
	WorldFogged: function (value) {
		this.WorldFog = value;
	},
	WorldFog: false
});
