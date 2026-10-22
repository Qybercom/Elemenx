/*
 * A check box. Checked is its state, Indeterminate shows a dash for a set that is partly checked (a parent of a list),
 * Label and Description stand beside it, Icon goes before the label. Variant: default (a box and its label), chip (a
 * toggle chip) or tile (a selectable tile with its description). Size: small, medium or large. Name and Value are those
 * of a field of a form; Disabled, Invalid. Events: change (Checked).
 */
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