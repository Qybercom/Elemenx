/*
 * DemoGraph: a shader graph of the library (shader/bake, shader/weather, shader/bolt, shader/galaxy, shader/cosmos... of ElemenxGraphics) open in a Blueprint,
 * to change it and see it in the scene of a demo: Name the graph, change ({Name, Graph}) each change of it, Graph null when
 * it is the library one again (Reset). The scene takes it in its Graphs as it is made: the demo makes it again.
 */
Elemenx.Component('DemoGraph', {
	$TemplateURL: 'DemoGraph.html',
	$StyleURL: 'DemoGraph.css',

	Name: '',
	/* The graph as it is now: a copy of the library one, then as it is changed. */
	Value: null,
	Shown: '',

	$OnCreate: function () {
		this.Opened();
	},

	$OnProps: function () {
		if (this.Shown !== this.Name)
			this.Opened();
	},

	Opened: function () {
		var library = this.Name ? Elemenx.Resources('Blueprints', 'ElemenxGraphics/' + this.Name) : null;

		this.Shown = this.Name;
		this.Value = library ? JSON.parse(JSON.stringify(library)) : null;
	},

	Changed: function (event) {
		var graph = event && event.detail !== undefined ? event.detail : event;

		this.Value = graph;

		this.$Emit('change', {Name: this.Name, Graph: graph});
	},

	Reset: function () {
		this.Opened();
		this.$Emit('change', {Name: this.Name, Graph: null});
	}
});
