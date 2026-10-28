<!-- generated -->
# CommitGraph

История репозитория так, как её рисует git: Commits — коммиты от новых к старым, как их выдаёт git log ([{ID, Parents: [ID], Message, Author, Date, Refs: [{Name, Kind: branch, remote, tag или head}]}]), каждый на дорожке своего цвета; слияние сводит дорожки, ветка начинает новую. Дорожки раскладываются один раз для всего списка, как это делает git log --graph.
- Layout list (по умолчанию): строка на каждый коммит, слева его граф, затем ссылки, сообщение, автор, дата и короткий ID (Columns — какие из message, author, date и id показывать). Height — высота списка в пикселях: в странице только видимые строки, поэтому история из тысяч коммитов прокручивается; auto показывает все.
- Layout scheme: история поперёк, старые слева, у каждой ветки своя дорожка, её имя в начале (ссылки её вершины), коммиты — точки со ссылками над ними (ShowMessages пишет под ними сообщения), как рисуют схемы git-flow.
Selected — ID выбранного коммита: выбирают нажатие, стрелки, Home и End; Enter или двойное нажатие открывает его. События: select (коммит), open (коммит).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Commits` | `[]` |
| `Layout` | `'list'` |
| `Selected` | `null` |
| `Columns` | `['message', 'author', 'date', 'id']` |
| `Height` | `360` |
| `ShowMessages` | `false` |
| `Label` | `''` |

## События

- `open`
- `select`

## Пример

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
