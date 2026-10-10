Elemenx.Component('Input', {
	$TemplateURL: 'Input.html',
	Type: 'text',
	Value: '',
	Placeholder: '',
	Disabled: false,
	Min: null,
	Max: null,
	Step: null,

	Input: function (event) {
		this.Value = event && event.target ? event.target.value : this.Value;

		this.$Emit('change', this.Value);
	}
});