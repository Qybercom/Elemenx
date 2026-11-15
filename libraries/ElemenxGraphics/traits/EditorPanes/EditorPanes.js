/*
 * EditorPanes: the panes of an editor as wide as the reader drags them (*resizable on their edge), kept in the browser
 * for the next time, each editor by its PanesKey. PaneWidth(name, fallback) is the width of a pane in CSS ('220px'),
 * PaneResized(name, event) keeps the width a drag of its edge ended at (the resizeend of *resizable).
 */
Elemenx.Trait('EditorPanes', {
	PanesKey: 'editor',
	Panes: null,

	PaneWidth: function (name, fallback) {
		var panes = this.Panes;

		if (!panes) {
			panes = {};

			try {
				panes = JSON.parse(window.localStorage.getItem('elemenx-panes:' + this.PanesKey) || '{}') || {};
			}
			catch (error) {
				panes = {};
			}

			this.Panes = panes;
		}

		return (Number(panes[name]) > 0 ? Number(panes[name]) : fallback) + 'px';
	},

	PaneResized: function (name, event) {
		var detail = event && event.detail ? event.detail : event;
		var panes = Object.assign({}, this.Panes || {});

		if (!detail || !(Number(detail.Width) > 0)) return;

		panes[name] = Math.round(Number(detail.Width));

		this.Panes = panes;

		try {
			window.localStorage.setItem('elemenx-panes:' + this.PanesKey, JSON.stringify(panes));
		}
		catch (error) {
			/* A browser that keeps nothing: the width holds till the page goes. */
		}
	}
});
