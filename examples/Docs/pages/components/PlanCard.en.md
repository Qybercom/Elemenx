<!-- generated -->
# PlanCard

The card of a plan of a subscription: Name and Description in a header (in Color, as a tile of the Metro style), Popular (the label of the plan to point out: 'Most popular'), the Price of a month in Currency (0 is Free) or of a year (Period 'year': YearlyPrice, otherwise twelve months), a Note, the Features ([{Label, Included, Hint}] or labels; Included false crosses one out) and the button (Action) that chooses it. Selected and Current (the plan of the user) mark it. Selectable makes it a radio of a group (PlanPicker); Tabbable makes it the one the Tab key reaches. Variant as in Card. Events: select ({ID}).

## Properties

| Property | Default |
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

## Events

`select`

## Slots

default

## Example

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
