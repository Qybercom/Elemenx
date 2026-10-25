module.exports = {
	Application: 'PWA',
	Entry: 'app.js',
	Index: 'index.html',
	Output: 'dist',
	Server: {
		DevelopmentPort: 4187,
		ProductionPort: 4188
	},

	/* The icon of the Application: the page, and the icons of the installed application (192 and 512 pixels). */
	Icon: '/icons/app.png',

	/*
	 * An application of the browser: installable, its files kept for the page to run without the network, and its
	 * updates waiting until the Application applies them (checked at the start and every hour, or by its button).
	 */
	PWA: {
		Name: 'Elemenx notes',
		ShortName: 'Notes',
		Description: 'Notes that work without the network: an installable Elemenx application.',
		Theme: '#2f4fd8',
		Background: '#f4f5f7',
		Update: 'prompt'
	}
};
