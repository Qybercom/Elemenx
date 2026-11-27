<!-- generated -->
# BlueprintPreview

Что даёт граф Blueprints, который строит данные, нарисованное плоско по мере правки: у облака (CloudBlueprints) — его точки, повёрнутые вокруг высоты (перетаскивание поворачивает; Turn и Pitch в радианах), каждая своего цвета и яркости, тем крупнее, чем больше её размер; у облака без мест — его поля (Distance и Anomaly вокруг середины, иначе первые два по ширине и высоте); у сети (NetworkBlueprints) — её пути, каждый цвета своего класса, тем шире, чем больше по нему течёт, на глобусе повёрнутые как облако, на земле — вид сверху (Inputs — что ей передано, иначе образец каждого её входа); у раскладки (LayoutBlueprints) — её улицы, стены, дороги и съезды, участки и дома на образце (город, деревня или пересечение дорог её формы), вид сверху (Drawing); у картинки (ImageBlueprints) — сама картинка, во весь размер, какой помещается. Graph — граф (объект, его JSON или имя ресурса), Parameters — с чем он запускается, Height — высота в пикселях (ширина — по месту); Label называет его для экранных чтецов. Граф, который не строится, говорит почему. О том, что нарисовано, сообщает событие drawn ({Kind, Count}).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Graph` | `null` |
| `Parameters` | `null` |
| `Inputs` | `null` |
| `Turn` | `0.4` |
| `Pitch` | `0.35` |
| `Height` | `280` |
| `Label` | `''` |
| `Note` | `''` |
| `Kind` | `''` |

## События

- `drawn`

## Тесты

- [draws what a cloud graph gives in BlueprintPreview, and tells it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/CloudBlueprints/CloudBlueprints.test.js#L151) — `libraries/ElemenxGraphics/services/CloudBlueprints/CloudBlueprints.test.js`
- [shows a picture in BlueprintPreview](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ImageBlueprints/ImageBlueprints.test.js#L86) — `libraries/ElemenxGraphics/services/ImageBlueprints/ImageBlueprints.test.js`
- [draws what a layout gives, of a settlement, a village and an interchange, and BlueprintPreview shows it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/LayoutBlueprints/LayoutBlueprints.test.js#L117) — `libraries/ElemenxGraphics/services/LayoutBlueprints/LayoutBlueprints.test.js`
- [gives a sample of the inputs of a graph to be seen, and draws it in BlueprintPreview](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/NetworkBlueprints/NetworkBlueprints.test.js#L103) — `libraries/ElemenxGraphics/services/NetworkBlueprints/NetworkBlueprints.test.js`
