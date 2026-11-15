<!-- generated -->
# ViewActions

The actions of the view of an editor in a bar over its bottom, for a mouse and for fingers alike: Items [{ID, Icon, Label, Disabled, Danger}] are buttons that tell act ({ID}); Hand (true or false; null leaves it out) is a toggle that gives one finger to the camera (two fingers move it always), told by hand ({Hand}). Label names the bar for screen readers. SceneEditor, ModelEditor and PlanetEditor have it, their context menu the same actions.

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Hand` | `null` |
| `Label` | `''` |

## Events

- `hand`: The toggle of one finger for the camera: {Hand}.
- `act`: An action was pressed: {ID}.
