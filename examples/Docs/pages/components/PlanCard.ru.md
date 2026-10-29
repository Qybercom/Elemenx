<!-- generated -->
# PlanCard

Карточка тарифа подписки: Name и Description в шапке (в цвете Color, как плитка в стиле Metro), Popular (метка тарифа, который нужно выделить: «Самый популярный»), Price за месяц в Currency (0 — бесплатно) или за год (Period 'year': YearlyPrice, иначе двенадцать месяцев), Note, возможности Features ([{Label, Included, Hint}] или подписи; Included false зачёркивает пункт) и кнопка (Action), выбирающая его. Selected и Current (тариф пользователя) помечают карточку. Selectable делает её радиокнопкой группы (PlanPicker); Tabbable — той, куда попадает клавиша Tab. Variant — как в Card. События: select ({ID}).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `Name` | `''` |
| `Description` | `''` |
| `Price` | `0` |
| `YearlyPrice` | `null` |
| `Period` | `'month'` |
| `Currency` | `'USD'` |
| `Note` | `''` |
| `Features` | `[]` |
| `Popular` | `''` |
| `Color` | `''` |
| `Selected` | `false` |
| `Current` | `false` |
| `Disabled` | `false` |
| `Selectable` | `false` |
| `Tabbable` | `false` |
| `Variant` | `'outlined'` |
| `Action` | `''` |
| `SelectedLabel` | `''` |
| `CurrentLabel` | `''` |
| `FreeLabel` | `''` |
| `MonthLabel` | `''` |
| `YearLabel` | `''` |
| `IncludedLabel` | `''` |
| `ExcludedLabel` | `''` |

## События

- `select`: Выбран тариф: {ID}.

## Слоты

по умолчанию

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<PlanCard ID="free" Name="Basic" Description="For a start" Price="0" [features]="['3 projects', '1 GB of storage', {Label: 'Custom themes', Included: false}]" Current="true" Color="#3f6c9e" />
	<PlanCard ID="pro" Name="Standard" Description="For a team" Price="12" Currency="EUR" [features]="['Unlimited projects', '100 GB of storage', 'Custom themes']" Popular="Most popular" Color="#b4483f" (select)="Chosen" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: '',

	Chosen: function (event) {
		this.Note = 'Chosen: ' + event.ID;
	}
})
</script>
```

## Тесты

- [binds every instance of a template with a slot, filled or not, the content of the slot by its owner](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/template-plan.test.js#L34) — `tests/regression/template-plan.test.js`
