/*
 * Declared: a Component that reads what is declared inside it (Pipeline its PipelineStage, Mosaic its MosaicItem,
 * Quiz its QuizQuestion): child Components that show nothing themselves, a hidden element of each with its props in
 * data-item, inside the element DeclaredSources names. It reads them once it is ready and again whenever they change
 * (a MutationObserver of the sources: their elements, their data-item and, with DeclaredText, their texts), through
 * the Declarations(sources) of the Component, and gives what changed to its Declared(declared): by default the list is
 * kept in Own().Declared and Version is counted up, for the template to make its model again.
 */
Elemenx.Trait('Declared', {
	DeclaredSources: '',
	DeclaredText: false,
	Version: 0,

	$OnReady: function () {
		var self = this;
		var sources = this.DeclaredSources ? this.$Element().querySelector(this.DeclaredSources) : null;
		var state = {Last: null, Watcher: null};

		this.DeclaredState = function () {
			return state;
		};

		if (!sources) return;

		state.Read = function () {
			var declared = self.Declarations(sources);
			var text = JSON.stringify(declared);
			if (text === state.Last) return;

			state.Last = text;

			self.Declared(declared);
		};

		state.Watcher = new MutationObserver(state.Read);

		state.Watcher.observe(sources, {subtree: true, childList: true, characterData: !!this.DeclaredText, attributes: true, attributeFilter: ['data-item']});

		state.Read();
	},

	$OnDestroy: function () {
		var state = this.DeclaredState ? this.DeclaredState() : null;
		if (state && state.Watcher)
			state.Watcher.disconnect();
	},

	/* The props of each declared element, as they are: a Component reads more of them (their content) on its own. */
	Declarations: function (sources) {
		return Array.prototype.map.call(sources.querySelectorAll('[data-item]'), function (node) {
			return JSON.parse(node.getAttribute('data-item') || '{}');
		});
	},

	Declared: function (declared) {
		if (this.Own)
			this.Own().Declared = declared;

		this.Version++;
	},

	/* What is declared now, read at once (a test, a change made by code before the observer tells of it). */
	ReadDeclared: function () {
		var state = this.DeclaredState ? this.DeclaredState() : null;
		if (state && state.Read)
			state.Read();
	}
});
