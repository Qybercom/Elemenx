<!-- generated -->
# GameScene

Сцена игры в трёх измерениях на WebGL2 (сервис Graphics3D): объекты любого вида (сервис Kinds), каждый из того, что расширяет его вид, что он умеет (черты, Traits, каждую ведёт система сцены) и из чего состоит (части, Parts, — объекты, размещённые в нём). Сеттинг space (по умолчанию) приносит виды звёздной системы и их системы: звёзды и планеты на кеплеровых орбитах (сервис Astronomy), освещённые своими звёздами (ночные стороны, тени лун и планет друг на друге и на кольцах), их поверхности из шума, один раз запечённые в кубические текстуры, пояса и кольца, станции из модулей, флоты кораблей, которые держатся у тела и летят к другому. Виды space: star, planet, moon, belt, ring, module, station, outpost, fighter, cruiser, freighter, fleet; приложение определяет свои (Kinds.Define) и системы для своих черт (Systems: {Черта: {Update(object, context), Draw(object, context)}}). Объекты — System ({Objects: [{ID, Kind, Parent, Values, Traits, Parts, Children}]}), Seed (целая система из него) и GameObject внутри. Time, Speed, Paused, Scale (compressed или real), Focus, Selected, Orbits, Labels, Details, Background, Team, слот hud; перетаскивание вращает вид, колесо и два пальца приближают, щелчок выбирает объект (или часть объекта вблизи), двойной щелчок перелетает к нему, Escape, стрелки, + и −, Enter, пробел. Вид рисуется относительно глаза, с разрешением по времени кадра. Land(id, {Latitude, Longitude, Altitude}) спускает вид на поверхность тела (не газового гиганта): тот же рельеф, что на запечённой поверхности (Terrain.Sphere), кусками, тем мельче, чем ближе к глазу, под небом его атмосферы и звезды; перетаскивание осматривается, колесо поднимает и опускает, WASD и стрелки идут, Escape или TakeOff() поднимает обратно; время там идёт со скоростью SurfaceSpeed дней в секунду (1/120). Сеттинг terrain — земля и её юниты: ground (Terrain: Size, Height, Water, Scale, Ridges, Seed — земля из шума, Terrain.Flat, с морем), sun (Sun: свет издалека), unit (Walker: Speed, MaxSlope, Swim), tree, rock, house (Model, Blocks — то, что стоит на пути); объект стоит в X и Y земли, Move(id, [x, y]) ведёт юнита в обход непроходимого, правый щелчок посылает выбранного. Каждая модель сервиса Models — вид с тем же именем на подходящей основе (knight, oak, tower…). Модели отбрасывают тени солнца друг на друга и на землю, рельеф — на поверхность планеты, части модели в фокусе — друг на друга (Shadows, true); растения гнутся на ветру; Model играет клипы своих частей: walk на пути сам, Clip в покое, Play(id, clip, callback) — остальные (attack, cast, work, die): клип с концом вызывает callback и возвращается назад, петля остаётся, die держит последнюю позу. События: ready, select ({ID, Object, Info}), focus, arrive, land, takeoff, error. Методы: Add, Change, Remove, Attach, Detach, Get, Objects, Describe, Position, Select, FocusOn, Move, Play, Now, SetTime, ToScreen, Pick, Save (каждый объект — вид и отличия от него), Load, Land, TakeOff, Surface, Supported. View top или isometric показывает землю в параллельных лучах, как двумерную игру; Add принимает и список. Карта клеток: Map (JSON или URL, в том числе Tiled), GameTerrain и GameLayer внутри делают землю стратегии, остальные GameObject стоят на клетках (X, Y, Width, Height). Вид сверху (Projection orthogonal) или под углом (isometric); модели, тени и клипы те же, метки и туман лежат поверх на canvas, а карта или объект с картинками (Image) и браузер без WebGL2 рисуются на нём целиком. Team — команда игрока: её юниты (то, что умеет Walker) выбираются кликом, Shift, рамкой, двойным кликом и Ctrl+A и получают приказы правым кликом или касанием (A*, расходятся вокруг цели); здания — то, что Blocks и выбирается. Fog, Grid, Minimap, X, Y, Zoom, MinZoom, MaxZoom. События карты: load, order, cell, view. Методы те же, что у любой сцены (Select принимает id или список, Move — id или список, ToScreen — id или x и y, Load — сохранённую игру или карту), и ещё Selection, Order, Stop, Cell, Paint, Near, Route, PathGrid, FogOfWar, CenterOn, ToCell. Массовое наполнение: GameObject вида с чертой Scatter (forest, grove, thicket, rocks или свой) рассаживает модели по правилам — Shapes, Density (на сто квадратных единиц), Size, MinHeight, MaxHeight, MaxSlope, Cover, Patch, Seed, Blocks; вид с чертой Grass (grass) растит траву в вершинном шейдере вокруг вида — Density, Height, Color, Root, MaxHeight, MaxSlope. Отдельного объекта на каждую вещь нет: вблизи рисуется вся модель, дальше упрощённые уровни, совсем далеко снимок, запечённый со всех сторон. Sown() сообщает {Things, Squares, Waiting, Draws, Blades}.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `System` | `null` |
| `Seed` | `''` |
| `Systems` | `null` |
| `Time` | `0` |
| `Speed` | `1` |
| `SurfaceSpeed` | `1 / 120` |
| `Shadows` | `true` |
| `View` | `''` |
| `Paused` | `false` |
| `Orbits` | `true` |
| `Labels` | `true` |
| `Details` | `true` |
| `Background` | `true` |
| `Scale` | `'compressed'` |
| `Team` | `''` |
| `Label` | `''` |

## События

- `arrive`: Объект дошёл туда, куда его послали: {ID, At}, на карте ещё X и Y.
- `focus`: Вид перелетел к объекту: {ID}.
- `land`: Вид спустился на поверхность тела: {ID}.
- `takeoff`: Вид поднялся обратно в космос: {ID}.
- `select`: Выделение изменилось: {ID, Object, Info, IDs, Objects} (ID пустой, когда не выбрано ничего).
- `error`: Нет WebGL2 ({Reason: webgl2}) или карту не удалось загрузить (ошибка).
- `ready`: Сцена готова: сам компонент, чтобы вызывать его методы.

## Слоты

`hud`, по умолчанию

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
- `FocusOn(id)`
- `Move(id, target, callback)`
- `Play(id, clip, callback)`
- `Now()`
- `SetTime(days)`
- `ToScreen(id, y)`
- `Pick(clientX, clientY)`
- `Save()`
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
- [reads the GameObject inside it: each attribute a field of its kind, nested ones going round their holder or a part of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L314) — `tests/regression/library-scene.test.js`
- [draws the star bright, the day side of a body of its baked surface, not its night side, and the same far from the middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L361) — `tests/regression/library-scene.test.js`
- [selects an object by its label and a part by a press when near, flies to it, sends a fleet that arrives](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L402) — `tests/regression/library-scene.test.js`
- [adds, changes, attaches, detaches and removes objects and parts, saves the game and loads it the same](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L464) — `tests/regression/library-scene.test.js`
- [runs the systems of the application for traits of their own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L526) — `tests/regression/library-scene.test.js`
- [lands on the surface of a body and takes off again; a giant of gas has none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L543) — `tests/regression/library-scene.test.js`
- [plays the clips of a model: walking on a way by itself, a clip that ends going back, a kind for each model](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L583) — `tests/regression/library-scene.test.js`
- [sees a ground in parallel rays: from above a point is where the plan says, at an angle where the rhombus says](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L652) — `tests/regression/library-scene.test.js`

+5 ещё в тех же файлах
