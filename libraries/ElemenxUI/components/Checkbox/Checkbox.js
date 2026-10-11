/* Variant: default (box and label), chip (a toggle chip) or tile (a selectable tile with a description). */
Elemenx.Component('Checkbox', {
	$TemplateURL: 'Checkbox.html',
	Checked: false,
	Indeterminate: false,
	Label: '',
	Description: '',
	Icon: '',
	Variant: 'default',
	Size: 'medium',
	Name: null,
	Value: null,
	Disabled: false,
	Invalid: false,

	Toggled: function (event, node) {
		this.Checked = node.checked;
		this.Indeterminate = false;

		this.$Emit('change', this.Checked);
	}
});