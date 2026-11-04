/*
 * A small game: a hero on a land of hills finds the gems, around the water and the slopes. Scene draws the land and walks the
 * hero; the HUD counts the gems; a menu starts and pauses it; an achievement comes with the last gem.
 */
Elemenx.Application('Gems', {
	$Title: 'Gem hunt',
	$Component: 'App',
	$Root: 'Game',
	$Mount: 'body',
	$Use: ['ElemenxGaming']
});
