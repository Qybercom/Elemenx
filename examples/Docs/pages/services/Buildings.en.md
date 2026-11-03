<!-- generated -->
# Buildings

Buildings of any size, made of their numbers: from a shack to a tower of offices, each a model of the Models Service, so a GameObject, a Scatter and a settlement place it as any other.

- Classes(): the classes and what each one is by default: shack, cabin, cottage, house, villa, townhouse, shop, warehouse, factory, apartments, office, tower, skyscraper, business (a business centre: a podium, a tower of glass in setbacks).
- Options(options): the whole of a building: its Class gives what is not told. Width and Depth (metres), Floors and FloorHeight (metres), Roof (gable, hip, shed, flat, dome, spire), Walls (wood, log, brick, stone, plaster, concrete, glass, metal), Windows (0 to 1: how much of a wall is glass), Setbacks (how many times a tall one steps in), Podium (the floors of a wider base), Crown (none, spire, antenna, helipad), Balconies, Lit (0 to 1: the windows lit, as at night), Color (of the walls, over their material), Seed.
- Pieces(tools, options, random): its pieces, in metres over its height (the model of Models takes its Size as its height).
- Define(name, options): a model of Models of that name; its Variants differ by the windows lit: Models.Make(name, {Variant}).
- Random(options, seed): the options of a building of a class, varied by a seed within what the class allows.

The same functions run in Node: they read no page.

## Methods

- `Classes()`
- `Options(options)`
- `Random(options, seed)`
- `Pieces(tools, options, random)`
- `Define(name, options)`

## Tests

- [knows its classes, from a shack to a business centre, and the height of each of its floors and its roof](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/buildings.test.js#L54) — `tests/regression/buildings.test.js`
- [varies a building of a class by its seed within what the class allows, the same seed the same building](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/buildings.test.js#L65) — `tests/regression/buildings.test.js`
- [is a model of Models as tall as its Size: a tower steps in at its setbacks, a business centre stands on a wider podium, its windows lit as told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/buildings.test.js#L81) — `tests/regression/buildings.test.js`
