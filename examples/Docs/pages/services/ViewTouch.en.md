<!-- generated -->
# ViewTouch

ViewTouch: the fingers on the view of an editor (SceneEditor, ModelEditor, PlanetEditor). One finger edits as the left button of a mouse does; two fingers move the camera (pan, pinch, rotate, tilt, as Gestures tells them) and never edit; a mouse and a pen go to the editor as they come.

- Make(options) gives {Down(event), Move(event), Up(event), Reset()} for the pointer events of the view. Options: Edit {Down, Move, Up} (the handlers of the editor), Camera(gesture) (a gesture of the fingers that move the camera), Abort() (an edit a second finger came late to: the editor lets it go), OneFinger() (true: one finger moves the camera too, the edits wait for a mouse), Wait (ms a finger waits for a second one before it edits: 120), Slop (px it may move meanwhile: 8). A finger that waited reaches the editor as an event of its own (the coordinates, the target and the currentTarget of the first; button 0).
- Orbit(scene, gesture, options) moves the camera of a Scene round what it looks at, by a gesture: one finger (or a rotate, a tilt) turns it round, two carry it aside, a pinch brings it nearer. Options: Near (the nearest distance: 0.3), Far (100000).

## Methods

- `Make(options)`
- `Orbit(scene, gesture, options)`

## Tests

- [gives a mouse to the editor as it comes](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js#L57) — `libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js`
- [lets one finger edit after it waited for a second one, at once when it moves or lifts](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js#L68) — `libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js`
- [gives two fingers to the camera, the editor never seeing the first when the second came soon](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js#L97) — `libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js`
- [lets an edit go when a second finger comes late to it, and the camera has the fingers till all lift](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js#L116) — `libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js`
- [gives one finger to the camera too when OneFinger says so](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js#L132) — `libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js`
- [Orbit turns the camera of a scene round what it looks at, carries it aside and brings it nearer](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js#L154) — `libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js`
