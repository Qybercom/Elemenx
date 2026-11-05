/*
 * The footings of a Scene: the ground gives way under what stands on it. When the World of a ground has the step Footings,
 * each building (an object whose model is of the Type building, or any object told Footing: true; Footing: false keeps
 * the ground as it is) gets a level place under it: its footprint (the box of its model over the ground, its Size and
 * Facing, Margin metres more round it) at the height the ground has there (Mode: mean, low or high of it), the ground
 * coming softly to it within Edge metres. They are a layer of the sketch of the ground (plateau areas, over the roads), so
 * a building moved makes the ground again only where it was and where it goes.
 * FootingsOf() gives the places made: [{ID, Points, Height}].
 */
Elemenx.Trait('SceneFootings', {
	FootingsStart: function () {
		var scene = this.Scene();
		var engine = this.Engine();
		var models = this.$Service('SceneModels');
		var terrain = this.$Service('SceneTerrainGenerator');
		var state = {Quick: '', Given: null, Key: '', Sketch: null, Made: [], Boxes: {}};

		function number (value, fallback) {
			return value === undefined || value === null || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		/* The name of the model of an object, if it has one. */
		function shape (object) {
			var model = object.Traits && object.Traits.Model;

			return model ? object.Shape || object.Values.Model || model.Shape || '' : '';
		}

		/* What stands on the ground for good and takes a footing. */
		function standing () {
			return (scene.Order || []).filter(function (object) {
				var name = shape(object);
				var info = name && models.Has(name) ? models.Info(name) : null;

				if (object.Owner || !name || object.Values.Footing === false || object.Values.Footing === 'false') return false;

				if (object.Traits.Walker || object.Traits.Vehicle) return false;

				return object.Values.Footing === true || object.Values.Footing === 'true' || !!info && info.Type === 'building';
			});
		}

		/* The box of a model over the ground, in its own units: [minX, minZ, maxX, maxZ]; null while its file is not here. */
		function box (name) {
			var made;
			var whole;
			var positions;
			var found = [Infinity, Infinity, -Infinity, -Infinity];
			var i;

			if (state.Boxes[name])
				return state.Boxes[name];

			made = models.Make(name);

			if (!made)
				return null;

			whole = models.Whole(made);
			positions = whole.Positions;

			for (i = 0; i < positions.length; i += 3) {
				found[0] = Math.min(found[0], positions[i]);
				found[1] = Math.min(found[1], positions[i + 2]);
				found[2] = Math.max(found[2], positions[i]);
				found[3] = Math.max(found[3], positions[i + 2]);
			}

			state.Boxes[name] = isFinite(found[0]) ? found : [-0.5, -0.5, 0.5, 0.5];

			return state.Boxes[name];
		}

		/* The footprint of an object on the ground: the corners of its box, turned as it faces, Margin more round it. */
		function footprint (object, margin) {
			var made = box(shape(object));
			var size = number(object.Size, number(object.Traits.Model.Size, 1));
			var turn = number(object.Values.Facing, 0) * Math.PI / 180;
			var c = Math.cos(turn);
			var s = Math.sin(turn);
			var x = number(object.Values.X, 0);
			var z = number(object.Values.Y, 0);

			if (!made)
				return null;

			return [[made[0], made[1]], [made[2], made[1]], [made[2], made[3]], [made[0], made[3]]].map(function (corner) {
				var u = corner[0] * size + (corner[0] < (made[0] + made[2]) / 2 ? -margin : margin);
				var v = corner[1] * size + (corner[1] < (made[1] + made[3]) / 2 ? -margin : margin);

				/* Its axis Z goes where it faces ([sin, cos]), its axis X across it. */
				return [x + u * c + v * s, z - u * s + v * c];
			});
		}

		function make (found, settings, sketch) {
			var given = settings.Footings || {};
			var edge = number(given.Edge, 6);
			var margin = number(given.Margin, 1);
			var mode = given.Mode || 'mean';
			var field = terrain.Flat(Object.assign({}, settings, {Sketch: sketch}));

			state.Made = [];

			found.forEach(function (object) {
				var points = footprint(object, margin);
				var heights;
				var height;

				if (!points) return;

				heights = points.concat([[number(object.Values.X, 0), number(object.Values.Y, 0)]]).map(function (point) {
					return field.Height(point[0], point[1]);
				});

				if (mode === 'low') height = Math.min.apply(Math, heights);
				else if (mode === 'high') height = Math.max.apply(Math, heights);
				else height = heights.reduce(function (sum, value) {
					return sum + value;
				}, 0) / heights.length;

				state.Made.push({ID: object.ID, Points: points, Height: height});
			});

			state.Sketch = state.Made.length ? {Layers: (sketch && sketch.Layers || []).concat([{ID: 'footings', Name: 'footings', Visible: true, Strength: 1, Items: state.Made.map(function (place) {
				return {ID: 'footing-' + place.ID, Type: 'plateau', Points: place.Points, Height: place.Height, Edge: edge};
			})}])} : sketch;
		}

		/* The sketch of a ground with the footings over it; made again only when what stands, the ground or its sketch changes. */
		engine.FootingsSketch = function (settings, sketch) {
			var quick = scene.Version + ':' + JSON.stringify(settings.Footings);
			var found;
			var key;

			if (state.Quick === quick && state.Given === sketch) return state.Sketch;

			state.Quick = quick;
			state.Given = sketch;
			found = standing();

			key = JSON.stringify([settings, sketch, found.map(function (object) {
				var name = shape(object);

				return [object.ID, name, models.Info(name).Group, object.Size, object.Traits.Model.Size, object.Values.X, object.Values.Y, object.Values.Facing, !!box(name)];
			})]);

			if (key !== state.Key) {
				state.Key = key;

				make(found, settings, sketch);
			}

			return state.Sketch;
		};

		engine.FootingsOf = function () {
			return state.Made;
		};
	},

	FootingsOf: function () {
		return this.Engine().FootingsOf ? this.Engine().FootingsOf() : [];
	}
});
