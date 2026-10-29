/*
 * A part of the layout of a TabSplit declared in its template: the groups and the splits in it side by side, Sizes their
 * shares in percents ('25,75'; equal without it). It shows nothing of its own: the TabSplit reads it.
 */
Elemenx.Component('TabRow', {
	$TemplateURL: 'TabRow.html',
	$StyleURL: 'TabRow.css',
	$Meta: {
		Group: 'layout',
		Icon: 'columns',
		Description: 'A part of the layout of a TabSplit declared in its template: the groups and the splits in it side by side.',
		Container: true,
		Children: ['TabGroup', 'TabColumn', 'Tab'],
		Props: {
			Sizes: 'The shares of its parts in percents: 25,75 (equal without it).'
		}
	},
	Sizes: ''
});
