<!-- generated -->
# Settings

Раскладка настроек, как в настройках IDE, на основе elemenx-screen, elemenx-container и elemenx-column. Слоты: nav (дерево разделов, часто NavList с поиском), по умолчанию (форма раздела), actions (справа от заголовка), footer (кнопки: ОК, Отмена, Применить). Path — путь к текущему разделу; его последняя часть — заголовок. Ширина навигации меняется перетаскиванием её края.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Path` | `[]` |
| `Description` | `''` |

## Слоты

`nav`, `actions`, по умолчанию, `footer`

## Пример

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

## Тесты

- [a settings menu goes into submenus and back, chooses, turns switches, finds rows on every level and follows the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L3632) — `tests/examples/ui-kit.spec.js`
