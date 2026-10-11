/* Native time picker for now; the API stays when a custom picker replaces it. */
Elemenx.Component('TimeInput', {
	$TemplateURL: 'TimeInput.html',
	Value: '',
	Seconds: false,
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