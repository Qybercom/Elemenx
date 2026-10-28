<!-- generated -->
# Toggle

Переключатель: флажок, нарисованный как дорожка с бегунком (role switch). Checked — его состояние, Label и Description — текст рядом; Size: small или medium; Orientation: horizontal (включено — к концу строки) или vertical (включено — вверху, как у выключателя света). Name и Disabled — как у флажка. События: change (Checked).
- States 3: переключатель на три положения (role slider), Value — false, null (середина: авто, наследовать, любое) или true, от начала (снизу, если вертикальный) к концу. Labels называет их ([выкл, середина, вкл]; по умолчанию Выкл, Авто и Вкл на языке страницы) для экранного диктора, а ShowLabels пишет их вдоль дорожки. Нажатие на дорожку ставит положение под указателем, нажатие на текст или Space — следующее; стрелки, Home и End двигают его. С Name форма получает 'false', 'null' или 'true'. События: change (Value).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Checked` | `false` |
| `Label` | `''` |
| `Description` | `''` |
| `Size` | `'medium'` |
| `Orientation` | `'horizontal'` |
| `States` | `2` |
| `Value` | `false` |
| `Labels` | `null` |
| `ShowLabels` | `false` |
| `Name` | `null` |
| `Disabled` | `false` |

## События

- `change`: Переключён: Checked.

## Пример

```example
<div class="docs-stack">
	<Toggle Label="Notifications" Description="Get a message on every reply" [checked]="Notify" (change)="Notified" />
	<Toggle Label="Sound" Size="small" [checked]="Sound" [disabled]="!Notify" (change)="Sounded" />
	<Toggle Label="Always off" Disabled="true" />
	<Toggle Label="Dark theme" States="3" ShowLabels="true" Labels="Light,System,Dark" [value]="Dark" (change)="Darkened" />
	<div class="docs-row">
		<Toggle Label="Light" Orientation="vertical" [checked]="Light" (change)="Lit" />
		<Toggle Label="Fan" Orientation="vertical" States="3" ShowLabels="true" Labels="Off,Low,High" [value]="Fan" (change)="Fanned" />
	</div>
</div>
<p class="elemenx-text small muted">Notifications {{Notify ? 'on' : 'off'}}, sound {{Notify && Sound ? 'on' : 'off'}}, theme {{Dark === null ? 'of the system' : Dark ? 'dark' : 'light'}}, fan {{Fan === null ? 'low' : Fan ? 'high' : 'off'}}.</p>
<script>
({
	Notify: true,
	Sound: false,
	Dark: null,
	Light: true,
	Fan: false,

	Notified: function (value) {
		this.Notify = value;
	},

	Sounded: function (value) {
		this.Sound = value;
	},

	Darkened: function (value) {
		this.Dark = value;
	},

	Lit: function (value) {
		this.Light = value;
	},

	Fanned: function (value) {
		this.Fan = value;
	}
})
</script>
```
