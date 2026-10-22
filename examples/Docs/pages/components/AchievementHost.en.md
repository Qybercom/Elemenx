<!-- generated -->
# AchievementHost

Shows the achievements of the Achievements Service, one at a time, over the whole page, as a game console does: a round badge pops up, opens into a band with the title (a light runs over it), and folds back into the badge before it goes. Place one in the layout of the Application. Placement: bottom (the default) or top, at the middle of the viewport. A press on the band dismisses it.

## Properties

| Property | Default |
| --- | --- |
| `Placement` | `'bottom'` |

## Example

```example
<Button Label="Unlock an achievement" Icon="trophy" Variant="primary" (click)="Unlock" />
<AchievementHost />
<script>
({
	Count: 0,

	Unlock: function () {
		var rarities = ['common', 'rare', 'epic', 'legendary'];

		this.Count++;

		this.$Service('Achievements').Show({
			Title: 'Reader ' + this.Count,
			Text: 'You opened ' + this.Count + ' pages of the reference.',
			Rarity: rarities[(this.Count - 1) % rarities.length],
			Points: this.Count * 10,
			Duration: 4000
		});
	}
})
</script>
```
