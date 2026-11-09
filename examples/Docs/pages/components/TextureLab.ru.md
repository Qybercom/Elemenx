<!-- generated -->
# TextureLab

Стенд для текстур SceneTextures: увидеть текстуру такой резкой, какой её получит земля, и покрутить её параметры.

- Texture — имя текстуры.
- View — tile (плитка Repeat раз по высоте, чтобы найти шов или сетку; меньше 1 — ближе, как фотография) или ground (плоскость под глазом на высоте Height метров, взгляд вниз на Pitch градусов: что видит идущий по ней, вблизи и вдали).
- Mode — lit (со светом), color, normal или height.
- Sun — высота солнца в градусах, Turn — его азимут.
- Params — значения параметров рецепта ({Name: value}); остальные — как в рецепте.

Панель сбоку выбирает всё это, по ползунку на каждый параметр рецепта. Событие change сообщает {Texture, Params}, когда они меняются. Методы: Draw(), Bake() (плитка заново), Picture() (PNG как data URL).

## Свойства

| Свойство | По умолчанию |
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

## События

- `change`

## Методы

- `Bake()`
- `Draw()`
- `Picture()`

## Тесты

- [shows a texture in TextureLab as a tile or a ground, a slider for each param, and tells change](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneTextures/SceneTextures.test.js#L149) — `libraries/ElemenxGraphics/services/SceneTextures/SceneTextures.test.js`
