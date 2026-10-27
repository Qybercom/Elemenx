/* The page: its header with the switch of the theme, its sections, and the toasts. */
Elemenx.Component('App', {
	$TemplateURL: 'App.html',
	$StyleURL: 'App.css',

	/* A link of the header scrolls to its section. */
	Go: function (event, node) {
		var target = document.getElementById(node.getAttribute('data-target'));

		event.preventDefault();

		if (target)
			target.scrollIntoView({behavior: 'smooth'});
	}
});
