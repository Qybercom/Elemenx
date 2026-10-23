<!-- generated -->
# Tabs

A strip of tabs. Tabs: [{ID, Label, Icon, Badge, Closable, Disabled}]; Value is the ID of the active tab. Variant: line (an underline, the default), pill (rounded buttons) or editor (the tabs of the files of an editor). A Closable tab (or every tab, with Closable on the strip) has a cross; the middle button, Delete and Ctrl+W close it too. Keys: the arrows, Home and End move between the tabs. The owner renders the content of the active tab; content in the default slot goes after the tabs (an action, a button that adds a tab). Size; Label names the strip for screen readers. Tabs may be declared in the template too, with their content: <Tab ID="general" Label="General">...</Tab> in the default slot (see Tab). Their tabs follow the ones of Tabs in the strip, and the Tabs shows the content of the current one under the strip (the first tab that is not Disabled while Value names none). Events: change (the ID), close (the ID).

## Properties

| Property | Default |
| --- | --- |
| `Tabs` | `[]` |
| `Value` | `null` |
| `Variant` | `'line'` |
| `Size` | `'medium'` |
| `Closable` | `false` |
| `Label` | `''` |

## Events

`change`, `close`

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
