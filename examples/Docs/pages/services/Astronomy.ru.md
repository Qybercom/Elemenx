<!-- generated -->
# Astronomy

Числа звёздной системы, как они нужны игре: где тело на орбите в данный момент (законы Кеплера), из чего состоят звезда и планета и насколько они тёплые, и целые системы из seed. Ничего не рисует. Единицы: расстояния в а. е., время в сутках, массы звёзд в массах Солнца, планет и лун — в массах Земли, радиусы звёзд в радиусах Солнца, планет — в км, углы в градусах; пространство эклиптики (X и Y в её плоскости, Z на север). Length(value) — длина в а. е. из числа или текста с единицей ('384400 km', '2.5 Mkm', '5.2 AU', '4.2 ly', '1.3 pc'); Period(distance, mass) — сутки оборота; Position(orbit, time, mass) — [x, y, z] в а. е. от того, вокруг чего тело обращается (orbit — {Distance, Eccentricity, Inclination, Node, Periapsis, Anomaly, Period}); Path(orbit, count) — точки всей орбиты; Star(star) — звезда, дополненная тем, чего не хватает, с Class, Color, Habitable ({Inner, Outer}) и Frost; Describe(body, context) — Radius, Mass, Gravity (м/с²), Escape (км/с), Density, Temperature (K), Period, Day, Habitable; Color(temperature) — цвет звезды; Kinds — виды планет и их цвета; Generate(seed, options) — целая система (всегда одна и та же для одного seed) с лунами, кольцами и поясами: options Name, Planets, Moons, Belts. Работает и в Node.

## Методы

- `Length(value)`
- `Period(distance, mass)`
- `Position(orbit, time, mass)`
- `Path(orbit, count)`
- `Star(star)`
- `Describe(body, context)`
- `Color(temperature)`
- `Generate(seed, options)`

## Пример

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

## Тесты

- [puts a body on its orbit of Kepler at a time, and describes stars and planets](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L55) — `tests/regression/library-scene.test.js`
- [makes the same system of the same seed: a star, planets by their distance, moons, rings and belts](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L101) — `tests/regression/library-scene.test.js`
- [multiplies, inverts and projects matrices, and makes shapes of triangles](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L136) — `tests/regression/library-scene.test.js`
- [turns a line into a body, makes a roof of two slopes, flat faces and a box of parallel light](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L167) — `tests/regression/library-scene.test.js`
- [has the same noise on the CPU as in the shaders, so a heightmap matches a baked surface](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L206) — `tests/regression/library-scene.test.js`
- [puts planets on their orbits and makes shapes of three dimensions with the Services of ElemenxUI](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L48) — `tests/regression/headless.test.js`
- [adds, changes, attaches, detaches and removes objects and parts, saves the game and loads it the same](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L464) — `tests/regression/library-scene.test.js`
