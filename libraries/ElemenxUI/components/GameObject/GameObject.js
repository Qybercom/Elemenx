/*
 * An object of a game, of any kind, declared in a GameScene (or a GameWorld): Kind names its kind (the Kinds Service:
 * what it extends, what it can do, its Traits, and what it is made of, its Parts), and every other attribute is a field
 * of it or of one of its Traits, in any case (Radius, Distance, Speed, Team: whatever its kind has). ID, Name, Team.
 * A GameObject declared inside another goes round it when its kind moves (an Orbit, a Mover: a moon in its planet), and
 * is a part of it otherwise (a module of a station); Part="dock" changes the part of that name that the kind of its
 * parent gives it, Parent names what it goes round instead of its place. For a GameWorld (the map of cells) it is a
 * thing on a cell: X and Y, Width and Height (1 by 1), Color, Image, Blocks (no way through it), Opaque (it hides what
 * is behind it), Kind tree (the default there), rock or a name of your own. It shows nothing by itself.
 */
Elemenx.Component('GameObject', {
	$TemplateURL: 'GameObject.html',
	$Open: true,
	$Meta: {
		Group: 'game',
		Icon: 'shapes',
		Description: 'An object of a game of any kind: its Kind gives its traits and parts, every other attribute is a field of it.',
		Container: true,
		Children: ['GameObject'],
		Props: {
			ID: 'The ID of the object.',
			Kind: 'Its kind (the Kinds Service): planet, station, fleet, tree, or one of your own.',
			Name: 'Its name.',
			Part: 'The part of its parent it changes (the part of that ID of the kind of the parent).',
			Parent: 'What it goes round or belongs to, when not the object it is declared in.',
			Team: 'Its team.',
			X: 'Its place across (a cell of a GameWorld).',
			Y: 'Its place down (a cell of a GameWorld).',
			Width: 'The cells it takes across.',
			Height: 'The cells it takes down.',
			Color: 'Its color.',
			Image: 'A picture of it, standing on its cell.',
			Blocks: 'No way through it.',
			Opaque: 'It hides what is behind it.'
		},
		Sample: {Kind: 'planet', Name: 'Earth'}
	},
	ID: '',
	Kind: '',
	Name: '',
	Part: '',
	Parent: '',
	Team: '',
	X: 0,
	Y: 0,
	Width: 1,
	Height: 1,
	Color: '',
	Image: '',
	Blocks: false,
	Opaque: false,

	$OnCreate: function () {
		var self = this;

		/* What it declares, as the scene or the world reads it: its props, then the fields its tag gives (a template calls it). */
		this.Value = function (id, kind, name, part, parent, team, x, y, width, height, color, image, blocks, opaque) {
			var value = {ID: id, Kind: kind, Name: name, Part: part, Parent: parent, Team: team, X: x, Y: y, Width: width, Height: height, Color: color, Image: image, Blocks: blocks, Opaque: opaque};
			var open = self.$Open();

			Object.keys(open).forEach(function (key) {
				value[key] = open[key];
			});

			return JSON.stringify(value, function (field, item) {
				if (item === Infinity) return 'Infinity';

				return item === '' && field !== 'Kind' ? undefined : item;
			});
		};
	}
});
