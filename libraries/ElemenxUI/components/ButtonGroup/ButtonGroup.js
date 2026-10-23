/*
 * Buttons in a row. Attached joins them into one strip (it scrolls sideways on a narrow screen); without Attached they
 * wrap onto a new line. Vertical stacks them. Label names the group for screen readers.
 */
Elemenx.Component('ButtonGroup', {
	$TemplateURL: 'ButtonGroup.html',
	$StyleURL: 'ButtonGroup.css',
	$Meta: {
		Group: 'buttons',
		Icon: 'columns',
		Description: 'Buttons in a row.',
		Container: true,
		Props: {
			Attached: 'Joins the buttons into one strip.',
			Vertical: 'Stacks the buttons.',
			Label: 'The name of the group for screen readers.'
		},
		Sample: {Attached: true, Label: 'Alignment'}
	},
	Attached: false,
	Vertical: false,
	Label: ''
});