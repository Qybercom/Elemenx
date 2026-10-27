<!-- generated -->
# DialPad

Номеронабиратель: номер в поле над сеткой клавиш, клавиша стирания и клавиша вызова. Value — номер. Keys — раскладка по строкам в Columns колонок: [{Value, Label, Sub, Hold, Icon, Class}]: Value добавляется к номеру, Label показывается на клавише (Value, если пусто), под ним Sub (буквы телефона), Hold встаёт вместо Value после долгого нажатия (+ на 0), Icon рисует клавишу, Class даёт ей свой вид. Без Keys это клавиатура телефона: 1–9, *, 0 и #. ShowInput показывает поле (в него попадают и клавиши клавиатуры, и вставка — из символов клавиш), ShowCall — клавишу вызова, CallLabel — её название; Disabled блокирует. Клавиша стирания удаляет последний символ, а при удержании — весь номер. События: input (номер), press ({Value}): нажата клавиша, call (номер): клавиша вызова или Enter.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Keys` | `null` |
| `Columns` | `3` |
| `ShowInput` | `true` |
| `ShowCall` | `true` |
| `CallLabel` | `''` |
| `Label` | `''` |
| `Hold` | `500` |
| `Disabled` | `false` |

## События

- `input`: Номер изменился: номер.
- `press`: Нажата клавиша: {Value}.
- `call`: Клавиша вызова (или Enter): номер.

## Пример

```example
<DialPad [value]="Number" (input)="Typed" (call)="Called" />
<p class="elemenx-text">{{Note}}</p>
<script>
({
	Number: '',
	Note: 'Type a number with the keys or the keyboard.',

	Typed: function (value) {
		this.Number = value;
	},

	Called: function (value) {
		this.Note = 'Calling ' + value + '...';
	}
})
</script>
```
