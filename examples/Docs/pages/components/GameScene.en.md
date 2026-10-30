<!-- generated -->
# GameScene

The scene of a game in three dimensions on WebGL2 (the Graphics3D Service): objects of any kind (the Kinds Service), each made of what its kind extends, what it can do (its Traits, each run by a system of the scene) and what it is made of (its Parts, objects of their own placed in it). The setting space (the default) brings the kinds of a star system and its systems: stars and planets on Kepler orbits (the Astronomy Service), lit by their stars (night sides, the shadows of moons and planets on each other and on rings), their surfaces of noise baked once into cube textures, belts and rings, stations of modules, fleets of ships that hold their place by a body and travel to another.

Kinds of space: star (Star: Mass, Radius, Temperature, Luminosity, Color), planet (Orbit: Distance, Eccentricity, Inclination, Node, Periapsis, Anomaly, Period; Body: Radius, Mass, Day, Tilt, Albedo; Surface: Type, Colors, Water, Ocean, Ice, Clouds, Atmosphere, Seed), moon (a planet, small, one face to its planet), belt (Belt: Inner, Outer, Count, Inclination, Colors), ring (Ring: Inner, Outer, Inclination, Colors), station and outpost (an Orbit in radii of what they go round, a Model and parts: modules, a dock), fighter, cruiser and freighter (ships: Model, Health), fleet (Mover: Speed; Formation: Count, Ship, Spacing: its ships are parts). An application defines its own (Kinds.Define) and systems of its own for traits of its own (Systems: {Trait: {Update(object, scene), Draw(object, scene)}}).

The objects: System ({Objects: [{ID, Kind, Parent, Values, Traits, Parts, Children}]}), Seed (a whole system of it: Astronomy.Generate) and GameObject declared inside (a GameObject in another goes round it when it moves, an Orbit or a Mover, and is a part of it otherwise; Part="dock" changes a part of the kind of its parent). Every attribute of a GameObject is a field of it or of a Trait, in any case. Time is the day (0), Speed the days of it a second (1), Paused holds it; Scale compressed (the default: large bodies, short distances) or real.

The view: a drag turns it round the object in focus, the wheel or two fingers zoom, a click selects an object (or its label; a part of an object near enough), a double click flies to it (from its day side), Escape goes back, the arrows turn, + and - zoom, Enter flies to the selected one, Space holds the time. Orbits, Labels, Details (a card of the selected object), Background (the far stars), Team, the slot hud. Without WebGL2 it says so (and emits error).

The surface: Land(id, {Latitude, Longitude, Altitude}) goes down to the ground of a body (not of a giant of gas), the very ground its baked surface shows (Terrain.Sphere), in patches finer near the eye, under its sky (its atmosphere and its star); a drag looks round, the wheel rises and comes down, WASD and the arrows walk, Escape or TakeOff() goes back up. The time runs SurfaceSpeed days a second there (1/120).

Kinds of the ground (the setting terrain): ground (Terrain: Size, Height, Water, Scale, Ridges, Seed: a ground of noise, Terrain.Flat, in chunks finer near the eye, with its sea), sun (Sun: its light from far), unit (Walker: Speed, MaxSlope, Swim; a Model), tree, rock and house (Model, Blocks: what stands in the way). An object of it stands at X and Y of the ground; Move(id, [x, y]) walks a walker round what cannot be walked, a right click sends the selected one; the view turns round a point of the ground and the keys move it. Every model of the Models Service is a kind of the same name (knight, mech, wolf, oak, tower, reactor...), of the kind that fits it.

The models stand in the light of their sun and cast shadows on each other and on the ground (Shadows); a Model plays clips of its pieces (Clip: the one it plays when idle): walk on a way by itself, Play(id, clip, callback) the others (attack, cast, work, die); the wind bends what grows.

Events: ready (the scene, for its methods), select ({ID, Object, Info}: ID empty when none is), focus ({ID}), arrive ({ID, At}), land ({ID}), takeoff ({ID}), error ({Reason: webgl2}). Methods: Add(kind, props), Change(id, changes), Remove(id), Attach(parent, object), Detach(id), Get(id), Objects(filter), Describe(id), Position(id), Select(id), FocusOn(id), Move(id, target), Now(), SetTime(days), Play(id, clip, callback), ToScreen(id), Pick(clientX, clientY), Save(), Load(saved), Land(id, options), TakeOff(), Surface(), Supported().

## Properties

| Property | Default |
| --- | --- |
| `System` | `null` |
| `Seed` | `''` |
| `Systems` | `null` |
| `Time` | `0` |
| `Speed` | `1` |
| `SurfaceSpeed` | `1 / 120` |
| `Shadows` | `true` |
| `Paused` | `false` |
| `Orbits` | `true` |
| `Labels` | `true` |
| `Details` | `true` |
| `Background` | `true` |
| `Scale` | `'compressed'` |
| `Team` | `''` |
| `Label` | `''` |

## Events

- `arrive`: An object reached where it was sent: {ID, At}.
- `focus`: The view moved to an object: {ID}.
- `land`: The view went down to the surface of a body: {ID}.
- `takeoff`: The view went back up to space: {ID}.
- `select`: An object was selected: {ID, Object, Info} (ID empty when none is).
- `error`: There is no WebGL2: {Reason: webgl2}.
- `ready`: The scene is ready: the component itself, to call its methods.

## Slots

`hud`, default

## Methods

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
- `ToScreen(id)`
- `Pick(clientX, clientY)`
- `Save()`
- `Load(saved)`
- `Supported()`
- `Land(id, options)`
- `TakeOff()`
- `Surface()`

## Example

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

## Tests

- [reads the GameObject inside it: each attribute a field of its kind, nested ones going round their holder or a part of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L314) — `tests/regression/library-scene.test.js`
- [draws the star bright, the day side of a body of its baked surface, not its night side, and the same far from the middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L361) — `tests/regression/library-scene.test.js`
- [selects an object by its label and a part by a press when near, flies to it, sends a fleet that arrives](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L402) — `tests/regression/library-scene.test.js`
- [adds, changes, attaches, detaches and removes objects and parts, saves the game and loads it the same](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L464) — `tests/regression/library-scene.test.js`
- [runs the systems of the application for traits of their own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L526) — `tests/regression/library-scene.test.js`
- [lands on the surface of a body and takes off again; a giant of gas has none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L543) — `tests/regression/library-scene.test.js`
- [plays the clips of a model: walking on a way by itself, a clip that ends going back, a kind for each model](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L583) — `tests/regression/library-scene.test.js`
- [casts the shadows of what stands on a ground, or none when told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L652) — `tests/regression/library-scene.test.js`
- [walks a unit over a ground round the water and what blocks it, sends it by a right press, and saves its place](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L705) — `tests/regression/library-scene.test.js`
