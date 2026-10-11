Elemenx.Component('TextArea', {
	$TemplateURL: 'TextArea.html',
	$StyleURL: 'TextArea.css',
	Value: '',
	Placeholder: '',
	Rows: 3,
	MaxLength: null,
	AutoSize: false,
	Resize: 'vertical',
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