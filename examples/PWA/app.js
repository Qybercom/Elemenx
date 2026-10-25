/*
 * An installable application of the browser (a PWA): elemenx build makes it, with the manifest and the worker that
 * keeps its files for the page to run without the network (PWA of elemenx.config.js); elemenx serve serves the build.
 * Its updates wait until the Application applies them (PWA.Update prompt): the page checks and updates when asked.
 */
Elemenx.Application('PWA', {
	$Title: 'Elemenx notes',
	$Component: 'App',
	$Root: 'PWA',
	$Mount: 'body',
	$Use: ['ElemenxUI']
});
