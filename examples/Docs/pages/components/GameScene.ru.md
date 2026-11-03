<!-- generated -->
# GameScene

Сцена игры в трёх измерениях на WebGL2 (сервис Graphics3D): объекты любого вида (сервис Kinds), каждый из того, что расширяет его вид, что он умеет (черты, Traits, каждую ведёт система сцены) и из чего состоит (части, Parts, — объекты, размещённые в нём). Сеттинг space (по умолчанию) приносит виды звёздной системы и их системы: звёзды и планеты на кеплеровых орбитах (сервис Astronomy), освещённые своими звёздами (ночные стороны, тени лун и планет друг на друге и на кольцах), их поверхности из шума, один раз запечённые в кубические текстуры, пояса и кольца, станции из модулей, флоты кораблей, которые держатся у тела и летят к другому. Виды space: star, planet, moon, belt, ring, module, station, outpost, fighter, cruiser, freighter, fleet; приложение определяет свои (Kinds.Define) и системы для своих черт (Systems: {Черта: {Update(object, context), Draw(object, context)}}). Объекты — System ({Objects: [{ID, Kind, Parent, Values, Traits, Parts, Children}]}), Seed (целая система из него) и GameObject внутри. Time, Speed, Paused, Scale (compressed или real), Focus, Selected, Orbits, Labels, Details, Background, Team, слот hud; перетаскивание вращает вид, колесо и два пальца приближают, щелчок выбирает объект (или часть объекта вблизи), двойной щелчок перелетает к нему, Escape, стрелки, + и −, Enter, пробел. Вид рисуется относительно глаза, с разрешением по времени кадра. Land(id, {Latitude, Longitude, Altitude}) спускает вид на поверхность тела (не газового гиганта): тот же рельеф, что на запечённой поверхности (Terrain.Sphere), кусками, тем мельче, чем ближе к глазу, под небом его атмосферы и звезды; перетаскивание осматривается, колесо поднимает и опускает, WASD и стрелки идут, Escape или TakeOff() поднимает обратно; время там идёт со скоростью SurfaceSpeed дней в секунду (1/120). Сеттинг terrain — земля и её юниты: ground (Terrain: Size, Height, Water, Scale, Ridges, Seed — земля из шума, Terrain.Flat, с морем), sun (Sun: свет издалека), unit (Walker: Speed, MaxSlope, Swim), tree, rock, house (Model, Blocks — то, что стоит на пути); объект стоит в X и Y земли, Move(id, [x, y]) ведёт юнита в обход непроходимого, правый щелчок посылает выбранного. Каждая модель сервиса Models — вид с тем же именем на подходящей основе (knight, oak, tower…). Модели отбрасывают тени солнца друг на друга и на землю, рельеф — на поверхность планеты, части модели в фокусе — друг на друга (Shadows, true); растения гнутся на ветру; Model играет клипы своих частей: walk на пути сам, Clip в покое, Play(id, clip, callback) — остальные (attack, cast, work, die): клип с концом вызывает callback и возвращается назад, петля остаётся, die держит последнюю позу. События: ready, select ({ID, Object, Info}), focus, arrive, land, takeoff, error. Методы: Add, Change, Remove, Attach, Detach, Get, Objects, Describe, Position, Select, FocusOn, Move, Play, Now, SetTime, ToScreen, Pick, Save (каждый объект — вид и отличия от него), Load, Land, TakeOff, Surface, Supported. View top или isometric показывает землю в параллельных лучах, как двумерную игру; Add принимает и список. Карта клеток: Map (JSON или URL, в том числе Tiled), GameTerrain и GameLayer внутри делают землю стратегии, остальные GameObject стоят на клетках (X, Y, Width, Height). Вид сверху (Projection orthogonal) или под углом (isometric); модели, тени и клипы те же, метки и туман лежат поверх на canvas, а карта или объект с картинками (Image) и браузер без WebGL2 рисуются на нём целиком. Team — команда игрока: её юниты (то, что умеет Walker) выбираются кликом, Shift, рамкой, двойным кликом и Ctrl+A и получают приказы правым кликом или касанием (A*, расходятся вокруг цели); здания — то, что Blocks и выбирается. Fog, Grid, Minimap, X, Y, Zoom, MinZoom, MaxZoom. События карты: load, order, cell, view. Методы те же, что у любой сцены (Select принимает id или список, Move — id или список, ToScreen — id или x и y, Load — сохранённую игру или карту), и ещё Selection, Order, Stop, Cell, Paint, Near, Route, PathGrid, FogOfWar, CenterOn, ToCell. Массовое наполнение: GameObject вида с чертой Scatter (forest, grove, thicket, rocks или свой) рассаживает модели по правилам — Shapes, Density (на сто квадратных единиц), Size, MinHeight, MaxHeight, MaxSlope, Cover, Patch, Seed, Blocks; вид с чертой Grass (grass) растит траву в вершинном шейдере вокруг вида — Density, Height, Color, Root, MaxHeight, MaxSlope. Отдельного объекта на каждую вещь нет: вблизи рисуется вся модель, дальше упрощённые уровни, совсем далеко снимок, запечённый со всех сторон. Sown() сообщает {Things, Squares, Waiting, Draws, Blades}. Модели из файлов: Model у GameObject называет модель сервиса Models или файл (Model="assets/hero.glb"): он загружается один раз, стоит на земле и имеет высоту 1, как остальные, Size масштабирует его, анимации файла становятся клипами (Clip, Play, ходьба по пути), все копии рисуются одним вызовом, кадры скелета читаются из текстуры, материалы освещаются по metal/roughness. Shapes черты Scatter принимает и файлы: они рассаживаются средним цветом своих текстур. Свет: сцена рисует в текстуру с плавающей точкой и строит из неё картинку — воздух, лучи солнца, ambient occlusion, bloom, кривая ACES; две карты теней с мягкими краями; отражённый свет того, что видит солнце (один отскок рядом с видом); листья и травинки пропускают солнце. Quality: low, medium, high, ultra; пусто — выбор по видеокарте со снижением, пока кадры опаздывают. Graphics() сообщает, что включено. Земля одним атрибутом: Kind="ground" Biome="taiga" приносит цвета, растительность и траву; Kind="village" с X, Y, Houses, Radius, Seed выкладывает дома и дороги, на них ничего не растёт. Soft (0–1) пропускает свет под поверхность, как в коже. Уровни детализации плавно переходят друг в друга, кадры складываются (TAA), вода отражает то, что на экране. Камера свободна в любой 3D-сцене: перетаскивание поворачивает и наклоняет, колесо приближает, средняя кнопка или перетаскивание с Shift сдвигает (двумя пальцами на экране), WASD или стрелки перемещают, Q и E поворачивают, R и F наклоняют. Land(id, {Latitude, Longitude, Altitude, Instant}) летит вниз одним движением оттуда, где стоит камера (Instant: сразу), TakeOff() возвращает к тому же виду из космоса. Небо земли: объект вида sun принимает Time (18:30) и идёт в темпе DaySeconds, Noon — азимут, через который оно проходит в полдень (180), Shade — цвет света неба. DayHours — длина суток (24); с Latitude солнце идёт как при вращении планеты: Tilt — наклон оси (23.44), DayOfYear (172) года из YearDays (365) дают длину светового дня, полярные день и ночь тоже. Ночью землю освещает луна: Moon (false — неба без луны), MoonLight, MoonSize, MoonPhase (0 — новолуние, 0.5 — полнолуние, она запаздывает на эту долю суток), MoonElevation с MoonAzimuth держат её на месте, MoonTilt с MoonNode (день года, когда её путь пересекает солнечный) дают затмения: солнечное в новолуние и лунное в полнолуние, а NightLight — свет воздуха в темноте. SkyGlow (от 0 до 1) — свет городов в воздухе, цвета SkyGlowColor, со стороны SkyGlowAzimuth или отовсюду: он подсвечивает облака снизу и скрывает слабые звёзды. Звёзды вращаются вместе с планетой вокруг полюса на высоте Latitude. Weather (clear, cloudy, overcast, rain, storm, snow, fog, changing — сама сменяется по кругу), Cosmos (nebula, pillars, galaxy, galaxies, cluster, void или {Kind, Seed, Colors, Gas, Dust, Stars}) создаёт дальнее небо по зерну: газ, пыль, скопления и диск галактики, запекается по одной грани за кадр; Galaxy у солнца — полоса галактики над ночной землёй. Exposure (число фиксирует экспозицию, пусто — она подстраивается, как глаз), Front (секунды смены), Wind и WindWay — один ветер для облаков, дождя, травы и деревьев. Облака бывают разных типов и отбрасывают настоящие тени; вода и снег копятся на земле и сходят минутами. Weather меняется за несколько секунд, а дождь мочит всё, что под ним; Flare (от 0 до 2) — насколько сильно объектив показывает солнце. На high и ultra глянцевое и мокрое отражает то, что на экране, а за его краем небо. Вид light (Color, Power, Radius, Height, Spot, Aim, Flicker, Follow, Z) — лампа: сколько угодно, сразу светят 24 ближайшие, тени дают 2 ближайшие. Вид location (Model, Size, Without, Plane) делает землю из модели файла, полы и стены читаются из её треугольников; Control(id) отдаёт клавиши персонажу (с FreeLook стоящий персонаж не поворачивается вслед за камерой и разворачивается, только когда пошёл), То, что светится в модели файла, само освещает мир: лампы файла (KHR_lights_punctual) и светящиеся поверхности, собранные в лампы (Lights: false на объекте их отключает). Вид effect (Type: spark, torch, campfire, smoke, steam, dust, exhaust; Size, Power, Aim, Height, Light, On, Follow, Offset; вид огня: Color, Hot, Volume, Intensity, Length, Smoke) горит и дымит на месте или вместе с объектом, у огня есть свой свет, а воздух над ним дрожит; Burst(type, place, options) срабатывает один раз, как explosion, а Effects(types) добавляет свои типы. Hold: {Model, Bone, Aim, At, Turn, Size} вкладывает модель в руку, с Aim её ось идёт от одной кости к другой, а скелет без клипов получает walk и idle, созданные по именам костей (Models.Gait). Правила Scatter принимают Reach и Grid: тайлы из готовых моделей и трава из модели (вид grass с Shapes).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `System` | `null` |
| `Seed` | `''` |
| `Systems` | `null` |
| `Time` | `0` |
| `Speed` | `1` |
| `DaySeconds` | `0` |
| `Capture` | `true` |
| `SurfaceSpeed` | `1 / 120` |
| `Shadows` | `true` |
| `View` | `''` |
| `Paused` | `false` |
| `Bokeh` | `0` |
| `BokehFocus` | `''` |
| `Orbits` | `true` |
| `Labels` | `true` |
| `Details` | `true` |
| `Background` | `true` |
| `Scale` | `'compressed'` |
| `Team` | `''` |
| `Label` | `''` |
| `Loader` | `true` |

## События

- `arrive`: Объект дошёл туда, куда его послали: {ID, At}, на карте ещё X и Y.
- `focus`: Вид перелетел к объекту: {ID}.
- `error`: Нет WebGL2 ({Reason: webgl2}) или карту не удалось загрузить (ошибка).
- `land`: Вид спустился на поверхность тела: {ID}.
- `takeoff`: Вид поднялся обратно в космос: {ID}.
- `select`: Выделение изменилось: {ID, Object, Info, IDs, Objects} (ID пустой, когда не выбрано ничего).
- `loading`
- `ready`: Сцена готова: сам компонент, чтобы вызывать его методы.
- `person`
- `shoulder`

## Слоты

`loading`, `hud`, по умолчанию, `screens`

## Методы

- `Add(kind, props)`
- `Change(id, changes)`
- `Remove(id)`
- `Attach(parent, object, place)`
- `Detach(id)`
- `Get(id)`
- `Objects(filter)`
- `Describe(id)`
- `Position(id)`
- `Select(id)`
- `Control(id)`
- `FocusOn(id)`
- `Move(id, target, callback)`
- `Play(id, clip, callback)`
- `Now()`
- `SetTime(days)`
- `ToScreen(id, y)`
- `Pick(clientX, clientY, all)`
- `Save(options)`
- `Load(saved, callback)`
- `Supported()`
- `Land(id, options)`
- `TakeOff()`
- `Surface()`

## Пример

```example
<div style="height: 380px;">
	<GameScene Speed="6" (ready)="Ready" (select)="Selected" (arrive)="Arrived">
		<GameObject ID="sun" Kind="star" Name="Sun">
			<GameObject ID="earth" Kind="planet" Name="Earth" Surface-Type="terran" Radius="6371" Distance="1" Tilt="23.4">
				<GameObject ID="moon" Kind="moon" Name="Moon" Radius="1737" Distance="384400 km" />
				<GameObject ID="gateway" Kind="station" Name="Gateway" Team="blue" />
			</GameObject>
			<GameObject ID="mars" Kind="planet" Name="Mars" Surface-Type="desert" Radius="3390" Distance="1.52" Eccentricity="0.09" />
			<GameObject ID="jupiter" Kind="planet" Name="Jupiter" Surface-Type="gas" Radius="69911" Distance="5.2" Day="9.9" />
		</GameObject>
		<GameObject ID="first" Kind="fleet" Name="First fleet" Parent="earth" Team="blue" Count="4" />
	</GameScene>
</div>
<Button Label="Fleet to Mars" Icon="send" (click)="Send" />
<Button Label="Save" Icon="save" Variant="ghost" (click)="Save" />
<Button Label="Load" Icon="refresh" Variant="ghost" [disabled]="!Saved" (click)="Load" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'A drag turns the view, the wheel zooms, a click selects, a double click flies to an object.',
	Saved: null,

	Ready: function (scene) {
		this.Scene = function () {
			return scene;
		};
	},

	Selected: function (event) {
		this.Note = event.ID ? event.Object.Name + (event.Info && event.Info.Gravity ? ': ' + event.Info.Gravity.toFixed(1) + ' m/s²' : '') : 'Nothing selected';
	},

	Send: function () {
		var scene = this.Scene();

		scene.Move('first', scene.Get('first').Parent === 'mars' ? 'earth' : 'mars');
	},

	Save: function () {
		this.Saved = this.Scene().Save();
		this.Note = 'Saved: ' + JSON.stringify(this.Saved).length + ' characters, the kinds and what differs from them.';
	},

	Load: function () {
		this.Scene().Load(this.Saved);
		this.Note = 'Loaded at day ' + Math.round(this.Scene().Now());
	},

	Arrived: function (event) {
		this.Note = event.ID + ' arrived at ' + event.At;
	}
})
</script>
```

## Тесты

- [GameMaps: its own JSON with rows of text, and a map of Tiled with its tiles, their properties and its objects](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L52) — `tests/regression/game-world.test.js`
- [GameScene: sets no timer of no function while it is made (a page that forbids eval refuses one)](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L81) — `tests/regression/game-world.test.js`
- [GameScene: the map and the objects it declares, the ways round its buildings, its methods, the order walked to the end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L102) — `tests/regression/game-world.test.js`
- [GameScene: a declaration changed moves its object, one taken away takes it away; a map by its URL loads](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L191) — `tests/regression/game-world.test.js`
- [gives the passes of the library as a render graph, in the order they run, and draws the same picture of it given](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-render-pipeline.test.js#L113) — `tests/regression/library-render-pipeline.test.js`
- [leaves out a pass switched off, takes the properties of its blocks, and adds a pass of a graph of its own after the picture](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-render-pipeline.test.js#L140) — `tests/regression/library-render-pipeline.test.js`
- [draws the picture of the library when the Pipeline cannot be made, and tells it once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-render-pipeline.test.js#L202) — `tests/regression/library-render-pipeline.test.js`
- [lets a crate fall onto the ground, tells the touch, and knocks it over by a push](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-rigid.test.js#L58) — `tests/regression/library-rigid.test.js`
- [lets a walker push a ball it walks into](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-rigid.test.js#L115) — `tests/regression/library-rigid.test.js`
- [sets the view at once and tells it, and finds the point of the ground under a point of the page](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editing.test.js#L44) — `tests/regression/library-scene-editing.test.js`
- [turns what stands by its Facing, lifts it by its Lift, and picks with all what cannot be selected](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editing.test.js#L87) — `tests/regression/library-scene-editing.test.js`
- [reads the GameObject inside it: each attribute a field of its kind, nested ones going round their holder or a part of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L327) — `tests/regression/library-scene.test.js`

+148 ещё в тех же файлах
