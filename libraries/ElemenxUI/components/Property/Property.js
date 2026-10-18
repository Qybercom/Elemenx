/*
 * A property: its name (Label) and its value (Value with its Unit, or the default slot in place of them), the value set
 * apart. Tone colors the value: success, danger, warning or accent. Goes in Properties, or in a dl of its own.
 */
Elemenx.Component('Property', {
	$TemplateURL: 'Property.html',
	$StyleURL: 'Property.css',
	Label: '',
	Value: '',
	Unit: '',
	Tone: ''
});
