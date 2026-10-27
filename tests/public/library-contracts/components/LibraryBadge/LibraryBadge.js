/* A Component of the Library of the tests: its template beside it, a Service and a phrase of the Library. */
Elemenx.Component('LibraryBadge', {
	$TemplateURL: 'LibraryBadge.html',
	Name: '',

	$OnCreate: function () {
		var self = this;

		this.Greeting = function (name) {
			return self.$Service('Greeter').Greet(name);
		};
	}
});
