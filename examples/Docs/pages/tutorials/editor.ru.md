<!-- generated -->
# Редактор в стиле IDE

Редактор кода: файлы проекта в дереве, каждый открытый файл во вкладке над редактором кода, терминал под ними, палитра команд и панели, которые меняют размер и запоминают его. Готовый проект — `examples/Tutorials/Editor`.

Чему вы научитесь: каркас `Workspace` и его панели инструментов, `Tree`, `Tabs`, `CodeEditor`, `Terminal`, `CommandPalette` и горячая клавиша, черновики отдельно от сохранённых файлов.

## 1. Каркас

`Workspace` расставляет то, что лежит в его слотах: панель инструментов сверху, панели слева, справа и снизу, основную область и строку состояния. Край панели меняет её размер; `Persist` запоминает размеры в браузере.

```html
<Workspace Persist="studio">
	<WorkspaceToolbar slot="header" Label="Toolbar">
		<strong>Studio</strong>
		<span class="elemenx-divider vertical"></span>
		<Button Icon="save" Title="Save (Mod+S)" Variant="ghost" Size="small" *hotkey="'Mod+S'" (click)="Save" />
		<Button Icon="terminal" Title="Terminal" Variant="ghost" Size="small" [pressed]="Terminal" (click)="Toggle" />
		<span class="elemenx-spacer"></span>
		<ThemeSwitch Compact="true" Size="small" />
	</WorkspaceToolbar>
	<WorkspaceToolWindow slot="left" Title="Project" Icon="folder">
		<Tree [items]="Tree" [value]="Current" [expanded]="['src/', 'styles/']" Label="Files" (select)="Picked" />
	</WorkspaceToolWindow>
	<div slot="main" class="elemenx-column fill studio-main">
		<Tabs Variant="editor" [tabs]="Tabs(Open, Drafts)" [value]="Current" Label="Open files" (change)="Switched" (close)="Closed" />
		<div class="studio-code" *if="Current"><CodeEditor [value]="Text(Current, Drafts)" [language]="Language(Current)" LineNumbers="true" ActiveLine="true" Pairs="true" Label="Code" (input)="Edited" /></div>
		<EmptyState *if="!Current" Title="No file open" Description="Open a file from the tree, or press Mod+K." />
	</div>
	<WorkspaceToolWindow slot="bottom" *if="Terminal" Title="Terminal" Icon="terminal" Closable="true" (close)="Toggle">
		<Terminal [lines]="Lines" (command)="Ran" (clear)="Cleared" />
	</WorkspaceToolWindow>
	<span slot="status">{{Current || 'No file'}} · {{Current ? Language(Current) : ''}}</span>
</Workspace>
<CommandPalette [commands]="Commands" (run)="Command" />
```

Область показывается, пока в её слоте что-то есть: `*if="Terminal"` открывает и закрывает нижнюю панель. `*hotkey="'Mod+S'"` нажимает кнопку по Ctrl+S (Cmd+S на Mac); `Mod+K` открывает палитру.

## 2. Файлы и черновики

Сервис `Files` хранит файлы в хранилище браузера. Компонент держит набранное отдельно, в `Drafts`, пока его не сохранят: вкладка с черновиком отмечена, а редактор показывает черновик.

```js
this.Tabs = function (open, drafts) {
	return open.map(function (name) {
		return {ID: name, Label: name.split('/').pop() + (Object.prototype.hasOwnProperty.call(drafts, name) ? ' •' : ''), Closable: true};
	});
};

this.Text = function (name, drafts) {
	return Object.prototype.hasOwnProperty.call(drafts, name) ? drafts[name] : files.Read(name);
};
```

```js
Edited: function (text) {
	var drafts = Object.assign({}, this.Drafts);

	drafts[this.Current] = text;
	this.Drafts = drafts;
},

Save: function () {
	var drafts = Object.assign({}, this.Drafts);

	if (!Object.prototype.hasOwnProperty.call(drafts, this.Current)) return;

	this.$Service('Files').Write(this.Current, drafts[this.Current]);

	delete drafts[this.Current];
	this.Drafts = drafts;

	this.Say('success', 'Saved ' + this.Current);
}
```

Каждый раз новый объект (`Object.assign({}, ...)`) — изменение, которое видит шаблон.

## 3. Редактор

`CodeEditor` — настоящий `<textarea>` под слоем, который рисует код с подсветкой сервиса `Syntax`: ввод, отмена браузера, экранные дикторы и клавиатуры телефонов работают как в любом поле. `Pairs` закрывает скобки и кавычки, `ActiveLine` отмечает строку курсора. Mod+F ищет, а Mod+R заменяет в нём (`FindBar`); `Markers` подчёркивают ошибки, а `Complete` предлагает дополнения.

## 4. Терминал

`Terminal` показывает свои `Lines` и сообщает о каждой команде; отвечает приложение:

```js
Ran: function (text) {
	var files = this.$Service('Files');
	var parts = text.trim().split(/\s+/);

	this.Say('input', text);

	if (parts[0] === 'help') this.Say('output', 'help · ls · cat <file> · clear');
	else if (parts[0] === 'ls') this.Say('output', files.Names().join('\n'));
	else if (parts[0] === 'cat' && files.Names().indexOf(parts[1]) !== -1) this.Say('output', files.Read(parts[1]));
	else if (parts[0] === 'clear') this.Lines = [];
	else this.Say('error', 'Unknown: ' + text);
}
```

Стрелки вверх и вниз листают историю; Ctrl+L очищает его.

## 5. Палитра

Команды — это данные: ID, подпись, группа, иконка, клавиши рядом. Палитра находит их по буквам запроса в их порядке и сообщает выбранную:

```js
this.Commands = files.Names().map(function (name) {
	return {ID: 'open:' + name, Label: 'Open ' + name, Group: 'Files', Icon: 'file-code'};
}).concat([
	{ID: 'save', Label: 'Save the file', Group: 'File', Icon: 'save', Keys: 'Mod+S'},
	{ID: 'terminal', Label: 'Show or hide the terminal', Group: 'View', Icon: 'terminal'}
]);
```

```js
Command: function (command) {
	if (command.ID.indexOf('open:') === 0) this.Show(command.ID.substring(5));
	else if (command.ID === 'save') this.Save();
	else if (command.ID === 'terminal') this.Toggle();
}
```

## Дальше

- Офисное приложение под лентой: `Ribbon`, `RibbonTab`, `RibbonGroup` и `Workspace Variant="ribbon"` (см. [Конструктор](/guide/designer)).
- [Десктоп-программа](/tutorials/desktop): студия как программа.
