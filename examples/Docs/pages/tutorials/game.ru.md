<!-- generated -->
# Браузерная игра

Небольшая игра: герой на карте ищет пять кристаллов, обходя воду и скалы; HUD считает их, меню запускает и ставит игру на паузу, а за последний кристалл приходит достижение. Готовый проект — `examples/Tutorials/Game`.

Чему вы научитесь: `GameWorld` и то, что в нём объявлено, его события и методы, HUD поверх него, `GameMenu`, сервис `Achievements`, клавиши и геймпад.

## 1. Мир

`GameWorld` рисует карту из клеток на canvas и водит своих юнитов в обход препятствий. Карта объявляется внутри него: `GameLayer` из строк текста (символ — вид земли: `.` трава, `~` вода, `=` брод, `^` холмы, `T` лес, `#` скала), юниты, здания и предметы.

```html
<GameWorld Team="blue" Projection="orthogonal" [paused]="Menu" Label="The map" (ready)="Ready" (cell)="Pressed" (arrive)="Arrived">
	<GameLayer Name="ground" [rows]="Rows" />
	<GameUnit ID="hero" X="1" Y="1" Team="blue" Type="hero" Name="Hero" Speed="4" />
	<GameObject *for="gem of Gems" *key="gem.ID" [id]="gem.ID" Kind="gem" [x]="gem.X" [y]="gem.Y" Color="#c47dff" Name="A gem" />
	<div slot="hud" class="gems-hud">
		<div class="elemenx-game-panel gems-score">
			<strong>Gems</strong>
			<GameBar [value]="Found" Max="5" Kind="mana" Segments="5" ShowValue="true" Label="Gems found" />
		</div>
		<span class="elemenx-game-panel gems-help" *if="!Menu">{{Target ? 'Going to ' + Target : 'Press a cell: the hero goes there'}} · Escape pauses</span>
	</div>
</GameWorld>
```

```js
Rows: [
	'..........~~........',
	'..TT......~~....^^..',
	'..TT......=~........',
	'..........~~...##...',
	'....##....~~...##...',
	'....##..............',
	'..........~~....TT..',
	'..........~~....TT..'
]
```

Кристаллы — список в состоянии: кристалл, убранный из списка, исчезает с карты. Слот `hud` рисуется поверх мира. `Projection="orthogonal"` показывает карту сверху, а `isometric` — под углом, как во многих стратегиях (без него — проекция самой карты).

## 2. Приказы и прибытие

Мир сообщает о нажатии на клетку (`cell`, `{X, Y, Button, Object}`) и о юните в конце пути (`arrive`, `{ID, X, Y}`). `ready` отдаёт сам мир, методы которого отдают приказы: `Order(ids, target)` отправляет юнитов, `Change(id, changes)` сразу переставляет одного.

```js
$OnCreate: function () {
	/* The world, once it is ready: its methods (Order, Change, CenterOn...). It stays out of the state. */
	var world = null;

	this.World = function (instance) {
		if (instance)
			world = instance;

		return world;
	};
},

Ready: function (world) {
	this.World(world);
},

/* A cell pressed: the hero goes there, round what blocks the way. */
Pressed: function (detail) {
	if (this.Menu || !this.World()) return;

	this.Target = detail.X + ', ' + detail.Y;

	this.World().Order(['hero'], {X: detail.X, Y: detail.Y});
}
```

Мир хранится в переменной `$OnCreate`, а не в поле: состояние хранит данные, и поле с компонентом отслеживалось бы впустую. `World()` отдаёт его методам. Обработчики событий (`Ready`, `Pressed`) — методы определения: шаблон привязывает их при отрисовке, раньше, чем `$OnCreate` успел бы что-то добавить.

```js
Arrived: function (detail) {
	var found = this.Gems.filter(function (gem) {
		return gem.X === detail.X && gem.Y === detail.Y;
	})[0];

	if (!found) return;

	this.Gems = this.Gems.filter(function (gem) {
		return gem !== found;
	});
	this.Found++;

	if (!this.Gems.length) {
		this.$Service('Achievements').Show({Title: 'Gem hunter', Text: 'All five gems found.', Rarity: 'epic', Points: 50, Icon: 'trophy'});
		this.Started = false;
		this.Menu = true;
	}
}
```

## 3. Меню и пауза

```html
<div class="gems-menu" *if="Menu">
	<GameMenu [title]="Started ? 'Paused' : 'Gem hunt'" [subtitle]="Found === 5 ? 'You found them all!' : ''" [items]="Items(Started)" (select)="Chosen" />
</div>
<AchievementHost />
```

`Paused` мира останавливает юнитов, пока открыто меню; его открывает Escape — слушатель документа, которого убирает `$OnDestroy`. `AchievementHost` показывает достижения сервиса по одному, как это делает консоль.

## 4. Геймпад

Ничего добавлять не нужно: сервис `Gamepad` заставляет геймпад управлять страницей так же, как клавиатура. Крестовина двигает фокус между пунктами меню, A нажимает, B — это Escape. `GameMenu` принимает стрелки; своя игра слышит кнопки через `this.$Service('Gamepad').On('button', ...)`.

## 5. Что ещё

- Мир побольше: здания, команды, туман войны (`Fog`), миникарта (`Minimap`), карта Tiled (`Map="maps/level.tmj"`, см. сервис GameMaps).
- Цикл своей игры с фиксированным шагом на любом экране: сервис `GameLoop`.
- Инвентарь, квесты, диалоги: `GameInventory`, `GameQuests`, `GameDialogue`.

## Дальше

- [GameWorld](/components/GameWorld) в справке библиотеки.
- [Приложение, работающее офлайн](/tutorials/pwa): игра, установленная и доступная без сети.
