/*
 * A set of radio buttons, one of them chosen. Options: [{Value, Label, Description, Disabled}]; Value is the Value of
 * the chosen option, with its original type. Variant: default (one under another), horizontal (in a row), tile (tiles
 * with their descriptions) or segmented (a strip of buttons, as a switch between views). Label names the group for screen
 * readers; the arrows move the choice. Size, Name, Disabled, Invalid. Events: change (Value).
 */
Elemenx.Component('RadioGroup', {
	$TemplateURL: 'RadioGroup.html',
	$Meta: {
		Group: 'inputs',
		Icon: 'list-bulleted',
		Description: 'A set of radio buttons, one of them chosen.',
		Events: ['change'],
		Props: {
			Options: {Schema: {Value: 'text', Label: 'text', Hint: 'text', Disabled: 'bool'}, Description: 'The options: [{Value, Label, Description, Disabled}].'},
			Value: 'The Value of the option chosen.',
			Variant: {Options: ['default', 'horizontal', 'tile', 'segmented'], Description: 'default (a column), horizontal (a row), tile or segmented (a strip of buttons).'},
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'},
			Name: 'The name of its value in a form.',
			Label: 'The name of the group for screen readers.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Invalid: 'Marks its value as wrong.'
		},
		Sample: {Variant: 'segmented', Label: 'View'}
	},
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