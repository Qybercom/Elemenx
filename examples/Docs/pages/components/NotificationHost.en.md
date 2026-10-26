<!-- generated -->
# NotificationHost

The notifications of the Application drawn by ElemenxUI (Native.Notify with Look elemenx): cards of Items ([{ID, Title, Text, Icon, Image, Variant, Actions: [{ID, Label}], Progress, Duration, Stamp, Component, Props, Bare}]), the newest next to the corner, in the window by the corner of the screen of a program or in the corner of the page on the web (Page, Corner). A card with a Duration shows the time it has left, held while the pointer is over it (Hold(item), Release(item)); Progress (0 to 1) draws a bar of a task. A card of a Component of the Application holds it with its Props and Notification ({ID, Choose(action), Close()}): an invitation to a call, say (CallInvite); Bare leaves it without the frame of a card. More is the number of the cards past the limit. Choose(item, action) is called with a press on a card (action null) or on one of its buttons, Close(item) with its close button. The theme draws them: the elemenx-notification classes and the tokens of the surface.

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `More` | `0` |
| `Page` | `false` |
| `Corner` | `'bottom-right'` |
| `Choose` | `null` |
| `Close` | `null` |
| `Hold` | `null` |
| `Release` | `null` |
