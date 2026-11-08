<!-- generated -->
# TextureLab

TextureLab: a bench for the textures of SceneTextures, to see one as sharp as the ground will have it and turn its params. Texture is its name; View tile (the tile Repeat times across, to find a seam or a grid) or ground (a plane under the eye at Height metres, looking down by Pitch degrees: what a walker sees of it, near and far); Mode lit, color, normal or height; Sun its elevation in degrees, Turn its azimuth. The panel beside picks them and a slider for each param of the recipe; change emits {Texture, Params} as they change. Methods: Draw(), Bake() (the tile again), Picture() (PNG as a data URL).

## Properties

| Property | Default |
| --- | --- |
| `Texture` | `'lawn'` |
| `View` | `'ground'` |
| `Mode` | `'lit'` |
| `Params` | `null` |
| `Sun` | `40` |
| `Turn` | `30` |
| `Repeat` | `2` |
| `Height` | `1.7` |
| `Pitch` | `30` |
| `Label` | `''` |

## Events

- `change`: A texture or a param changed: {Texture, Params}.

## Methods

- `Bake()`
- `Draw()`
- `Picture()`

## Tests

- [shows a texture in TextureLab as a tile or a ground, a slider for each param, and tells change](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneTextures/SceneTextures.test.js#L98) — `libraries/ElemenxGraphics/services/SceneTextures/SceneTextures.test.js`
