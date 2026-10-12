/*
 * A rating of Max stars (5). Value: 0 to Max, in halves with Half. The pointer shows the rating it would give;
 * a press gives it (a press on the given rating clears it, unless Clearable is false). Keys: arrows (a step: one star,
 * or half with Half), Home (0), End (Max), digits. ReadOnly shows a rating that cannot change. Icon names another
 * shape. Events: change (Value).
 */
Elemenx.Component('Rating', {
	$TemplateURL: 'Rating.html',
	$StyleURL: 'Rating.css',
	Value: 0,
	Max: 5,
	Half: false,
	Clearable: true,
	ReadOnly: false,
	Disabled: false,
	Icon: 'star',
	Size: 'medium',
	Label: 'Rating',
	Hover: -1,

	$OnCreate: function () {
		var self = this;

		/* The stars: how much of each is filled (0, 0.5 or 1) for the value shown. */
		this.Stars = function (value, hover, max) {
			var shown = hover >= 0 ? hover : Number(value) || 0;
			var stars = [];
			var i = 0;

			while (i < Number(max)) {
				stars.push({Index: i, Fill: Math.max(0, Math.min(1, shown - i))});

				i++;
			}

			return stars;
		};

		this.Text = function (value, max) {
			return (Number(value) || 0) + ' / ' + max;
		};

		this.Step = function () {
			return self.Half ? 0.5 : 1;
		};
	},

	/* The rating at the pointer over a star: the whole star, or its half with Half. */
	At: function (event, node) {
		var index = Number(node.getAttribute('data-index'));
		var rect = node.getBoundingClientRect();
		if (this.Half && event.clientX < rect.left + rect.width / 2) return index + 0.5;

		return index + 1;
	},

	Over: function (event, node) {
		if (!this.ReadOnly && !this.Disabled)
			this.Hover = this.At(event, node);
	},

	Out: function () {
		this.Hover = -1;
	},

	Set: function (value) {
		value = Math.max(0, Math.min(Number(this.Max), value));

		if (value === Number(this.Value)) return;

		this.Value = value;

		this.$Emit('change', value);
	},

	Pick: function (event, node) {
		var value;

		if (this.ReadOnly || this.Disabled) return;

		value = this.At(event, node);

		this.Set(value === Number(this.Value) && this.Clearable ? 0 : value);
	},

	Key: function (event) {
		var step = this.Step();
		var value = Number(this.Value) || 0;

		if (this.ReadOnly || this.Disabled) return;

		if (event.key === 'ArrowRight' || event.key === 'ArrowUp') this.Set(value + step);
		else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') this.Set(value - step);
		else if (event.key === 'Home') this.Set(0);
		else if (event.key === 'End') this.Set(Number(this.Max));
		else if (/^[0-9]$/.test(event.key)) this.Set(Number(event.key));
		else return;

		event.preventDefault();
	}
});
