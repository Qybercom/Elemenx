<!-- generated -->
# DesignerInspector

The selected element of a designer of pages (the Designer Service), in blocks of their own: on top its layout, what every element has (DesignerStyle: its box, its sizes, its flex), its rules of CSS by their context (DesignerRules; Style false leaves both out), then its props, what its kind has: a field for each prop (a text, a number, a switch, a choice, the modifiers of its class, an expression of JavaScript), with the description its Component declares in $Meta as the hint; its slot in its parent and its text when its kind has one. A list prop whose $Meta gives the Schema of its items is a list of them, each a row of fields, that adds, moves and removes items ({ } edits it as an expression again). A component of declared children (Tabs and Tab) has a button to add each kind of them. The actions on the element: up and down among its siblings, its parent, a copy, removal. Every change goes to the Designer at once. A prop its Component declares Body (the Value of a Markdown) is a field of many lines. With no element selected, a component or an application shows the document being edited (DesignerDocument). Events: select (the element selected after an action, or null).

## Properties

| Property | Default |
| --- | --- |
| `Style` | `true` |

## Events

- `select`: Another element was selected from it (its parent): its ID, or null.

## Example

```example
<style>
	.designer-demo {
		display: grid;
		grid-template-columns: 240px minmax(0, 1fr) 260px;
		gap: 8px;
		height: 520px;
	}

	.designer-demo-side {
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: auto;
		border: 1px solid var(--elemenx-border);
		border-radius: var(--elemenx-radius);
	}

	.designer-demo-tree {
		flex: 0 0 auto;
		max-height: 180px;
		overflow: auto;
		border-bottom: 1px solid var(--elemenx-border);
	}

	.designer-demo-canvas {
		display: flex;
		min-width: 0;
	}
</style>
<div class="designer-demo">
	<div class="designer-demo-side">
		<div class="designer-demo-tree"><DesignerTree /></div>
		<DesignerPalette />
	</div>
	<div class="designer-demo-canvas"><DesignerCanvas Width="desktop" /></div>
	<div class="designer-demo-side"><DesignerInspector /></div>
</div>
<Button Icon="code" Size="small" Label="Template" (click)="Show" />
<CodeView *if="Code" Language="html" Fold="true" [value]="Code" />
<script>
({
	Code: '',

	/* A first page, when the Designer has none yet (it keeps its document in the storage of the browser). */
	$OnCreate: function () {
		var designer = this.$Service('Designer');

		designer.Load(function (error) {
			if (!error && !designer.Count())
				designer.Import('<div class="elemenx-column" style="padding: 16px">\n\t<h2>Sign in</h2>\n\t<Field Label="Email"><Input Placeholder="ada@example.com" /></Field>\n\t<Button Label="Continue" Variant="primary" />\n</div>');
		});
	},

	Show: function () {
		this.Code = this.$Service('Designer').Template();
	}
})
</script>
```
