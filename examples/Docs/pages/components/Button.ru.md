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
- [Component tags preserve case and do not capture native HTML tags](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/templates.test.js#L69) — `tests/regression/templates.test.js`
- [adds components from the Insert tab of its Ribbon, edits their props and text, and undoes and redoes the changes](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L142) — `tests/examples/builder.spec.js`
- [drops components from the Ribbon where the line shows, with words saying where, and moves elements by the grip of the selection](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L213) — `tests/examples/builder.spec.js`
- [declares the tabs of a Tabs as its children: adds them, shows the one selected on the canvas and exports them](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L470) — `tests/examples/builder.spec.js`
- [sets the layout of an element above its props: its box, its sizes and the alignment of a flex container by icons](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L506) — `tests/examples/builder.spec.js`
- [shows a page of the guide and a page of the reference with its live example](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/docs.spec.js#L30) — `tests/examples/docs.spec.js`
- [switches to Russian, keeps the language and finds a page by the search of the whole reference in its header](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/docs.spec.js#L52) — `tests/examples/docs.spec.js`
- [keeps the $Meta of the libraries in a build whose own component reads Elemenx.Meta, and leaves it out otherwise](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/cli-meta.test.js#L222) — `tests/regression/cli-meta.test.js`
- [ButtonGroup groups its buttons for screen readers, attached or in a column, and FileIcon names the icon of a file by its name](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-misc.test.js#L123) — `tests/regression/library-misc.test.js`
- [overrides the CSS of an element, of every element of its kind and in a state, in a <style> of the template](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L874) — `tests/examples/builder.spec.js`

+2 ещё в тех же файлах
