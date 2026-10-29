/*
 * A part of the layout of a TabSplit declared in its template: the groups and the splits in it one over another, Sizes
 * their shares in percents ('60,40'; equal without it). It shows nothing of its own: the TabSplit reads it.
 */
Elemenx.Component('TabColumn', {
	$TemplateURL: 'TabColumn.html',
	$StyleURL: 'TabColumn.css',
	$Meta: {
		Group: 'layout',
		Icon: 'panel-bottom',
		Description: 'A part of the layout of a TabSplit declared in its template: the groups and the splits in it one over another.',
		Container: true,
		Children: ['TabGroup', 'TabRow', 'Tab'],
		Props: {
			Sizes: 'The shares of its parts in percents: 60,40 (equal without it).'
		}
	},
	Sizes: ''
});
