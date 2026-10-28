<!-- generated -->
# Panels

The panels a component declares in its template, as the tabs of a Tabs (Tab) and of a Ribbon (RibbonTab): a child component renders an element of a class (its panel) whose data-* attributes describe it, and the owner reads them. Read(root, selector, owner) returns the panels of root (an element of selector inside it, not inside another element of the owner selector inside it: the panels of a nested Tabs are its own). Data(panel) gives the data-* attributes of a panel as {Name: text}, the names in PascalCase (data-key-tip is KeyTip). Watch(root, selector, callback) calls back whenever a panel comes, goes or one of its data-* attributes changes, once a frame at most, and returns the function that stops it.

## Methods

- `Read(root, selector, owner)`
- `Data(panel)`
- `Watch(root, selector, callback)`

## Example

```example
<div #Root>
	<div class="docs-panel" data-id="general" data-label="General" data-key-tip="G"></div>
	<div class="docs-panel" data-id="privacy" data-label="Privacy"></div>
	<div class="docs-panel" *if="Extra" data-id="advanced" data-label="Advanced"></div>
</div>
<Button [label]="Extra ? 'Take a panel away' : 'Add a panel'" (click)="Toggle" />
<ul>
	<li *for="panel of Found">{{panel.Label}} ({{panel.Id}}){{panel.KeyTip ? ', key tip ' + panel.KeyTip : ''}}</li>
</ul>
<p class="elemenx-text small muted">What Tabs and Ribbon do with their Tab and RibbonTab: the children render elements whose data-* attributes describe them, and the owner reads them, and hears them change.</p>
<script>
({
	Extra: false,
	Found: [],

	$OnReady: function () {
		var self = this;
		var panels = this.$Service('Panels');

		function read () {
			self.Found = panels.Read(self.$Ref('Root'), '.docs-panel').map(function (panel) {
				return panels.Data(panel);
			});
		}

		read();

		this.Unwatch = panels.Watch(this.$Ref('Root'), '.docs-panel', read);
	},

	$OnDestroy: function () {
		if (this.Unwatch) this.Unwatch();
	},

	Toggle: function () {
		this.Extra = !this.Extra;
	}
})
</script>
```

## Tests

- [Panels: reads the panels of a root but not those of a nested owner, their data-* attributes, and hears them change](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L179) — `tests/regression/library-services.test.js`
