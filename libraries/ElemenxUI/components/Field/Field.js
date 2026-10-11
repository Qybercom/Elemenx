Elemenx.Component('Field', {
	$TemplateURL: 'Field.html',
	$StyleURL: 'Field.css',
	Label: '',
	Hint: '',
	Error: '',
	Required: false,
	Horizontal: false,
	Disabled: false,

	Focus: function (event, node) {
		var control = node.parentNode.querySelector('input:not([type="hidden"]):not([tabindex="-1"]), textarea, select, button:not([tabindex="-1"]), [tabindex="0"]');
		if (control)
			control.focus();
	}
});