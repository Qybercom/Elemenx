/* A single radio button for custom layouts; RadioGroup renders a whole set from Options. */
Elemenx.Component('Radio', {
	$TemplateURL: 'Radio.html',
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