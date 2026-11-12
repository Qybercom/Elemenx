<!-- generated -->
# FloraEditor

FloraEditor: a species of plant of a picture of it (SceneFlora): a photograph of a plant on white or clear is read for its bare trunk, the profile of its crown and the colors of its leaves and of its bark (FromPicture, its outline drawn over it), and the plant grown of that seen at once in 3D, each of its numbers on a slider, its colors picked, its own pictures of bark and leaves loaded; Define makes it a model of SceneModels under Name, as the scenes sow it. Species: the preset it starts of (a species of SceneFlora: pine, oak, willow, apple...); Preset: one given instead (an object or its JSON); Variant: which plant of the species the view shows; Name: the model Define makes. Events: change {Preset} as it changes, define {Name}. Methods: Current() (the preset as it is now), Analyse(picture) ({Width, Height, Data}: the preset of a picture, null when it holds no plant), Grow() (the view again), Define(name).

## Properties

| Property | Default |
| --- | --- |
| `Species` | `'oak'` |
| `Preset` | `null` |
| `Variant` | `0` |
| `Name` | `'flora-custom'` |
| `Label` | `''` |
| `Size` | `10` |

## Events

`change`, `define`

## Methods

- `Current()`
- `Analyse(picture)`
- `Grow()`
- `Define(name)`

## Tests

- [starts of its species, reads a picture into its preset, its numbers on sliders, and grows the plant in its view](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/FloraEditor/FloraEditor.test.js#L68) — `libraries/ElemenxGraphics/components/FloraEditor/FloraEditor.test.js`
- [turns a number of its preset on a slider, emits change, and defines the model under Name](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/FloraEditor/FloraEditor.test.js#L99) — `libraries/ElemenxGraphics/components/FloraEditor/FloraEditor.test.js`
