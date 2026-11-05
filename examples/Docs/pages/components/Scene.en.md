<!-- generated -->
# Scene

The scene of a game in three dimensions on WebGL2 (the Renderer Service): objects of any kind (the Kinds Service), each made of what its kind extends, what it can do (its Traits, each run by a system of the scene) and what it is made of (its Parts, objects of their own placed in it). The setting space (the default) brings the kinds of a star system and its systems: stars and planets on Kepler orbits (the Astronomy Service), lit by their stars (night sides, the shadows of moons and planets on each other and on rings), their surfaces of noise baked once into cube textures, belts and rings, stations of modules, fleets of ships that hold their place by a body and travel to another.

Kinds of space: star (Star: Mass, Radius, Temperature, Luminosity, Color, Veil: how far from the disc, in its radii, engines go in its light, 0 for not at all), planet (Orbit: Distance, Eccentricity, Inclination, Node, Periapsis, Anomaly, Period; Body: Radius, Mass, Day, Tilt, Albedo; Surface: Type, Colors, Water, Ocean, Ice, Clouds, Atmosphere, Seed), moon (a planet, small, one face to its planet), belt (Belt: Inner, Outer, Count, Inclination, Colors), ring (Ring: Inner, Outer, Inclination, Colors), station and outpost (an Orbit in radii of what they go round, a Model and parts: modules, a dock), fighter, cruiser and freighter (ships: Model, Health), fleet (Mover: Speed; Formation: Count, Ship, Spacing: its ships are parts). An application defines its own (SceneKinds.Define) and systems of its own for traits of its own (Systems: {Trait: {Update(object, scene), Draw(object, scene)}}).

The objects: System ({Objects: [{ID, Kind, Parent, Values, Traits, Parts, Children}]}), Seed (a whole system of it: Astronomy.Generate) and SceneObject declared inside (a SceneObject in another goes round it when it moves, an Orbit or a Mover, and is a part of it otherwise; Part="dock" changes a part of the kind of its parent). Every attribute of a SceneObject is a field of it or of a Trait, in any case. Time is the day (0), Speed the days of it a second (1), Paused holds it; Scale compressed (the default: large bodies, short distances) or real.

The view: a drag turns it round the object in focus, the wheel or two fingers zoom, a click selects an object (or its label; a part of an object near enough), a double click flies to it (from its day side), Escape goes back, the arrows turn, + and - zoom, Enter flies to the selected one, Space holds the time. Orbits, Labels, Details (a card of the selected object), Background (the far stars), Team, the slot hud, the slot screens (elements a car's screens show, out of sight). Without WebGL2 it says so (and emits error).

The view is free in every 3D scene: a drag turns and tilts it, the wheel zooms, the middle button or a drag with Shift carries it (two fingers on a screen), WASD or the arrows move it, Q and E turn it, R and F tilt it.

The sky of a ground: a SceneObject of kind sun takes Time (18:30, or hours as a number) and goes on at the pace of DaySeconds, Noon is the azimuth it passes at noon (180) and Shade the color of the light of the sky. DayHours is how long a day is (24); with a Latitude the sun goes as the planet turns: Tilt of its axis (23.44), DayOfYear (172) of a year of YearDays (365) give the length of the light of the day, the polar days and nights too. At night the moon lights the land: Moon (false: a sky without one), MoonLight, MoonSize, MoonPhase (0 new, 0.5 full, it goes late by that part of a day), MoonElevation with MoonAzimuth to hold it in a place, MoonTilt with MoonNode (the day of a year its way crosses the sun's: an eclipse, of the sun at a new moon, of the moon at a full one), and NightLight, the light of the air in the dark. SkyGlow (0 to 1) is the light towns throw on the air, of SkyGlowColor, from SkyGlowAzimuth or all round: it lights the clouds from under and hides the faint stars. The stars turn with the planet, round its pole at the height of Latitude, and with them the band of the galaxy (Galaxy, 0 for none). Weather (clear, cloudy, overcast, rain, storm, snow, fog) changes in a few seconds, and rain wets what stands in it (pools on what is level, drops on what is smooth; Wet and Drops of an object, 0 to 1, its own); Flare (0 to 2) is how strongly a lens shows the sun; Bokeh (0 to 1) blurs what is out of focus (BokehFocus, a distance; else the hero, or the middle of the view). At high and ultra what is glossy or wet mirrors what is on the screen, and past it the sky. Kind light (Color, Power, Radius, Height, Spot, Aim, Flicker, Follow, Z) is a lamp: any number, the nearest 24 at once, the nearest 2 with shadows; what shines in a model of a file is a lamp too (Lamps of the Models Service; Lights: false on an object leaves them out). Kind mirror (Width, Height, Yaw and Pitch in degrees, Lift over the ground or Z, Tint, Blur, Strength, Every: the frames between two of its pictures) shows the world reflected by its plane, drawn again at half the size (the nearest one at low and medium, two at high, three at ultra); kind glass (the same place and size, Tint, Clarity, Frost, Reflect) is a pane blended over what is behind it, the sky, the sun and, while Reflect is above 0, the world on it by its angle. Kind location (Model, Size, Without, Plane) makes a ground of a model of a file, its floors and walls read from its triangles; Control(id) gives the keys to a walker: a press takes the mouse (Capture), it faces the view, A and D step aside, Shift runs, Shift and Alt sprint, Space jumps, a drag with the right button turns the view and leaves the walk as it was. A skeleton with no clips gets walk and idle made from the names of its bones, Motions of a recipe bring clips of FBX files.

The surface: Land(id, {Latitude, Longitude, Altitude}) goes down to the ground of a body (not of a giant of gas), the very ground its baked surface shows (SceneTerrainGenerator.Sphere), in patches finer near the eye, under its sky (its atmosphere and its star); a drag looks round, the wheel rises and comes down, WASD and the arrows walk, Escape or TakeOff() goes back up. The time runs SurfaceSpeed days a second there (1/120). A ship lands and takes off by itself (its traits Entry and Flight, SceneLanding): Land(ship, {Marker} or {Latitude, Longitude}) takes it from its orbit through the air to the location of the point, TakeOff(ship) back up to a low orbit; the command Landing of the scene lists the markers of the body and lets a point be picked.

Kinds of the ground (the setting terrain): ground (Terrain: World, the graph of its world (SceneWorld: its land, relief, climate, biomes, sketch and what is made on it, the only place they are told; with none there is no ground), Swell (how wild its sea, 0 to 1.5: SceneWaves; wilder in the rain), SwellWay (degrees the wind drives it): a ground of noise, SceneTerrainGenerator.Flat, in chunks finer near the eye, with its sea; the objects its World makes are in the scene as Generated, made again with it and never saved), sun (Sun: its light from far), unit (Walker: Speed, MaxSlope, Swim; a Model), tree, rock and house (Model, Blocks: what stands in the way). An object of it stands at X and Y of the ground; Move(id, [x, y]) walks a walker round what cannot be walked, a right click sends the selected one; the view turns round a point of the ground and the keys move it. Every model of the Models Service is a kind of the same name (knight, mech, wolf, oak, tower, reactor...), of the kind that fits it.

The models stand in the light of their sun and cast shadows on each other and on the ground (Shadows); a Model plays clips of its pieces (Clip: the one it plays when idle): walk on a way by itself, Play(id, clip, callback) the others (attack, cast, work, die); the wind bends what grows. View top or isometric sees a ground in parallel rays, as a game of two dimensions.

A strategy game, a race and any other game is a component declared inside it (GameStrategy, GameRace of ElemenxGaming: the trait SceneBehaviour).

Events: ready (the scene, for its methods), select ({ID, Object, Info}: ID empty when none is), focus ({ID}), arrive ({ID, At}), land ({ID}), takeoff ({ID}), error ({Reason: webgl2}); enter and leave of a trigger ({Trigger, ID, Object}) and action ({Trigger, Name, Data}): kind trigger and kind zone (trait Triggers: Trigger(id), TriggerActions(actions), ZonesAt(x, z)); touch ({ID, With, At, Normal, Impulse}) of solid things that fall and are knocked over (trait Rigid: Push(id, impulse, at), CastRay(from, direction, max), RigidWorld()). Cosmos (nebula, pillars, galaxy, galaxies, cluster, void, or {Kind, Seed, Colors, Gas, Dust, Stars, Pillars, Band, Galaxies, Clusters, Beacon}) is what lies far behind a system (trait Cosmos). Kind effect (Type: spark, torch, campfire, smoke, steam, dust, exhaust; Size, Power, Aim, Height, Light, Follow, Offset) burns and smokes where it stands, or goes with an object; Burst(type, place, options) happens once, as an explosion (trait Effects). Methods: Add(kind, props), Change(id, changes), Remove(id), Attach(parent, object), Detach(id), Get(id), Objects(filter), Describe(id), Position(id), Select(id), FocusOn(id), Move(id, target), Now(), SetTime(days), Play(id, clip, callback), ToScreen(id), Pick(clientX, clientY), Save(options), Load(saved), Land(id, options), TakeOff(), Surface(), Supported(). Save gives the recipe of a game (Seed, Cosmos, Weather, Time and what the methods changed: Added, Removed, Overrides), made again by Load; Save({Baked: true}) every object as it is.

What a scene waits for, its programs and models, comes behind the page and holds no frame up: Loader shows how far it came, a slot named loading takes the place of the bar, and the event loading tells {Part}, up to 100.

## Properties

| Property | Default |
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

## Events

- `arrive`: An object reached where it was sent: {ID, At}.
- `shader`: A graph (or GLSL written by hand) made into a shader did not compile, and what the library has is drawn in its place: {Kind (material, vertex, land, water, wind, grass, effect, pass), Owner (the material, object or prop of the graph), Errors ([{Block, Line, Message}]: each on the block of GLSL it is in), Message}.
- `focus`: The view moved to an object: {ID}.
- `error`: There is no WebGL2 ({Reason: webgl2}).
- `land`: The view went down to the surface of a body: {ID}.
- `takeoff`: The view went back up to space: {ID}.
- `select`: The selection changed: {ID, Object, Info, IDs, Objects} (ID empty when none is).
- `loading`: What the scene waits for came a step nearer: {Part}, up to 100.
- `ready`: The scene is ready: the component itself, to call its methods.
- `person`: V took the view of a walker to another place: third, first or shoulder.
- `shoulder`: B took the view over another shoulder: right or left.
- `dig`: A hole was dug in the ground (Dig): {At, Radius}.

## Slots

`loading`, `hud`, default, `screens`

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

## Example

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

## Tests

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

+173 more in the same files
