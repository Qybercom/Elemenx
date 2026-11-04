/* A Component of a Library on another one: a Component and a Service of that one in it. */
Elemenx.Component('ChainCard', {
	$Template: '<div class="chain-card"><b class="chain-greeting">{{Greeting()}}</b><LibraryBadge Name="Bo" /></div>',

	$OnCreate: function () {
		var self = this;

		this.Greeting = function () {
			return self.$Service('Greeter').Greet('Chain');
		};
	}
});
