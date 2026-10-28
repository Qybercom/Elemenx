<!-- generated -->
# Toggle

A switch: a check box drawn as a track with a thumb (role switch). Checked is its state, Label and Description the text beside it; Size: small or medium; Orientation: horizontal (on to the end of the line) or vertical (on at the top, as the switch of a light). Name and Disabled as in a check box. Events: change (Checked).

- States 3: a switch of three positions (role slider), Value false, null (the middle: auto, inherit, either) or true, from the start (the bottom when vertical) to the end. Labels names them ([off, middle, on]; by default Off, Auto and On in the language of the page) for screen readers, and ShowLabels writes them along the track. A press on the track takes the position under the pointer, a press on the text or Space the next one; the arrows, Home and End move it. With a Name, a form gets 'false', 'null' or 'true'. Events: change (Value).
- Values: the values of its positions, two ([off, on]) or three ([off, middle, on]: three positions without States), any values (texts, numbers, objects); Value is then the one of the position, change gives it and a form gets its text. A Value that is none of them stands at off (at the middle of three).

## Properties

| Property | Default |
| --- | --- |
| `Checked` | `false` |
| `Label` | `''` |
| `Description` | `''` |
| `Size` | `'medium'` |
| `Orientation` | `'horizontal'` |
| `States` | `2` |
| `Value` | `false` |
| `Values` | `null` |
| `Labels` | `null` |
| `ShowLabels` | `false` |
| `Name` | `null` |
| `Disabled` | `false` |

## Events

- `change`: It was switched: Checked (Value with States 3 or Values).

## Example

```example
<div class="docs-stack">
	<Toggle Label="Notifications" Description="Get a message on every reply" [checked]="Notify" (change)="Notified" />
	<Toggle Label="Sound" Size="small" [checked]="Sound" [disabled]="!Notify" (change)="Sounded" />
	<Toggle Label="Always off" Disabled="true" />
	<Toggle Label="Dark theme" States="3" ShowLabels="true" Labels="Light,System,Dark" [value]="Dark" (change)="Darkened" />
	<div class="docs-row">
		<Toggle Label="Light" Orientation="vertical" [checked]="Light" (change)="Lit" />
		<Toggle Label="Fan" Orientation="vertical" States="3" ShowLabels="true" Labels="Off,Low,High" [value]="Fan" (change)="Fanned" />
	</div>
	<Toggle Label="Units" [values]="['metric', 'imperial']" [value]="Units" (change)="Unit" />
	<Toggle Label="Quality" ShowLabels="true" Labels="480p,720p,1080p" [values]="[480, 720, 1080]" [value]="Quality" (change)="Chose" />
</div>
<p class="elemenx-text small muted">Notifications {{Notify ? 'on' : 'off'}}, sound {{Notify && Sound ? 'on' : 'off'}}, theme {{Dark === null ? 'of the system' : Dark ? 'dark' : 'light'}}, fan {{Fan === null ? 'low' : Fan ? 'high' : 'off'}}, units {{Units}}, quality {{Quality}}.</p>
<script>
({
	Notify: true,
	Sound: false,
	Dark: null,
	Light: true,
	Fan: false,
	Units: 'metric',
	Quality: 720,

	Notified: function (value) {
		this.Notify = value;
	},

	Sounded: function (value) {
		this.Sound = value;
	},

	Unit: function (value) {
		this.Units = value;
	},

	Chose: function (value) {
		this.Quality = value;
	},

	Darkened: function (value) {
		this.Dark = value;
	},

	Lit: function (value) {
		this.Light = value;
	},

	Fanned: function (value) {
		this.Fan = value;
	}
})
</script>
```

## Tests

- [Toggle takes Values of its own: two for a switch, three for three positions, given back by change and to a form](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L75) — `tests/regression/library-controls.test.js`
- [Toggle stands vertical with on at the top, and with States 3 goes from false to null to true by its keys, a press on its text and on its track](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L143) — `tests/regression/library-controls.test.js`
- [knows the references of a template (#Name): completes, tells and finds them from $Ref, and marks a $Ref of none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L104) — `tests/regression/language-server.test.js`
- [finds the Component of a <template id> of a page by its $TemplateID, and marks a name in $Template](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L148) — `tests/regression/language-server.test.js`
- [runs a deferred route Component leave hook on the resolved Component instance](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/router.test.js#L916) — `tests/regression/router.test.js`
- [switches to Russian, keeps the language and finds a page by the search of the whole reference in its header](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/docs.spec.js#L52) — `tests/examples/docs.spec.js`
- [shows the example of the page it goes to through the contents, not the one of the page before](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/docs.spec.js#L111) — `tests/examples/docs.spec.js`
- [exports the page as a template and imports a template back from the backstage, keeping the elements it does not know](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L317) — `tests/examples/builder.spec.js`
