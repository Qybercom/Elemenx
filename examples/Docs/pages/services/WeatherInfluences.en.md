<!-- generated -->
# WeatherInfluences

WeatherInfluences: what is done to the weather of a planet in a place for a while, over its forecast (SceneForecast): a storm seeded, a rocket against hail, clouds seeded or dispersed, the fog a storm leaves. An influence is data, of no state: {ID, Kind, Direction (the unit way of its middle in the frame of its body, as it began), Radius (km), Start and Length (days of the scene), Strength, Seed}; what it does is the graph of its kind (resources/weather/influences.json: Graph, Hours, Radius, Strength, Spawns), of the place (Near: its distance from the middle, a part of the radius), its age (Age: a part of its life) and its Strength: what it adds to the forecast there (Cover, Rain, Kind, Cirrus, Fog). Its middle drifts with the wind of the forecast (wind(way, days): the tangent way the air goes, radians a day). An influence may leave others when it ends (Spawns: {Kind, At (a part of its life), Hours, Radius and Strength of its}), made of it, never kept: the same list gives the same weather at any time, there and back.

- Kinds(): the kinds, of the resource.
- Make(kind, way, days, options): an influence of a kind from a way at a time (options Radius, Hours, Strength, ID, Seed).
- Center(one, days, wind): its middle at a time, drifted.
- Expand(list, days, wind): those going at a time, the ones they left among them.
- Apply(over, way, days, list, wind, radiusKm): a forecast of a place (Cover, Kind, Cirrus, Rain, Fog...) with what the influences over it do there.

## Methods

- `Kinds()`
- `Make(kind, way, days, options)`
- `Center(one, days, wind)`
- `Expand(list, days, wind)`
- `Apply(over, way, days, list, wind, radiusKm)`

## Tests

- [has its kinds of the resource, each of a graph, how long, how wide and how strong](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js#L16) — `libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js`
- [makes an influence of a kind at a way and a time, its own values over those of its kind](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js#L24) — `libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js`
- [adds to the forecast of a place within its radius as it lives, nothing past it, and takes away of its kind](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js#L30) — `libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js`
- [leaves the influences of its kind when it ends, made of it: a fog after a storm](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js#L48) — `libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js`
- [drifts with the wind it is given, as long as it lives](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js#L59) — `libraries/ElemenxGraphics/services/WeatherInfluences/WeatherInfluences.test.js`
