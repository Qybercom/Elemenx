/*
 * A tool window for a Workspace area: a title bar with actions (slot "actions") above a scrolling body (default slot).
 * With an ID, in the slot tools of a Workspace, the frame places it: Area (left, right or bottom) is where it starts,
 * Open opens it at first, Icon and Badge make its button on the stripe (Badge: a count, 'dot', 'busy'...). Its close
 * button then closes its area.
 */
Elemenx.Component('WorkspaceToolWindow', {
	$TemplateURL: 'WorkspaceToolWindow.html',
	$StyleURL: 'WorkspaceToolWindow.css',
	$Meta: {
		Group: 'overlays',
		Icon: 'panel-right',
		Description: 'A tool window for a Workspace area: a title bar with actions (slot "actions") above a scrolling body (default slot).',
		Container: true,
		Slots: ['actions'],
		Events: {
			close: 'Its close button was pressed.'
		},
		Props: {
			Title: 'The title of its bar.',
			Icon: 'Its icon, and the icon of its button on the stripe.',
			Closable: 'Shows the close button.',
			Padded: 'Puts room around the body.',
			ID: 'The ID by which the Workspace places it.',
			Area: {Options: ['left', 'right', 'bottom'], Description: 'Where it starts: left, right or bottom.'},
			Open: 'Opens it at first.',
			Badge: 'A badge on its button: a count, dot, busy...'
		},
		Sample: {Title: 'Project', Icon: 'folder', Closable: true, Padded: true, ID: 'project', Open: true}
	},
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