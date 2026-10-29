<!-- generated -->
# CastList

The people of a title: its cast and its crew, Items [{ID, Name, Role, Image, Href}], each a photo (an Avatar of the name without one, or while it loads) with the name and the role under it. Layout row scrolls across (a shelf of people), grid fills the lines, list puts them one under another. Title names the list. A press opens a person (the open event); the arrow keys go from one to the next.

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Title` | `''` |
| `Layout` | `'row'` |
| `Label` | `''` |

## Events

- `open`: A person was pressed: the item.

## Example

```example
<div class="docs-stack">
	<RadioGroup Variant="segmented" [value]="Layout" [options]="Layouts" (change)="Laid" />
	<CastList Title="Cast" [items]="People" [layout]="Layout" (open)="Opened" />
	<p class="elemenx-text small muted">{{Note}}</p>
</div>
<script>
({
	Layout: 'row',
	Note: 'A person without a photo gets an avatar of the name.',
	Layouts: [{Value: 'row', Label: 'Row'}, {Value: 'grid', Label: 'Grid'}, {Value: 'list', Label: 'List'}],
	People: [
		{ID: 'ada', Name: 'Ada Lovelace', Role: 'Captain Mara Holt'},
		{ID: 'alan', Name: 'Alan Turing', Role: 'The keeper'},
		{ID: 'grace', Name: 'Grace Hopper', Role: 'Navigator'},
		{ID: 'linus', Name: 'Linus Pauling', Role: 'The stranger'},
		{ID: 'emmy', Name: 'Emmy Noether', Role: 'Director'},
		{ID: 'carl', Name: 'Carl Gauss', Role: 'Music'}
	],

	Laid: function (value) {
		this.Layout = value;
	},

	Opened: function (person) {
		this.Note = person.Name + ', ' + person.Role;
	}
})
</script>
```

## Tests

- [CastList, DiffView, MediaHero, MediaShelf and VideoTimeline are as wide as a column of flex-start](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/inline-size-width.test.js#L39) — `tests/regression/inline-size-width.test.js`
- [CastList: photos or avatars of the names, their roles, in a row, a grid or a list; a press opens a person](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-media.test.js#L432) — `tests/regression/library-media.test.js`
