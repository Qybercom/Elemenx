/*
 * An activity timeline, like the activity of a merge request. Items: [{ID, Icon, Variant, Author, Action, Time, Text,
 * Element, Render}]: Variant (default, accent, info, success, warning, danger) colors the node; Text is a body under
 * the line (a comment); Element or Render(container, item) give it custom content. Compact tightens the spacing.
 */
Elemenx.Component('Timeline', {
	$TemplateURL: 'Timeline.html',
	$StyleURL: 'Timeline.css',
	Items: [],
	Compact: false
});