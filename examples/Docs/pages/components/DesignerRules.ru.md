<!-- generated -->
# DesignerRules

Правила CSS выбранного элемента конструктора страниц (сервис Designer) по контексту: кому (этому элементу, всем элементам его вида или тем, что внутри элемента вида вокруг него), когда (всегда, :hover, :focus-visible, :active, :disabled), где (любая ширина, планшет, телефон) и в какой схеме (обе, светлая, тёмная). Свойства правила этого контекста — строки из имени и значения (токены темы вроде var(--elemenx-accent) предлагаются в подсказках); добавленное свойство создаёт правило, удаление последнего убирает его. Правила, которые действуют на элемент в других контекстах, перечислены ниже, нажатие переходит к правилу. Правила попадают в шаблон как <style>.

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
