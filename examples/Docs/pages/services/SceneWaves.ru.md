<!-- generated -->
# SceneWaves

SceneWaves: волны моря как волны Герстнера — одни и те же для шейдера, который их рисует, и для того, что на них плавает. Make(settings) делает волны состояния моря: {Swell (от 0 — штиль до 1.5 — шторм, 0.35), Way (градусы, куда дует ветер, 30), Length (длина самой длинной волны, 40 единиц), Choppy (от 0 до 1: насколько острые гребни, 0.6), Count (до 8), Seed}: {Waves: [{Way: [x, z], Length, Height, Sharp, Speed, Phase}], Count}. У спокойного моря (Swell 0) волн нет.

- At(made, x, z, time): поверхность над точкой: {Height, Normal, Crest (от 0 до 1: насколько вода там заворачивается сама на себя — где волна разбивается в пену)}. Волна гоняет воду по кругу: место под точкой находится заново.
- Values(made, time): uniform шейдера: uWaveA[8] (направление, волновое число, высота), uWaveB[8] (острота, скорость, фаза), uWaveCount, uWaveTime.
- GLSL: функция шейдера gerstner(vec2 place, float time, float far, float fade, out vec3 normal, out float crest): насколько сдвигается точка ровного моря; каждая волна гаснет с расстоянием, когда пиксель уже не может её передать, и все вместе — по fade (мелкая вода).

Сцена берёт волны своего моря из Swell и SwellWay земли (в дождь море сильнее), рисует море сеткой вокруг глаза, а лодка (транспорт Kind boat, Physics.Boat) держится на тех же волнах.

## Методы

- `Make(settings)`
- `At(made, x, z, time)`
- `Values(made, time)`

## Тесты

- [makes the waves of a sea state: none on a calm sea, higher and longer as it gets wild, the same for the same seed](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js#L47) — `libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js`
- [tells the surface over a point as the shader moves it: its height, its normal, where it breaks](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js#L62) — `libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js`
- [draws the sea as a grid of waves round the eye, mirrored by its level at high quality, over what is behind with no gloss left](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js#L91) — `libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js`
- [goes under the sea when what the eye looks at is under it: the water fogs what it sees, its surface seen from below](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js#L141) — `libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js`
- [mirrors the sea by its level at high quality only](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js#L219) — `libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js`
- [floats on the waves of the sea, goes under its motor and its rudder, and leaves foam behind it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneVehicles/SceneVehicles.test.js#L61) — `libraries/ElemenxGraphics/traits/SceneVehicles/SceneVehicles.test.js`
