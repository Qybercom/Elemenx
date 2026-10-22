/*
 * A single radio button, for layouts of your own; RadioGroup renders a whole set from Options. Checked marks it, Value
 * is what it stands for, Name groups it with the radio buttons of the same name (the browser keeps one checked), Label
 * and Description stand beside it. Variant: default or tile (a selectable tile with its description); Size: small,
 * medium or large; Disabled, Invalid. Events: change (Value, when it is checked).
 */
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