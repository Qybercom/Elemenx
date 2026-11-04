<!-- generated -->
# Браузерная игра

Небольшая игра: герой на холмистой земле ищет пять кристаллов, обходя воду и крутые склоны; HUD считает их, меню запускает и ставит игру на паузу, а за последний кристалл приходит достижение. Готовый проект — `examples/Tutorials/Game`.

Чему вы научитесь: `Scene` и то, что в ней объявлено, `GameStrategy`, которая выбирает юнитов и отдаёт им приказы, триггеры сцены, HUD поверх неё, `GameMenu`, сервис `Achievements`, клавиши и геймпад.

## 1. Земля

`Scene` рисует трёхмерную землю и водит юнитов в обход того, что им не пройти: воды, крутых склонов, деревьев. Всё, что в ней есть, объявляется внутри: солнце, земля (рельеф из шума по `Seed`, размер `Size` в метрах, высота `Height`, доля под водой `Water`), лес и трава поверх неё, герой, кристаллы.

```html
<Scene Setting="terrain" Team="blue" [paused]="Menu" Label="The land" (ready)="Ready" (enter)="Entered">
	<SceneObject ID="day" Kind="sun" Time="15:30" />
	<SceneObject ID="land" Kind="ground" Size="300" Height="22" Water="0.15" Scale="260" Ridges="0.1" Seed="gems" />
	<SceneObject ID="woods" Kind="forest" Density="0.6" Cover="0.4" />
	<SceneObject ID="meadow" Kind="grass" Density="0.6" Height="0.5" />
	<SceneObject ID="hero" Kind="unit" X="0" Y="0" Team="blue" Name="Hero" Speed="9" />
	<SceneObject *for="gem of Gems" *key="gem.ID" [id]="gem.ID" Kind="thing" [x]="gem.X" [y]="gem.Y" Model="crystal" Size="2.5" Name="A gem" />
	<SceneObject *for="gem of Gems" *key="'at-' + gem.ID" [id]="'at-' + gem.ID" Kind="trigger" [x]="gem.X" [y]="gem.Y" Radius="2.5" />
	<GameStrategy Team="blue" Selected="hero" (order)="Ordered" />
	<div slot="hud" class="gems-hud">
		<div class="elemenx-game-panel gems-score">
			<strong>Gems</strong>
			<GameBar [value]="Found" Max="5" Kind="mana" Segments="5" ShowValue="true" Label="Gems found" />
		</div>
		<span class="elemenx-game-panel gems-help" *if="!Menu">{{Target ? 'Going to ' + Target : 'A right press on the land sends the hero there'}} · Escape pauses</span>
	</div>
</Scene>
```

```js
Start: [
	{ID: 'g1', X: -60, Y: 30},
	{ID: 'g2', X: 40, Y: -50},
	{ID: 'g3', X: 70, Y: 60},
	{ID: 'g4', X: -30, Y: -70},
	{ID: 'g5', X: 10, Y: 80}
]
```

X и Y — метры по земле от её середины. Кристаллы — список в состоянии: кристалл, убранный из списка, исчезает с земли, а с ним и триггер вокруг него. Слот `hud` рисуется поверх сцены.

## 2. Приказы и триггеры

`GameStrategy` (из библиотеки `ElemenxGaming`) превращает сцену в стратегию: ходячие юниты её команды `Team` — юниты игрока; нажатие выбирает одного, рамка — нескольких, а правое нажатие на землю отправляет их туда, и путь находится в обход воды и склонов. `Selected="hero"` выбирает героя с самого начала. Событие `order` сообщает, куда их отправили.

Триггер — место сцены, которое сообщает, кто вошёл (`enter`) и кто вышел (`leave`): здесь это круг радиусом `Radius` метров вокруг каждого кристалла. `ready` отдаёт саму сцену, методы которой её меняют: `Change(id, changes)` сразу переставляет объект, `SetViewpoint(view)` ставит взгляд.

```js
$OnCreate: function () {
	/* The scene, once it is ready: its methods (Change, SetViewpoint...). It stays out of the state. */
	var scene = null;

	this.Land = function (instance) {
		if (instance)
			scene = instance;

		return scene;
	};
},

Ready: function (scene) {
	this.Land(scene);

	scene.SetViewpoint({Target: [-20, 4, 10], Yaw: 0.6, Pitch: 0.75, Distance: 70});
},

/* Where the hero was sent. */
Ordered: function (detail) {
	if (detail.Kind === 'move')
		this.Target = Math.round(detail.X) + ', ' + Math.round(detail.Z);
}
```

Сцена хранится в переменной `$OnCreate`, а не в поле: состояние хранит данные, и поле с компонентом отслеживалось бы впустую. `Land()` отдаёт её методам. Обработчики событий (`Ready`, `Ordered`) — методы определения: шаблон привязывает их при отрисовке, раньше, чем `$OnCreate` успел бы что-то добавить.

```js
/* The hero came into the trigger round a gem: the gem is found. */
Entered: function (detail) {
	var id = detail.Trigger.ID.replace(/^at-/, '');
	var found = this.Gems.filter(function (gem) {
		return gem.ID === id;
	})[0];
	if (!found || detail.ID !== 'hero') return;

	this.Gems = this.Gems.filter(function (gem) {
		return gem !== found;
	});
	this.Found++;

	if (!this.Gems.length) {
		this.$Service('Achievements').Unlock('gem-hunter');

		this.Started = false;
		this.Menu = true;
	}
}
```

## 3. Достижение

Сервис `Achievements` хранит достижения приложения как данные: их определения, насколько продвинулось каждое и какие получены. Сам он ничего не показывает: каждое полученное достижение показывает `AchievementHost`, как это делает игровая консоль.

```js
/* The achievement of the game: data of the Achievements Service; the AchievementHost shows it as it is unlocked. */
if (!this.$Service('Achievements').State('gem-hunter'))
	this.$Service('Achievements').Define({ID: 'gem-hunter', Title: 'Gem hunter', Text: 'All five gems found.', Rarity: 'epic', Points: 50});
```

Достижение может считаться до цели `Goal` (`Progress(id)` за каждый кристалл), а приложение хранит их где хочет: `Export()` отдаёт их состояния, `Import(data)` возвращает их.

## 4. Меню и пауза

```html
<div class="gems-menu" *if="Menu">
	<GameMenu [title]="Started ? 'Paused' : 'Gem hunt'" [subtitle]="Found === 5 ? 'You found them all!' : ''" [items]="Items(Started)" (select)="Chosen" />
</div>
<AchievementHost />
```

`Paused` сцены останавливает её, пока открыто меню; Escape открывает его — это слушатель документа, которого убирает `$OnDestroy`.

## 5. Геймпад

Ничего добавлять не нужно: сервис `Gamepad` позволяет управлять страницей с геймпада так же, как с клавиатуры. Крестовина переводит фокус между пунктами меню, A нажимает, B — это Escape. `GameMenu` берёт стрелки; собственная игра слышит кнопки через сервис `InputDevices`.

## 6. Дальше

- Больше юнитов и команд: юниты другой команды `Team`, которых `GameStrategy` атакует по правому нажатию на них, их `Damage`, `Range` и `Sight`, туман войны (`Fog`).
- Дороги по земле (`Kind="road"`), гонка по дороге (`GameRace`).
- Цикл собственной игры с постоянным шагом на любом экране: сервис `Loop`.
- Инвентарь, задания, диалоги: `GameInventory`, `GameQuests`, `GameDialogue`.

## Что дальше

- [Scene](/components/Scene) и [GameStrategy](/components/GameStrategy) в справочнике библиотек.
- [Приложение, которое работает без сети](/tutorials/pwa): игра устанавливается и работает без сети.
