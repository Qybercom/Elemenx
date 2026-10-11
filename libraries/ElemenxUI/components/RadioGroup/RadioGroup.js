/*
 * Options: [{Value, Label, Description, Disabled}]. Variant: default, horizontal, tile or segmented.
 * The change event carries the Value of the picked option, with its original type.
 */
Elemenx.Component('RadioGroup', {
	$TemplateURL: 'RadioGroup.html',
	Options: [],
	Value: null,
	Variant: 'default',
	Size: 'medium',
	Name: '',
	Label: '',
	Disabled: false,
	Invalid: false,

	$OnCreate: function () {
		if (!this.Name)
			this.Name = 'elemenx-radio-' + Math.random().toString(36).substring(2, 10);
	},

	Picked: function (event, node) {
		var option = this.Options[Number(node.getAttribute('data-index'))];
		if (!option) return;

		this.Value = option.Value;

		this.$Emit('change', this.Value);
	}
});