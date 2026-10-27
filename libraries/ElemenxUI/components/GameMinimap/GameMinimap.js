/*
 * The frame of a minimap: the map in its default slot (an image, a canvas), round or square (Shape), Size pixels
 * wide. Markers [{ID, X, Y, Kind, Icon, Label, Color}] stand at X and Y from 0 to 1 over the map (Kind quest, enemy,
 * ally or point, for their color); a marker off the map waits on its edge, pointing the way. The player is an arrow
 * in the middle turned to Heading degrees (Player false hides it); North puts the letter N on the frame. Title (the
 * place) and Note (coordinates, the time) show on a band under the map. Zoomable adds + and - buttons.
 * Events: zoom (1 or -1), marker (the marker pressed).
 */
Elemenx.Component('GameMinimap', {
	$TemplateURL: 'GameMinimap.html',
	$StyleURL: 'GameMinimap.css',
	$Meta: {
		Group: 'game',
		Icon: 'trophy',
		Description: 'The frame of a minimap: the map in its default slot (an image, a canvas), round or square (Shape), Size pixels wide.',
		Container: true,
		Events: {
			marker: 'A marker was pressed: the marker.',
			zoom: 'A zoom button was pressed: 1 (in) or -1 (out).'
		},
		Props: {
			Shape: {Options: ['round', 'square'], Description: 'round or square.'},
			Size: 'The width in pixels.',
			Markers: 'The marks over the map: [{ID, X, Y, Kind, Icon, Label, Color}], X and Y from 0 to 1.',
			Heading: 'The direction of the player, in degrees.',
			Player: 'Shows the arrow of the player.',
			North: 'Shows the letter N on the frame.',
			Title: 'The name of the place on the band under the map.',
			Note: 'A note on the band (coordinates, the time).',
			Zoomable: 'Adds the + and - buttons.',
			Label: 'The name of the map for screen readers.'
		},
		Sample: {Heading: 35, Title: 'Northern woods', Zoomable: true}
	},
	Shape: 'round',
	Size: 160,
	Markers: [],
	Heading: 0,
	Player: true,
	North: true,
	Title: '',
	Note: '',
	Zoomable: false,
	Label: '',

	$OnCreate: function () {
		var self = this;

		/* Where a marker stands, kept on the map: {X, Y, Edge} from 0 to 1. */
		this.Spot = function (marker) {
			var x = Number(marker.X);
			var y = Number(marker.Y);
			var dx = x - 0.5;
			var dy = y - 0.5;
			var distance = Math.sqrt(dx * dx + dy * dy);
			var limit = 0.46;

			if (self.Shape === 'round') {
				if (distance <= limit)
					return {X: x, Y: y, Edge: false};

				return {X: 0.5 + dx / distance * limit, Y: 0.5 + dy / distance * limit, Edge: true};
			}

			if (Math.abs(dx) <= limit && Math.abs(dy) <= limit) return {X: x, Y: y, Edge: false};

			return {X: 0.5 + Math.max(-limit, Math.min(limit, dx)), Y: 0.5 + Math.max(-limit, Math.min(limit, dy)), Edge: true};
		};

		/* The style of a marker: its place, the angle that points to it from the middle, and its color. */
		this.Place = function (marker) {
			var spot = self.Spot(marker);
			var bearing = Math.atan2(Number(marker.Y) - 0.5, Number(marker.X) - 0.5) * 180 / Math.PI + 90;

			return 'left: ' + spot.X * 100 + '%; top: ' + spot.Y * 100 + '%; --elemenx-game-marker-bearing: ' + bearing + 'deg;' + (marker.Color ? ' --elemenx-game-marker: ' + marker.Color + ';' : '');
		};

		/* A marker off the map waits on its edge. */
		this.Edge = function (marker) {
			return self.Spot(marker).Edge;
		};
	},

	Pressed: function (event, node) {
		var index = Number(node.getAttribute('data-index'));

		this.$Emit('marker', (this.Markers || [])[index]);
	},

	ZoomIn: function () {
		this.$Emit('zoom', 1);
	},

	ZoomOut: function () {
		this.$Emit('zoom', -1);
	}
});
