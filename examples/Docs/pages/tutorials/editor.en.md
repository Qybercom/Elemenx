# An editor in the manner of an IDE

An editor of code: the files of a project in a tree, each open file in a tab over a code editor, a terminal under them, a palette of commands, and panels that resize and remember their size. The finished project is `examples/Tutorials/Editor`.

What you learn: the frame of `Workspace` and its tool windows, `Tree`, `Tabs`, `CodeEditor`, `Terminal`, `CommandPalette` and a hotkey, and drafts kept apart from the saved files.

## 1. The frame

`Workspace` places what its slots hold: a toolbar on top, tool windows on the left, the right and the bottom, the main area, and a status bar. The edge of a panel resizes it; `Persist` remembers the sizes in the browser.

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

An area shows while its slot has something: `*if="Terminal"` opens and closes the bottom panel. `*hotkey="'Mod+S'"` presses the button on Ctrl+S (Cmd+S on a Mac); `Mod+K` opens the palette.

## 2. Files and drafts

The `Files` Service keeps the files in the storage of the browser. The component keeps what is typed apart, in `Drafts`, until it is saved: a tab with a draft is marked, and the editor shows the draft.

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

A new object each time (`Object.assign({}, ...)`) is a change the template sees.

## 3. The editor

`CodeEditor` is a real `<textarea>` under a layer that draws the code highlighted by the `Syntax` Service: typing, the undo of the browser, screen readers and the keyboards of phones work as in any field. `Pairs` closes brackets and quotes, `ActiveLine` marks the line of the caret. Mod+F finds and Mod+R replaces in it (a `FindBar`); `Markers` underline errors, and `Complete` offers completions.

## 4. The terminal

`Terminal` shows its `Lines` and tells each command; the Application answers:

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

Arrow Up and Down walk its history; Ctrl+L clears it.

## 5. The palette

The commands are data: an ID, a label, a group, an icon, the keys shown beside it. The palette finds them by the letters of the query in their order, and tells the one chosen:

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

## Next

- An office application under a ribbon: `Ribbon`, `RibbonTab`, `RibbonGroup` and `Workspace Variant="ribbon"` (see the visual [builder](/guide/builder)).
- [A desktop program](/tutorials/desktop): the studio as a program.
