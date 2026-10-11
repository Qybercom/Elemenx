Elemenx.Component('Toggle', {
	$TemplateURL: 'Toggle.html',
	$StyleURL: 'Toggle.css',
	Checked: false,
	Label: '',
	Description: '',
	Size: 'medium',
	Name: null,
	Disabled: false,

	Toggled: function (event, node) {
		this.Checked = node.checked;

		this.$Emit('change', this.Checked);
	}
});