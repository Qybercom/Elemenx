/*
 * A tool window for a Workspace area: a title bar with actions (slot "actions") above a scrolling body (default slot).
 * With an ID, in the slot tools of a Workspace, the frame places it: Area (left, right or bottom) is where it starts,
 * Open opens it at first, Icon and Badge make its button on the stripe (Badge: a count, 'dot', 'busy'...). Its close
 * button then closes its area.
 */
Elemenx.Component('WorkspaceToolWindow', {
	$TemplateURL: 'WorkspaceToolWindow.html',
	$StyleURL: 'WorkspaceToolWindow.css',
	Title: '',
	Icon: '',
	Closable: false,
	Padded: false,
	ID: '',
	Area: 'left',
	Open: false,
	Badge: '',

	Close: function () {
		this.$Emit('close');

		this.$Element().dispatchEvent(new CustomEvent('elemenx-tool-close', {bubbles: true}));
	},

	/* A tool window that goes tells the Workspace that placed it, wherever its element is now. */
	$OnDestroy: function () {
		var root = this.$Element();
		if (root && root.ElemenxForget)
			root.ElemenxForget(root);
	}
});