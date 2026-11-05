<!-- generated -->
# Sigils

Sigils: magic circles of a seed, as data, for whatever draws them: a circle is a list of rings, from the rim to the middle.

- Make(seed, options) returns {Seed, Rings: [{Kind, Radius, Width, Count, Step, Speed, Phase, Bright, Seed}]}. Kind: line, double, ticks, dots, arcs, runes or star. Radius and Width are parts of the radius of the circle, Count how many marks the ring has, Step how far a star's lines reach, Speed its turns a second (minus the other way), Phase its first turn. Options: Rings, how many (default 6 to 9); Speed, the speed of them all; Layout, a list of rings in the place of those of the seed: any field left out comes of the seed, so {Speed: 0.1} alone turns one ring as told.
- Uniforms(circle, seconds, spin) returns {uRings, uRingsMore, uRingCount}: what a shader reads, with each ring turned as far as the time has taken it. The most is Most rings.

## Methods

- `Make(seed, options)`
- `Uniforms(circle, seconds, spin)`

## Tests

- [Sigils makes circles of a seed, the same each time, whose rings turn apart](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3333) — `tests/regression/library-scene.test.js`
- [saves a recipe of the kinds of the library and makes the very same thing of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/seeded.test.js#L23) — `tests/regression/seeded.test.js`
- [makes the Service that declares a kind as a record of it is loaded, and every one of them for the list](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/seeded.test.js#L45) — `tests/regression/seeded.test.js`
