/*
 * SceneLocations: the locations of a planet of ScenePlanet, each a cell of its surface (ScenePlanet.CellAt) that a scene
 * shows in detail, its neighbours beside it. They are told in the planet (the options of ScenePlanet.Make): LocationSize
 * (km, the side of a cell, 4) and Locations {ID: location}, a location {ID (of its cell), Kind (generated: of the World of
 * the planet there; model: a file, Model its address), World (a World of its own, SceneWorld, when it was edited; else
 * the one of the planet there), Passages ([{Side (0 to 3: +X, +Z, -X, -Z of the location, as CellNeighbours), At (0 to 1
 * along it), Kind (road, path, river, tunnel, gate), Width (metres), Mode (seamless: the neighbour is walked into;
 * passage: it is gone to through it), To (the ID of the neighbour)}]), Beyond (what is past a side with no neighbour:
 * cliff, wall, void, sea or far, the far ground of the planet; far by default)}. A cell with no location told is one of
 * the planet as it is, generated.
 * - Location(planet, id): a location resolved: {ID, Cell, Place (CellPlace: Latitude, Longitude, Turn, Size, Points), Kind,
 *   Model, World (its own, or SceneWorld.Library of the planet there), Passages, Beyond, Sides ([{Side, To (the ID of the
 *   cell beside), Told (whether a location is told there), Passages}])}.
 * - At(planet, latitude, longitude): the ID of the location of a point.
 * - Open(planet, id): the sides where a location may be added beside it (no location told there): [{Side, To}].
 * - Tell(planet, id, changes): the planet with a location told or changed (a copy); Forget(planet, id) with it gone.
 * - Passage(planet, id, passage): the planet with a passage added on a side of a location, and the same on the neighbour's
 *   side facing it (its At the other way along it), so both lead to each other.
 * The same functions run in workers and in Node: they read no page.
 */
Elemenx.Service('SceneLocations', {
	$Meta: {
		Description: 'The locations of a planet: cells of its surface, each a scene in detail, their neighbours, passages between them and what is past their sides.',
		Methods: ['Location(planet, id)', 'At(planet, latitude, longitude)', 'Open(planet, id)', 'Tell(planet, id, changes)', 'Forget(planet, id)', 'Passage(planet, id, passage)', 'Kinds()', 'Beyonds()']
	},

	Kinds: function () {
		return ['road', 'path', 'river', 'tunnel', 'gate'];
	},

	Beyonds: function () {
		return ['far', 'cliff', 'wall', 'void', 'sea'];
	},

	/* The radius and the size of the cells of a planet, km. */
	Grid: function (planet) {
		return {Radius: Number(planet.Radius) || 6371, Size: Number(planet.LocationSize) || 4};
	},

	/* A cell of its ID. */
	Cell: function (id) {
		var parts = String(id).split(':').map(Number);

		return {Face: parts[0], I: parts[1], J: parts[2], N: parts[3], ID: String(id)};
	},

	At: function (planet, latitude, longitude) {
		var planets = this.$Service('ScenePlanet');
		var grid = this.Grid(planet);

		return planets.CellAt(grid.Radius, grid.Size, planets.Direction(latitude, longitude)).ID;
	},

	Location: function (planet, id) {
		var planets = this.$Service('ScenePlanet');
		var grid = this.Grid(planet);
		var cell = this.Cell(id);
		var told = (planet.Locations || {})[id] || null;
		var place = planets.CellPlace(grid.Radius, cell);
		var options = Object.assign({}, planet);
		var passages = told && told.Passages || [];

		delete options.Locations;

		return {
			ID: cell.ID,
			Cell: cell,
			Place: place,
			Kind: told && told.Kind || 'generated',
			Model: told && told.Model || '',
			Told: !!told,
			World: told && told.World || this.$Service('SceneWorld').Library({Size: Math.round(place.Size), Planet: {Options: options, Latitude: place.Latitude, Longitude: place.Longitude, Turn: place.Turn}}),
			Passages: passages,
			Beyond: told && told.Beyond || 'far',
			Sides: planets.CellNeighbours(grid.Radius, grid.Size, cell).map(function (other, side) {
				return {Side: side, To: other.ID, Told: !!(planet.Locations || {})[other.ID], Passages: passages.filter(function (passage) {
					return passage.Side === side;
				})};
			})
		};
	},

	Open: function (planet, id) {
		return this.Location(planet, id).Sides.filter(function (side) {
			return !side.Told;
		}).map(function (side) {
			return {Side: side.Side, To: side.To};
		});
	},

	Tell: function (planet, id, changes) {
		var made = JSON.parse(JSON.stringify(planet || {}));

		made.Locations = made.Locations || {};
		made.Locations[id] = Object.assign({ID: id, Kind: 'generated', Passages: [], Beyond: 'far'}, made.Locations[id] || {}, changes || {});

		return made;
	},

	Forget: function (planet, id) {
		var made = JSON.parse(JSON.stringify(planet || {}));
		if (made.Locations)
			delete made.Locations[id];

		return made;
	},

	Passage: function (planet, id, passage) {
		var location = this.Location(planet, id);
		var side = location.Sides[passage.Side];
		var other;
		var back;
		var made;
		var given = {Side: Number(passage.Side), At: Math.max(0, Math.min(1, Number(passage.At) || 0.5)), Kind: passage.Kind || 'path', Width: Number(passage.Width) || 4, Mode: passage.Mode === 'passage' ? 'passage' : 'seamless', To: side.To};

		made = this.Tell(planet, id, {Passages: location.Passages.concat([given])});

		/* The neighbour's side that faces this one, and the passage on it, along it the other way. */
		other = this.Location(made, side.To);
		back = other.Sides.filter(function (each) {
			return each.To === id;
		})[0];

		if (back)
			made = this.Tell(made, side.To, {Passages: other.Passages.concat([{Side: back.Side, At: 1 - given.At, Kind: given.Kind, Width: given.Width, Mode: given.Mode, To: id}])});

		return made;
	}
});
