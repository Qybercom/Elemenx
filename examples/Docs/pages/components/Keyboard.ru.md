<!-- generated -->
# Keyboard

Клавиатура компьютера, нарисованная по клавишам (вид и управление): чтобы показать сочетания, нажатые клавиши или принимать нажатия на экране. Layout: 'full' (с цифровым блоком), 'tkl' (без него) или 'compact' (только основной блок). Клавиши называются по коду (KeyboardEvent.code: KeyA, Digit1, ShiftLeft, ArrowUp, Numpad7...).

- Pressed — коды, показанные нажатыми; Live вдобавок показывает клавиши, удерживаемые на клавиатуре пользователя, пока страница в фокусе (класс held: нажатая или отпущенная клавиша меняет только свою кнопку, а не всю клавиатуру), кроме клавиш, которые забирает себе элемент в фокусе (Piano, который на них играет, сочетание клавиш: они отменяют действие клавиши по умолчанию). Marks: {code: class} помечает клавиши (сочетание, группа клавиш игры), true — метка темы.
- Labels: {code: текст} даёт клавишам свои названия; Native называет символьные клавиши так, как их пишет раскладка пользователя (navigator.keyboard, Chrome и Edge), иначе — по американской раскладке.
- Alternate — вторая раскладка на символьных клавишах, как на клавиатурах стран с другим алфавитом: первая крупно в верхнем левом углу клавиши, вторая мельче в нижнем правом. Название раскладки библиотеки ('ru' — русская, 'uk' — украинская, 'el' — греческая, 'he' — иврит), 'native' (раскладка пользователя, как её читает Native) или {code: текст} для любой другой.
- Clickable: нажатие клавиши отправляет press ({Code, Label}); клавиша экранной клавиатуры — кнопка.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Layout` | `'full'` |
| `Pressed` | `[]` |
| `Marks` | `{}` |
| `Labels` | `{}` |
| `Native` | `false` |
| `Alternate` | `''` |
| `Live` | `false` |
| `Clickable` | `false` |
| `Size` | `'medium'` |
| `Label` | `''` |

## События

`press`

## Пример

```example
<RadioGroup Variant="segmented" Label="Second layout" [options]="Layouts" [value]="Alternate" (change)="Chose" />
<Keyboard Layout="compact" [alternate]="Alternate" [pressed]="Pressed" [marks]="{KeyW: true, KeyA: true, KeyS: true, KeyD: true, Space: true}" Live="true" Clickable="true" (press)="Press" />
<p class="elemenx-text small muted">Press a key on the screen, or type while the page has the focus: {{Last}}</p>
<Keyboard Layout="full" Size="small" [pressed]="['ControlLeft', 'ShiftLeft', 'KeyP']" Label="A hotkey" />
<script>
({
	Pressed: [],
	Last: '—',
	Alternate: 'ru',
	Layouts: [{Value: '', Label: 'none'}, {Value: 'ru', Label: 'ru'}, {Value: 'uk', Label: 'uk'}, {Value: 'el', Label: 'el'}, {Value: 'he', Label: 'he'}],

	Chose: function (value) {
		this.Alternate = value;
	},

	Press: function (event) {
		this.Last = event.Label + ' (' + event.Code + ')';
	}
})
</script>
```
