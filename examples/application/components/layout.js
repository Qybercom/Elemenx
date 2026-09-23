Elemenx.Component('Layout', {
	Template: [
		'<div>',
			'<header>',
				'<strong>Elemenx Application</strong> ',
				'<nav>',
					'<a href="/" data-router>Home</a>',
					'<a href="/project/42?tab=activity#latest" data-router>Project</a>',
				'</nav>',
			'</header>',
			'<main data-outlet="Content"></main>',
		'</div>'
	].join('')
});