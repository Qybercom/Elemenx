<!-- generated -->
# DesignerCanvas

Холст конструктора страниц (сервис Designer): страница документа, работающая как отдельный компонент (создаётся заново при каждом изменении), шириной с компьютер, планшет или телефон (Width). Слой поверх неё забирает указатель, так что компоненты страницы стоят на месте, пока её собирают: он отмечает элемент под указателем и выбранный, выбирает нажатый и принимает виды, перетащенные из DesignerPalette, и элементы, перенесённые за ручку выделения, показывая линией и словами, куда они попадут («В Экран, после Строка»). У края контейнера элемент попадает рядом с ним, в его родителя; с зажатым Shift — на уровень выше. Зажатый Shift без перетаскивания измеряет, как в редакторах картинок: от выбранного элемента до элемента под указателем (до сторон того, что вокруг него, если указатель на нём) или до краёв холста, когда указатель на самом элементе или ни на чём (без выделения — от элемента под указателем до краёв). Нажатие на вкладку компонента с объявленными детьми (Tabs, Ribbon) выбирает ребёнка, которого она показывает, а холст показывает того ребёнка, в котором находится выделение. Пока идёт перетаскивание, панель над холстом называет контейнер, куда попадёт элемент, и все контейнеры вокруг него: бросок на один из них ставит элемент в его конец, как бы ни совпадали края. Холст — это body страницы: высотой со своё место (экран с Sizing fill заполняет его), шириной по Width. Outlines рисует рамку каждого контейнера, Gaps даёт контейнерам без своего внутреннего отступа место для броска (8 пикселей); ни того, ни другого нет в самой странице. Preview убирает слой, а с ним контуры и места для броска: страница работает так, как будет работать. Inspect (в Preview) показывает рамки элемента под указателем, как инструменты браузера: внешний и внутренний отступы и размер; нажатие закрепляет элемент, а с зажатым Shift видно расстояние от него до элемента под указателем (без закреплённого — до краёв холста), сразу, даже если указатель не двигался. Lines рисует контуры и в Preview. Rulers (Ruler) идут вдоль верхнего и бокового края холста и отмечают указатель и выбранный элемент. Холст — кадр Board (Bounds frame): колесо двигает вид по странице, которая больше места, Ctrl с колесом масштабирует её (Controls — кнопки масштаба), и все отметки, расстояния и линейки — в пикселях страницы при любом масштабе. Empty — текст пустого контейнера (по умолчанию — фраза языка страницы). События: select (ID элемента или null), drop ({Kind или Node, Parent, Index, ID}).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Width` | `'desktop'` |
| `Preview` | `false` |
| `Outlines` | `true` |
| `Gaps` | `true` |
| `Inspect` | `false` |
| `Lines` | `false` |
| `Rulers` | `true` |
| `Controls` | `true` |
| `Empty` | `''` |
| `Note` | `''` |
| `Size` | `{Width: 0, Height: 0}` |

## События

- `select`: Нажат элемент: его ID или null для страницы.
- `drop`: На холст брошен вид или элемент: {Kind, Node, Parent, Index, ID}, ID созданного или перенесённого элемента.

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

## Тесты

- [shows the code of an example in listings of its own and the source files of the component of the page](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/docs.spec.js#L136) — `tests/examples/docs.spec.js`
