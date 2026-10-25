<!-- generated -->
# DesignerCanvas

The canvas of a designer of pages (the Designer Service): the page of the document running as a component of its own (made again on every change), at the width of a desktop, a tablet or a phone (Width). A layer over it takes the pointer, so the components of the page stay still while they are built: it marks the element under the pointer and the selected one, selects what is pressed, and takes the kinds of a DesignerPalette dropped on it and the elements moved by the grip of the selection, with a line where they go and words that say it (In Screen, after Row). Near the edge of a container a drop goes beside it, in its parent; Shift held takes it one level up. Shift held without a drag measures, as the designers of pictures do: from the selected element to the one under the pointer (to the sides of the one around it, when that is under the pointer), or to the edges of the canvas when the pointer is on it or on nothing (the element under the pointer to them, with nothing selected). A press on a tab of a component of declared children (Tabs, Ribbon) selects the child it shows, and the canvas shows the child the selection is in. While a drag goes on, a bar over the canvas names the container the drop goes into and those around it: a drop on one of them puts the element at its end, whatever the edges. The canvas is the body of the page: as high as the room it has (a screen with Sizing fill fills it), as wide as Width says. Outlines draws the frame of every container, Gaps gives the containers without a padding of their own some room to drop into (8 pixels); neither is in the page. Preview takes the layer away, the outlines and the places to drop with it: the page works as it will. Inspect (in a preview) shows the box of the element under the pointer as the tools of a browser do: its margin, its padding, its size; a press keeps one, and Shift held measures the distance from it to the one under the pointer (to the edges of the canvas without one). Lines draws the outlines in a preview too. Rulers (Ruler) run along the top and the side of the canvas, the pointer and the selected element marked on them. Empty is the text of an empty container (the phrase of the language of the page by default). Events: select (the ID of an element, or null), drop ({Kind or Node, Parent, Index, ID}).

## Properties

| Property | Default |
| --- | --- |
| `Width` | `'desktop'` |
| `Preview` | `false` |
| `Outlines` | `true` |
| `Gaps` | `true` |
| `Inspect` | `false` |
| `Lines` | `false` |
| `Rulers` | `true` |
| `Empty` | `''` |
| `Note` | `''` |

## Events

`select`, `drop`

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
