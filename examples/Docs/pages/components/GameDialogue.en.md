<!-- generated -->
# GameDialogue

The line of a character in a dialogue: Speaker, Portrait (an image URL) and Text, typed out at Speed characters a second (0 shows it at once). A press, Enter or Space shows the rest of a line being typed. Then the Choices ([{ID, Text, Disabled}]) show as buttons (digits 1-9 choose too) and emit choose ({ID, Choice}); a line without choices emits next on a press of its continue button. A new Text starts typing again. Screen readers get the whole line at once. The keys it takes do not reach the shortcuts of the page.

## Properties

| Property | Default |
| --- | --- |
| `Speaker` | `''` |
| `Portrait` | `''` |
| `Text` | `''` |
| `Choices` | `[]` |
| `Speed` | `40` |

## Events

- `next`: The line without choices was read on (its continue button).
- `choose`: A choice was made: {ID, Choice}.

## Example

```example
<div class="elemenx-game-panel">
	<GameDialogue *if="Line" [speaker]="Line.Speaker" Portrait="/data/cards/mountains.svg" [text]="Line.Text" [choices]="Line.Choices || []" Speed="60" (next)="Next" (choose)="Chose" />
	<p *if="!Line" class="elemenx-text">{{Ending}} <Button Label="Again" Size="small" (click)="Again" /></p>
</div>
<script>
({
	Step: 0,
	Ending: '',
	Script: [
		{Speaker: 'Old sage', Text: 'Traveller! The northern road is closed: a storm came down from the peaks at dawn.'},
		{Speaker: 'Old sage', Text: 'Will you take the mountain pass, or wait out the storm at the inn?', Choices: [
			{ID: 'pass', Text: 'Take the mountain pass'},
			{ID: 'inn', Text: 'Wait at the inn'},
			{ID: 'guide', Text: 'Hire a guide (50 gold)', Disabled: true}
		]}
	],
	Line: null,

	$OnCreate: function () {
		this.Line = this.Script[0];
	},

	Next: function () {
		this.Step++;
		this.Line = this.Script[this.Step] || null;
	},

	Chose: function (choice) {
		this.Line = null;
		this.Ending = 'You chose: ' + choice.Choice.Text + '.';
	},

	Again: function () {
		this.Step = 0;
		this.Line = this.Script[0];
	}
})
</script>
```
