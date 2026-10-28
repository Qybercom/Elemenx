/* A Service of a Library that $Discovery finds by a graph file of its own name (kit.js). */
Elemenx.Service('DiscoveredCounter', {
	Count: 0,

	Next: function () {
		this.Count++;

		return this.Count;
	}
});
