<!-- generated -->
# Experiment

An experiment of a page: one of its Variant children shows, the one the Audience Service chooses for the visitor (by their rules, the split of the others kept for the visitor, or a link that forces one: ?variant=ID). Name is its name (the key kept and the one of its events); Variants ([{ID, When, Weight, Default}]) adds variants from code, to the declared ones of the same ID or as new ones. Param names the parameter of a link that forces a variant (variant). Track (true) tells the Audience a view of the variant chosen. Visitor ({URL, Referrer, Language, Width, UserAgent}, the options of Audience.Context) shows the page as such a visitor would see it: a preview of a campaign. Events: choose ({Experiment, ID, Reason}). Methods: Convert(goal, data) tells a conversion of the variant shown, Choose() chooses again (after Forget()), Forget() forgets the variant kept for the visitor.

## Properties

| Property | Default |
| --- | --- |
| `Name` | `''` |
| `Variants` | `[]` |
| `Param` | `''` |
| `Track` | `true` |
| `Visitor` | `null` |
| `Reason` | `''` |

## Events

- `choose`: A variant was chosen: {Experiment, ID, Reason}.

## Slots

default

## Methods

- `Choose()`
- `Convert(goal, data)`
- `Forget()`

## Example

```example
<RadioGroup Variant="segmented" [options]="Sources" [value]="Source" (change)="Visited" />
<Experiment Name="docs-hero" [visitor]="Visitor" (choose)="Chosen">
	<Variant ID="ads" Source="google"><LandingHero Layout="center" Title="20% off for the spring" Text="Found us in a search? The code is applied at checkout." [actions]="Actions" /></Variant>
	<Variant ID="a"><LandingHero Layout="center" Title="Build interfaces in one file" [actions]="Actions" /></Variant>
	<Variant ID="b"><LandingHero Layout="center" Title="Ship the interface today" [actions]="Actions" /></Variant>
</Experiment>
<p class="elemenx-text small muted">{{Text}}</p>
<script>
({
	Text: '',
	Source: 'direct',
	Sources: [{Value: 'direct', Label: 'Direct'}, {Value: 'google', Label: 'Google ads'}],
	Visitor: {URL: '/'},
	Actions: [{ID: 'start', Label: 'Start', Goal: 'start'}],

	Visited: function (value) {
		this.Source = value;
		this.Visitor = {URL: value === 'google' ? '/?utm_source=google' : '/'};
	},

	Chosen: function (event) {
		this.Text = 'Variant ' + event.ID + ' (' + event.Reason + ')';
	}
})
</script>
```

## Tests

- [tells who came, from where, in which language and on what, and matches its rules](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L39) — `tests/regression/library-landing.test.js`
- [chooses a forced variant, then a rule, then the one kept, then a split by weight, else the default](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L65) — `tests/regression/library-landing.test.js`
- [shows the Variant chosen, tells its view once and the conversion of an action with a Goal inside it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L94) — `tests/regression/library-landing.test.js`
- [keeps the variant of a split for the visitor, and a link forces another one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L141) — `tests/regression/library-landing.test.js`
- [draws the blocks of a landing: a hero with its actions, features, numbers counted up, quotes and questions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L167) — `tests/regression/library-landing.test.js`
