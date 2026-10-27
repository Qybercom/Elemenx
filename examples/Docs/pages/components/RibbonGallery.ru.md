<!-- generated -->
# RibbonGallery

Галерея RibbonGroup: полоса образцов (стили, макеты, цвета), прокручиваемая по строке, и кнопка, показывающая их все. Items: [{ID, Label, Icon, Preview, Style, Hint}]; образец показывает свою Icon или Preview (или Label) в своём Style ('font-weight: 700; color: #b4483f'); его подсказка (*tip) — Label полужирным и Hint под ним. Value — выбранный ID; Columns — образцов в строке полосы. Labels подписывает каждый образец и в полосе. Drag называет тип перетаскивания (*draggable): образец, который потянули, перетаскивается с его ID в качестве Data туда, где его принимает *droppable этого типа (холст, список). События: select ({ID, Item}); лента сообщает его как command ({ID: ID галереи, Item}).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `Label` | `''` |
| `Items` | `[]` |
| `Value` | `null` |
| `Columns` | `4` |
| `Labels` | `false` |
| `Drag` | `''` |

## События

- `select`: Выбран образец: {ID, Item}.

## Пример

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
