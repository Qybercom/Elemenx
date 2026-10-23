/*
 * A list and the card of the chosen item, built on elemenx-container and elemenx-column.
 * Slots: list-header, list, detail-header, detail. Without detail content the card area shows Empty.
 * The list is resized by its edge. On a narrow layout one side shows at a time: the card when it has content,
 * the list otherwise; the back button of the card then emits back (the owner clears the detail).
 */
Elemenx.Component('MasterDetail', {
	$TemplateURL: 'MasterDetail.html',
	$StyleURL: 'MasterDetail.css',
	$Meta: {
		Group: 'layout',
		Icon: 'panel-left',
		Description: 'A list and the card of the chosen item, built on elemenx-container and elemenx-column.',
		Container: true,
		Slots: ['list-header', 'list', 'detail-header', 'detail'],
		Events: ['back'],
		Props: {
			Empty: 'The text of the card while nothing is chosen.',
			EmptyIcon: 'The icon of the card while nothing is chosen.'
		},
		Sample: {Empty: 'Select a person'}
	},
	Empty: '',
	EmptyIcon: 'list',

	Back: function () {
		this.$Emit('back');
	}
});