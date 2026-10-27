<!-- generated -->
# CallStage

The stage of a call: where its videos are and its bars. Slots: main (the video in front: the speaker, a screen shared), participants (their CallTiles), self (the own video, in a corner over the stage; it can be dragged to another corner), controls (a CallControls), side (a panel: the chat, the people; shown with Side), status (the time, the recording). Layout: grid (the participants in a grid of as many columns as they need, main in it when it has content), speaker (main large, the participants in a strip under it), screen (main large, the participants in a column beside it). The grid pages the participants past PerPage (the page with Page, the buttons by its side).

## Properties

| Property | Default |
| --- | --- |
| `Layout` | `'grid'` |
| `Side` | `false` |
| `PerPage` | `0` |
| `Page` | `0` |

## Events

- `page`: Another page of the grid was shown: {Page}.
- `corner`: The own video was dragged to another corner: {Corner}.

## Slots

`status`, `main`, `participants`, `self`, `side`, `controls`

## Example

```example
<RadioGroup Variant="segmented" Label="Layout" [options]="Layouts" [value]="Layout" (change)="Laid" />
<div style="height: 360px; margin-top: 12px;">
	<CallStage [layout]="Layout">
		<CallTile slot="main" Name="Ada Lovelace" Camera="false" Speaking="true" Pinned="true" />
		<CallTile slot="participants" *for="person of People" [name]="person" Camera="false" />
		<CallTile slot="self" Name="Me" Self="true" Camera="false" />
		<CallControls slot="controls" [hide]="['chat', 'people']" />
	</CallStage>
</div>
<script>
({
	Layout: 'speaker',
	Layouts: [{Value: 'grid', Label: 'Grid'}, {Value: 'speaker', Label: 'Speaker'}, {Value: 'screen', Label: 'Screen'}],
	People: ['Alan Turing', 'Grace Hopper', 'Edsger Dijkstra'],

	Laid: function (value) {
		this.Layout = value;
	}
})
</script>
```
