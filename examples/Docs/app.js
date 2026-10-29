/*
 * The Docs of Elemenx, built with ElemenxUI: a page for every part of the framework and of the Library, with a
 * description and examples that run beside their code. The pages are Markdown files, one for each language:
 * pages/<section>/<page>.<language>.md (English and Russian); a page missing in a language shows its English one.
 */
/* The examples of the cache keep the instances a template marks (*keep, $KeepAlive). */
Elemenx.Cache({Instances: {Scope: 'marked'}});

Elemenx.Application('ElemenxDocs', {
	$Title: 'Elemenx Docs',
	$Component: 'DocsLayout',
	$Root: 'application',
	$Mount: 'body',
	$Use: ['ElemenxUI'],
	$Locales: {URL: 'locales/{language}.json', Languages: ['en', 'ru']},
	$Router: {
		NotFound: 'DocsPage',
		Routes: [
			{Path: '/', Component: 'DocsPage'},
			{Path: '/:section/:page', Component: 'DocsPage'}
		]
	}
});
