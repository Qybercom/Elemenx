<!-- generated -->
# Rating

Оценка из Max звёзд (5). Value от 0 до Max, с половинками при Half. Указатель показывает оценку, которую он поставил бы; нажатие ставит её (нажатие на поставленную оценку снимает её, если Clearable не false). Клавиши: стрелки (шаг — звезда или половина с Half), Home (0), End (Max), цифры. ReadOnly показывает неизменяемую оценку. Icon задаёт другую форму. События: change (Value).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `0` |
| `Max` | `5` |
| `Half` | `false` |
| `Clearable` | `true` |
| `ReadOnly` | `false` |
| `Disabled` | `false` |
| `Icon` | `'star'` |
| `Size` | `'medium'` |
| `Label` | `''` |

## События

- `change`: Оценка поставлена или снята: Value.

## Пример

```example
<Rating [value]="Stars" Half="true" (change)="Rated" />
<Rating Value="4" ReadOnly="true" />
<Rating Value="2" Max="3" Icon="heart" />
<p class="elemenx-text small muted">Rating: {{Stars}} · press the given rating to clear it.</p>
<script>
({
	Stars: 3.5,

	Rated: function (value) {
		this.Stars = value;
	}
})
</script>
```

## Тесты

- [takes the base a Component names in $Extends and the Traits of the project into the bundle, the Traits as their own type](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/build-inheritance.test.js#L52) — `tests/regression/build-inheritance.test.js`
