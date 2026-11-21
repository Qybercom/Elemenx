/*
 * WorldEditorDemo (Graphics): WorldEditor · a world level in level: its galaxy (pick a star, put a star or a body of no
 * system where the view looks), the system of a star, a planet of it, a location of the planet; its models, plants,
 * cutscenes (one of them, Arrival, of its location Harbour, played in a scene of it) and materials each in a tab beside it; the whole world saved as one file and opened again. Its relief is a
 * graph of its own (Graphs, planet/relief: ranges twice as high as of the library), changed in a tab as any graph of the
 * library its planets and grounds are made of.
 */
Elemenx.Component('WorldEditorDemo', {
	$TemplateURL: 'WorldEditorDemo.html',
	$Traits: ['SceneDemo'],
	World: null,

	$OnCreate: function () {
		this.World = {Name: 'Aurelia', Galaxy: {Seed: 'aurelia', Kind: 'spiral', Name: 'Aurelia'}, Graphs: {'planet/relief': this.HighRanges()}, Locations: this.Locations(), Resources: {Cutscenes: this.Cutscenes()}};
	},

	/* A location of the world to play a cutscene in: a harbour by the sea, two cameras over it, each looking at the other. */
	Locations: function () {
		return {'aurelia/coast/harbour': {Version: 1, Name: 'Harbour', Setting: 'ground', Scene: {Version: 1, Seed: '', Time: 0, Travels: [], Removed: [], Overrides: {}, Added: [
			{ID: 'ground', Kind: 'ground', Values: {}, Traits: {Terrain: {World: this.$Service('SceneWorld').Library({Size: 400, Height: 20, Water: 0.25, Seed: 'harbour'})}}, Parts: []},
			{ID: 'sun', Kind: 'sun', Values: {}, Traits: {Sun: {Time: 9}}, Parts: []},
			{ID: 'pier', Kind: 'camera', Values: {X: -60, Y: -40}, Traits: {Camera: {Lift: 6, Target: 'cliff'}}, Parts: []},
			{ID: 'cliff', Kind: 'camera', Values: {X: 70, Y: 30}, Traits: {Camera: {Lift: 40, Target: 'pier'}}, Parts: []}
		]}}};
	},

	/* A cutscene of the harbour (its tab plays it in a scene of the location): from the pier to the cliff, a title over it. */
	Cutscenes: function () {
		return {'arrival': {Name: 'Arrival', Location: 'aurelia/coast/harbour', Value: {arrival: {Tracks: [
			{Type: 'camera', Keys: [{At: 0, Camera: 'pier'}, {At: 4, Camera: 'cliff'}]},
			{Type: 'fade', Keys: [{At: 0, Value: 1}, {At: 1, Value: 0}]},
			{Type: 'title', Items: [{At: 0.5, Length: 3, Text: 'The harbour of Aurelia', Typing: 14, In: 0}]}
		], Restore: true, Skip: true}}}};
	},

	/* The relief of the library with its ranges twice as high: the term of the ranges of its plains doubled. */
	HighRanges: function () {
		var graph = JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/planet/relief')));

		graph.blocks.forEach(function (block) {
			(block.properties || []).forEach(function (property) {
				if (block.type === 'Formula' && property.key === 'Expression')
					property.value = String(property.value).replace('H * Relief * (0.3 + 0.5 * Mountains) * C', 'H * Relief * (0.6 + 1 * Mountains) * C');
			});
		});

		return graph;
	},

	/*
	 * A generator of models for the object editor, of rules and no network: a word of the description chooses what it builds
	 * (a tower, a table, a robot, else a tree), a number in it how many of its parts there are.
	 */
	ObjectGenerator: function (description, callback) {
		var text = String(description || '').toLowerCase();
		var count = Math.max(2, Math.min(12, Number((text.match(/\d+/) || [4])[0])));
		var parts = [];
		var i;

		if (/tower|башн/.test(text)) {
			for (i = 0; i < count; i++)
				parts.push({ID: 'floor-' + i, Shape: 'cylinder', Piece: 'body', At: [0, (i + 0.5) / count * 0.9, 0], Size: [0.5 - i * 0.02, 0.9 / count, 0.5], Color: i % 2 ? '#b8a88c' : '#9e9078', Tags: ['floor']});

			parts.push({ID: 'roof', Shape: 'cylinder', Top: 0, Piece: 'body', At: [0, 0.97, 0], Size: [0.6, 0.2, 0.6], Color: '#7a3b2e'});
		}
		else if (/table|стол/.test(text)) {
			parts.push({ID: 'top', Shape: 'box', At: [0, 0.75, 0], Size: [1, 0.06, 0.6], Color: '#8a6a4a'});
			parts.push({ID: 'leg-front', Shape: 'box', At: [0.44, 0.36, 0.24], Size: [0.06, 0.72, 0.06], Color: '#6e5238', Mirror: true, Tags: ['leg']});
			parts.push({ID: 'leg-back', Shape: 'box', At: [0.44, 0.36, -0.24], Size: [0.06, 0.72, 0.06], Color: '#6e5238', Mirror: true, Tags: ['leg']});
		}
		else if (/robot|робот/.test(text)) {
			parts.push({ID: 'chest', Shape: 'box', Piece: 'body', At: [0, 0.62, 0], Size: [0.42, 0.34, 0.24], Color: '#8f9aa8'});
			parts.push({ID: 'head', Shape: 'box', Piece: 'head', At: [0, 0.88, 0], Size: [0.22, 0.18, 0.2], Color: '#c8d0da', Vary: {Size: [0.03, 0.03, 0]}});
			parts.push({ID: 'arm', Shape: 'cylinder', Piece: 'arm-l', At: [0.28, 0.58, 0], Size: [0.09, 0.34, 0.09], Color: '#6c7684', Mirror: true});
			parts.push({ID: 'leg', Shape: 'cylinder', Piece: 'leg-l', At: [0.1, 0.22, 0], Size: [0.12, 0.44, 0.12], Color: '#5a6270', Mirror: true});
			parts.push({ID: 'antenna', Shape: 'cylinder', Piece: 'head', At: [0.06, 1.02, 0], Size: [0.02, 0.12, 0.02], Color: '#e0b050', Chance: 0.5});
		}
		else {
			parts.push({ID: 'trunk', Shape: 'cylinder', Top: 0.7, At: [0, 0.3, 0], Size: [0.12, 0.6, 0.12], Color: '#6b4a32'});

			for (i = 0; i < count; i++)
				parts.push({ID: 'crown-' + i, Shape: 'blob', At: [Math.cos(i * 2.4) * 0.16, 0.66 + i * 0.05, Math.sin(i * 2.4) * 0.16], Size: [0.34, 0.3, 0.34], Color: '#4f8a3c', Vary: {At: [0.05, 0.04, 0.05], Color: 0.15}, Chance: 0.8});
		}

		window.setTimeout(function () {
			callback(null, {Type: /robot|робот/.test(text) ? 'unit' : '', Rig: /robot|робот/.test(text) ? 'Biped' : '', Variants: 4, Parts: parts});
		}, 0);
	}
});
