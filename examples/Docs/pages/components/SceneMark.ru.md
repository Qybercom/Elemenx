<!-- generated -->
# SceneMark

SceneMark: то, что внутри (любые компоненты ElemenxUI: карточка, полоска, график Chart или Sparkline, Meter), над местом сцены, в которой он объявлен, в её слоте hud:

```html
<Scene>
	<SceneMark slot="hud" For="earth" Line="true">
		<Card Title="Земля"><Sparkline [values]="Temperatures" /></Card>
	</SceneMark>
</Scene>
```

На каждом кадре сцена раскладывает его вместе с другими метками (SceneMarks, подписи объектов тоже среди них). For — объект (Part — гнездо его модели, Up — сколько его размеров над серединой) или Point [x, y, z] мира; Offset [x, y, z], Shift [x, y] пикселей, Align (bottom, top, center, left, right); Line (true, auto, false), Occlude (прятать за телами и рельефом), Edge (у края вида со стрелкой, когда место вне вида), Declutter (сдвигать с других меток), Cluster и ClusterRadius (близкие метки одного кластера — одна с бейджем +N), Near и Far (метры: гаснет с расстоянием), Priority. Key — его имя среди меток (иначе своё).

В демо Space (/graphics) переключатель Marks показывает карточки с графиками над Землёй и Марсом, шкалу над станцией, луны Юпитера кластером и Нептун у края со стрелкой.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Key` | `''` |
| `For` | `''` |
| `Part` | `''` |
| `Point` | `null` |
| `Up` | `1.15` |
| `Offset` | `null` |
| `Shift` | `null` |
| `Align` | `'bottom'` |
| `Line` | `'auto'` |
| `Occlude` | `''` |
| `Edge` | `false` |
| `Declutter` | `true` |
| `Cluster` | `''` |
| `ClusterRadius` | `36` |
| `Near` | `''` |
| `Far` | `0` |
| `Priority` | `0` |

## Слоты

по умолчанию

## Тесты

- [puts an element over its point, moves another off it with a line, and the names of the objects are marks too](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L89) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
- [follows its object as it goes round its star](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L136) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
- [hides one behind a body, one too far; one behind the eye shows at the edge with an arrow when it may](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L166) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
- [shows marks of a cluster near each other as one with a badge +N, a press on it told](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L200) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
- [lays out what a SceneMark holds over its object, as its props say](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L228) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
