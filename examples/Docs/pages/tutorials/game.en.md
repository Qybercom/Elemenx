# A browser game

A small game: a hero on a map looks for five gems, round the water and the rocks; the HUD counts them, a menu starts and pauses the game, and an achievement comes with the last gem. The finished project is `examples/Tutorials/Game`.

What you learn: `GameWorld` and the things declared in it, its events and its methods, a HUD over it, `GameMenu`, the `Achievements` Service, and the keys and the gamepad.

## 1. The world

`GameWorld` draws a map of cells on a canvas and walks its units round what blocks them. Its map is declared inside it: a `GameLayer` of rows of text (a character a kind of ground: `.` grass, `~` water, `=` a ford, `^` hills, `T` a forest, `#` rock), the units, the buildings and the things.

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

The gems are a list of the state: a gem taken out of the list leaves the map. The `hud` slot is drawn over the world. `Projection="orthogonal"` shows the map from above; `isometric` at an angle, as many strategy games do (without it, the projection of the map).

## 2. Orders and arrivals

The world tells a press on a cell (`cell`, `{X, Y, Button, Object}`) and a unit at the end of its way (`arrive`, `{ID, X, Y}`). `ready` gives the world itself, whose methods give orders: `Order(ids, target)` sends units, `Change(id, changes)` moves one at once.

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

The world is kept in a variable of `$OnCreate`, not in a field: the state holds data, and a field holding a component would be watched for nothing. `World()` gives it to the methods. The handlers of the events (`Ready`, `Pressed`) are methods of the definition: the template binds them as it renders, before `$OnCreate` could add any.

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

## 3. The menu and the pause

```html
<div class="gems-menu" *if="Menu">
	<GameMenu [title]="Started ? 'Paused' : 'Gem hunt'" [subtitle]="Found === 5 ? 'You found them all!' : ''" [items]="Items(Started)" (select)="Chosen" />
</div>
<AchievementHost />
```

`Paused` of the world stops its units while the menu is open; Escape opens it, a listener of the document that `$OnDestroy` takes away. `AchievementHost` shows the achievements of the Service, one at a time, as a console does.

## 4. A gamepad

Nothing to add: the `Gamepad` Service makes a pad work the page as the keyboard does. The d-pad moves the focus between the items of the menu, A presses, B is Escape. `GameMenu` takes the arrows; a game of its own hears the buttons with `this.$Service('Gamepad').On('button', ...)`.

## 5. More

- A larger world: buildings, teams, the fog of war (`Fog`), a minimap (`Minimap`), a map of Tiled (`Map="maps/level.tmj"`, see the GameMaps Service).
- The loop of a game of your own, at a fixed step whatever the screen: the `GameLoop` Service.
- The inventory, the quests, the dialogues: `GameInventory`, `GameQuests`, `GameDialogue`.

## Next

- [GameWorld](/components/GameWorld) in the reference of the Library.
- [An application that works offline](/tutorials/pwa): a game installed, playable without the network.
