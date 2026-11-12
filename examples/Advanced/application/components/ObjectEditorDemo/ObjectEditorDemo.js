/*
 * ObjectEditorDemo (Graphics): ModelEditor · a model of shapes: parts in pieces a rig moves, tags, a mirror on the
 * other side, variants of a seed; the right button turns round, W E R move, turn and scale; Generate asks a generator
 * of rules (a tower, a table, a robot, a tree); Model saves it as glb, gltf, fbx or obj
 */
Elemenx.Component('ObjectEditorDemo', {
	$TemplateURL: 'ObjectEditorDemo.html',
	$Traits: ['SceneDemo'],
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
