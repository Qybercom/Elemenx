/*
 * The Game editor of ElemenxUI: a game made of a scene (SceneEditor: a ground or a star system, its sketch, its objects,
 * its triggers) and of models of shapes (ObjectEditor), placed in the scene; Play runs it there, and the game downloads
 * as one HTML file that runs alone or as a project of Elemenx, with its models as glb files too.
 */
Elemenx.Application('ElemenxGameEditor', {
	$Title: 'Elemenx Game editor',
	$Component: 'GameEditorLayout',
	$Root: 'application',
	$Mount: 'body',
	$Use: ['ElemenxUI'],
	$Locales: {URL: 'locales/{language}.json', Languages: ['en', 'ru']}
});
