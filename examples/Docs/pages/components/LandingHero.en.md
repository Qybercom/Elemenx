<!-- generated -->
# LandingHero

The first screen of a landing: an Overline, a large Title, its Text, the Actions and a picture. Layout: split (the picture beside the text, under it on a phone), center (the text in the middle, the picture under it) or cover (the picture behind the text, darkened). Image and ImageAlt, and the slot media (a video, a form, a mockup in its place). Actions: [{ID, Label, Href, Variant (primary, secondary or ghost), Icon, Goal, Experiment}]: a link with Href, else a button; Goal tells the Audience a conversion of the Experiment it stands in (or of the one Experiment names). The default slot goes under the actions (a note, logos). Events: action ({ID, Label, Href, Goal}).

## Properties

| Property | Default |
| --- | --- |
| `Overline` | `''` |
| `Title` | `''` |
| `Text` | `''` |
| `Image` | `''` |
| `ImageAlt` | `''` |
| `Layout` | `'split'` |
| `Actions` | `[]` |

## Events

- `action`: An action was pressed: {ID, Label, Href, Goal}.

## Slots

default, `media`

## Example

```example
<LandingHero Overline="New" Title="Ship faster" Text="One file, no build step, two hundred components." [actions]="Actions" (action)="Acted" />
<p class="elemenx-text small muted">{{Text}}</p>
<script>
({
	Text: 'Press an action.',
	Actions: [{ID: 'start', Label: 'Start free'}, {ID: 'docs', Label: 'Read the docs', Variant: 'secondary'}],

	Acted: function (event) {
		this.Text = 'Pressed ' + event.ID;
	}
})
</script>
```

## Tests

- [draws the blocks of a landing: a hero with its actions, features, numbers counted up, quotes and questions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L167) — `tests/regression/library-landing.test.js`
