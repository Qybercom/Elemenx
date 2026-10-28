<!-- generated -->
# CallInvite

An invitation to a call, as a messenger shows it: the picture and the name of who calls, what kind of call, and the buttons to accept it (with the camera too when Video) or to decline it. In a card of Platform.Notify (Component CallInvite, Look elemenx, Bare, Priority high, Timeout 0, a Sound with Loop) its Notification takes the choice: the notification event with the Action accept, accept-video or decline. Alone in a page its events are accept ({Video}) and decline. Name, Image (the URL of the picture; none: the avatar of the name), Text (the kind of the call, Incoming call by default), Video.

## Properties

| Property | Default |
| --- | --- |
| `Name` | `''` |
| `Image` | `''` |
| `Text` | `''` |
| `Video` | `false` |
| `Notification` | `null` |

## Example

```example
<div style="max-width: 360px;">
	<CallInvite Name="Grace Hopper" Video="true" (accept)="Accepted" (decline)="Declined" />
</div>
<p class="elemenx-text small muted">{{Answer}}</p>
<script>
({
	Answer: 'Waiting for an answer',

	Accepted: function (event) {
		this.Answer = event.Video ? 'Accepted with the camera' : 'Accepted';
	},

	Declined: function () {
		this.Answer = 'Declined';
	}
})
</script>
```

## Tests

- [draws a card of a Component of its own, as an invitation to a call: over the limit, its sound until it goes, its choice told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-notify.test.js#L284) — `tests/regression/native-notify.test.js`
