<!-- generated -->
# Scene

Сцена игры в трёх измерениях на WebGL2 (сервис Renderer): объекты любого вида (сервис Kinds), каждый из того, что расширяет его вид, что он умеет (черты, Traits, каждую ведёт система сцены) и из чего состоит (части, Parts, — объекты, размещённые в нём). Сеттинг space (по умолчанию) приносит виды звёздной системы и их системы: звёзды и планеты на кеплеровых орбитах (сервис Astronomy), освещённые своими звёздами (ночные стороны, тени лун и планет друг на друге и на кольцах), их поверхности из шума, один раз запечённые в кубические текстуры, пояса и кольца, станции из модулей, флоты кораблей, которые держатся у тела и летят к другому. Виды space: star, planet, moon, belt, ring, module, station, outpost, fighter, cruiser, freighter, fleet; приложение определяет свои (SceneKinds.Define) и системы для своих черт (Systems: {Черта: {Update(object, context), Draw(object, context)}}). Объекты — System ({Objects: [{ID, Kind, Parent, Values, Traits, Parts, Children}]}), Seed (целая система из него) и SceneObject внутри. Time, Speed, Paused, Scale (compressed или real), Focus, Selected, Orbits, Labels, Details, Background, Team, слот hud; перетаскивание вращает вид, колесо и два пальца приближают, щелчок выбирает объект (или часть объекта вблизи), двойной щелчок перелетает к нему, Escape, стрелки, + и −, Enter, пробел. Вид рисуется относительно глаза, с разрешением по времени кадра. Land(id, {Latitude, Longitude, Altitude}) спускает вид на поверхность тела (не газового гиганта): тот же рельеф, что на запечённой поверхности (SceneTerrainGenerator.Sphere), кусками, тем мельче, чем ближе к глазу, под небом его атмосферы и звезды; перетаскивание осматривается, колесо поднимает и опускает, WASD и стрелки идут, Escape или TakeOff() поднимает обратно; время там идёт со скоростью SurfaceSpeed дней в секунду (1/120). Сеттинг terrain — земля и её юниты: ground (Terrain: World — граф её мира, SceneWorld: земля, рельеф, климат, биомы, эскиз и то, что на ней создаётся, единственное место, где они задаются; без графа земли нет; Swell, SwellWay — волны моря; земля из шума, SceneTerrainGenerator.Flat, с морем; объекты, созданные графом, есть в сцене с пометкой Generated, создаются заново вместе с ним и не сохраняются), sun (Sun: свет издалека), unit (Walker: Speed, MaxSlope, Swim), tree, rock, house (Model, Blocks — то, что стоит на пути); объект стоит в X и Y земли, Move(id, [x, y]) ведёт юнита в обход непроходимого, правый щелчок посылает выбранного. Каждая модель сервиса Models — вид с тем же именем на подходящей основе (knight, oak, tower…). Модели отбрасывают тени солнца друг на друга и на землю, рельеф — на поверхность планеты, части модели в фокусе — друг на друга (Shadows, true); растения гнутся на ветру; Model играет клипы своих частей: walk на пути сам, Clip в покое, Play(id, clip, callback) — остальные (attack, cast, work, die): клип с концом вызывает callback и возвращается назад, петля остаётся, die держит последнюю позу. События: ready, select ({ID, Object, Info}), focus, arrive, land, takeoff, error. Методы: Add, Change, Remove, Attach, Detach, Get, Objects, Describe, Position, Select, FocusOn, Move, Play, Now, SetTime, ToScreen, Pick, Save (каждый объект — вид и отличия от него), Load, Land, TakeOff, Surface, Supported. View top или isometric показывает землю в параллельных лучах, как двумерную игру; Add принимает и список. Стратегия, гонка и любая другая игра — компонент, объявленный внутри сцены (GameStrategy, GameRace из ElemenxGaming: трейт SceneBehaviour). Массовое наполнение: SceneObject вида с чертой Scatter (forest, grove, thicket, rocks или свой) рассаживает модели по правилам — Shapes, Density (на сто квадратных единиц), Size, MinHeight, MaxHeight, MaxSlope, Cover, Patch, Seed, Blocks; вид с чертой Grass (grass) растит траву в вершинном шейдере вокруг вида — Density, Height, Color, Root, MaxHeight, MaxSlope. Отдельного объекта на каждую вещь нет: вблизи рисуется вся модель, дальше упрощённые уровни, совсем далеко снимок, запечённый со всех сторон. Sown() сообщает {Things, Squares, Waiting, Draws, Blades}. Модели из файлов: Model у SceneObject называет модель сервиса Models или файл (Model="assets/hero.glb"): он загружается один раз, стоит на земле и имеет высоту 1, как остальные, Size масштабирует его, анимации файла становятся клипами (Clip, Play, ходьба по пути), все копии рисуются одним вызовом, кадры скелета читаются из текстуры, материалы освещаются по metal/roughness. Shapes черты Scatter принимает и файлы: они рассаживаются средним цветом своих текстур. Свет: сцена рисует в текстуру с плавающей точкой и строит из неё картинку — воздух, лучи солнца, ambient occlusion, bloom, кривая ACES; две карты теней с мягкими краями; отражённый свет того, что видит солнце (один отскок рядом с видом); листья и травинки пропускают солнце. Quality: low, medium, high, ultra; пусто — выбор по видеокарте со снижением, пока кадры опаздывают. Graphics() сообщает, что включено. Биомы — шаг Biomes графа мира: даже один биом (['taiga']) приносит цвета, растительность и траву, несколько лягут по климату; Kind="village" с X, Y, Houses, Radius, Seed выкладывает дома и дороги, на них ничего не растёт. Soft (0–1) пропускает свет под поверхность, как в коже. Уровни детализации плавно переходят друг в друга, кадры складываются (TAA), вода отражает то, что на экране. Камера свободна в любой 3D-сцене: перетаскивание поворачивает и наклоняет, колесо приближает, средняя кнопка или перетаскивание с Shift сдвигает (двумя пальцами на экране), WASD или стрелки перемещают, Q и E поворачивают, R и F наклоняют. Land(id, {Latitude, Longitude, Altitude, Instant}) летит вниз одним движением оттуда, где стоит камера (Instant: сразу), TakeOff() возвращает к тому же виду из космоса. Небо земли: объект вида sun принимает Time (18:30) и идёт в темпе DaySeconds, Noon — азимут, через который оно проходит в полдень (180), Shade — цвет света неба. DayHours — длина суток (24); с Latitude солнце идёт как при вращении планеты: Tilt — наклон оси (23.44), DayOfYear (172) года из YearDays (365) дают длину светового дня, полярные день и ночь тоже. Ночью землю освещает луна: Moon (false — неба без луны), MoonLight, MoonSize, MoonPhase (0 — новолуние, 0.5 — полнолуние, она запаздывает на эту долю суток), MoonElevation с MoonAzimuth держат её на месте, MoonTilt с MoonNode (день года, когда её путь пересекает солнечный) дают затмения: солнечное в новолуние и лунное в полнолуние, а NightLight — свет воздуха в темноте. SkyGlow (от 0 до 1) — свет городов в воздухе, цвета SkyGlowColor, со стороны SkyGlowAzimuth или отовсюду: он подсвечивает облака снизу и скрывает слабые звёзды. Звёзды вращаются вместе с планетой вокруг полюса на высоте Latitude. Weather (clear, cloudy, overcast, rain, storm, snow, fog, changing — сама сменяется по кругу), Cosmos (nebula, pillars, galaxy, galaxies, cluster, void или {Kind, Seed, Colors, Gas, Dust, Stars}) создаёт дальнее небо по зерну: газ, пыль, скопления и диск галактики, запекается по одной грани за кадр; Galaxy у солнца — полоса галактики над ночной землёй. Exposure (число фиксирует экспозицию, пусто — она подстраивается, как глаз), Front (секунды смены), Wind и WindWay — один ветер для облаков, дождя, травы и деревьев. Облака бывают разных типов и отбрасывают настоящие тени; вода и снег копятся на земле и сходят минутами. Weather меняется за несколько секунд, а дождь мочит всё, что под ним; Flare (от 0 до 2) — насколько сильно объектив показывает солнце. На high и ultra глянцевое и мокрое отражает то, что на экране, а за его краем небо. Вид light (Color, Power, Radius, Height, Spot, Aim, Flicker, Follow, Z) — лампа: сколько угодно, сразу светят 24 ближайшие, тени дают 2 ближайшие. Вид location (Model, Size, Without, Plane) делает землю из модели файла, полы и стены читаются из её треугольников; Control(id) отдаёт клавиши персонажу (с FreeLook стоящий персонаж не поворачивается вслед за камерой и разворачивается, только когда пошёл), То, что светится в модели файла, само освещает мир: лампы файла (KHR_lights_punctual) и светящиеся поверхности, собранные в лампы (Lights: false на объекте их отключает). Вид effect (Type: spark, torch, campfire, smoke, steam, dust, exhaust; Size, Power, Aim, Height, Light, On, Follow, Offset; вид огня: Color, Hot, Volume, Intensity, Length, Smoke) горит и дымит на месте или вместе с объектом, у огня есть свой свет, а воздух над ним дрожит; Burst(type, place, options) срабатывает один раз, как explosion, а Effects(types) добавляет свои типы. Hold: {Model, Bone, Aim, At, Turn, Size} вкладывает модель в руку, с Aim её ось идёт от одной кости к другой, а скелет без клипов получает walk и idle, созданные по именам костей (SceneModels.Gait). Правила Scatter принимают Reach и Grid: тайлы из готовых моделей и трава из модели (вид grass с Shapes).

Под землёй. Если в графе мира земли есть туннели, пещеры или нависания, по земле ходят как по локации с этажами: предмет с Z стоит на полу на этой высоте, герой ходит по туннелям (шаг вверх до 0,6 м, не круче примерно 60°, стены останавливают), камера держится уровня героя. Move(id, [x, z, y]) ведёт юнита на пол высоты y по тем же правилам, что и героя (WayUnder: путь над землёй и под ней), GroundAt попадает и в пещеру, видимую через вход. Dig(at, radius) выкапывает яму-шар во время игры: перестраиваются только куски вокруг неё, стоящее там опускается, ямы хранятся в Save (Digs) и возвращаются Load; событие dig ({At, Radius}). Под камнем темно: доля неба, видимого из каждой точки объёмной земли, ослабляет солнце, небо и отражённый свет, а лампы светят как обычно. Корабль садится и взлетает сам (признаки Entry и Flight, SceneLanding): Land(ship, {Marker} или {Latitude, Longitude}) ведёт его с орбиты через воздух в локацию точки, TakeOff(ship) поднимает его обратно на низкую орбиту; команда «Посадка» сцены показывает метки тела и выбор точки.

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
- `shader`
- `focus`: Вид перелетел к объекту: {ID}.
- `error`: Нет WebGL2 ({Reason: webgl2}) или карту не удалось загрузить (ошибка).
- `land`: Вид спустился на поверхность тела: {ID}.
- `takeoff`: Вид поднялся обратно в космос: {ID}.
- `select`: Выделение изменилось: {ID, Object, Info, IDs, Objects} (ID пустой, когда не выбрано ничего).
- `loading`
- `ready`: Сцена готова: сам компонент, чтобы вызывать его методы.
- `person`
- `shoulder`
- `dig`

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
- `ToScreen(id)`
- `Pick(clientX, clientY, all)`
- `Save(options)`
- `Load(saved, callback)`
- `Supported()`
- `Land(id, options)`
- `TakeOff(id)`
- `Surface()`

## Пример

```example
<div style="height: 380px;">
	<Scene Speed="6" (ready)="Ready" (select)="Selected" (arrive)="Arrived">
		<SceneObject ID="sun" Kind="star" Name="Sun">
			<SceneObject ID="earth" Kind="planet" Name="Earth" Surface-Type="terran" Radius="6371" Distance="1" Tilt="23.4">
				<SceneObject ID="moon" Kind="moon" Name="Moon" Radius="1737" Distance="384400 km" />
				<SceneObject ID="gateway" Kind="station" Name="Gateway" Team="blue" />
			</SceneObject>
			<SceneObject ID="mars" Kind="planet" Name="Mars" Surface-Type="desert" Radius="3390" Distance="1.52" Eccentricity="0.09" />
			<SceneObject ID="jupiter" Kind="planet" Name="Jupiter" Surface-Type="gas" Radius="69911" Distance="5.2" Day="9.9" />
		</SceneObject>
		<SceneObject ID="first" Kind="fleet" Name="First fleet" Parent="earth" Team="blue" Count="4" />
	</Scene>
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

- [reads a graph of an effect and the blocks of the passes with no Scene: Blueprints makes what declares them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-effect-blueprints.test.js#L77) — `tests/regression/library-effect-blueprints.test.js`
- [counts down, counts the laps of each racer through its checkpoints, their times and best, finishes and ends](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-race.test.js#L100) — `tests/regression/library-game-race.test.js`
- [counts no lap of a racer that goes back over the line, and tells the wrong way and the right way again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-race.test.js#L157) — `tests/regression/library-game-race.test.js`
- [selects the units of its team only, by code, by Ctrl+A and by a frame drawn over them, and none by Escape](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L74) — `tests/regression/library-game-strategy.test.js`
- [sends units to a place, each to its own spot, stops them, and has them attack a foe until it is gone](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L108) — `tests/regression/library-game-strategy.test.js`
- [hides in its fog the units of other teams that its units do not see, and tells what was seen and explored](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L149) — `tests/regression/library-game-strategy.test.js`
- [sets no timer of no function while the scene and its game are made](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L176) — `tests/regression/library-game-strategy.test.js`
- [gives the passes of the library as a render graph, in the order they run, and draws the same picture of it given](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-render-pipeline.test.js#L113) — `tests/regression/library-render-pipeline.test.js`
- [leaves out a pass switched off, takes the properties of its blocks, and adds a pass of a graph of its own after the picture](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-render-pipeline.test.js#L140) — `tests/regression/library-render-pipeline.test.js`
- [draws the picture of the library when the Pipeline cannot be made, and tells it once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-render-pipeline.test.js#L202) — `tests/regression/library-render-pipeline.test.js`
- [lets a crate fall onto the ground, tells the touch, and knocks it over by a push](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-rigid.test.js#L58) — `tests/regression/library-rigid.test.js`
- [shows a falling crate between its last two steps, by how far the time came into the next one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-rigid.test.js#L116) — `tests/regression/library-rigid.test.js`

+173 ещё в тех же файлах
