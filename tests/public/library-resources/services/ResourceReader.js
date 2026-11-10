/* A Service of the tests that reads the resources of its Library as it is defined: they are there before it. */
Elemenx.Service('ResourceReader', {
	Seen: Elemenx.Resources('Blueprints').slice(),
	Read: function (name) {
		return Elemenx.Resources('Blueprints', name);
	}
});
