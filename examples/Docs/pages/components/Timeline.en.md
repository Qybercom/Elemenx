<!-- generated -->
# Timeline

A line of time: its scale (ticks with their labels, chosen for the span in view: seconds to centuries, or numbers), its marks (a moment with a label above or under it: the labels of marks close together stack in rows instead of covering each other, a thin leader to their point), its ranges (from a moment to another, in lanes with their labels at the start, as a Gantt chart has them; the ones that overlap in rows of their lane), its progress (filled up to a moment, and a lighter Buffer) and a playhead, and the line of now.

Start and End are the whole line; From and To the part in view (all of it by default). Scale: time (dates: YYYY-MM-DD, YYYY-MM-DDTHH:mm, a Date, milliseconds) or number (seconds of a video, steps: Unit names them, Format writes them); by default the one of Start. Orientation horizontal or vertical. Marks [{ID, At, Label, Text, Icon, Tone, Side, Element, Render}], Ranges [{ID, From, To, Label, Tone, Color, Lane, Element, Render}], Lanes [{ID, Label}], Progress (a moment, or {To, Buffer}), Playhead (a moment; Seekable shows it and lets it be moved), Now (the line of now). The same declared inside it: TimelineMark, TimelineRange (any content inside them is their label), TimelineLane, TimelineProgress.

Interaction: Ctrl (or ⌘) with the wheel, a pinch or the buttons (Controls) zoom at the pointer, between MinSpan and the whole line; Shift with the wheel, a sideways wheel, a drag of the empty line or the middle button move it; the arrows move it too, + and - zoom, 0 shows it all; a press on the axis seeks (Seekable: the playhead follows the pointer). Marks and ranges are buttons: a press or Enter selects them, the arrows go from one to the next, a tip shows them whole. Overview shows a strip of the whole line beside it, its marks and ranges small, a frame on the part in view: a drag of the frame moves the view, a drag of an edge of it zooms, a press elsewhere on the strip centers the view there. Editable: a mark or a range is dragged in time, a range by its edges too, a new range drawn on an empty lane; Alt with the arrows moves the one with the focus, by Snap (minute, hour, day, week, month, year, or a number: milliseconds or units of the scale; by default the step of the ticks). Escape cancels a drag. The Timeline does not change its data itself: its events ask the owner to.

Events: select ({Kind: mark or range, ID, Item}), seek ({At}), view ({From, To}), move ({Kind, ID, Item, At} of a mark, {Kind, ID, Item, From, To} of a range), resize ({ID, Item, From, To}), create ({Lane, From, To}). The moments it tells are of the kind of Start: a date (YYYY-MM-DD when its snap is a day or more) or a number.

## Properties

| Property | Default |
| --- | --- |
| `Start` | `''` |
| `End` | `''` |
| `From` | `''` |
| `To` | `''` |
| `Scale` | `''` |
| `Orientation` | `'horizontal'` |
| `Marks` | `[]` |
| `Ranges` | `[]` |
| `Lanes` | `[]` |
| `Progress` | `null` |
| `Playhead` | `null` |
| `Seekable` | `false` |
| `Now` | `false` |
| `Editable` | `false` |
| `Snap` | `''` |
| `MinSpan` | `0` |
| `Unit` | `''` |
| `Format` | `null` |
| `Controls` | `true` |
| `Overview` | `false` |
| `Label` | `''` |

## Events

- `view`: The part in view changed: {From, To}.
- `select`: A mark or a range was pressed: {Kind (mark or range), ID, Item}.
- `seek`: The line or the playhead was pressed or dragged: {At}.
- `create`: A range was drawn on a lane: {Lane, From, To}.
- `move`: A mark or a range was dragged: {Kind, ID, Item, At} for a mark, {Kind, ID, Item, From, To} for a range.
- `resize`: An edge of a range was dragged: {ID, Item, From, To}.

## Slots

default

## Example

```example
<Timeline Start="2026-01-01" End="2026-12-31" [marks]="Marks" [ranges]="Ranges" [lanes]="Lanes" Overview="true" Editable="true" Snap="day" (move)="Moved" (resize)="Moved" (select)="Selected" />
<p>{{Note}}</p>
<Timeline Start="0" End="300" Unit="s" [playhead]="At" Seekable="true" (seek)="Seek">
	<TimelineProgress [to]="At" Buffer="120" />
	<TimelineMark ID="intro" At="0" Label="Intro" />
	<TimelineMark ID="goal" At="95" Tone="success"><strong>Goal!</strong></TimelineMark>
	<TimelineMark ID="replay" At="100" Label="Replay" Side="before" />
	<TimelineRange ID="ad" From="150" To="180" Label="Ad" Tone="danger" />
</Timeline>
<script>
({
	Note: 'Drag a range, its edges or a mark',
	At: 40,
	Lanes: [{ID: 'design', Label: 'Design'}, {ID: 'build', Label: 'Build'}],
	Ranges: [
		{ID: 'research', From: '2026-01-12', To: '2026-03-20', Label: 'Research', Lane: 'design'},
		{ID: 'core', From: '2026-03-02', To: '2026-08-28', Label: 'Core', Lane: 'build', Tone: 'info'}
	],
	Marks: [
		{ID: 'alpha', At: '2026-05-04', Label: 'Alpha'},
		{ID: 'demo', At: '2026-05-08', Label: 'Demo day', Tone: 'success'}
	],

	Moved: function (event) {
		var list = event.Kind === 'mark' ? 'Marks' : 'Ranges';

		this[list] = this[list].map(function (item) {
			return item.ID === event.ID ? Object.assign({}, item, event.Kind === 'mark' ? {At: event.At} : {From: event.From, To: event.To}) : item;
		});
		this.Note = event.ID + ': ' + (event.At || event.From + ' – ' + event.To);
	},

	Selected: function (event) {
		this.Note = 'Selected: ' + event.ID;
	},

	Seek: function (event) {
		this.At = event.At;
	}
})
</script>
```

## Tests

- [timeline draws its scale, stacks close labels, edits ranges, zooms and seeks](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5916) — `tests/examples/ui-kit.spec.js`
