<!-- generated -->
# Breadcrumbs

The path to the present page: Items [{ID, Label, Icon, File, Href, Disabled, Class}], the last one the present page (aria-current="page", not pressed unless CurrentClickable). Icon names an Icon, File a FileIcon (by a file name). A press on an item emits select with {Item, Index}; an item with Href is a link (the Router follows it as any link of the page) and emits select too. Separator: chevron (the default), slash, arrow, dot, or a text of its own. Max (0: all) keeps the first item and the last Max - 1: the ones between are behind a "…" that lists them in a menu. The slots start and end stand before and after the path (a button, a status); Size small, medium or large.

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Separator` | `'chevron'` |
| `Max` | `0` |
| `Size` | `'medium'` |
| `Label` | `''` |
| `CurrentClickable` | `false` |

## Events

- `select`: An item was pressed, or chosen in the menu of the hidden ones: {Item, Index}.

## Slots

`start`, `end`

## Example

```example
<Breadcrumbs [items]="Path" (select)="Picked" />
<Breadcrumbs [items]="Long" Max="4" Separator="slash" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'Press a part of the path.',
	Path: [
		{ID: 'home', Label: 'Home', Icon: 'home'},
		{ID: 'docs', Label: 'Docs'},
		{ID: 'components', Label: 'Components'},
		{ID: 'page', Label: 'Breadcrumbs'}
	],
	Long: [
		{ID: 'root', Label: 'Disk C', Icon: 'database'},
		{ID: 'users', Label: 'Users'},
		{ID: 'ada', Label: 'ada'},
		{ID: 'projects', Label: 'Projects'},
		{ID: 'elemenx', Label: 'elemenx'},
		{ID: 'readme', Label: 'README.md', File: true}
	],

	Picked: function (event) {
		this.Note = 'Go to ' + event.Item.Label + ' (part ' + (event.Index + 1) + ')';
	}
})
</script>
```
