/*
 * A kind of ground of a GameWorld, declared in it: Key (the character of the rows of a GameLayer), Name, Color,
 * Cost (to enter a cell of it: 1 by default, Infinity blocks), Opaque (it hides what is behind it: a forest), Image
 * (a picture of a tile). It shows nothing by itself: the world reads it.
 */
Elemenx.Component('GameTerrain', {
	$TemplateURL: 'GameTerrain.html',
	$Meta: {
		Group: 'game',
		Icon: 'layout',
		Description: 'A kind of ground of a GameWorld: the character of its rows, its color, its cost and whether it hides.',
		Props: {
			Key: 'The character of the kind in the rows of a GameLayer.',
			Name: 'The name of the kind: water, forest.',
			Color: 'Its color.',
			Cost: 'The cost to enter a cell of it: 1 by default, Infinity blocks.',
			Opaque: 'It hides what is behind it.',
			Image: 'A picture of a tile of it.'
		},
		Sample: {Key: '~', Name: 'water', Color: '#3a6fb8', Cost: 'Infinity'}
	},
	Key: '',
	Name: '',
	Color: '',
	Cost: 1,
	Opaque: false,
	Image: '',

	$OnCreate: function () {
		/* What it declares, as the world reads it (a template calls it with its props). */
		this.Value = function (key, name, color, cost, opaque, image) {
			return JSON.stringify({Key: key, Name: name, Color: color, Cost: cost, Opaque: opaque, Image: image}, function (field, value) {
				return value === Infinity ? 'Infinity' : value;
			});
		};
	}
});
