/*
 * A switch: a check box drawn as a track with a thumb (role switch). Checked is its state, Label and Description the
 * text beside it; Size: small or medium. Name and Disabled as in a check box. Events: change (Checked).
 */
Elemenx.Component('Toggle', {
	$TemplateURL: 'Toggle.html',
	$StyleURL: 'Toggle.css',
	$Meta: {
		Group: 'inputs',
		Icon: 'sliders',
		Description: 'A switch: a check box drawn as a track with a thumb (role switch).',
		Events: ['change'],
		Props: {
			Checked: 'Whether it is on.',
			Label: 'The text beside it.',
			Description: 'A smaller text under the label.',
			Size: {Options: ['small', 'medium'], Description: 'small or medium.'},
			Name: 'The name of its value in a form.',
			Disabled: 'Turns it off: it takes no input and looks so.'
		},
		Sample: {Label: 'Notifications', Description: 'Get a message on every reply'}
	},
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