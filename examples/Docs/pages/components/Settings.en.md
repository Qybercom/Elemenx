<!-- generated -->
# Settings

A settings layout like the settings of an IDE, built on elemenx-screen, elemenx-container and elemenx-column. Slots: nav (the tree of sections, often a searchable NavList), default (the form of the section), actions (at the right of the title), footer (the buttons: OK, Cancel, Apply). Path is the trail of the current section; its last part is the title. The navigation is resized by its edge.

## Properties

| Property | Default |
| --- | --- |
| `Path` | `[]` |
| `Description` | `''` |

## Slots

`nav`, `actions`, default, `footer`

## Example

```example
<div class="docs-frame">
	<Settings [path]="['Editor', Page]" Description="Options of the code editor">
		<NavList slot="nav" [items]="Nav" [value]="Page" [expanded]="['editor']" Searchable="true" (select)="Picked" />
		<Button slot="actions" Icon="refresh" Title="Reset" Variant="ghost" Size="small" />
		<Field Label="Font size" Horizontal="true"><NumberInput Value="14" Min="8" Max="32" Suffix="px" /></Field>
		<Field Label="Show line numbers" Horizontal="true"><Toggle Checked="true" /></Field>
		<Button slot="footer" Label="Cancel" />
		<Button slot="footer" Label="OK" Variant="primary" />
	</Settings>
</div>
<script>
({
	Page: 'Font',
	Nav: [
		{ID: 'editor', Label: 'Editor', Icon: 'edit', Items: [
			{ID: 'Font', Label: 'Font'},
			{ID: 'Lines', Label: 'Lines'}
		]},
		{ID: 'Keymap', Label: 'Keymap', Icon: 'settings'}
	],

	Picked: function (item) {
		this.Page = item.ID;
	}
})
</script>
```

## Tests

- [a settings menu goes into submenus and back, chooses, turns switches, finds rows on every level and follows the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L3691) — `tests/examples/ui-kit.spec.js`
