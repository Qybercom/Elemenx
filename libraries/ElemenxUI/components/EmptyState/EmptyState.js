/*
 * What a list, a table or a panel shows when it has nothing: an icon, a title, a description and actions (the
 * actions slot), the default slot for more. Variant: empty (default), search (nothing found), error (could not load),
 * offline; each has its icon unless Icon names another. Size: small (inside a list or a table) or medium.
 */
Elemenx.Component('EmptyState', {
	$TemplateURL: 'EmptyState.html',
	$StyleURL: 'EmptyState.css',
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
