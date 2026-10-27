/*
 * A small game: a hero on a map finds the gems, around the water and the rocks. GameWorld draws the map and walks the
 * hero; the HUD counts the gems; a menu starts and pauses it; an achievement comes with the last gem.
 */
Elemenx.Application('Gems', {
	$Title: 'Gem hunt',
	$Component: 'App',
	$Root: 'Game',
	$Mount: 'body',
	$Use: ['ElemenxUI']
});
