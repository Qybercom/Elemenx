<!-- generated -->
# Tabs

A strip of tabs. Tabs: [{ID, Label, Icon, Badge, Closable, Disabled}]; Value is the ID of the active tab. Variant: line (an underline, the default), pill (rounded buttons) or editor (the tabs of the files of an editor). A Closable tab (or every tab, with Closable on the strip) has a cross; the middle button, Delete and Ctrl+W close it too. Keys: the arrows, Home and End move between the tabs. The owner renders the content of the active tab; content in the default slot goes after the tabs (an action, a button that adds a tab). Size; Label names the strip for screen readers. Tabs may be declared in the template too, with their content: <Tab ID="general" Label="General">...</Tab> in the default slot (see Tab). Their tabs follow the ones of Tabs in the strip, and the Tabs shows the content of the current one under the strip (the first tab that is not Disabled while Value names none). Orientation vertical stands the strip on a side of the content, Placement left (the default) or right, the text of its tabs turned on its side (read from the bottom up on the left, from the top down on the right, as the tool windows of an editor); Rotate false keeps it level (a list of sections, as in the settings). Its keys are then Up and Down. Events: change (the ID), close (the ID).

## Properties

| Property | Default |
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

## Events

- `change`: Another tab was opened: its ID.
- `close`: A tab asks to close (its cross, the middle button, Delete or Ctrl+W): its ID.

## Slots

default

## Example

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

## Tests

- [stands the strip left or right of the panels, its text turned or level, and moves by Up and Down](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tabs.test.js#L37) — `tests/regression/library-tabs.test.js`
- [declares the tabs of a Tabs as its children: adds them, shows the one selected on the canvas and exports them](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L470) — `tests/examples/designer.spec.js`
- [a right-to-left language mirrors the components: arrows, sliders, popups and the icons of a direction](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L322) — `tests/examples/ui-kit.spec.js`
- [tabs declared with their content show the panel of the current one, and make the component of a tab when it first opens](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4263) — `tests/examples/ui-kit.spec.js`
- [editor tabs switch and close](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4316) — `tests/examples/ui-kit.spec.js`
- [radio groups and tab strips with their own state do not affect each other](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4377) — `tests/examples/ui-kit.spec.js`
- [keeps nested templates inside the text and finds the end of the outer one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/server.test.js#L405) — `tests/regression/server.test.js`
