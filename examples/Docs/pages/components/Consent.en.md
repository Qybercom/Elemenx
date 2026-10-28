<!-- generated -->
# Consent

A request for consent, of any kind: cookies and analytics, the terms of a service, mail of news. Key names the consent and Version its text (a new version asks again); Purposes are what it asks for, [{ID, Label, Description, Required}] (a required one is always on). It shows itself while the Consents Service keeps no decision of that version (Open true or false decides instead): Accept all, Reject (only the required ones) and Customize (a switch for each purpose, then Save) keep the decision there and emit change with it. Show() opens it again with the choices kept (a link "Cookie settings"). Placement: bottom (a banner over the bottom of the page), center (a card in the middle) or inline (in its place). Its text is Text, or the content of its tag; Policy links to the full text.

## Properties

| Property | Default |
| --- | --- |
| `Key` | `'default'` |
| `Version` | `''` |
| `Purposes` | `[]` |
| `Title` | `''` |
| `Text` | `''` |
| `Policy` | `''` |
| `PolicyLabel` | `''` |
| `Placement` | `'bottom'` |
| `Reject` | `true` |
| `Customize` | `true` |
| `Open` | `null` |

## Events

- `change`: A decision was made: {Version, Choices: {purpose: true or false}, Time}.
- `close`: It was hidden after a decision.

## Slots

default

## Methods

- `Show()`

## Example

```example
<Consent Key="docs-example" Placement="inline" [open]="Open" [purposes]="Purposes" Policy="#" (change)="Decided">
	<p>This site keeps a few things in your browser. Choose what it may use.</p>
</Consent>
<p class="elemenx-text small muted">{{Note}} <Button Label="Ask again" Variant="ghost" Size="small" (click)="Again" /></p>
<script>
({
	Open: true,
	Purposes: [
		{ID: 'necessary', Label: 'Necessary', Description: 'Your session and your settings', Required: true},
		{ID: 'analytics', Label: 'Analytics', Description: 'Which pages are read'},
		{ID: 'news', Label: 'News by mail'}
	],
	Note: 'No decision yet.',

	Decided: function (decision) {
		var choices = decision.Choices;

		this.Open = false;
		this.Note = 'Analytics ' + (choices.analytics ? 'on' : 'off') + ', news ' + (choices.news ? 'on' : 'off') + '.';
	},

	Again: function () {
		this.Open = true;
	}
})
</script>
```

## Tests

- [Consent asks while no decision of its version is kept, keeps the choices in Consents and asks again for a new version](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L146) — `tests/regression/library-new.test.js`
