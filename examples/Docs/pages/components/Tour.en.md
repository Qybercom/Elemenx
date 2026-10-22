<!-- generated -->
# Tour

A guided tour: the page is shaded except the element of the current step, and a card next to it explains it. Steps: [{Target (a CSS selector or an element), Title, Text, Placement (bottom, top, right, left; the side with room wins)}]. Open shows it at Step. Back, Next and Done move; Skip, Done and Escape close it. A step whose target is missing shows its card in the middle. The page behind does not take presses while the tour is open. Events: change (the new Step), close (the reason: 'skip', 'escape' or 'done'), finish (after the last step).

## Properties

| Property | Default |
| --- | --- |
| `Steps` | `[]` |
| `Open` | `false` |
| `Step` | `0` |
| `Padding` | `6` |
| `BackLabel` | `''` |
| `NextLabel` | `''` |
| `DoneLabel` | `''` |
| `SkipLabel` | `''` |

## Events

`change`, `finish`, `close`

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Start the tour" Variant="primary" (click)="Start" />
	<span class="docs-tour-search"><Button Label="Search" Icon="search" /></span>
	<span class="docs-tour-share"><Button Label="Share" Icon="share" /></span>
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<Tour [steps]="Steps" [open]="Open" [step]="Step" (change)="Changed" (close)="Closed" />
<script>
({
	Open: false,
	Step: 0,
	Note: '',
	Steps: [
		{Target: '.docs-tour-search', Title: 'Search', Text: 'Find anything of the page here.', Placement: 'bottom'},
		{Target: '.docs-tour-share', Title: 'Share', Text: 'Send a link to the page.', Placement: 'bottom'},
		{Target: '.docs-tour-missing', Title: 'The end', Text: 'A step whose target is missing shows its card in the middle.'}
	],

	Start: function () {
		this.Step = 0;
		this.Open = true;
	},

	Changed: function (step) {
		this.Step = step;
	},

	Closed: function (reason) {
		this.Open = false;
		this.Note = 'Closed: ' + reason;
	}
})
</script>
```
