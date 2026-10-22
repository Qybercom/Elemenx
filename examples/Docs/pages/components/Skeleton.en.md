<!-- generated -->
# Skeleton

A placeholder of content that loads: grey shapes that shimmer, in the place and the size of what will come. Shape: text (Lines lines, the last one shorter), rect (a picture, a card) or circle (an avatar); Width and Height in CSS units ('100%', '48px'). Put several together for the skeleton of a card or a row.

## Properties

| Property | Default |
| --- | --- |
| `Shape` | `'text'` |
| `Lines` | `3` |
| `Width` | `''` |
| `Height` | `''` |

## Example

```example
<div class="elemenx-card docs-stack" style="padding: 12px; max-width: 360px;" *if="Loading">
	<div class="elemenx-container" style="gap: 8px;"><Skeleton Shape="circle" Width="40px" Height="40px" /><Skeleton Lines="2" Width="200px" /></div>
	<Skeleton Shape="rect" Height="120px" />
	<Skeleton Lines="3" />
</div>
<div class="elemenx-card docs-stack" style="padding: 12px; max-width: 360px;" *if="!Loading">
	<div class="elemenx-container" style="gap: 8px;"><Avatar Name="Ada Lovelace" /><strong>Ada Lovelace</strong></div>
	<img src="/data/cards/mountains.svg" alt="" style="width: 100%; height: 120px; object-fit: cover;" />
	<p class="elemenx-text">The card has loaded.</p>
</div>
<Button [label]="Loading ? 'Show the content' : 'Show the skeleton'" (click)="Toggle" />
<script>
({
	Loading: true,

	Toggle: function () {
		this.Loading = !this.Loading;
	}
})
</script>
```
