<!-- generated -->
# SceneScatter

Scatter: what fills a ground in masses, with no object of its own for each thing. A SceneObject of a kind with the trait Scatter (forest, grove, thicket, rocks, or one of your own) sows models over a ground by its rules: Shapes (the names of models), Density (a hundred square units), Size (the smallest and the largest, in sizes of the model), MinHeight, MaxHeight, MaxSlope, Cover (0 to 1: how much of the ground its patches take, 1 all of it), Patch (the size of its patches), Clumps (0 to 1: thick in groves of the size of Patch and thin between them), Seed, Blocks (no way through them). A SceneObject of a kind with the trait Grass (grass) grows blades in the vertex shader round the view: Density, Height, Spread (0 to 1: how unlike in height one blade is to the next, a lawn 0.05, a wild meadow 0.6; 0.45), Clumps (0 to 1: tufts and glades of the size of Patch, 24), Color, MaxHeight, MaxSlope; with Shapes (a model of grass, a file too) it sows that model, thick, up to Reach from the eye. Reach holds for any rule; Grid (a size) lays Shapes as tiles, one a cell, turned by quarters, the way to build a land out of ready pieces.

Biome on a ground (the Biomes Service) brings its colors, its rules and its grass by itself, so a whole land is one attribute; a SceneObject of kind village lays out houses and their roads at its X and Y (Houses, Radius, Seed), and what is sown keeps away from them.

The things live in squares of the ground, typed arrays made in workers (SceneSower), the nearest first. Each square in view gives its things to the stream of their model and level: near the whole model, farther two simpler ones (SceneModels.Levels), far a picture baked from all sides that is lit as the model is (Renderer.Target). The streams are made again only when the view moved, so a still view costs no work, and a few draws show them all.

Methods: Sown() ({Things, Squares, Waiting (the squares not sown yet, those in a worker among them), Draws, Blades}), SownNear(x, z, radius) (what is sown round a point: [{Model, X, Y, Z, Size, Turn}]).

## Methods

- `Sown()`
- `SownNear(x, z, radius)`
