То, что Scene добавляет в Blueprints, объявленное в $Provides: Blueprints создаёт сервис, когда встречает граф эффекта или один из его блоков, поэтому сцене ничего не нужно вызывать заранее. Вид effect — граф слоёв эффекта сцены, который заканчивается блоком Effect (в нём стоят и блоки generator); Make(parameters) того, что даёт Compile, — тип эффекта. Его блоки: Layer (у каждого свой Kind, его числа — входы, которые может взять Parameter, иначе свойства; каждый идёт после слоёв под ним) и Effect, конец (его лампа, жар, прицел и полёт, переданные слои). Блоки проходов картинки графа render (из BlueprintShaders): Scene, Clouds, Occlusion, Air, Frames, Mirror, Rays, Exposure, Bokeh, Bloom, Picture и Shader; каждый выполняет шаг сцены, которая его запускает (frame.Steps). Вид water — вода сцены как граф: blueprintWater(inout color, inout alpha) в шейдере воды Scene. Блоки читают то, что есть у этого шейдера (Place, View, Far, Flow со скоростью Speed и направлением Way, Sun, Time), и повторяют части воды библиотеки, каждый со своим GLSL без изменений: Waves (наклон поверхности озера или вытянутые вдоль реки волны, которые сносит течением; Rush — где вода бурлит), WaterNormal, Fresnel, Glints (дорожка солнца), Sky (отражённое небо), Body (цвет толщи, у реки — с илом), Foam, Reflection (отражение окружающего по экрану) и WaterFog; конец — Water. Scene.LibraryWater() — вода библиотеки, собранная из них; WaterGraph сцены (граф, его JSON или GLSL) заменяет её.

Блок земли LandMaterial — из чего сделана земля в точке (SceneMaterials, по весам её материалов): цвет и нормаль, наклонённая по высоте узоров, так близко, как их видно. В земле библиотеки он стоит между LandPoint и альбедо: его цвет идёт в LandAlbedo, его нормаль — в лужи, альбедо и LandPaint.

## Звезда

Вид графа `star` — облик звезды в момент времени, считается каждый кадр. Конечный блок `Star`: Corona, Prominences, Flares (сколько короны, протуберанцев и вспышек), Count (сколько протуберанцев, до 8), Height (высота), Speed (как быстро дышат и текут волокна), Strands (насколько рваные), Tint (оттенок). Каждый вход берёт значение от `Parameter` или `Curve` от `Time`, иначе свойство блока. `Look(parameters, seconds)` того, что даёт `Compile`, возвращает облик. Звезда с `Blueprint` в трейте `Star` горит так; `LibraryStar()` сцены — граф библиотеки: протуберанцы поднимаются и опадают за круг в `Cycle` секунд, их и вспышек столько, сколько `Activity`.

## Вид графа nebula

Облик туманности, считается каждый кадр, как граф звезды (берёт блоки генератора: Time, Sin, Curve, Parameter…). Конец — блок Nebula: Glow, Density, Turn (градусы), Grow, Detail, Turbulence, Thickness, Hollow (числа, 1 / 0 по умолчанию) и Outer, Inner (оттенки). Look(parameters, seconds) у скомпилированного графа даёт эти поля; Turbulence, Thickness и Hollow относятся к форме и берутся на время 0. Граф библиотеки — blueprints/nebula.json (Scene.LibraryNebula()).

## Вид графа bake

Поверхность тела из шума (не ScenePlanet), запекаемая в два его куба: `blueprintBake(p, inout surface, inout sky)` в шейдере `Bake` у Scene (`BakeGraph`, иначе `LibraryBake()`, `blueprints/shader/bake`). `surface` — цвет земли (rgb) и блеск (a), `sky` — облака (r), свечение лавы (g) и искры (b). Входы — блоки `Input` (`PX`, `PY`, `PZ` — направление; `Seed`, `Ocean`, `Cratered`, `Kind`, `Ice`, `Clouds`), числа — блоки генератора (`Fbm`, `Ridge`, `Formula`, `Smoothstep`…), поэтому то, что приходит в блок `BakeLand` (`Land`, `H`), считается и в странице: `BakeLandGraph(graph)` вырезает эту часть как генератор с результатом `Land`, и земля тела (`SceneTerrainGenerator.Sphere`) — та самая, что видна на картинке. Остальные блоки: `BakeRocky`, `BakeIcy`, `BakeLava`, `BakeGas` (поверхность каждого вида), `BakeKind` (поверхность вида тела), `BakeIce` (полярные шапки), `BakeClouds` и конец `BakeEnd`. Раньше земля была написана дважды — в шейдере и в странице, и шейдер рисовал кратеры под морем, которых у земли не было; теперь граф один, кратеров под морем нет нигде.

## Вид графа weather

Что погода и год делают с поверхностями вещей (шейдеры `Pbr` и `Solid`): `WeatherGraph` сцены, иначе `LibraryWeather()` (`blueprints/shader/weather`). Каждый блок даёт функцию, которую вызывают шейдеры: `WeatherSeason` (`weather_season` — листья желтеют, опадают и цветут; свойства `Leaf`, `Bare`, `Blossom`), `WeatherSnow` (`weather_snow_<For>` — сколько лежит снега; `For`: things, solid или plants; пороги и масштабы шума — свойства), `WeatherDissolve` (`weather_dissolve` — тело, уносимое лучом), `WeatherPuddles` (`weather_puddles` — лужи там, где плоско и мокро). Все приходят в `WeatherEnd`. Числа, которыми шейдеры различались, стали свойствами блоков.

## Форма молнии

Одна для молнии грозы (SceneLighting) и молнии эффекта (вид `bolt` у SceneEffects): генератор излома каждого шага (`Step`, `Seed` → `X`, `Z` от -0.5 до 0.5) с параметрами `Steps`, `Wide`, `Fork`, `ForkSteps`, `ForkDown`, `ForkWide`. `LibraryBolt()` — форма библиотеки (`blueprints/shader/bolt`); `Bolt(graph)` даёт `{Jag(step, seed), Steps… ForkWide, GLSL}` (функция `vec2 bolt_jag(float step, float seed)` для шейдера). Своя форма сцены — `BoltGraph` или `Graphs['shader/bolt']` (`Scene.BoltShape()`).

## Вид графа air

Воздух между глазом и тем, что он видит (`AirGraph` у Scene, иначе `LibraryAir()`, `blueprints/shader/air`). Каждый блок даёт функции только тем шейдерам, которые их просят (`#define ENX_AIR_<FOR>` перед местом графа): `AirHaze` (`air_haze_<For>(world)` — сколько дымки, `air_horizon_<For>(light)` — её цвет; For globe — вещи и земля глобуса, ground — земля и вода сцены), `AirFog` (проход Air: туман, который лежит низко, полосы дождя, свет воздуха, вуаль у горизонта), `AirUnder` (глаз под водой), конец `AirEnd`. Раньше одна и та же дымка была написана в четырёх шейдерах.

## Вид графа clouds

Облака (`CloudsGraph`, иначе `LibraryClouds()`, `blueprints/shader/clouds`): `CloudCover` (`clouds_cover` — покров погоды планеты в месте, его клубы), `CloudGlobe` (`cloudSeen`, `cloudAt` — глобус и тени облаков на земле), `CloudShell` (`shellThick` — облака вокруг глаза над поверхностью), `CloudLayer` (`lobe`, `thick` — слой облаков сцены на дешёвом 3D-шуме), конец `CloudsEnd`. Раньше покров глобуса и облаков у поверхности был одним и тем же циклом, написанным дважды.

## Погода планеты

Блоки чисел ForecastStorms, ForecastFronts, ForecastHeaps, ForecastCirrus, ForecastRain, ForecastShroud (сервис SceneForecast) и граф библиотеки `LibraryForecast()` (`blueprints/shader/forecast`). Блок другой библиотеки может быть числовым: `Numeric(inputs, properties, kit)` в его определении даёт выходы как выражения IR, `kit.Kernel(name, module)` добавляет функции его ядра в модуль один раз. `Chunk(context, name, lines, guard)` — функция блока как часть шейдеров Renderer под своим именем (guard — имя или имена для `#ifdef`).

## Рукава галактики

Блоки чисел GalaxyTurn (где место стоит на спирали), GalaxyBend (изгиб рукавов шумом градиентов; Bend — насколько), GalaxyWave (волна рукавов, со сдвигом внутрь для пыли), GalaxyArm (сколько диска в рукавах: Low, High, Power) — ядро GalaxyData. `LibraryGalaxy()` — граф библиотеки (`blueprints/shader/galaxy`), `Galaxy(graph)` даёт `{Of, Arm, GLSL}` (функция `vec4 galaxy_spiral(...)` для шейдера). Из него и звёзды, и сгустки, и туманности карты (GalaxyData), и её картинка (SceneGalaxy), и полоса в небе системы, и далёкие галактики (SceneCosmos). Свой граф сцены — `GalaxyGraph` или `Graphs['shader/galaxy']`.

## Небо космоса

Вид `cosmos` (CosmosGraph сцены): функция `blueprintCosmos(d, s, inout color)` в шейдере, который запекает небо в куб. Блоки по порядку: CosmosRay, CosmosGas, CosmosPlane, CosmosGlow, CosmosDust, CosmosBand (полоса галактики — честная или нарисованная), CosmosBursts, CosmosGalaxies, CosmosPillars, CosmosStars, CosmosBeacon, CosmosClusters, конец CosmosEnd. `LibraryCosmos()` — граф библиотеки (`blueprints/shader/cosmos`).

Числовой граф берёт из ядер блоков только то, что вызывается (и то, что вызывает вызванное): раньше блок ядра тащил в шейдер весь шум.

## Кольцо

Вид `ring` (RingGraph сцены или `Graphs['shader/ring']`): функция `blueprintRing(r, world, normal, inout color, inout alpha)` в шейдере колец, `r` — доля поперёк кольца (0 у внутреннего края, 1 у внешнего). Блоки: RingPlace (R, World, Normal, Seed), RingBands (широкие и тонкие полосы: WideScale, FineScale, Base, Wide, Fine, края Inner и Outer), RingGap (щель: At, Width, Depth; щелей сколько угодно, одна за другой; уже полутора пикселей не бывает — тогда мельче), RingColor (цвета по полосам, Mix), RingLight (свет с обеих сторон: Back, Side), конец RingEnd. `LibraryRing()` — граф библиотеки (`blueprints/shader/ring`): три щели. Граф с одной щелью на 0.62 рисует ровно прежнее кольцо.

## Планета издали

Вид `planet` (PlanetGraph сцены или `Graphs['shader/planet']`): функция `blueprintPlanet(n, v, p, inout color, inout alpha)` в шейдере Planet. Блоки: PlanetPlace (Normal, View, Point, World, Day — насколько там светит солнце), PlanetSurface (запечённая картинка: Albedo, Gloss), PlanetRelief (горы для света: Lean, Steep), PlanetGas (вершины облаков гиганта вблизи: запечённые полосы, разорванные течением в фестоны и вихри, ближе — клубы облаков со светом по их наклону; Strength, Stretch — вытянутость по широтам, Swirl — сила течения, Near — с какого числа радиусов видно, Bump), PlanetLight (Shine, Gloss), PlanetHeat (свечение лавы: Glow), PlanetClouds (облака погоды или запечённые: Cover, Color, Shade — тень под ними, Veil — сколько огней они закрывают; Tint, Shadow, Veil, Haze, DrawnVeil), RingShadow (тень кольца — той же функцией графа кольца, со всеми щелями: Strength), PlanetShade, GlobeLights (огни городов ночью; этот блок есть и у земли глобуса: Red, Green, Blue, Strength), PlanetMix (облака поверх), PlanetRim (воздух у края: Power), PlanetHighlight (Power), конец PlanetEnd (только облака, когда шейдер рисует оболочку облаков). `LibraryPlanet()` — граф библиотеки (`blueprints/shader/planet`).

В граф облаков добавлен блок CloudShade: `cloudSide` (насколько облако темнее со стороны от солнца: Ahead, Gain, Most) и `cloudUnder` (облака, чья тень падает в эту точку: Low, High) — общие для глобуса и его земли.

`Painted(kind, end, head)` — такой вид графа функции тела в шейдере.

## Звезда целиком

Граф вида `star` теперь описывает звезду целиком. Блок `Star` — числа каждого мгновения (сколько короны, протуберанцев, вспышек, их число, высота, скорость), как раньше; к нему добавлены части в шейдерах, каждая со своим концом: поверхность (`blueprintSun`: SunPlace, SunCells, SunSpots, SunBands, SunLimb, SunColor, SunBurn → StarSurface), корона (`blueprintCrown`: CrownPlace, CrownCorona, CrownProminences, CrownFlare → StarCrown) и лучи пульсара (`blueprintBeam`: BeamPlace, BeamGlow → StarBeam). Каждая часть собирается только из блоков, ведущих к её концу. Граф библиотеки (`LibraryStar()`, `blueprints/star.json`) рисует ровно прежние пиксели. Звезда со своим графом (`Star.Blueprint`) рисует свои части; старый граф только из чисел берёт части библиотеки. `Graphs['star']` сцены — общий граф для звёзд без своего.

## Земля глобуса

Вид `ground` (GroundGraph сцены или `Graphs['shader/ground']`): функция `blueprintGround(inout color)` в шейдере Ground — земля глобуса вблизи и с высоты. Блоки: GroundPlace (Normal, View, Up, Height, Sea, Place — км от центра, Near — км от якоря, точно, Foot — км на пиксель, World), GroundBase (цвета по высоте, глубина моря, скалы на крутом: Shallow, Deep, Depth, RockFrom, RockTo, Rock, RockDark, PaintedRock), GroundPicture (картинка квадрата с рваными краями текселей: Ragged, Seam, Aside; выходы At, Soft, DX, DY для остальных текстур квадрата), GroundIce (полярные шапки: Scale, Ragged, Edge), GroundMottle (пятна от километров до десятков метров: Far, Middle, Fine), GroundWoods (массивы лесов: цвет Red, Green, Blue; выходы Wooded, Stands, Cover), GroundFields (поля и дома, Rise — высота живых изгородей), GroundCrowns (кроны вблизи: Scale, Dark, Light), GroundSnow (край снега: Torn), GroundDunes (дюны: Strength), GroundRelief (бугры, гряды и овраги в свете нормали: Hills, Knolls, Crowns, Dunes, Ridges, Gullies, Lean; Smoothed — нормаль до них), GroundTiles (плитки материалов вблизи — функция шейдера `groundLaid`; ближняя земля ставит на её место материалы своих биомов), GroundRing (тень кольца: Strength), GroundLight (солнце, небо, сумерки, тени облаков: Sky, Dusk, Shadow; Day для огней — DayFrom, DayTo), GroundWater (вода: Waves, Glints, Spread), GlobeLights (тот же блок, что у планеты), GroundClouds (облака сверху: Sun), GroundAir (дымка графа воздуха), конец GroundEnd. `LibraryGround()` — граф библиотеки (`blueprints/shader/ground`); рисует прежние пиксели.

Тень кольца на земле считает непрозрачность графа кольца (`groundRing`) — только блоки, ведущие ко входу Alpha его конца: свет кольца читает то, чего у шейдера земли нет. Кольцо, написанное на GLSL вручную, тени на землю не даёт.
