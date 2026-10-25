module.exports = {
	Application: 'Native',
	Entry: 'app.js',
	Index: 'index.html',
	Output: 'dist',
	Server: {
		DevelopmentPort: 4185,
		ProductionPort: 4186
	},

	/* The icon of the Application everywhere: the page, the program, its installer, the phones. */
	Icon: '/icons/app.png',

	/* The splash of its page: shown until the Application is ready, in the window and on the phone too. */
	Splash: {Image: '/icons/tray.png', Text: 'Elemenx native', Background: '#1e1f22', Color: '#dfe1e5', MinTime: 600},

	/*
	 * The programs: on the desktop a window of 960 by 640 that hides in the tray when it closes, its title bar drawn by
	 * the Application under the buttons of the system (Frame hidden), with two tasks in its jump list, made into a zip,
	 * an installer and a portable program; the ID of the program on a phone.
	 */
	Native: {
		Desktop: {
			Name: 'Elemenx native',
			Width: 960,
			Height: 640,
			Frame: 'hidden',
			CloseToTray: true,
			Tasks: [
				{ID: 'compose', Label: 'New note', Description: 'Write a new note'},
				{ID: 'inbox', Label: 'Inbox'}
			],
			Targets: ['zip', 'installer', 'portable']
		},
		Mobile: {
			AppID: 'dev.elemenx.nativeexample',
			Name: 'Elemenx native'
		}
	}
};
