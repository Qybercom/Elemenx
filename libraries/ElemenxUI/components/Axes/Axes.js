/*
 * The three axes of a view: how a world stands to the eye. Yaw and Pitch are the turn of the view as a GameScene has them: the
 * eye looks from Z at a yaw of 0 and from above at a pitch over 0. X is red, Y green, Z blue, each with a dot for its other end;
 * the end nearest the eye lies over the others. A press on one tells it: axis ({Axis, Sign}). Labels writes their letters, Size is
 * its side in pixels.
 */
Elemenx.Component('Axes', {
	$TemplateURL: 'Axes.html',
	$StyleURL: 'Axes.css',
	$Meta: {
		Group: 'game',
		Icon: 'move',
		Description: 'The three axes of a view: how a world stands to the eye; a press on one tells which.',
		Events: {
			axis: 'An end of an axis was pressed: {Axis, Sign}.'
		},
		Props: {
			Yaw: 'The turn of the view round the height, in radians.',
			Pitch: 'How far above its middle the eye stands, in radians.',
			Size: 'Its side in pixels.',
			Labels: 'Writes the letters of the axes.',
			Label: 'The name of it for screen readers.'
		},
		Sample: {Yaw: 0.6, Pitch: 0.4}
	},
	Yaw: 0,
	Pitch: 0,
	Size: 72,
	Labels: true,
	Label: 'Axes',

	$OnCreate: function () {
		/* Where each end stands on the picture, the farthest first: x to the right, y up, depth to the eye. */
		this.Ends = function (yaw, pitch) {
			var sinYaw = Math.sin(yaw);
			var cosYaw = Math.cos(yaw);
			var sinPitch = Math.sin(pitch);
			var cosPitch = Math.cos(pitch);
			var axes = [
				{Axis: 'X', X: cosYaw, Y: -sinYaw * sinPitch, Depth: sinYaw * cosPitch},
				{Axis: 'Y', X: 0, Y: cosPitch, Depth: sinPitch},
				{Axis: 'Z', X: -sinYaw, Y: -cosYaw * sinPitch, Depth: cosYaw * cosPitch}
			];
			var ends = [];

			axes.forEach(function (axis) {
				[1, -1].forEach(function (sign) {
					ends.push({Key: axis.Axis + sign, Axis: axis.Axis, Sign: sign, X: axis.X * sign * 36, Y: -axis.Y * sign * 36, Depth: axis.Depth * sign});
				});
			});

			return ends.sort(function (a, b) {
				return a.Depth - b.Depth;
			});
		};
	},

	Press: function (end) {
		this.$Emit('axis', {Axis: end.Axis, Sign: end.Sign});
	}
});
