<!-- generated -->
# SceneBuildingGenerator

Buildings of any size, made of their numbers: from a shack to a tower of offices, each a model of the Models Service, so a SceneObject, a Scatter and a settlement place it as any other.

- Classes(): the classes and what each one is by default: shack, cabin, cottage, house, villa, townhouse, shop, warehouse, factory, apartments, office, tower, skyscraper, business (a business centre: a podium, a tower of glass in setbacks), school, church (a nave and its bell tower), station (a hall, its clock tower, a canopy over its platform), fuel (a canopy over the pumps, a shop behind), hangar (a vault of metal), garage, barn (a gambrel roof), watertower (a tank on legs), parking (open floors of a car park).
- Options(options): the whole of a building: its Class gives what is not told. Width and Depth (metres), Floors and FloorHeight (metres), Roof (gable, hip, shed, flat, dome, spire, gambrel, vault), Walls (wood, log, brick, stone, plaster, concrete, glass, metal), Windows (0 to 1: how much of a wall is glass), Plan (rect, L, U, court: its wings within its Width and Depth), Annex (a lower wing on its side: true, false, or by chance), Porch (a roof over its door on posts), Cornice (a band under its roof and a plinth: true by default for walls of masonry), Setbacks (how many times a tall one steps in), Podium (the floors of a wider base), Crown (none, spire, antenna, helipad), Balconies, Lit (0 to 1: the windows lit, as at night), Color (of the walls, over their material), Seed.
- Pieces(tools, options, random): its pieces, in metres over its height (the model of Models takes its Size as its height).
- Define(name, options): a model of Models of that name; its Variants differ by the windows lit: SceneModels.Make(name, {Variant}).
- Random(options, seed): the options of a building of a class, varied by a seed within what the class allows.

The same functions run in Node: they read no page.

## Methods

- `Classes()`
- `Options(options)`
- `Random(options, seed)`
- `Pieces(tools, options, random)`
- `Define(name, options)`

## Tests

- [uses every type of the sketch of a ground, every type of road, every model, every class of building and every effect](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js#L48) — `libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js`
