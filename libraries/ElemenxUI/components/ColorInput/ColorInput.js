Elemenx.Component('ColorInput', {
	$TemplateURL: 'ColorInput.html',
	$StyleURL: 'ColorInput.css',
	Value: '#000000',
	Size: 'medium',
	Name: null,
	Disabled: false,
	Invalid: false,
	Text: null,

	Picked: function (event, node) {
		this.Text = null;
		this.Value = node.value.toLowerCase();

		this.$Emit('input', this.Value);
	},

	Typed: function (event, node) {
		var digits = node.value.replace(/[^0-9a-fA-F]/g, '').substring(0, 6).toLowerCase();
		var text = '#' + digits;
		if (node.value !== text)
			node.value = text;

		this.Text = text;

		if (digits.length === 6 || digits.length === 3) {
			this.Value = digits.length === 3 ? '#' + digits.charAt(0) + digits.charAt(0) + digits.charAt(1) + digits.charAt(1) + digits.charAt(2) + digits.charAt(2) : text;

			this.$Emit('input', this.Value);
		}
	},

	Committed: function () {
		this.Text = null;

		this.$Emit('change', this.Value);
	}
});