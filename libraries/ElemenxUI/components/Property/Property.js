/*
 * A property: its name (Label) and its value (Value with its Unit, or the default slot in place of them), the value set
 * apart. Tone colors the value: success, danger, warning or accent. Goes in Properties, or in a dl of its own.
 */
Elemenx.Component('Property', {
	$TemplateURL: 'Property.html',
	$StyleURL: 'Property.css',
	$Meta: {
		Group: 'layout',
		Icon: 'layout',
		Description: 'A property: its name (Label) and its value (Value with its Unit, or the default slot in place of them), the value set apart.',
		Container: true,
		Props: {
			Label: 'The name of the property.',
			Value: 'Its value (or the default slot).',
			Unit: 'The unit after the value.',
			Tone: {Options: ['', 'success', 'danger', 'warning', 'accent'], Description: 'Colors the value: success, danger, warning or accent.'}
		},
		Sample: {Label: 'Uptime', Value: '99.9', Unit: '%', Tone: 'success'}
	},
	Label: '',
	Value: '',
	Unit: '',
	Tone: ''
});
