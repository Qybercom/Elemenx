/*
 * A thing of a GameWorld, declared in it: a tree, a rock, a resource, a flag. ID, Kind (tree, rock, or a name of
 * your own), X and Y, Width and Height (1 by 1), Color, Image (a picture standing on its cell), Blocks (no way
 * through it), Opaque (it hides what is behind it), Name. It shows nothing by itself: the world draws it.
 */
Elemenx.Component('GameObject', {
	$TemplateURL: 'GameObject.html',
	$Meta: {
		Group: 'game',
		Icon: 'leaf',
		Description: 'A thing of a GameWorld: a tree, a rock, a resource; whether it blocks the way and hides.',
		Props: {
			ID: 'The ID of the thing.',
			Kind: 'What it is: tree, rock, or a name of your own.',
			X: 'Its cell, across.',
			Y: 'Its cell, down.',
			Width: 'The cells it takes across.',
			Height: 'The cells it takes down.',
			Name: 'Its name.',
			Color: 'Its color.',
			Image: 'A picture of it, standing on its cell.',
			Blocks: 'No way through it.',
			Opaque: 'It hides what is behind it.'
		},
		Sample: {Kind: 'tree', X: 3, Y: 3}
	},
	ID: '',
	Kind: 'tree',
	X: 0,
	Y: 0,
	Width: 1,
	Height: 1,
	Name: '',
	Color: '',
	Image: '',
	Blocks: false,
	Opaque: false,

	$OnCreate: function () {
		/* What it declares, as the world reads it (a template calls it with its props). */
		this.Value = function (id, kind, x, y, width, height, name, color, image, blocks, opaque) {
			return JSON.stringify({ID: id, Kind: kind, X: x, Y: y, Width: width, Height: height, Name: name, Color: color, Image: image, Blocks: blocks, Opaque: opaque}, function (field, value) {
				return value === Infinity ? 'Infinity' : value;
			});
		};
	}
});
