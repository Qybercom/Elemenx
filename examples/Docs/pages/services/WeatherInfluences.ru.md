<!-- generated -->
# WeatherInfluences

WeatherInfluences: то, что делают с погодой планеты в каком-то месте на какое-то время, поверх её прогноза (SceneForecast): затравка грозы, противоградовая ракета, засев облаков, разгон облаков, туман после грозы. Влияние — это данные, без состояния: {ID, Kind, Direction (единичное направление его середины в системе тела, где оно началось), Radius (км), Start и Length (дни сцены), Strength, Seed}.

Что делает вид влияния, задаёт его граф (resources/weather/influences.json: Graph, Hours, Radius, Strength, Spawns; графы blueprints/weather/influence/<вид>): по месту (Near — расстояние от середины в долях радиуса), возрасту (Age — доля жизни) и силе (Strength) он даёт прибавку к прогнозу этого места — Cover, Rain, Kind, Cirrus, Fog (каждая от −1 до 1). Середина влияния сносится ветром прогноза: wind(way, days) — касательное направление, куда идёт воздух, в радианах в сутки. Кончаясь, влияние может оставить другие (Spawns: {Kind, At — доля его жизни, Hours, Radius и Strength в долях его}); они выводятся из него и не хранятся, поэтому один и тот же список даёт одну и ту же погоду в любой момент, вперёд и назад.

- Kinds() — виды из ресурса.
- Make(kind, way, days, options) — влияние вида из направления в момент (options: Radius, Hours, Strength, ID, Seed).
- Center(one, days, wind) — его середина в момент, снесённая ветром.
- Expand(list, days, wind) — те, что идут в этот момент, вместе с оставленными ими.
- Apply(over, way, days, list, wind, radiusKm) — прогноз места (Cover, Kind, Cirrus, Rain, Fog…) с тем, что делают там влияния над ним.

Сцена хранит влияния своих планет (Scene.Influence, Influences, событие influence, Save и Load) и применяет их к прогнозу места (WeatherOver), над поверхностью и в локации.

## Методы

- `Kinds()`
- `Make(kind, way, days, options)`
- `Center(one, days, wind)`
- `Expand(list, days, wind)`
- `Apply(over, way, days, list, wind, radiusKm)`

## Тесты

- [has its kinds of the resource, each of a graph, how long, how wide and how strong](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js#L16) — `libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js`
- [makes an influence of a kind at a way and a time, its own values over those of its kind](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js#L24) — `libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js`
- [adds to the forecast of a place within its radius as it lives, nothing past it, and takes away of its kind](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js#L30) — `libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js`
- [leaves the influences of its kind when it ends, made of it: a fog after a storm](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js#L48) — `libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js`
- [drifts with the wind it is given, as long as it lives](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js#L59) — `libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js`
