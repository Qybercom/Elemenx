<!-- generated -->
# Chronicle

The chronicle of an activity, like the activity of a merge request (Timeline is the line of time). Items: [{ID, Icon, Variant, Author, Action, Time, Text, Element, Render, Size}]: Variant (default, accent, info, success, warning, danger) colors the node; Text is a body under the line (a comment); Element or Render(container, item) give it custom content. Size 'small' makes a minor event (a label added, a commit pushed): a small node, a dot when the item has no Icon, and a smaller line of text. Compact tightens the spacing.

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Compact` | `false` |

## Example

```example
<Chronicle [items]="Items" />
<Button Label="Approve" Icon="check" Size="small" (click)="Approve" />
<script>
({
	Items: [
		{ID: 1, Icon: 'branch', Author: 'Ada', Action: 'opened this merge request', Time: '9:00'},
		{ID: 2, Author: 'Alan', Action: 'added the label ui', Time: '9:12', Size: 'small'},
		{ID: 3, Icon: 'comment', Author: 'Alan', Action: 'commented', Time: '11:30', Text: 'Looks good; can the list keep its scroll on reload?'},
		{ID: 4, Author: 'Ada', Action: 'pushed 2 commits', Time: '13:05', Size: 'small', Variant: 'info'},
		{ID: 5, Icon: 'warning', Author: 'CI', Action: 'failed on the e2e tests', Time: '13:20', Variant: 'danger'}
	],

	Approve: function () {
		this.Items = this.Items.concat([{ID: this.Items.length + 1, Icon: 'check', Author: 'You', Action: 'approved', Time: 'now', Variant: 'success'}]);
	}
})
</script>
```

## Tests

- [Chronicle lists its events in order with their author, action and time, small ones as dots](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-misc.test.js#L171) — `tests/regression/library-misc.test.js`
