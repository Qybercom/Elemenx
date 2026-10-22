<!-- generated -->
# Tabs

Полоса вкладок. Tabs: [{ID, Label, Icon, Badge, Closable, Disabled}]; Value — ID активной вкладки. Variant: line (подчёркивание, по умолчанию), pill (скруглённые кнопки) или editor (вкладки файлов редактора). У вкладки с Closable (или у каждой при Closable на полосе) есть крестик; закрывают её и средняя кнопка мыши, Delete и Ctrl+W. Клавиши: стрелки, Home и End переходят между вкладками. Содержимое активной вкладки рисует владелец; содержимое слота по умолчанию идёт после вкладок (действие, кнопка добавления вкладки). Size; Label называет полосу для экранных читалок. События: change (ID), close (ID).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Tabs` | `[]` |
| `Value` | `null` |
| `Variant` | `'line'` |
| `Size` | `'medium'` |
| `Closable` | `false` |
| `Label` | `''` |

## События

`change`, `close`

## Слоты

по умолчанию

## Пример

```example
<Tabs [tabs]="Tabs" [value]="Current" (change)="Changed" />
<div class="elemenx-text" style="padding: 12px 0;">{{Texts[Current]}}</div>
<Tabs Variant="pill" [tabs]="Tabs" [value]="Current" Size="small" (change)="Changed" />
<Tabs Variant="editor" [tabs]="Files" [value]="File" Closable="true" (change)="Opened" (close)="Closed">
	<Button Icon="add" Title="A new file" Size="small" Variant="ghost" (click)="Add" />
</Tabs>
<script>
({
	Current: 'general',
	Tabs: [{ID: 'general', Label: 'General', Icon: 'settings'}, {ID: 'billing', Label: 'Billing', Badge: 2}, {ID: 'team', Label: 'Team'}, {ID: 'admin', Label: 'Admin', Disabled: true}],
	Texts: {general: 'The name and the language of the workspace.', billing: 'Two invoices are waiting.', team: 'Eight people.'},
	File: 'app.js',
	Files: [{ID: 'app.js', Label: 'app.js'}, {ID: 'index.html', Label: 'index.html'}, {ID: 'style.css', Label: 'style.css'}],
	Count: 1,

	Changed: function (id) {
		this.Current = id;
	},

	Opened: function (id) {
		this.File = id;
	},

	Closed: function (id) {
		this.Files = this.Files.filter(function (file) {
			return file.ID !== id;
		});

		if (this.File === id && this.Files.length)
			this.File = this.Files[0].ID;
	},

	Add: function () {
		var name = 'new-' + this.Count++ + '.js';

		this.Files = this.Files.concat([{ID: name, Label: name}]);
		this.File = name;
	}
})
</script>
```
