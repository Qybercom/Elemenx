<!-- generated -->
# CallInvite

An invitation to a call, as a messenger shows it: the picture and the name of who calls, what kind of call, and the buttons to accept it (with the camera too when Video) or to decline it. In a card of Native.Notify (Component CallInvite, Look elemenx, Bare, Priority high, Timeout 0, a Sound with Loop) its Notification takes the choice: the notification event with the Action accept, accept-video or decline. Alone in a page its events are accept ({Video}) and decline. Name, Image (the URL of the picture; none: the avatar of the name), Text (the kind of the call, Incoming call by default), Video.

## Properties

| Property | Default |
| --- | --- |
| `Name` | `''` |
| `Image` | `''` |
| `Text` | `''` |
| `Video` | `false` |
| `Notification` | `null` |
