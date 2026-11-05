<!-- generated -->
# SceneWaves

SceneWaves: the waves of a sea as Gerstner waves, the same for the shader that draws them and for what floats on them. Make(settings) makes the waves of a sea state: {Swell (0 calm to 1.5 a storm, 0.35), Way (degrees the wind blows to, 30), Length (the length of the longest wave, 40 units), Choppy (0 to 1: how sharp their crests, 0.6), Count (up to 8), Seed}: {Waves: [{Way: [x, z], Length, Height, Sharp, Speed, Phase}], Count}. A calm sea (Swell 0) has none.

- At(made, x, z, time): the surface over a point: {Height, Normal, Crest (0 to 1: how much the water folds over itself there, where it breaks white)}. A wave moves the water round and round: the place under a point is found again.
- Values(made, time): the uniforms of the shader: uWaveA[8] (way, number, height), uWaveB[8] (sharpness, speed, phase), uWaveCount, uWaveTime.
- GLSL: the function of the shader, gerstner(vec2 place, float time, float far, float fade, out vec3 normal, out float crest): how far a point of a level sea moves; each wave fades with the distance as a pixel can no longer tell it, and all of them by fade (shallow water).

## Methods

- `Make(settings)`
- `At(made, x, z, time)`
- `Values(made, time)`

## Tests

- [makes the waves of a sea state: none on a calm sea, higher and longer as it gets wild, the same for the same seed](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js#L47) — `libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js`
- [tells the surface over a point as the shader moves it: its height, its normal, where it breaks](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js#L62) — `libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js`
- [draws the sea as a grid of waves round the eye, mirrored by its level at high quality, over what is behind with no gloss left](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js#L91) — `libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js`
- [goes under the sea when what the eye looks at is under it: the water fogs what it sees, its surface seen from below](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js#L141) — `libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js`
- [mirrors the sea by its level at high quality only](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js#L210) — `libraries/ElemenxGraphics/services/SceneWaves/SceneWaves.test.js`
- [floats on the waves of the sea, goes under its motor and its rudder, and leaves foam behind it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneVehicles/SceneVehicles.test.js#L61) — `libraries/ElemenxGraphics/traits/SceneVehicles/SceneVehicles.test.js`
