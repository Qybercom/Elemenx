/*
 * What a list, a table or a panel shows when it has nothing: an icon, a title, a description and actions (the
 * actions slot), the default slot for more. Variant: empty (default), search (nothing found), error (could not load),
 * offline; each has its icon unless Icon names another. Size: small (inside a list or a table) or medium.
 */
Elemenx.Component('EmptyState', {
	$TemplateURL: 'EmptyState.html',
	$StyleURL: 'EmptyState.css',
	$Meta: {
		Group: 'display',
		Icon: 'folder-open',
		Description: 'What a list, a table or a panel shows when it has nothing: an icon, a title, a description and actions (the actions slot), the default slot for more.',
		Container: true,
		Slots: ['actions'],
		Props: {
			Title: 'The title.',
			Description: 'A text under the title.',
			Icon: 'An icon of its own in place of the one of the Variant.',
			Variant: {Options: ['empty', 'search', 'error', 'offline'], Description: 'empty, search (nothing found), error (could not load) or offline.'},
			Size: {Options: ['small', 'medium'], Description: 'small (inside a list or a table) or medium.'}
		},
		Sample: {Title: 'Nothing found', Description: 'Try another word.', Icon: 'search'}
	},
	Title: '',
	Description: '',
	Icon: '',
	Variant: 'empty',
	Size: 'medium',

	$OnCreate: function () {
		this.IconOf = function (icon, variant) {
			return icon || {search: 'search', error: 'error', offline: 'cloud'}[variant] || 'folder-open';
		};
	}
});
