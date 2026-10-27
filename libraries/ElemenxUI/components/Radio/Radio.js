/*
 * A single radio button, for layouts of your own; RadioGroup renders a whole set from Options. Checked marks it, Value
 * is what it stands for, Name groups it with the radio buttons of the same name (the browser keeps one checked), Label
 * and Description stand beside it. Variant: default or tile (a selectable tile with its description); Size: small,
 * medium or large; Disabled, Invalid. Events: change (Value, when it is checked).
 */
Elemenx.Component('Radio', {
	$TemplateURL: 'Radio.html',
	$Meta: {
		Group: 'inputs',
		Icon: 'edit',
		Description: 'A single radio button, for layouts of your own; RadioGroup renders a whole set from Options.',
		Container: true,
		Events: {
			change: 'It was checked: Value.'
		},
		Props: {
			Checked: 'Whether it is chosen.',
			Label: 'The text beside it.',
			Description: 'A smaller text under the label.',
			Variant: {Options: ['default', 'tile'], Description: 'default, or tile (a tile with its description).'},
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'},
			Name: 'Groups it with the radio buttons of the same name.',
			Value: 'What it stands for.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Invalid: 'Marks its value as wrong.'
		},
		Sample: {Label: 'By post', Description: '5 to 7 days', Name: 'docs-ship', Value: 'post'}
	},
	Checked: false,
	Label: '',
	Description: '',
	Variant: 'default',
	Size: 'medium',
	Name: null,
	Value: null,
	Disabled: false,
	Invalid: false,

	Picked: function (event, node) {
		this.Checked = node.checked;

		this.$Emit('change', this.Value);
	}
});