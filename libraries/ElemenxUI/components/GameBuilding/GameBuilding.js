/*
 * A building of a GameWorld, declared in it: ID, X and Y (its first cell), Width and Height (the cells it takes, 2
 * by 2 by default; no way through them), Team, Type (barracks), Name, Color (its walls), Roof (the color of its
 * roof, of its team by default), Tall (its walls, in heights of a tile), Image (a picture standing on its
 * footprint), Health and MaxHealth, Sight. It shows nothing by itself: the world draws it.
 */
Elemenx.Component('GameBuilding', {
	$TemplateURL: 'GameBuilding.html',
	$Meta: {
		Group: 'game',
		Icon: 'home',
		Description: 'A building of a GameWorld: the cells it takes, its team, its colors and its health.',
		Props: {
			ID: 'The ID of the building.',
			X: 'Its first cell, across.',
			Y: 'Its first cell, down.',
			Width: 'The cells it takes across.',
			Height: 'The cells it takes down.',
			Team: 'Its team.',
			Type: 'Its kind in the game: barracks.',
			Name: 'Its name.',
			Color: 'The color of its walls.',
			Roof: 'The color of its roof (of its team by default).',
			Tall: 'Its walls, in heights of a tile.',
			Image: 'A picture of it, standing on its footprint.',
			Health: 'Its health.',
			MaxHealth: 'Its health when whole.',
			Sight: 'The cells it sees.'
		},
		Sample: {ID: 'barracks', X: 8, Y: 2, Width: 3, Height: 3, Team: 'blue'}
	},
	ID: '',
	X: 0,
	Y: 0,
	Width: 2,
	Height: 2,
	Team: '',
	Type: '',
	Name: '',
	Color: '',
	Roof: '',
	Tall: 1,
	Image: '',
	Health: null,
	MaxHealth: null,
	Sight: 4,

	$OnCreate: function () {
		/* What it declares, as the world reads it (a template calls it with its props). */
		this.Value = function (id, x, y, width, height, team, type, name, color, roof, tall, image, health, maxHealth, sight) {
			return JSON.stringify({ID: id, X: x, Y: y, Width: width, Height: height, Team: team, Type: type, Name: name, Color: color, Roof: roof, Tall: tall, Image: image, Health: health, MaxHealth: maxHealth, Sight: sight}, function (field, value) {
				return value === Infinity ? 'Infinity' : value;
			});
		};
	}
});
