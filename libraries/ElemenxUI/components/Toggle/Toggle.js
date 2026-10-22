/*
 * A switch: a check box drawn as a track with a thumb (role switch). Checked is its state, Label and Description the
 * text beside it; Size: small or medium. Name and Disabled as in a check box. Events: change (Checked).
 */
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