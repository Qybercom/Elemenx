/*
 * An IDE-like application frame built on elemenx-screen, elemenx-container and elemenx-column.
 * Slots: header, left-stripe, left, main, bottom, right, right-stripe, status.
 * LeftOpen, RightOpen and BottomOpen show the tool window areas; their sizes are resized by the splitters
 * (pointer or arrow keys) and reported by the resize event as {Panel, Size}.
 */
Elemenx.Component('Workspace', {
	$TemplateURL: 'Workspace.html',
	$StyleURL: 'Workspace.css',
	LeftOpen: true,
	RightOpen: false,
	BottomOpen: true,
	LeftWidth: 280,
	RightWidth: 280,
	BottomHeight: 240,
	MinSize: 120,
	Drag: null,

	Limit: function (panel, size) {
		var body = this.$Element().querySelector('.elemenx-workspace-body');
		var room = panel === 'bottom' ? body.clientHeight : body.clientWidth;

		return Math.round(Math.max(Number(this.MinSize), Math.min(size, room * 0.72)));
	},

	Apply: function (panel, size) {
		size = this.Limit(panel, size);

		if (panel === 'left') this.LeftWidth = size;
		else if (panel === 'right') this.RightWidth = size;
		else this.BottomHeight = size;

		this.$Emit('resize', {Panel: panel, Size: size});
	},

	StartResize: function (event, node) {
		var panel = node.getAttribute('data-panel');

		if (event.button !== 0) return;

		event.preventDefault();

		node.setPointerCapture(event.pointerId);

		this.Drag = {
			Panel: panel,
			X: event.clientX,
			Y: event.clientY,
			Size: panel === 'left' ? Number(this.LeftWidth) : panel === 'right' ? Number(this.RightWidth) : Number(this.BottomHeight)
		};
	},

	MoveResize: function (event) {
		var drag = this.Drag;
		var delta;

		if (!drag) return;

		if (drag.Panel === 'left') delta = event.clientX - drag.X;
		else if (drag.Panel === 'right') delta = drag.X - event.clientX;
		else delta = drag.Y - event.clientY;

		this.Apply(drag.Panel, drag.Size + delta);
	},

	EndResize: function (event, node) {
		if (!this.Drag) return;

		if (node.hasPointerCapture(event.pointerId))
			node.releasePointerCapture(event.pointerId);

		this.Drag = null;
	},

	KeyResize: function (event, node) {
		var panel = node.getAttribute('data-panel');
		var size = panel === 'left' ? Number(this.LeftWidth) : panel === 'right' ? Number(this.RightWidth) : Number(this.BottomHeight);
		var step = event.shiftKey ? 64 : 16;
		var grow;

		if (panel === 'bottom') grow = event.key === 'ArrowUp' ? 1 : event.key === 'ArrowDown' ? -1 : 0;
		else if (panel === 'left') grow = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
		else grow = event.key === 'ArrowLeft' ? 1 : event.key === 'ArrowRight' ? -1 : 0;

		if (!grow) return;

		event.preventDefault();

		this.Apply(panel, size + grow * step);
	}
});