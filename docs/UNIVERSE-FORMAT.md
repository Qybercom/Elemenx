# The universe format

A universe of Elemenx is made of a seed, the same everywhere: in any browser, in Node, and in a port of its generators to another language (PHP for a server, C++ for an engine). This file is what such a port has to do to make the very same galaxies, stars and systems, and how it is checked. The levels and the parts of space are those of `docs/SPACE-FORMAT.md`; this file adds the rules of the numbers and the layout of the universe level.

Decisions of 2026-11-20 and 2026-11-25: the universe has no end; its galaxies stand at random places of a real density, with no voids; an author puts galaxies of their own at their places, and the home galaxy can be anywhere; distances are real (megaparsecs between galaxies); a jump between galaxies is the warp going on (steps of `travel.json` above those of a galaxy), arriving at the edge of the galaxy aimed at.

## What must be the same, and what need not

Everything that is a fact of the world is the same to the last bit: how many stars a sector has, their IDs, places, masses, types and classes, the nebulae and clusters of a galaxy, the bodies of a system and their orbits, the galaxies of a cube of the universe and where they are. A choice (which kind, whether there is one, how many) is made only of numbers made exactly as below.

What is only seen need not be: the glow of a galaxy (`GalaxyData.Glow`), its shaders, the light and the colours of a picture. A port may draw them as it likes.

## Exact numbers

A port uses doubles of IEEE 754 (64 bits) and rounds to nearest at each operation, as JavaScript does. These are exact in every language and may be used freely:

- `+`, `-`, `*`, `/`, `sqrt`, comparisons, `floor`, `ceil`, `abs`, `min`, `max`.
- `round(x)`: as `Math.round` of JavaScript, the nearest whole number, halves up (towards +∞): `r = floor(x); if (x - r >= 0.5) r = r + 1`. Not `round` of PHP or C (halves away from zero).
- Whole numbers of 32 bits: `imul(a, b)` (the low 32 bits of the product, signed), `a >>> 0` (as unsigned), `a | 0` (as signed), shifts and `^`, `&`, `|` of 32 bits.
- The characters of a text are its code units of UTF-16 (`charCodeAt`), not its bytes of UTF-8.

The functions of Math that are not exact in a language (`sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`, `exp`, `log`, `pow`) are the own ones of Elemenx (`Elemenx.Compilers.Math()`): `OwnMath` of `elemenx.js`, written in the kernel language after fdlibm. A port ports those functions as they are (the kernel compiles to js and wasm; its text is a short C-like one), not the Math of its language. `cbrt(x)` is `pow(x, 1 / 3)`; `PI` is `3.141592653589793`.

The services that decide facts take their Math of their method `Math()`: `GalaxyData`, `Astronomy` (and so `SystemData`, which makes its systems of `Astronomy`), the graphs of `Blueprints` run by `NumericCode`, the noise of `Noise`.

## Sequences of a seed

A seed is a text. The numbers of a text, 0 to 1 (not 1), are made by one of these, as the generator of each part says:

- `Sequence(text)` (Random, GalaxyData `Random`): `s = 0`; for each code unit `c`: `s = (s * 31 + c) >>> 0`; then each number: `s = (s * 1664525 + 1013904223) >>> 0`, `s / 4294967296`. Both products are below 2^53: exact.
- `Hash(text)` (Random): `h = 1779033703 ^ length`; for each code unit: `h = imul(h ^ c, 3432918353)`, `h = (h << 13) | (h >>> 19)`; then `h = imul(h ^ (h >>> 16), 2246822507)`, `h = imul(h ^ (h >>> 13), 3266489909)`, `(h ^ (h >>> 16)) >>> 0`.
- Astronomy `Random(text)` (Mulberry32): the state as the start of `Hash` (without its end); each number: `state = state + 0x6D2B79F5 | 0`, `t = imul(state ^ (state >>> 15), 1 | state)`, `t = t + imul(t ^ (t >>> 7), 61 | t) ^ t`, `((t ^ (t >>> 14)) >>> 0) / 4294967296`.

The texts of the seeds of the parts are written in the code of each part: a sector of a galaxy is `Seed + ':sector:' + x.y.z`, its star `Seed + ':star:' + x.y.z-i`, the shape of a galaxy `Seed + ':shape'`, its nebulae and clusters `Seed + ':objects'`.

## The universe

A universe is a passport `{Format: 'elemenx-universe', Version: 1, ID, Name, Seed, Cube (the edge of a cube, 10 megaparsecs), Density {kind: galaxies a cubic megaparsec}, Galaxies (those of the author), Home (the ID of the galaxy one starts in), Near (megaparsecs: no galaxy of the seed is made this near one of the author)}` and its edits, as the other levels.

Its space is cut into cubes of `Cube` megaparsecs; a cube is `x.y.z` of whole numbers, with no end either way. The galaxies of a cube are made of `Seed + ':cube:' + x.y.z`: their count of the density (a mean `m` of all the kinds: `round(m + sqrt(m) * (a + b + c - 1.5) * 1.4)`, three numbers of the sequence, never below 0), each galaxy `n` of its own sequence `Seed + ':galaxy:' + x.y.z-n`: its kind (of the share of each kind in the density), its place in the cube (`(x + u) * Cube` of three numbers, megaparsecs), its seed (the same text): what it is is made by `GalaxyData.Make` of that seed and kind. The ID of a galaxy of a cube is `x.y.z-n`; its place in a universe is the cube and the place in it, so that the numbers stay small however far it is.

A galaxy of the author is `{ID, Name, Seed, Kind, Coordinates [x, y, z] (megaparsecs), ...}` (what `GalaxyData.Make` takes); a galaxy of the seed nearer than `Near` to one of them is not made (the squares of the differences compared: exact).

## The golden numbers

`docs/universe-golden.json` holds what this code makes of a few seeds: the own Math of chosen inputs, sequences and hashes, galaxies of three kinds (their passports, stars of four sectors, their nebulae and clusters, the system of a star, the system of the black hole) and three star systems of `Astronomy.Generate`. `node scripts/universe-golden.js` writes it (in Node), `tests/regression/universe-golden.test.js` checks a browser against it; a port checks its own output against the same file, number for number (each written as JSON writes it: the shortest text read back to the very same double).

When a generator is changed on purpose, its golden numbers are written again in the same change, and the change says so: the worlds of old seeds are not the same any more.

## Files and a server

`elemenx universe bake <universe.json | seed> <folder>` writes a region of a universe for any static server, and `elemenx universe serve` answers the same paths made as they are asked for (`tools/universe.js`, Node; a port in another language serves the same):

| Path | What it holds |
|---|---|
| `universe.json`, `edits.json` | its passport and its edits |
| `cubes/<x>.<y>.<z>.json` | the galaxies of a cube: `{Key, Count, Galaxies}` (`UniverseData.Cube`) |
| `galaxies/<id>.json` | the passport of a galaxy (`GalaxyData.Make` of its seed and kind at its place) |
| `galaxies/<id>/sky.json` | the galaxies seen from it (`UniverseData.Sky`) |
| `galaxies/<id>/sectors/<x>.<y>.<z>.json` | the stars of a sector of it (`GalaxyData.Sector`; `?limit=`; served only) |
| `index.json` | what was baked: `{Universe, Around, Radius, Cubes, Galaxies}` |

A page opens such a folder by its address ending in `/` (`UniverseData.Open`) and reads a cube there with `UniverseData.Fetch`; one it cannot read it makes itself, the same.
