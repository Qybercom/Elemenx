/* Native date picker for now; the API stays when a custom calendar replaces it. Mode: date, datetime-local, month, week. */
Elemenx.Component('DateInput', {
	$TemplateURL: 'DateInput.html',
	Value: '',
	Mode: 'date',
	Min: null,
	Max: null,
	Size: 'medium',
	Name: null,
	Disabled: false,
	ReadOnly: false,
	Invalid: false,

	Typed: function (value) {
		this.Value = value;

		this.$Emit('input', value);
	},

	Committed: function (value) {
		this.$Emit('change', value);
	}
});