# A browser game

A small game: a hero on a land of hills looks for five gems, round the water and the slopes; the HUD counts them, a menu starts and pauses the game, and an achievement comes with the last gem. The finished project is `examples/Tutorials/Game`.

What you learn: `Scene` and the things declared in it, `GameStrategy` that selects and orders the units, the triggers of a scene, a HUD over it, `GameMenu`, the `Achievements` Service, and the keys and the gamepad.

## 1. The land

`Scene` draws a land of three dimensions and walks its units round what they cannot cross: the water, the steep slopes, the trees. What is in it is declared inside it: the sun, the ground (a land of noise of its `Seed`, its `Size` in metres, its `Height`, how much of it is under `Water`), a forest and the grass sown over it, the hero, the gems.

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

X and Y are metres across the land from its middle. The gems are a list of the state: a gem taken out of the list leaves the land, and the trigger round it with it. The `hud` slot is drawn over the scene.

## 2. Orders and triggers

`GameStrategy` (of the `ElemenxGaming` Library) makes the scene a strategy game: the walkers of its `Team` are the units of the player, a press selects one, a frame drawn selects many, and a right press on the land sends them there, their way found round the water and the slopes. `Selected="hero"` selects the hero from the start. Its event `order` tells where they were sent.

A trigger is a place of the scene that tells who comes in (`enter`) and who goes out (`leave`): here a circle of `Radius` metres round each gem. `ready` gives the scene itself, whose methods change it: `Change(id, changes)` moves one at once, `SetViewpoint(view)` puts the eye.

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

The scene is kept in a variable of `$OnCreate`, not in a field: the state holds data, and a field holding a component would be watched for nothing. `Land()` gives it to the methods. The handlers of the events (`Ready`, `Ordered`) are methods of the definition: the template binds them as it renders, before `$OnCreate` could add any.

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

## 3. The achievement

The `Achievements` Service keeps the achievements of an Application as data: their definitions, how far each has come, which are unlocked. It shows nothing: the `AchievementHost` shows each one unlocked, as a console does.

```js
/* The achievement of the game: data of the Achievements Service; the AchievementHost shows it as it is unlocked. */
if (!this.$Service('Achievements').State('gem-hunter'))
	this.$Service('Achievements').Define({ID: 'gem-hunter', Title: 'Gem hunter', Text: 'All five gems found.', Rarity: 'epic', Points: 50});
```

An achievement may count up to a `Goal` (`Progress(id)` at each gem), and the Application keeps them where it likes: `Export()` gives their states, `Import(data)` takes them back.

## 4. The menu and the pause

```html
<div class="gems-menu" *if="Menu">
	<GameMenu [title]="Started ? 'Paused' : 'Gem hunt'" [subtitle]="Found === 5 ? 'You found them all!' : ''" [items]="Items(Started)" (select)="Chosen" />
</div>
<AchievementHost />
```

`Paused` of the scene stops it while the menu is open; Escape opens it, a listener of the document that `$OnDestroy` takes away.

## 5. A gamepad

Nothing to add: the `Gamepad` Service makes a pad work the page as the keyboard does. The d-pad moves the focus between the items of the menu, A presses, B is Escape. `GameMenu` takes the arrows; a game of its own hears the buttons with the `InputDevices` Service.

## 6. More

- More units and teams: units of another `Team` that `GameStrategy` attacks with a right press on them, their `Damage`, `Range` and `Sight`, the fog of war (`Fog`).
- Roads over the land (`Kind="road"`), a race on a road (`GameRace`).
- The loop of a game of your own, at a fixed step whatever the screen: the `Loop` Service.
- The inventory, the quests, the dialogues: `GameInventory`, `GameQuests`, `GameDialogue`.

## Next

- [Scene](/components/Scene) and [GameStrategy](/components/GameStrategy) in the reference of the Libraries.
- [An application that works offline](/tutorials/pwa): a game installed, playable without the network.
