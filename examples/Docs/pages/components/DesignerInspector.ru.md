<!-- generated -->
# DesignerInspector

Выбранный элемент конструктора страниц (сервис Designer) в независимых блоках: сверху его размещение — то, что есть у любого элемента (DesignerStyle: рамка, размеры, flex), затем его правила CSS по контексту (DesignerRules; Style false убирает оба блока), ниже его свойства — то, что есть у его вида: поле для каждого свойства (текст, число, переключатель, выбор, модификаторы класса, выражение JavaScript) с описанием, которое компонент объявляет в $Meta, в качестве подсказки; его слот в родителе и его текст, если у вида есть текст. Свойство-список, для элементов которого $Meta задаёт Schema, показывается списком элементов, каждый — строка полей, с добавлением, перемещением и удалением ({ } снова правит его как выражение). У компонента с объявленными детьми (Tabs и Tab) есть кнопка для добавления каждого их вида. Действия над элементом: выше и ниже среди соседей, родитель, копия, удаление. Свойство, которое компонент объявляет как Body (Value у Markdown и CodeView), правится в многострочном поле. Каждое изменение сразу идёт в Designer. Без выбранного элемента компонент или приложение показывает редактируемый документ (DesignerDocument). События: select (элемент, выбранный после действия, или null).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Style` | `true` |

## События

- `select`: Из него выбран другой элемент (родитель): его ID или null.

## Пример

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
