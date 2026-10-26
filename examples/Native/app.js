/*
 * A native program of Elemenx: the same Application in a window of the desktop (Electron) and on a phone (Capacitor),
 * which tries the features of the system through the Native Service of ElemenxUI. elemenx build --native makes the
 * programs (npm run native), elemenx dev runs it in a browser, where the Service does what the web can.
 */
Elemenx.Application('Native', {
	$Title: 'Elemenx native',
	$Component: 'App',
	$Root: 'Native',
	$Mount: 'body',
	$Use: ['ElemenxUI'],
	/* Its phrases in English and Russian: it starts in the language of the system, or the one chosen before. */
	$Locales: {URL: 'locales/{language}.json', Languages: ['en', 'ru']}
});
