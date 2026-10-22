<!-- generated -->
# ProfileCard

The card of a person: a Cover (an image, or Color), the Avatar (or initials) with its Status (online, away, busy or offline), Name (Verified), Role, Bio, Stats ([{Label, Value}]; numbers are shortened: 12.4K) and the buttons Follow (Following) and Message. Layout: card, or compact (one row for lists: avatar, name, role and Follow). Variant and Href as in Card. The default slot adds content under the bio. Events: follow ({Following}), message.

## Properties

| Property | Default |
| --- | --- |
| `Name` | `''` |
| `Role` | `''` |
| `Bio` | `''` |
| `Avatar` | `''` |
| `Cover` | `''` |
| `Color` | `''` |
| `Status` | `''` |
| `Verified` | `false` |
| `Stats` | `[]` |
| `Follow` | `true` |
| `Following` | `false` |
| `Message` | `true` |
| `Layout` | `'card'` |
| `Variant` | `'outlined'` |
| `Href` | `''` |
| `FollowLabel` | `''` |
| `FollowingLabel` | `''` |
| `MessageLabel` | `''` |
| `VerifiedLabel` | `''` |

## Events

`follow`, `message`

## Slots

default

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px; align-items: flex-start;">
	<div style="width: 300px;"><ProfileCard Name="Ada Lovelace" Role="Analyst" Status="online" Verified="true" Cover="/data/cards/sea.svg" Bio="Writes the notes on the engine." [stats]="[{Label: 'Posts', Value: 312}, {Label: 'Followers', Value: 12400}, {Label: 'Following', Value: 87}]" [following]="Following" (follow)="Followed" (message)="Messaged" /></div>
	<div style="width: 360px;"><ProfileCard Layout="compact" Name="Alan Turing" Role="Engineer" Status="away" /></div>
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Following: false,
	Note: 'Press Follow or Message.',

	Followed: function (event) {
		this.Following = event.Following;
		this.Note = event.Following ? 'Following' : 'Not following';
	},

	Messaged: function (event) {
		this.Note = 'A message to ' + event.Name;
	}
})
</script>
```
