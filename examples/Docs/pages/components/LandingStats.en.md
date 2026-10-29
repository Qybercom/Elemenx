<!-- generated -->
# LandingStats

The numbers of a product: Items [{ID, Value, Prefix, Suffix, Label, Precision}] in a row (10 000+ users, 99.9% uptime), counted up from 0 the first time they come into view (Animate, for Duration milliseconds; at once when the system asks for less motion). Locale writes the numbers (the language of the page by default). Title over them.

## Properties

| Property | Default |
| --- | --- |
| `Title` | `''` |
| `Items` | `[]` |
| `Animate` | `true` |
| `Duration` | `1200` |
| `Locale` | `''` |

## Example

```example
<LandingStats [items]="Items" />
<script>
({
	Items: [{ID: 'users', Value: 12000, Suffix: '+', Label: 'Users'}, {ID: 'uptime', Value: 99.9, Suffix: '%', Label: 'Uptime'}, {ID: 'countries', Value: 48, Label: 'Countries'}]
})
</script>
```

## Tests

- [draws the blocks of a landing: a hero with its actions, features, numbers counted up, quotes and questions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L167) — `tests/regression/library-landing.test.js`
