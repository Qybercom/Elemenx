/*
 * A layer of the ground of the map of a GameScene, declared in it: its rows of text inside it (a character a kind of
 * GameTerrain, or of the ones GameMaps knows: . grass, ~ water, = ford, : sand, ^ hills, T forest, # rock, _ road;
 * a space leaves the cell to the layers under it), or Rows. Name names it. It shows nothing by itself.
 */
Elemenx.Component('GameLayer', {
	$TemplateURL: 'GameLayer.html',
	$Meta: {
		Group: 'game',
		Icon: 'layout',
		Description: 'A layer of the ground of the map of a GameScene: its rows of text, a character a kind of the ground.',
		Container: true,
		Props: {
			Name: 'The name of the layer.',
			Rows: 'The rows, when they are not inside it.'
		},
		Sample: {Name: 'ground'}
	},
	Name: '',
	Rows: [],

	$OnCreate: function () {
		/* What it declares, as the world reads it (a template calls it with its props). */
		this.Value = function (name, rows) {
			return JSON.stringify({Name: name, Rows: rows}, function (field, value) {
				return value === Infinity ? 'Infinity' : value;
			});
		};
	}
});
