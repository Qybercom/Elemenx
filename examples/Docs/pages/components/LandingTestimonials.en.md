<!-- generated -->
# LandingTestimonials

What the customers say: Items [{ID, Text, Name, Role, Avatar, Rating}] as quotes in a grid (Columns, 3), each with the avatar (a picture, or made of the name), the name and role and the stars of a Rating. Overline, Title and Text over them; the default slot adds quotes of its own.

## Properties

| Property | Default |
| --- | --- |
| `Overline` | `''` |
| `Title` | `''` |
| `Text` | `''` |
| `Items` | `[]` |
| `Columns` | `3` |

## Slots

default

## Example

```example
<LandingTestimonials Title="What the teams say" Columns="2" [items]="Items" />
<script>
({
	Items: [
		{ID: 'ada', Text: 'We moved a back office in a week.', Name: 'Ada Lovelace', Role: 'CTO', Rating: 5},
		{ID: 'alan', Text: 'The tables cover what we used three libraries for.', Name: 'Alan Turing', Role: 'Lead', Rating: 4.5}
	]
})
</script>
```

## Tests

- [draws the blocks of a landing: a hero with its actions, features, numbers counted up, quotes and questions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L167) — `tests/regression/library-landing.test.js`
