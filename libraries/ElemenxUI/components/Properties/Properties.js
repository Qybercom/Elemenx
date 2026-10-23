/*
 * A list of properties: Property children, a name and its value each, in one column or two (Columns). Label names the
 * list for screen readers. Its look comes from the --elemenx-property-* tokens of the theme.
 */
Elemenx.Component('Properties', {
	$TemplateURL: 'Properties.html',
	$StyleURL: 'Properties.css',
	$Meta: {
		Group: 'layout',
		Icon: 'list',
		Description: 'A list of properties: Property children, a name and its value each, in one column or two (Columns).',
		Container: true,
		Props: {
			Columns: 'One column of pairs, or two.',
			Label: 'The name of the list for screen readers.'
		},
		Sample: {Columns: 2, Label: 'Battle'}
	},
	Columns: 1,
	Label: ''
});
