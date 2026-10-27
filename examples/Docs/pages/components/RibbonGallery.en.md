<!-- generated -->
# RibbonGallery

A gallery of a RibbonGroup: a strip of samples (styles, layouts, colors) that scrolls row by row, and a button that shows all of them. Items: [{ID, Label, Icon, Preview, Style, Hint}]; a sample shows its Icon, or Preview (or its Label) in its Style ('font-weight: 700; color: #b4483f'); its tip (*tip) is its Label in bold and its Hint under it. Value is the chosen ID; Columns the samples in a row of the strip. Labels writes the Label of each sample under it in the strip too. Drag names a type of drags (*draggable): a sample pulled away is dragged with its ID as the Data, to where a *droppable of that type takes it (a canvas, a list). Events: select ({ID, Item}); the Ribbon reports it as command ({ID: the ID of the gallery, Item}).

## Properties

| Property | Default |
| --- | --- |
| `ID` | `''` |
| `Label` | `''` |
| `Items` | `[]` |
| `Value` | `null` |
| `Columns` | `4` |
| `Labels` | `false` |
| `Drag` | `''` |

## Events

- `select`: A sample was chosen: {ID, Item}.

## Example

```example
<p class="elemenx-text small">The gallery is the strip of samples in the group Styles: the arrows scroll it row by row, the last button opens all of them. A sample shows its Preview in its Style.</p>
<div class="docs-frame" style="height: 150px;">
	<Ribbon Collapsible="false">
		<RibbonTab ID="home" Title="Home">
			<RibbonGroup Title="Styles" Icon="color">
				<RibbonGallery ID="style" Label="Styles" Columns="3" [items]="Styles" [value]="Style" (select)="Chosen" />
			</RibbonGroup>
		</RibbonTab>
	</Ribbon>
</div>
<p class="elemenx-text" [attribute.style]="Current(Style).Style || null">The chosen style: {{Current(Style).Label}}</p>
<script>
({
	Style: 'heading',
	Styles: [
		{ID: 'normal', Label: 'Normal', Preview: 'AaBbCc'},
		{ID: 'heading', Label: 'Heading', Preview: 'AaBb', Style: 'font-size: 16px; font-weight: 600; color: var(--elemenx-info)'},
		{ID: 'title', Label: 'Title', Preview: 'Aa', Style: 'font-size: 20px'},
		{ID: 'quote', Label: 'Quote', Preview: 'AaBbC', Style: 'font-style: italic'},
		{ID: 'code', Label: 'Code', Preview: 'a = 1', Style: 'font-family: var(--elemenx-font-mono)'},
		{ID: 'strong', Label: 'Strong', Preview: 'AaBb', Style: 'font-weight: 700'}
	],

	/* What the template asks of the state: the sample of an ID. */
	$OnCreate: function () {
		var self = this;

		this.Current = function (style) {
			return self.Styles.filter(function (item) {
				return item.ID === style;
			})[0];
		};
	},

	Chosen: function (event) {
		this.Style = event.ID;
	}
})
</script>
```
