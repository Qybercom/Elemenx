<!-- generated -->
# MenuBar

Полоса меню, как вверху окна программы: File, Edit, View... Items — меню ([{ID, Label, Icon, Disabled, Items}]), а после них — объявленные дочерними MenuItem (MenuItem с вложенными MenuItem — меню полосы, его MenuItem — пункты этого меню). Ведёт себя как полоса программы: пока одно меню открыто, наведение на другое открывает его вместо текущего; стрелки влево и вправо переходят от меню к меню (и между кнопками закрытой полосы), стрелка вниз открывает меню; F10 или одиночный Alt переводят фокус на первое меню первой полосы страницы и возвращают его обратно. Caret показывает стрелку у подписи меню (по умолчанию её нет, как в программах). Место, фон и рамку полосе даёт разметка вокруг неё. Событие select несёт выбранный конечный пункт (объявленный пункт отправляет select и на своём MenuItem).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Variant` | `'ghost'` |
| `Size` | `'small'` |
| `Caret` | `false` |
| `Disabled` | `false` |

## События

- `select`: Выбран конечный пункт меню: сам пункт.

## Слоты

по умолчанию

## Пример

```example
<MenuBar (select)="Selected">
	<MenuItem Label="File">
		<MenuItem ID="new" Label="New" Shortcut="Ctrl+N" />
		<MenuItem ID="open" Label="Open..." Shortcut="Ctrl+O" />
		<MenuItem Separator="true" />
		<MenuItem ID="quit" Label="Quit" Danger="true" />
	</MenuItem>
	<MenuItem Label="Edit">
		<MenuItem ID="copy" Label="Copy" Shortcut="Ctrl+C" />
		<MenuItem Label="Paste special">
			<MenuItem ID="paste-text" Label="Text only" />
		</MenuItem>
	</MenuItem>
	<MenuItem Label="Help">
		<MenuItem ID="about" Label="About" />
	</MenuItem>
</MenuBar>
<p class="elemenx-text small muted">Chosen: {{Chosen}}</p>
<script>
({
	Chosen: 'nothing yet',

	Selected: function (item) {
		this.Chosen = item.Label;
	}
})
</script>
```
