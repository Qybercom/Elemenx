<!-- generated -->
# Astronomy

The numbers of a star system, as a game needs them: where a body is on its orbit at a time (the laws of Kepler), what a star and a planet are made of and how warm they are, and whole systems made of a seed. Nothing is drawn here.

Units: distances in astronomical units (AU), times in days, the masses of stars in the masses of the Sun, the ones of planets and moons in the masses of the Earth, the radii of stars in the radii of the Sun, of planets in km, angles in degrees. Space is the one of the ecliptic: X and Y in its plane, Z to its north.

- Length(value): a length in AU, of a number (in AU) or a text with its unit: '384400 km', '2.5 Mkm', '5.2 AU', '4.2 ly', '1.3 pc'.
- Period(distance, mass): the days of an orbit round a mass (in masses of the Sun).
- Position(orbit, time, mass): where a body is ([x, y, z] in AU from what it goes round) at a time (days). An orbit is {Distance (the half of its long axis), Eccentricity (0 a circle, below 1), Inclination, Node (the longitude of the ascending node), Periapsis (the argument of the periapsis), Anomaly (the mean anomaly at the time 0), Period (days: of the mass by default)}.
- Path(orbit, count): count points of the whole orbit (the ellipse to draw).
- Star(star): a star {Mass, Radius, Luminosity, Temperature} completed by what is missing (as a star of the main sequence), with its Class (O, B, A, F, G, K, M), Color, Habitable ({Inner, Outer}: the zone of liquid water, AU) and Frost (the line beyond which ice stays).
- Describe(body, context): what a planet or a moon {Kind, Radius, Mass, Albedo, Day, Orbit} is: Radius, Mass, Gravity (m/s²), Escape (km/s), Density (g/cm³), Temperature (K, of the light of the star), Period (days), Day (hours), Habitable; context {Star (of Star), Distance (from it, AU), Mass (of what it goes round, Suns)}.
- Color(temperature): the color of a star of a temperature (K), as '#rrggbb'.
- Kinds: the kinds of planets and their colors (rocky, desert, terran, ocean, ice, lava, gas, ice-giant, dwarf, moon).
- Generate(seed, options): a whole system of a seed, always the same for the same seed: {Name, Seed, Bodies: [{ID, Type (star, planet, belt), Parent, Name, Kind, ...}]}, the planets with their moons, rings and belts. Options: Name, Planets (how many, 3 to 9 by default), Moons (false: none), Belts (false: none).

The same functions run in Node: they read no page.

## Methods

- `Length(value)`
- `Period(distance, mass)`
- `Position(orbit, time, mass)`
- `Path(orbit, count)`
- `Star(star)`
- `Describe(body, context)`
- `Color(temperature)`
- `Generate(seed, options)`

## Example

```example
<Field Label="Seed">
	<Input [value]="Seed" (input)="Typed" />
</Field>
<p>The star <strong>{{Star}}</strong>, its planets:</p>
<ul class="elemenx-text small">
	<li *for="planet of Planets" *key="planet.ID">{{planet.Name}}: {{planet.Kind}} at {{planet.Distance}} AU, a year of {{planet.Year}} days, {{planet.Temperature}} K</li>
</ul>
<p class="elemenx-text small muted">The same seed makes the same system: hot rocky worlds near the star, gas giants beyond the frost line.</p>
<script>
({
	Seed: 'kepler',
	Star: '',
	Planets: [],

	$OnCreate: function () {
		this.Make();
	},

	Typed: function (value) {
		this.Seed = value;
		this.Make();
	},

	Make: function () {
		var astronomy = this.$Service('Astronomy');
		var system = astronomy.Generate(this.Seed);
		var star = astronomy.Star(system.Bodies[0]);

		this.Star = system.Name + ' (class ' + star.Class + ', ' + Math.round(star.Temperature) + ' K)';
		this.Planets = system.Bodies.filter(function (body) {
			return body.Type === 'planet' && body.Parent === 'star';
		}).map(function (body) {
			var info = astronomy.Describe(body, {Star: star, Distance: body.Orbit.Distance, Mass: star.Mass});

			return {ID: body.ID, Name: body.Name, Kind: body.Kind, Distance: body.Orbit.Distance.toFixed(2), Year: Math.round(info.Period), Temperature: Math.round(info.Temperature)};
		});
	}
})
</script>
```

## Tests

- [puts a body on its orbit of Kepler at a time, and describes stars and planets](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L55) — `tests/regression/library-scene.test.js`
- [makes the same system of the same seed: a star, planets by their distance, moons, rings and belts](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L101) — `tests/regression/library-scene.test.js`
- [multiplies, inverts and projects matrices, and makes shapes of triangles](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L136) — `tests/regression/library-scene.test.js`
- [has the same noise on the CPU as in the shaders, so a heightmap matches a baked surface](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L167) — `tests/regression/library-scene.test.js`
- [puts planets on their orbits and makes shapes of three dimensions with the Services of ElemenxUI](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L48) — `tests/regression/headless.test.js`
- [adds, changes, attaches, detaches and removes objects and parts, saves the game and loads it the same](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L424) — `tests/regression/library-scene.test.js`
