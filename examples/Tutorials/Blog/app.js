/*
 * A blog: the list of the posts (all of them, or those of a tag), a post written in Markdown, and the comments of a
 * post kept in the browser. The posts are files of data/: the list in posts.json, each post in posts/<id>.md.
 */
Elemenx.Application('Blog', {
	$Title: 'Field notes',
	$Component: 'Layout',
	$Root: 'Blog',
	$Mount: 'body',
	$Use: ['ElemenxUI'],
	$Router: {
		NotFound: 'NotFound',
		Routes: [
			{Path: '/', Component: 'PostList'},
			{Path: '/tag/:tag', Component: 'PostList'},
			{Path: '/post/:id', Component: 'PostPage'}
		]
	}
});
