/*
 * A hotel to book, in English, Russian and Arabic: phrases from dictionaries, plural forms, dates and prices in the
 * manner of each language, and a layout that mirrors itself for a language written right to left. The project of the
 * tutorial on languages.
 */
Elemenx.Application('Languages', {
	$Title: 'Seaside',
	$Component: 'TripCard',
	$Root: 'Languages',
	$Mount: 'body',
	$Use: ['ElemenxUI'],
	$Locales: {URL: 'locales/{language}.json', Languages: ['en', 'ru', 'ar']}
});
