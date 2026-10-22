/*
 * Buttons in a row. Attached joins them into one strip (it scrolls sideways on a narrow screen); without Attached they
 * wrap onto a new line. Vertical stacks them. Label names the group for screen readers.
 */
Elemenx.Component('ButtonGroup', {
	$TemplateURL: 'ButtonGroup.html',
	$StyleURL: 'ButtonGroup.css',
	Attached: false,
	Vertical: false,
	Label: ''
});