/* A directive of the Library of the tests: the text of its element in capitals. */
Elemenx.Directive('Shout', {
	$OnCreate: function (context) {
		context.Element.textContent = context.Element.textContent.toUpperCase();
	}
});
