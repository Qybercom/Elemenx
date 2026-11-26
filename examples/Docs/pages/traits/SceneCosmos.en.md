<!-- generated -->
# SceneCosmos

Cosmos: what lies far behind a system. Cosmos of a Scene (a Kind, or {Kind, Seed, Colors, and what it is filled with}) makes a backdrop of a seed: clouds of gas torn by their own currents, lanes of dust before them, clusters of stars, the disc and the bulge of a galaxy. It is baked once into a cube, a face a frame so that no frame stops, and read at every frame; the same seed is always the same sky. Colors are up to four, from the deep of the gas to its bright; a seed chooses them when none are told.

All of it is one generator. A Kind (nebula, pillars, galaxy, galaxies, cluster, void; CosmosKinds() tells what each holds) is only a set of amounts, and any of them can be told on top of it, so one sky holds what it likes: Gas, Dust, Stars and Pillars (0 to 1), Band (the band of the galaxy we are in), Galaxies (how many far ones, up to 16), Clusters (how many globular ones, up to 12), Beacon (the young stars that light the gas), Bursts (how many places where rays of light go out through the gas, up to 8). Pole is the way the band of the galaxy goes round, Middle the way to its bulge, Lift how far the band stands off the middle of the sky (seen from above the plane of the galaxy it lies lower: SceneGalaxy, from inside its disc). Pillars stand in a ring of dark cloud round the whole sky, in one to three groups, each by its own stars; they are clouds of dust with light through them, or with Style 'drawn' shapes with drawn edges, for a sky that is a picture.

Before it a few sparks and puffs of dust go round the eye, each in a box that wraps round it, so a view that flies past sees them pass: that is what shows it moves against a sky that stays. What the backdrop is lends its color to the shade of bodies.

On a ground the same cube is the band of the galaxy over a night: it turns with the stars, and what hides them hides it.

The band of a galaxy is drawn as it is (unless Style is 'drawn'): a ray from where the system lies through the galaxy (Galaxy: its manifest or options of GalaxyData.Make, of the seed when none; Place, ly: where the system lies, 54% of its radius out by default), its glow of the stars the eye cannot part, its dust in clumps, the stars near points; the same galaxy as its map (its arms of the GalaxyGraph of the scene), baked into a cube of its own first. The sky is a graph (CosmosGraph, the kind cosmos of SceneBlueprints: its parts as blocks), else the one of the library (LibraryCosmos()).

Far (of UniverseData.Sky: [{Way, Size, Pole, Shape}], in the frame of the galaxy of its band) puts the far galaxies as they are seen from where it lies in its universe in place of those of its seed: each where it is, as large as it is (a few tenths of a degree at a few megaparsecs, a texel wide at the least, as bright in all), of its kind (CosmosGalaxyGLSL).

## Methods

- `CosmosKinds()`
