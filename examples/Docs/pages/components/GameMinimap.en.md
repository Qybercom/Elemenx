<!-- generated -->
# GameMinimap

The frame of a minimap: the map in its default slot (an image, a canvas), round or square (Shape), Size pixels wide. Markers [{ID, X, Y, Kind, Icon, Label, Color}] stand at X and Y from 0 to 1 over the map (Kind quest, enemy, ally or point, for their color); a marker off the map waits on its edge, pointing the way. The player is an arrow in the middle turned to Heading degrees (Player false hides it); North puts the letter N on the frame. Title (the place) and Note (coordinates, the time) show on a band under the map. Zoomable adds + and - buttons. Events: zoom (1 or -1), marker (the marker pressed).

## Properties

| Property | Default |
| --- | --- |
| `Shape` | `'round'` |
| `Size` | `160` |
| `Markers` | `[]` |
| `Heading` | `0` |
| `Player` | `true` |
| `North` | `true` |
| `Title` | `''` |
| `Note` | `''` |
| `Zoomable` | `false` |
| `Label` | `''` |

## Events

- `marker`: A marker was pressed: the marker.
- `zoom`: A zoom button was pressed: 1 (in) or -1 (out).

## Slots

default

## Example

```example
<GameMinimap Size="160" Title="Northern woods" [note]="'412, 88 · ×' + Zoom" [markers]="Markers" Heading="35" Zoomable="true" (zoom)="Zoomed" (marker)="Chose"><img src="/data/cards/mountains.svg" alt="" [style.transform]="'scale(' + (1 + Zoom * 0.25) + ')'" /></GameMinimap>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Zoom: 2,
	Note: 'Press a marker; zoom with the buttons.',
	Markers: [
		{ID: 'elder', X: 0.3, Y: 0.35, Kind: 'quest', Label: 'The elder'},
		{ID: 'wolf', X: 0.7, Y: 0.6, Kind: 'enemy', Label: 'Grey wolf'},
		{ID: 'mira', X: 0.45, Y: 0.72, Kind: 'ally', Label: 'Mira'},
		{ID: 'pass', X: 0.95, Y: -0.2, Kind: 'quest', Label: 'The pass'}
	],

	Zoomed: function (step) {
		this.Zoom = Math.max(1, Math.min(4, this.Zoom + step));
	},

	Chose: function (marker) {
		this.Note = 'Marker: ' + marker.Label;
	}
})
</script>
```
