<!-- generated -->
# FloraEditor

FloraEditor: вид растения по его фотографии (SceneFlora). Фото растения на белом или прозрачном фоне читается: голый ствол, профиль кроны по высоте, её ширина, наклон и просветы, цвета листвы (в тени, средний, на свету) и коры (внизу и вверху) — найденное рисуется поверх фото (строки кроны красным, начало кроны синим, ствол жёлтым). Растение сразу вырастает в 3D рядом; каждое его число — на ползунке (в том числе свисание листвы, узкие листья, цветы и плоды, листья от земли, размер и доля соцветий у стеблей), цвета — в палитре (и цвета цветов и плодов), можно загрузить свои картинки коры и листвы. «Определить модель» делает его моделью SceneModels под именем Name — её сеют сцены, как любое растение.

- Species — вид, с которого начинают (любой вид SceneFlora: pine, oak, willow, apple…): от него берётся всё, чего фото не говорит (как растёт, высота, вид листвы и коры).
- Preset — свой пресет SceneFlora вместо вида (объект или его JSON).
- Variant — какой экземпляр вида показан (0 и дальше; стрелки на панели).
- Name — имя модели, которую делает Define.
- События: change {Preset} при каждом изменении, define {Name} после Define.
- Методы: Current() — пресет как он есть сейчас; Analyse(picture) — пресет по картинке {Width, Height, Data} (null, если растения на ней нет); Grow() — вырастить вид заново; Define(name) — модель SceneModels.

На фото может быть несколько растений в ряд: берётся самое крупное — каждое отделяется по своему стволу у земли (то, что не поднимается от земли хотя бы на десятую часть высоты, вроде надписи или фигурки человека, стволом не считается), а растение — то, что связано со своим стволом. Свои картинки: кора — по окружности ствола и вверх по высоте растения, листва — атлас 512×1024 как у SceneFlora (четыре ветки сверху, они же в тени снизу). Вид в 3D не хранится в кэше браузера (Keep: false), определённая модель — хранится.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Species` | `'oak'` |
| `Preset` | `null` |
| `Variant` | `0` |
| `Name` | `'flora-custom'` |
| `Label` | `''` |
| `Size` | `10` |

## События

- `change`
- `define`

## Методы

- `Current()`
- `Analyse(picture)`
- `Grow()`
- `Define(name)`

## Тесты

- [starts of its species, reads a picture into its preset, its numbers on sliders, and grows the plant in its view](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/FloraEditor/FloraEditor.test.js#L68) — `libraries/ElemenxGraphics/components/FloraEditor/FloraEditor.test.js`
- [turns a number of its preset on a slider, emits change, and defines the model under Name](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/FloraEditor/FloraEditor.test.js#L99) — `libraries/ElemenxGraphics/components/FloraEditor/FloraEditor.test.js`
