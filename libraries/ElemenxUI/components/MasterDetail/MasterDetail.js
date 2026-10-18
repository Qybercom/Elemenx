/*
 * A list and the card of the chosen item, built on elemenx-container and elemenx-column.
 * Slots: list-header, list, detail-header, detail. Without detail content the card area shows Empty.
 * The list is resized by its edge. On a narrow layout one side shows at a time: the card when it has content,
 * the list otherwise; the back button of the card then emits back (the owner clears the detail).
 */
Elemenx.Component('MasterDetail', {
	$TemplateURL: 'MasterDetail.html',
	$StyleURL: 'MasterDetail.css',
	Empty: '',
	EmptyIcon: 'list',

	Back: function () {
		this.$Emit('back');
	}
});