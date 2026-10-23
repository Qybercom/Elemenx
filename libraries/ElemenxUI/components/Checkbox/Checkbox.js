/*
 * A check box. Checked is its state, Indeterminate shows a dash for a set that is partly checked (a parent of a list),
 * Label and Description stand beside it, Icon goes before the label. Variant: default (a box and its label), chip (a
 * toggle chip) or tile (a selectable tile with its description). Size: small, medium or large. Name and Value are those
 * of a field of a form; Disabled, Invalid. Events: change (Checked).
 */
Elemenx.Component('Checkbox', {
	$TemplateURL: 'Checkbox.html',
	$Meta: {
		Group: 'inputs',
		Icon: 'check',
		Description: 'A check box.',
		Container: true,
		Events: ['change'],
		Props: {
			Checked: 'Whether it is checked.',
			Indeterminate: 'Shows a dash: a set that is partly checked.',
			Label: 'The text beside the box.',
			Description: 'A smaller text under the label.',
			Icon: 'An icon before the label.',
			Variant: {Options: ['default', 'chip', 'tile'], Description: 'default (a box), chip (a toggle chip) or tile (a tile with its description).'},
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'},
			Name: 'The name of its value in a form.',
			Value: 'The value of the field in a form.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Invalid: 'Marks its value as wrong.'
		},
		Sample: {Label: 'Remember me'}
	},
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