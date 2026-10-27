/*
 * A number that matters, with its name and how it moved: Label, Value, Unit, and Delta (a percent; above 0 is good,
 * below is bad, unless Inverse says a fall is good: costs, errors). A click emits open with {Label}, to show more.
 */
Elemenx.Component('StatCard', {
	$TemplateURL: 'StatCard.html',
	$StyleURL: 'StatCard.css',
	$Meta: {
		Group: 'data',
		Icon: 'chart',
		Description: 'A number that matters, with its name and how it moved.',
		Events: {
			open: 'The card was pressed: {Label}.'
		},
		Props: {
			Label: 'What the number is.',
			Value: 'The number, or a text.',
			Unit: 'Written after the value.',
			Delta: {Type: 'number', Description: 'How it moved, a percent: above 0 up, below 0 down.'},
			Inverse: 'A fall is good: costs, errors.'
		},
		Sample: {Label: 'Revenue', Value: '48.2K', Unit: '€', Delta: 12}
	},
	Label: '',
	Value: '',
	Unit: '',
	Delta: null,
	Inverse: false,

	/* The classes of the delta: up, down or flat, and good or bad. */
	Trend: function (delta, inverse) {
		var value = Number(delta);
		var good;

		if (delta === null || delta === '' || !value) return ['flat'];

		good = value > 0 !== (inverse === true || inverse === 'true');

		return [value > 0 ? 'up' : 'down', good ? 'good' : 'bad'];
	},

	Pressed: function () {
		this.$Emit('open', {Label: this.Label});
	}
});
