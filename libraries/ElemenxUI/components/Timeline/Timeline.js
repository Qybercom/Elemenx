/*
 * An activity timeline, like the activity of a merge request. Items: [{ID, Icon, Variant, Author, Action, Time, Text,
 * Element, Render, Size}]: Variant (default, accent, info, success, warning, danger) colors the node; Text is a body
 * under the line (a comment); Element or Render(container, item) give it custom content. Size 'small' makes a minor
 * event (a label added, a commit pushed): a small node, a dot when the item has no Icon, and a smaller line of text.
 * Compact tightens the spacing.
 */
Elemenx.Component('Timeline', {
	$TemplateURL: 'Timeline.html',
	$StyleURL: 'Timeline.css',
	Items: [],
	Compact: false
});