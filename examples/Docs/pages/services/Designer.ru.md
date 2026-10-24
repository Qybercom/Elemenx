<!-- generated -->
# Designer

Документ конструктора страниц, общий для его компонентов (DesignerPalette, DesignerCanvas, DesignerTree, DesignerInspector): дерево узлов под корнем (страницей), каждый — вид палитры со своими свойствами, текстом, размещением (Style) и детьми, и выбранный узел. Он меняется только своими методами; каждое изменение сохраняется в истории (Undo, Redo) и в хранилище браузера (StorageKey), а слушатели узнают о каждом изменении (OnChange).

- Виды — классы раскладок ElemenxUI (экран, строка, заголовок, таблица...) с их модификаторами в виде полей и каждый компонент библиотеки по тому, что он объявляет в $Meta: data/meta.json библиотеки, который делает elemenx meta. Load(callback) читает его один раз (Ready() говорит, что он на месте); Use(meta) даёт его вместо этого.
- Узел — {ID, Kind, Props, Text, Slot, Style, Children}: Slot — именованный слот родителя, куда он попадает ("" — слот по умолчанию); Style хранит его размещение (padding, margin, размер с наименьшим и наибольшим, а во flex-контейнере ещё направление, перенос, align-items, justify-content и gap), которое задаётся в строке: у его элемента или у div вокруг компонента. SetStyle(id, property, value) задаёт одно из свойств Layout.
- Компонент, чьи $Meta называют его детей (Children: Tab в Tabs), держит их как узлы: вставленный ребёнок получает ID и имя (tab-2, Tab 2), а на холсте компонент показывает того ребёнка, в котором находится выделение (своё свойство Current).
- Literal(value) записывает значение как исходный код выражения ({ID: 'a'}); Parse(expression) читает его обратно.
- Kinds() перечисляет виды по группам; Kind(id) — один вид: {ID, Group, Icon, Tag, Component, Container, Flex, Text, Description, Props (первые значения), Fields ([{Name, Type, Options, Default, Description}]), Slots}. Label(kind) и GroupLabel(group) называют их на языке страницы; Slots(id) — именованные слоты родителя узла.
- Insert(kind, parent, index), Move(id, parent, index), Remove(id), Duplicate(id), Set(id, name, value), SetStyle(id, property, value), Clear(); Select(id) и Selected() — для выбранного узла.
- Template() — документ как шаблон Elemenx; Template(true, empty) — то же для холста: каждый узел в элементе, который его называет (data-designer-id), а пустой контейнер содержит текст empty.
- Правила CSS страницы по контексту: Rules(); Rule(context) — правило контекста {Who: node, kind или within, Node, Class, Parent, State, Width, Theme}; SetRule(context, property, value) задаёт его свойство (правило появляется с первым свойством и исчезает с последним); RootClass(id) — класс элемента узла (elemenx-button), который называет правило его вида. Узел со своими правилами получает класс page-<его ID> (у компонента — на div вокруг него). Template() пишет правила первыми в <style> (ширины — через @media), а для холста — внутрь его страницы (ширины — через @container).
- Import(text) читает шаблон обратно вместе с правилами его <style> (непонятные правила сохраняются как есть): виды палитры там, где элемент им соответствует, а любой другой элемент — как есть.

## Методы

- `Load(callback)`
- `Use(meta)`
- `Literal(value)`
- `Parse(expression)`
- `Ready()`
- `Kinds()`
- `Kind(id)`
- `Label(id)`
- `GroupLabel(group)`
- `Slots(id)`
- `Select(id)`
- `Selected()`
- `Insert(kind, parent, index)`
- `Move(id, parent, index)`
- `Remove(id)`
- `Duplicate(id)`
- `Set(id, name, value)`
- `SetStyle(id, property, value)`
- `Clear()`
- `Template(canvas, empty)`
- `Import(source)`
- `Rules()`
- `Rule(context)`
- `SetRule(context, property, value)`
- `RootClass(id)`

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
