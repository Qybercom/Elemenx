<!-- generated -->
# Tabs

Полоса вкладок. Tabs: [{ID, Label, Icon, Badge, Closable, Disabled}]; Value — ID активной вкладки. Variant: line (подчёркивание, по умолчанию), pill (скруглённые кнопки) или editor (вкладки файлов редактора). У вкладки с Closable (или у каждой при Closable на полосе) есть крестик; закрывают её и средняя кнопка мыши, Delete и Ctrl+W. Клавиши: стрелки, Home и End переходят между вкладками. Содержимое активной вкладки рисует владелец; содержимое слота по умолчанию идёт после вкладок (действие, кнопка добавления вкладки). Size; Label называет полосу для экранных читалок. Вкладки можно объявить и в шаблоне, вместе с содержимым: <Tab ID="general" Label="Общие">...</Tab> в слоте по умолчанию (см. Tab). Их вкладки идут в полосе после вкладок Tabs, а Tabs показывает под полосой содержимое текущей (первой не Disabled, пока Value ни на какую не указывает). Orientation vertical ставит полосу сбоку от содержимого, Placement left (по умолчанию) или right, а текст вкладок повёрнут набок (слева читается снизу вверх, справа — сверху вниз, как окна инструментов редактора); Rotate false оставляет его горизонтальным (список разделов, как в настройках). Клавиши тогда — вверх и вниз.
События: change (ID), close (ID).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Tabs` | `[]` |
| `Value` | `null` |
| `Variant` | `'line'` |
| `Size` | `'medium'` |
| `Closable` | `false` |
| `Orientation` | `'horizontal'` |
| `Placement` | `'left'` |
| `Rotate` | `true` |
| `Label` | `''` |

## События

- `change`: Открыта другая вкладка: её ID.
- `close`: Вкладка просит закрыться (крестик, средняя кнопка, Delete или Ctrl+W): её ID.

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
<div class="docs-row" style="align-items: stretch; margin-top: 16px;">
	<Tabs Orientation="vertical" [value]="Tool" (change)="Tooled">
		<Tab ID="project" Label="Project" Icon="folder">The files of the project.</Tab>
		<Tab ID="commit" Label="Commit" Icon="commit">Two changes to commit.</Tab>
		<Tab ID="search" Label="Search" Icon="search">Find in the files.</Tab>
	</Tabs>
	<Tabs Orientation="vertical" Placement="right" Variant="pill" [tabs]="Tabs" [value]="Current" (change)="Changed" />
	<Tabs Orientation="vertical" Rotate="false" Variant="pill" [tabs]="Tabs" [value]="Current" (change)="Changed" />
</div>
<script>
({
	Current: 'general',
	Tabs: [{ID: 'general', Label: 'General', Icon: 'settings'}, {ID: 'billing', Label: 'Billing', Badge: 2}, {ID: 'team', Label: 'Team'}, {ID: 'admin', Label: 'Admin', Disabled: true}],
	Texts: {general: 'The name and the language of the workspace.', billing: 'Two invoices are waiting.', team: 'Eight people.'},
	File: 'app.js',
	Files: [{ID: 'app.js', Label: 'app.js'}, {ID: 'index.html', Label: 'index.html'}, {ID: 'style.css', Label: 'style.css'}],
	Count: 1,
	Tool: 'project',

	Tooled: function (id) {
		this.Tool = id;
	},

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

## Тесты

- [stands the strip left or right of the panels, its text turned or level, and moves by Up and Down](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tabs.test.js#L37) — `tests/regression/library-tabs.test.js`
- [declares the tabs of a Tabs as its children: adds them, shows the one selected on the canvas and exports them](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L470) — `tests/examples/designer.spec.js`
- [a right-to-left language mirrors the components: arrows, sliders, popups and the icons of a direction](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L322) — `tests/examples/ui-kit.spec.js`
- [tabs declared with their content show the panel of the current one, and make the component of a tab when it first opens](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4254) — `tests/examples/ui-kit.spec.js`
- [editor tabs switch and close](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4307) — `tests/examples/ui-kit.spec.js`
- [radio groups and tab strips with their own state do not affect each other](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4368) — `tests/examples/ui-kit.spec.js`
- [keeps nested templates inside the text and finds the end of the outer one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/server.test.js#L405) — `tests/regression/server.test.js`
