/* Resize: vertical (the bottom edge), both (the corner) or none; AutoSize grows the field with its text instead. */
Elemenx.Component('TextArea', {
	$TemplateURL: 'TextArea.html',
	$StyleURL: 'TextArea.css',
	Value: '',
	Placeholder: '',
	Rows: 3,
	MaxLength: null,
	AutoSize: false,
	Resize: 'vertical',
	Shape: 'default',
	Name: null,
	Disabled: false,
	ReadOnly: false,
	Invalid: false,

	$OnReady: function () {
		this.Fit(null, this.$Element().querySelector('textarea'));
	},

	Fit: function (event, node) {
		if (!this.AutoSize || !node) return;

		node.style.height = 'auto';
		node.style.height = node.scrollHeight + 'px';
	},

	Typed: function (event, node) {
		this.Value = node.value;

		this.Fit(event, node);

		this.$Emit('input', this.Value);
	},

	Committed: function () {
		this.$Emit('change', this.Value);
	}
});