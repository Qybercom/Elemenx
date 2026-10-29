<!-- generated -->
# Toggle

Переключатель: флажок, нарисованный как дорожка с бегунком (role switch). Checked — его состояние, Label и Description — текст рядом; Size: small или medium; Orientation: horizontal (включено — к концу строки) или vertical (включено — вверху, как у выключателя света). Name и Disabled — как у флажка. События: change (Checked).
- States 3: переключатель на три положения (role slider), Value — false, null (середина: авто, наследовать, любое) или true, от начала (снизу, если вертикальный) к концу. Labels называет их ([выкл, середина, вкл]; по умолчанию Выкл, Авто и Вкл на языке страницы) для экранного диктора, а ShowLabels пишет их вдоль дорожки. Нажатие на дорожку ставит положение под указателем, нажатие на текст или Space — следующее; стрелки, Home и End двигают его. С Name форма получает 'false', 'null' или 'true'. События: change (Value).
- Values: значения его положений, два ([выкл, вкл]) или три ([выкл, середина, вкл]: три положения без States), любые (тексты, числа, объекты); тогда Value — значение положения, change отдаёт его, а форма получает его текст. Value, которого нет среди них, стоит в «выкл» (в середине для трёх).

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
| `Values` | `null` |
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
	<Toggle Label="Units" [values]="['metric', 'imperial']" [value]="Units" (change)="Unit" />
	<Toggle Label="Quality" ShowLabels="true" Labels="480p,720p,1080p" [values]="[480, 720, 1080]" [value]="Quality" (change)="Chose" />
</div>
<p class="elemenx-text small muted">Notifications {{Notify ? 'on' : 'off'}}, sound {{Notify && Sound ? 'on' : 'off'}}, theme {{Dark === null ? 'of the system' : Dark ? 'dark' : 'light'}}, fan {{Fan === null ? 'low' : Fan ? 'high' : 'off'}}, units {{Units}}, quality {{Quality}}.</p>
<script>
({
	Notify: true,
	Sound: false,
	Dark: null,
	Light: true,
	Fan: false,
	Units: 'metric',
	Quality: 720,

	Notified: function (value) {
		this.Notify = value;
	},

	Sounded: function (value) {
		this.Sound = value;
	},

	Unit: function (value) {
		this.Units = value;
	},

	Chose: function (value) {
		this.Quality = value;
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

## Тесты

- [Toggle takes Values of its own: two for a switch, three for three positions, given back by change and to a form](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L75) — `tests/regression/library-controls.test.js`
- [Toggle stands vertical with on at the top, and with States 3 goes from false to null to true by its keys, a press on its text and on its track](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L143) — `tests/regression/library-controls.test.js`
- [knows the references of a template (#Name): completes, tells and finds them from $Ref, and marks a $Ref of none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L110) — `tests/regression/language-server.test.js`
- [finds the Component of a <template id> of a page by its $TemplateID, and marks a name in $Template](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L154) — `tests/regression/language-server.test.js`
- [runs a deferred route Component leave hook on the resolved Component instance](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/router.test.js#L916) — `tests/regression/router.test.js`
- [switches to Russian, keeps the language and finds a page by the search of the whole reference in its header](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/docs.spec.js#L52) — `tests/examples/docs.spec.js`
- [shows the example of the page it goes to through the contents, not the one of the page before](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/docs.spec.js#L111) — `tests/examples/docs.spec.js`
- [exports the page as a template and imports a template back from the backstage, keeping the elements it does not know](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L317) — `tests/examples/designer.spec.js`
