<!-- generated -->
# SceneForecast

Погода планеты из одного источника — функций на языке ядра Elemenx.Compilers (Kernel) поверх шума значений ядра сервиса Noise: одни и те же на странице и в шейдере. Из её блоков собран граф чисел Blueprints `blueprints/shader/forecast` (`ForecastGraph` у Scene): шейдер, который запекает погоду планеты (WEATHER), и страница, которая спрашивает погоду над наблюдателем (`Scene.WeatherOver`), читают одну и ту же карту.

Функции: `wx_wind` (ветер в направлении — струи поясов, десять штормов, закручивающих воздух вокруг глаза и живущих неделю, вихри шума; и сила шторма там), `wx_air` (откуда пришёл воздух: фронты и струи в несколько сотен км, вытянутые по ветру, их середина, шторм), `wx_fronts` (облачные листы фронта и влажность воздуха — пояса, суша, подъём на хребет), `wx_heaps` (кучевые от дневного тепла и вид облаков), `wx_cirrus`, `wx_rain`, `wx_shroud` (покров, вид, перистые и дождь; сплошная пелена у облачного мира и ничего у мира без облаков).

Блоки графа (генератор): ForecastStorms, ForecastFronts, ForecastHeaps, ForecastCirrus, ForecastRain, ForecastShroud; их пороги и масштабы — свойства. `Code()` — ядро в js (собирается на странице); `IR()` — его модуль IR вместе с функциями шума (для Blueprints.Numeric). `Air`, `Fronts`, `Heaps`, `Cirrus`, `Rain`, `Shroud` — то же на странице.

Wind(p, days, seed, radiusKm, eddy, cells) — ветер над направлением тела в момент: [x, y, z — касательное направление, куда идёт воздух, в радианах в сутки, сила бури там]. По нему сносятся влияния на погоду (WeatherInfluences).

## Методы

- `Code()`
- `IR()`
- `Air(p, days, seed, radiusKm, scale, fine, eddy, cells)`

## Тесты

- [bakes the weather of a planet as its time goes, and draws its clouds over the surface as a shell of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L1623) — `tests/regression/library-scene-landing.test.js`
- [makes the weather of a planet a graph of numbers: its shader and the page give the same cover, kind, cirrus and rain](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneBlueprints/SceneBlueprints.test.js#L336) — `libraries/ElemenxGraphics/services/SceneBlueprints/SceneBlueprints.test.js`
- [takes blocks of numbers of other Libraries into a graph of numbers (Numeric of a definition, its Kernel once)](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneBlueprints/SceneBlueprints.test.js#L419) — `libraries/ElemenxGraphics/services/SceneBlueprints/SceneBlueprints.test.js`
