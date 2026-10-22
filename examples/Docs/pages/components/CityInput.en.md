<!-- generated -->
# CityInput

A field that finds a city of the Cities Service (the cities of the world from GeoNames, loaded when it is first used): typing lists the cities by name, with their region, country and local time. Value is the ID of the city picked; Country keeps one country (a code of ISO 3166), Limit the number of cities listed, ShowTime the local time. Event: change (the city {ID, Name, Country, Region, Latitude, Longitude, TimeZone}, or null when cleared).

## Properties

| Property | Default |
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

## Events

`change`

## Example

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
