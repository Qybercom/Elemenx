Elemenx.Component('Field', {
	$TemplateURL: 'Field.html',
	Label: '',
	Hint: '',
	Type: 'text',
	Value: '',
	Placeholder: '',
	Disabled: false,
	Min: null,
	Max: null,
	Step: null,

	Changed: function (event) {
		this.Value = event && event.Data !== undefined ? event.Data : this.Value;

		this.$Emit('change', this.Value);
	}
});