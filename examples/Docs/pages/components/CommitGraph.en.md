<!-- generated -->
# CommitGraph

The history of a repository as git draws it: Commits, newest first as git log gives them ([{ID, Parents: [ID], Message, Author, Date, Refs: [{Name, Kind: branch, remote, tag or head}]}]), each in a lane of its own color; a merge joins its lanes, a branch leaves one. Lanes are laid out once for the whole list, as git log --graph does.

- Layout list (the default): a row for each commit, its graph on the left, then its refs, message, author, date and short ID (Columns: the ones shown, of message, author, date and id). Height is the height of the list in pixels: it shows the rows in view only, so a history of thousands scrolls; 'auto' shows them all.
- Layout scheme: the history across, oldest on the left, a lane for each branch, its name at its start (the refs of its tip), the commits as dots with their refs over them (ShowMessages writes the messages under them), as the schemes of git-flow draw it.

Selected is the ID of the commit chosen: a press, the arrows, Home and End choose; Enter or a double press opens it. Events: select (the commit), open (the commit).

## Properties

| Property | Default |
| --- | --- |
| `Commits` | `[]` |
| `Layout` | `'list'` |
| `Selected` | `null` |
| `Columns` | `['message', 'author', 'date', 'id']` |
| `Height` | `360` |
| `ShowMessages` | `false` |
| `Label` | `''` |

## Events

- `open`: A commit was opened (Enter, a double press): the commit.
- `select`: A commit was chosen: the commit.

## Example

```example
<div class="docs-stack">
	<CommitGraph [commits]="History" [selected]="Selected" Height="250" (select)="Chosen" (open)="Opened" />
	<CommitGraph Layout="scheme" ShowMessages="true" [commits]="History" [selected]="Selected" (select)="Chosen" />
	<p class="elemenx-text small muted">{{Said}}</p>
</div>
<script>
({
	Selected: 'm2',
	Said: 'Choose a commit; Enter or a double press opens it.',
	History: [
		{ID: 'm2', Parents: ['m1', 'h1'], Message: 'Merge hotfix/total', Author: 'Ada', Date: '2026-10-27', Refs: [{Name: 'main', Kind: 'branch'}, {Name: 'HEAD', Kind: 'head'}]},
		{ID: 'h1', Parents: ['m1'], Message: 'Fix the total of the cart', Author: 'Grace', Date: '2026-10-26', Refs: [{Name: 'hotfix/total', Kind: 'branch'}]},
		{ID: 'm1', Parents: ['c3', 'f2'], Message: 'Merge feature/login', Author: 'Ada', Date: '2026-10-25', Refs: [{Name: 'v1.1', Kind: 'tag'}]},
		{ID: 'f2', Parents: ['f1'], Message: 'Remember the user', Author: 'Grace', Date: '2026-10-24', Refs: [{Name: 'feature/login', Kind: 'branch'}, {Name: 'origin/feature/login', Kind: 'remote'}]},
		{ID: 'c3', Parents: ['c2'], Message: 'The footer', Author: 'Ada', Date: '2026-10-23'},
		{ID: 'f1', Parents: ['c2'], Message: 'The login form', Author: 'Grace', Date: '2026-10-22'},
		{ID: 'c2', Parents: ['c1'], Message: 'The first page', Author: 'Ada', Date: '2026-10-21', Refs: [{Name: 'v1.0', Kind: 'tag'}]},
		{ID: 'c1', Parents: [], Message: 'First commit', Author: 'Ada', Date: '2026-10-20'}
	],

	Chosen: function (commit) {
		this.Selected = commit.ID;
		this.Said = commit.ID + ': ' + commit.Message;
	},

	Opened: function (commit) {
		this.Said = 'Opened ' + commit.ID;
	}
})
</script>
```

## Tests

- [CommitGraph lays its lanes out as git log --graph: a branch leaves a lane, a merge joins it, a lane goes on from row to row](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-graphs.test.js#L58) — `tests/regression/library-graphs.test.js`
- [CommitGraph chooses with a press and its keys, opens with Enter and a double press, and shows only the rows in view of a long history](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-graphs.test.js#L95) — `tests/regression/library-graphs.test.js`
- [CommitGraph as a list is as wide as its place, also in a column that does not stretch its items](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-graphs.test.js#L146) — `tests/regression/library-graphs.test.js`
- [CommitGraph as a scheme scrolls inside its place: it does not widen a column of a grid (a phone)](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-graphs.test.js#L156) — `tests/regression/library-graphs.test.js`
- [CommitGraph as a scheme: oldest on the left, a lane for each branch named by its tip, its refs over the dots](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-graphs.test.js#L166) — `tests/regression/library-graphs.test.js`
