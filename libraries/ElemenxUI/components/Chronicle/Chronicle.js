/*
 * The chronicle of an activity, like the activity of a merge request (Timeline is the line of time). Items: [{ID, Icon, Variant, Author, Action, Time, Text,
 * Element, Render, Size}]: Variant (default, accent, info, success, warning, danger) colors the node; Text is a body
 * under the line (a comment); Element or Render(container, item) give it custom content. Size 'small' makes a minor
 * event (a label added, a commit pushed): a small node, a dot when the item has no Icon, and a smaller line of text.
 * Compact tightens the spacing.
 */
Elemenx.Component('Chronicle', {
	$TemplateURL: 'Chronicle.html',
	$StyleURL: 'Chronicle.css',
	$Meta: {
		Group: 'data',
		Icon: 'history',
		Description: 'The chronicle of an activity, like the activity of a merge request.',
		Props: {
			Items: {Schema: {ID: 'text', Icon: 'icon', Author: 'text', Action: 'text', Time: 'text', Variant: 'text'}, Description: 'The events: [{ID, Icon, Variant, Author, Action, Time, Text, Element, Render, Size}].'},
			Compact: 'Tighter spacing.'
		},
		Sample: {Items: [{ID: 1, Icon: 'edit', Author: 'Ada', Action: 'opened the request', Time: '9:00'}, {ID: 2, Icon: 'check', Author: 'Alan', Action: 'approved it', Time: '11:30', Variant: 'success'}]}
	},
	Items: [],
	Compact: false
});