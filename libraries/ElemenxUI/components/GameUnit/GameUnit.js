/*
 * A unit of a GameWorld, declared in it: ID, X and Y (the cell it stands on), Team (the one of the player is the
 * Team of the world: it selects and orders it), Type (archer, worker: its kind in the game), Name, Color (of its
 * team by default), Image (a picture of it, standing on its feet), Health and MaxHealth, Speed (cells a second),
 * Sight (the cells it sees in the fog). It shows nothing by itself: the world draws it and moves it.
 */
Elemenx.Component('GameUnit', {
	$TemplateURL: 'GameUnit.html',
	$Meta: {
		Group: 'game',
		Icon: 'user',
		Description: 'A unit of a GameWorld: where it stands, its team, its health, its speed and its sight.',
		Props: {
			ID: 'The ID of the unit.',
			X: 'The cell it stands on, across.',
			Y: 'The cell it stands on, down.',
			Team: 'Its team.',
			Type: 'Its kind in the game: archer, worker.',
			Name: 'Its name.',
			Color: 'Its color (of its team by default).',
			Image: 'A picture of it, standing on its feet.',
			Health: 'Its health.',
			MaxHealth: 'Its health when whole.',
			Speed: 'Cells a second.',
			Sight: 'The cells it sees.'
		},
		Sample: {ID: 'archer-1', X: 4, Y: 6, Team: 'blue', Type: 'archer'}
	},
	ID: '',
	X: 0,
	Y: 0,
	Team: '',
	Type: '',
	Name: '',
	Color: '',
	Image: '',
	Health: null,
	MaxHealth: null,
	Speed: 2,
	Sight: 5,

	$OnCreate: function () {
		/* What it declares, as the world reads it (a template calls it with its props). */
		this.Value = function (id, x, y, team, type, name, color, image, health, maxHealth, speed, sight) {
			return JSON.stringify({ID: id, X: x, Y: y, Team: team, Type: type, Name: name, Color: color, Image: image, Health: health, MaxHealth: maxHealth, Speed: speed, Sight: sight}, function (field, value) {
				return value === Infinity ? 'Infinity' : value;
			});
		};
	}
});
