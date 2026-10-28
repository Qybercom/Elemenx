<!-- generated -->
# Ruler

A ruler, as the rulers of an editor of pages or pictures: Orientation horizontal (along the top) or vertical (along the side), ticks every Step pixels and a longer one with its number every Major (both in the units of the ruler, shown at Scale: 2 draws them twice as far apart). Start is the value at its start (a page scrolled by 120 starts at 120). Marker marks a value (the pointer), Range a span {From, To} (the selected element), Guides the values of the guides. A press on the ruler pulls a guide out of it: pull ({Value, ClientX, ClientY}) asks the owner to follow the pointer with one.

## Properties

| Property | Default |
| --- | --- |
| `Orientation` | `'horizontal'` |
| `Start` | `0` |
| `Scale` | `1` |
| `Step` | `10` |
| `Major` | `100` |
| `Marker` | `null` |
| `Range` | `null` |
| `Guides` | `[]` |

## Events

- `pull`: A guide is pulled out of the ruler: {Value, ClientX, ClientY}.

## Example

```example
<div class="docs-stack" style="gap: 8px;">
	<div style="height: 20px;" (pointermove)="Moved">
		<Ruler [start]="Start" [marker]="Marker" [range]="{From: 40, To: 200}" [guides]="Guides" (pull)="Pulled" />
	</div>
	<label class="elemenx-text small">Start <input class="elemenx-input" type="range" min="0" max="400" step="10" [value]="Start" (input)="Scrolled"></label>
	<p class="elemenx-text small muted">Guides: {{Guides.join(', ') || 'none'}} (press the ruler to add one)</p>
</div>
<script>
({
	Start: 0,
	Marker: null,
	Guides: [300],

	Moved: function (event, node) {
		this.Marker = Math.round(this.Start + event.clientX - node.getBoundingClientRect().left);
	},

	Scrolled: function (event) {
		this.Start = Number(event.target.value);
	},

	Pulled: function (event) {
		this.Guides = this.Guides.concat([event.detail.Value]);
	}
})
</script>
```

## Tests

- [Ruler labels its Major ticks from Start at its Scale, and a press pulls a guide out with the value under the pointer](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L276) — `tests/regression/library-controls.test.js`
