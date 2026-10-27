<!-- generated -->
# Ruler

Линейка, как в редакторах страниц и рисунков: Orientation horizontal (вдоль верхнего края) или vertical (вдоль бокового), деления через каждые Step единиц и длинное деление с числом через каждые Major (в единицах линейки, при масштабе Scale: 2 рисует их вдвое реже). Start — значение в начале линейки (у страницы, прокрученной на 120, она начинается со 120). Marker отмечает значение (указатель), Range — отрезок {From, To} (выбранный элемент), Guides — значения направляющих. Нажатие на линейку вытягивает из неё направляющую: событие pull ({Value, ClientX, ClientY}) просит владельца вести её за указателем.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Orientation` | `'horizontal'` |
| `Start` | `0` |
| `Scale` | `1` |
| `Step` | `10` |
| `Major` | `100` |
| `Marker` | `null` |
| `Range` | `null` |
| `Guides` | `[]` |

## События

- `pull`: Из линейки вытягивается направляющая: {Value, ClientX, ClientY}.

## Пример

```example
<div class="docs-stack" style="gap: 8px;">
	<div style="height: 20px;" (pointermove)="Moved">
		<Ruler [start]="Start" [marker]="Marker" [range]="{From: 40, To: 200}" [guides]="Guides" (pull)="Pulled" />
	</div>
	<label class="elemenx-text small">Start <input class="elemenx-input" type="range" min="0" max="400" step="10" [value]="Start" (input)="Scrolled"></label>
	<p class="elemenx-text small muted">Guides: {{Guides.join(', ') || 'none'}} (press the ruler to add one)</p>
</div>
<script>
({
	Start: 0,
	Marker: null,
	Guides: [300],

	Moved: function (event, node) {
		this.Marker = Math.round(this.Start + event.clientX - node.getBoundingClientRect().left);
	},

	Scrolled: function (event) {
		this.Start = Number(event.target.value);
	},

	Pulled: function (event) {
		this.Guides = this.Guides.concat([event.detail.Value]);
	}
})
</script>
```
