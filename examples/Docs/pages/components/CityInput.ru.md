<!-- generated -->
# CityInput

Поле, находящее город сервиса Cities (города мира из GeoNames, загружаются при первом использовании): ввод показывает города по названию с регионом, страной и местным временем. Value — ID выбранного города; Country ограничивает одной страной (код ISO 3166), Limit — числом показанных городов, ShowTime показывает местное время. Событие: change (город {ID, Name, Country, Region, Latitude, Longitude, TimeZone} или null при очистке).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `null` |
| `Country` | `''` |
| `Limit` | `20` |
| `ShowTime` | `true` |
| `Placeholder` | `''` |
| `Clearable` | `false` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |
| `Cities` | `{}` |

## События

- `change`: Выбран город: {ID, Name, Country, Region, Latitude, Longitude, TimeZone}; null, если очищено.

## Пример

```example
<Field Label="A city" [hint]="City || 'Type a few letters: moskva finds Москва too'"><CityInput Clearable="true" (change)="Changed" /></Field>
<script>
({
	City: '',

	Changed: function (city) {
		this.City = city ? city.Name + ', ' + city.Country + ' · ' + city.TimeZone : '';
	}
})
</script>
```
