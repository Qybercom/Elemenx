<!-- generated -->
# LandingFAQ

The questions of the customers: Items [{ID, Question, Answer}], each a <details> the browser opens and closes (find in the page opens the one it finds). Single keeps one open at a time; Open is the ID of the one open at first. Overline, Title and Text over them; the default slot adds questions of its own. Events: toggle ({ID, Open}).

## Properties

| Property | Default |
| --- | --- |
| `Overline` | `''` |
| `Title` | `''` |
| `Text` | `''` |
| `Items` | `[]` |
| `Single` | `false` |
| `Open` | `''` |

## Events

- `toggle`: A question opened or closed: {ID, Open}.

## Slots

default

## Example

```example
<LandingFAQ Title="Questions" Single="true" Open="free" [items]="Items" />
<script>
({
	Items: [
		{ID: 'free', Question: 'Is it free?', Answer: 'Yes: it is open source.'},
		{ID: 'deps', Question: 'Has it dependencies?', Answer: 'None.'}
	]
})
</script>
```

## Tests

- [draws the blocks of a landing: a hero with its actions, features, numbers counted up, quotes and questions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L167) — `tests/regression/library-landing.test.js`
