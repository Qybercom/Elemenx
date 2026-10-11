/* A tool window for a Workspace area: a title bar with actions (slot "actions") above a scrolling body (default slot). */
Elemenx.Component('WorkspaceToolWindow', {
	$TemplateURL: 'WorkspaceToolWindow.html',
	$StyleURL: 'WorkspaceToolWindow.css',
	Title: '',
	Icon: '',
	Closable: false,
	Padded: false,

	Close: function () {
		this.$Emit('close');
	}
});