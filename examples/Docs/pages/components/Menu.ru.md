<!-- generated -->
# Menu

Кнопка, открывающая многоуровневый MenuList. Items, а после них пункты, объявленные дочерними MenuItem (MenuItem с вложенными MenuItem — подменю). Событие select несёт выбранный конечный пункт (объявленный пункт отправляет select и на своём MenuItem). Sheet: true или 'auto' (на узком или сенсорном экране) показывает список листом снизу экрана, как на телефоне. Caret false убирает стрелку у подписи кнопки.

Menu — это кнопка и открываемое ею меню; MenuList — один уровень меню сам по себе (список, его подменю, его лист): из него сделаны Menu, ContextMenu и лента Ribbon, и его можно поставить под любым своим элементом.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Label` | `''` |
| `Icon` | `''` |
| `Title` | `''` |
| `Variant` | `'secondary'` |
| `Size` | `'medium'` |
| `Placement` | `'bottom-start'` |
| `Sheet` | `false` |
| `Caret` | `true` |
| `Disabled` | `false` |
| `Open` | `false` |

## События

- `select`: Выбран конечный пункт: сам пункт.

## Слоты

по умолчанию

## Пример

```example
<div class="elemenx-container" style="gap: 8px;">
	<Menu Label="Edit" Icon="edit" (select)="Chose">
		<MenuItem ID="undo" Label="Undo" Icon="undo" Shortcut="Ctrl+Z" />
		<MenuItem ID="redo" Label="Redo" Icon="redo" Shortcut="Ctrl+Y" Disabled="true" />
		<MenuItem Separator="true" />
		<MenuItem ID="paste" Label="Paste special" Icon="paste">
			<MenuItem ID="text" Label="Text only" />
			<MenuItem ID="html" Label="With formatting" />
		</MenuItem>
		<MenuItem ID="wrap" Label="Word wrap" [checked]="Wrap" />
		<MenuItem Separator="true" />
		<MenuItem ID="delete" Label="Delete" Icon="delete" Danger="true" />
	</Menu>
	<Menu Label="Sheet" Sheet="true" [items]="[{ID: 'share', Label: 'Share', Icon: 'share'}, {ID: 'copy', Label: 'Copy the link', Icon: 'link'}]" (select)="Chose" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'Open a menu; the arrows move, Right opens a submenu.',
	Wrap: false,

	Chose: function (item) {
		if (item.ID === 'wrap')
			this.Wrap = !this.Wrap;

		this.Note = 'Chosen: ' + item.Label;
	}
})
</script>
```

## Тесты

- [Menu: its first item](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/focus-on-open.test.js#L74) — `tests/regression/focus-on-open.test.js`
- [Menu lets its owner take it away in its select (a sign out) without an error](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-overlays.test.js#L211) — `tests/regression/library-overlays.test.js`
- [a drawer is a side menu from either side, and drawers stack: Escape closes the top one](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L8122) — `tests/examples/ui-kit.spec.js`
