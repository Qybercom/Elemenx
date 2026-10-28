/*
 * A switch: a check box drawn as a track with a thumb (role switch). Checked is its state, Label and Description the
 * text beside it; Size: small or medium; Orientation: horizontal (on to the end of the line) or vertical (on at the top,
 * as the switch of a light). Name and Disabled as in a check box. Events: change (Checked).
 * - States 3: a switch of three positions (role slider), Value false, null (the middle: auto, inherit, either) or true,
 *   from the start (the bottom when vertical) to the end. Labels names them ([off, middle, on]; by default Off, Auto
 *   and On in the language of the page) for screen readers, and ShowLabels writes them along the track. A press on the
 *   track takes the position under the pointer, a press on the text or Space the next one; the arrows, Home and End
 *   move it. With a Name, a form gets 'false', 'null' or 'true'. Events: change (Value).
 */
Elemenx.Component('Toggle', {
	$TemplateURL: 'Toggle.html',
	$StyleURL: 'Toggle.css',
	$Meta: {
		Group: 'inputs',
		Icon: 'sliders',
		Description: 'A switch: a check box drawn as a track with a thumb (role switch), of two positions or three.',
		Events: {
			change: 'It was switched: Checked (Value with States 3).'
		},
		Props: {
			Checked: 'Whether it is on.',
			Label: 'The text beside it.',
			Description: 'A smaller text under the label.',
			Size: {Options: ['small', 'medium'], Description: 'small or medium.'},
			Orientation: {Options: ['horizontal', 'vertical'], Description: 'horizontal, or vertical (on at the top).'},
			States: {Type: 'number', Options: [2, 3], Description: '2, or 3: off, the middle and on (Value).'},
			Value: 'With States 3: false, null (the middle) or true.',
			Labels: 'With States 3: the names of the three positions, [off, middle, on].',
			ShowLabels: 'With States 3: writes the names of the positions along the track.',
			Name: 'The name of its value in a form.',
			Disabled: 'Turns it off: it takes no input and looks so.'
		},
		Sample: {Label: 'Notifications', Description: 'Get a message on every reply'}
	},
	Checked: false,
	Label: '',
	Description: '',
	Size: 'medium',
	Orientation: 'horizontal',
	States: 2,
	Value: false,
	Labels: null,
	ShowLabels: false,
	Name: null,
	Disabled: false,

	$OnCreate: function () {
		/* A switch of three positions. */
		this.Three = function (states) {
			return Number(states) === 3;
		};

		/* The position of a value: 0 (false), 1 (null) or 2 (true); an attribute gives the text of it. */
		this.Position = function (value) {
			if (value === true || value === 'true') return 2;

			if (value === null || value === 'null' || value === undefined || value === '') return 1;

			return 0;
		};

		/* The names of the three positions: Labels, else the ones of the language of the page. */
		this.Names = function (labels) {
			var list = typeof labels === 'string' ? labels.split(',') : labels;
			if (Array.isArray(list) && list.length === 3)
				return list.map(function (item) {
					return String(item).trim();
				});

			return [Elemenx.Locale.Text('ui.toggle.off'), Elemenx.Locale.Text('ui.toggle.auto'), Elemenx.Locale.Text('ui.toggle.on')];
		};
	},

	Toggled: function (event, node) {
		this.Checked = node.checked;

		this.$Emit('change', this.Checked);
	},

	/* Moves a switch of three positions to one (0, 1 or 2) and tells it. */
	Place: function (position) {
		var value = [false, null, true][Math.max(0, Math.min(2, position))];
		if (this.Disabled || this.Position(this.Value) === this.Position(value)) return;

		this.Value = value;

		this.$Emit('change', value);
	},

	/* A press on the track takes the position under the pointer; one on the text the next position. */
	Pressed: function (event) {
		var track = this.$Ref('Track');
		var box = track && track.getBoundingClientRect();
		var vertical = this.Orientation === 'vertical';
		var rtl = track && getComputedStyle(track).direction === 'rtl';
		var share;

		if (this.Disabled || !this.Three(this.States)) return;

		if (box && event.target && track.contains(event.target) && (event.clientX || event.clientY)) {
			share = vertical ? (box.bottom - event.clientY) / box.height : (event.clientX - box.left) / box.width;

			if (rtl && !vertical)
				share = 1 - share;

			this.Place(Math.round(Math.max(0, Math.min(1, share)) * 2));
		}
		else {
			this.Place((this.Position(this.Value) + 1) % 3);
		}

		if (track)
			track.focus();
	},

	Keyed: function (event) {
		var position = this.Position(this.Value);
		var rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
		var key = event.key;

		if (key === 'ArrowLeft' && rtl) key = 'ArrowRight';
		else if (key === 'ArrowRight' && rtl) key = 'ArrowLeft';

		if (key === 'ArrowRight' || key === 'ArrowUp') this.Place(position + 1);
		else if (key === 'ArrowLeft' || key === 'ArrowDown') this.Place(position - 1);
		else if (key === 'Home') this.Place(0);
		else if (key === 'End') this.Place(2);
		else if (key === ' ' || key === 'Enter') this.Place((position + 1) % 3);
		else return;

		event.preventDefault();
	}
});
