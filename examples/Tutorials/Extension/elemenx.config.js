/*
 * The project of the tutorial on browser extensions. elemenx build --extension makes it a Manifest V3 extension for
 * Chrome, Edge and Firefox (dist/extension), the window of its button (a popup); elemenx dev and elemenx build show the
 * same page in a tab, with the storage of the page in place of the storage of the extension.
 */
module.exports = {
	Application: 'Extension',
	Entry: 'app.js',
	Index: 'index.html',
	Output: 'dist',
	Server: {
		DevelopmentPort: 4329,
		ProductionPort: 4330
	},
	Extension: {
		Surface: 'popup',
		Name: 'Reading list',
		Description: 'Keeps the pages to read later, on every browser you sign in to.',

		/* activeTab: the page of the tab when the button is pressed, and only then; storage: chrome.storage. */
		Manifest: {
			permissions: ['activeTab', 'storage']
		}
	}
};
