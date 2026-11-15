<!-- generated -->
# Button

Кнопка. Variant: primary, secondary (по умолчанию), ghost, danger или link; Size: small, medium, large или giant; Shape round делает её круглой. Icon и IconRight — иконки до и после подписи Label; без Label кнопка — только иконка, и её название берётся из Title. Loading показывает вращающийся индикатор и выключает кнопку, Disabled выключает её, Pressed (true или false) делает её переключателем (aria-pressed), Expanded (true или false) говорит, что она раскрывает и закрывает что-то (aria-expanded), AriaLabel — её имя для скринридера, когда текст его не передаёт (M — «Выключить звук барабанов»), Block растягивает на всю ширину. Type — тип нативной кнопки (button, submit, reset). Badge ставит в угол значок, как директива *badge: число, 'dot', 'busy', текст или {Value, Tone, Max, Label}. Событие click.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Label` | `''` |
| `Variant` | `'secondary'` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Icon` | `''` |
| `IconRight` | `''` |
| `Type` | `'button'` |
| `Title` | `''` |
| `Disabled` | `false` |
| `Loading` | `false` |
| `Block` | `false` |
| `Pressed` | `null` |
| `Expanded` | `null` |
| `AriaLabel` | `''` |
| `Badge` | `''` |

## События

- `click`: Нажата (не когда Disabled или Loading): DOM-событие нажатия.

## Слоты

по умолчанию

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Primary" Variant="primary" (click)="Clicked" />
	<Button Label="Secondary" Icon="add" (click)="Clicked" />
	<Button Label="Ghost" Variant="ghost" (click)="Clicked" />
	<Button Label="Danger" Variant="danger" Icon="delete" (click)="Clicked" />
	<Button Label="A link" Variant="link" (click)="Clicked" />
</div>
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Small" Size="small" />
	<Button Label="Large" Size="large" />
	<Button Label="Giant" Size="giant" Variant="primary" />
	<Button Icon="bell" Title="Notifications" Badge="3" />
	<Button Icon="settings" Title="Settings" Shape="round" />
	<Button Label="Saving" [loading]="Saving" (click)="Save" />
	<Button Label="Bold" Icon="bold" [pressed]="Bold" (click)="ToggleBold" />
</div>
<Button Label="Block: the full width" Block="true" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: '',
	Saving: false,
	Bold: false,

	Clicked: function (event, button) {
		this.Note = 'Pressed: ' + button.Label;
	},

	Save: function () {
		var self = this;

		this.Saving = true;

		setTimeout(function () {
			self.Saving = false;
			self.Note = 'Saved';
		}, 1200);
	},

	ToggleBold: function () {
		this.Bold = !this.Bold;
	}
})
</script>
```

## Тесты

- [AriaLabel names it whatever its text; without one its text names it, and an icon button its Title](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/button-names.test.js#L45) — `tests/regression/button-names.test.js`
- [Expanded true or false is its aria-expanded, as it changes; empty, it has none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/button-names.test.js#L54) — `tests/regression/button-names.test.js`
- [Rove moves the focus by the arrows round a list, to its ends by Home and End, and lets other keys be](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L38) — `tests/regression/library-game-controls.test.js`
- [numbers the tabs of Tabs when it is told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L66) — `tests/regression/library-game-controls.test.js`
- [GameMenu: its items are Buttons, the arrows go round them, a press tells select and Escape back](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L77) — `tests/regression/library-game-controls.test.js`
- [GameDialogue: its choices and its next are Buttons that tell choose and next](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L111) — `tests/regression/library-game-controls.test.js`
- [GameTabs: Tabs of ElemenxUI, numbered, that open another by a press or the arrows and tell change](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L133) — `tests/regression/library-game-controls.test.js`
- [Component tags preserve case and do not capture native HTML tags](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/templates.test.js#L69) — `tests/regression/templates.test.js`
- [adds components from the Insert tab of its Ribbon, edits their props and text, and undoes and redoes the changes](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L150) — `tests/examples/designer.spec.js`
- [drops components from the Ribbon where the line shows, with words saying where, and moves elements by the grip of the selection](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L221) — `tests/examples/designer.spec.js`
- [declares the tabs of a Tabs as its children: adds them, shows the one selected on the canvas and exports them](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L478) — `tests/examples/designer.spec.js`
- [sets the layout of an element above its props: its box, its sizes and the alignment of a flex container by icons](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L514) — `tests/examples/designer.spec.js`

+8 ещё в тех же файлах
