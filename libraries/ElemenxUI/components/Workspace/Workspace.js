/*
 * An IDE-like application frame built on elemenx-screen, elemenx-container and elemenx-column.
 * Slots: header, top-stripe (a band under the header), left-stripe, left, main, bottom, right, right-stripe,
 * bottom-stripe (a band above the status bar) and status. The frame does not decide its content: an area shows
 * only while its slot renders something (put *if on a tool window to open and close it), and the left, right and
 * bottom areas are resized by their edge; the resize event reports {Panel, Size}.
 */
Elemenx.Component('Workspace', {
	$TemplateURL: 'Workspace.html',
	$StyleURL: 'Workspace.css',

	Resized: function (event, node) {
		var panel = node.getAttribute('data-panel');

		this.$Emit('resize', {Panel: panel, Size: panel === 'bottom' ? event.detail.Height : event.detail.Width});
	}
});