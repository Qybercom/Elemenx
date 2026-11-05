<!-- generated -->
# SceneFootings

The footings of a Scene: the ground gives way under what stands on it. When the World of a ground has the step Footings, each building (an object whose model is of the Type building, or any object told Footing: true; Footing: false keeps the ground as it is) gets a level place under it: its footprint (the box of its model over the ground, its Size and Facing, Margin metres more round it) at the height the ground has there (Mode: mean, low or high of it), the ground coming softly to it within Edge metres. They are a layer of the sketch of the ground (plateau areas, over the roads), so a building moved makes the ground again only where it was and where it goes. FootingsOf() gives the places made: [{ID, Points, Height}].

## Methods

- `FootingsOf()`

## Tests

- [levels the ground under each building of a World with Footings, softly round it, and nowhere else](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneFootings/SceneFootings.test.js#L59) — `libraries/ElemenxGraphics/traits/SceneFootings/SceneFootings.test.js`
- [takes no footing without the step, and follows a building moved](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneFootings/SceneFootings.test.js#L104) — `libraries/ElemenxGraphics/traits/SceneFootings/SceneFootings.test.js`
