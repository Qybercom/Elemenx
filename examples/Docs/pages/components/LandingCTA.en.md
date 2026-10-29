<!-- generated -->
# LandingCTA

The call to act of a landing: a band of a Title, its Text and the Actions ([{ID, Label, Href, Variant, Icon, Goal, Experiment}], as in LandingHero: a Goal tells the Audience a conversion of the Experiment it stands in, or of the one Experiment names). Tone: accent (the band in the color of the theme) or neutral. Layout: row (the text and the actions side by side) or center. The default slot goes under the actions (a form of a mail, a note). Events: action ({ID, Label, Href, Goal}).

## Properties

| Property | Default |
| --- | --- |
| `Title` | `''` |
| `Text` | `''` |
| `Actions` | `[]` |
| `Tone` | `'accent'` |
| `Layout` | `'row'` |

## Events

- `action`: An action was pressed: {ID, Label, Href, Goal}.

## Slots

default

## Example

```example
<LandingCTA Title="Ready to start?" Text="It takes a minute." [actions]="Actions" />
<script>
({
	Actions: [{ID: 'signup', Label: 'Create an account'}, {ID: 'sales', Label: 'Talk to us', Variant: 'secondary'}]
})
</script>
```

## Tests

- [shows the Variant chosen, tells its view once and the conversion of an action with a Goal inside it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L94) — `tests/regression/library-landing.test.js`
