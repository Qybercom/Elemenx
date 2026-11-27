<!-- generated -->
# ImageBlueprints

ImageBlueprints: pictures made on the processor of graphs of Blueprints, declared in $Provides (Blueprints makes it when it meets such a graph or block): the bark and the leaves of plants. A graph of the kind image ends at Image: Width and Height (pixels), and either the Color (vec4, 0 to 1) and the Bump (its relief) of each pixel, the graph run once for each (its Input blocks U and V, 0 to 1 across and down, X and Y, the pixel, and what it is given), or a Picture made whole ({Width, Height, Data}, as a block of an algorithm gives it), the graph run once. Of its bumps a normal map is made (Strength: how steep; Wrap: seamless across, as round a trunk), and its mean color (Mean, every seventh pixel).

- Compiled(graph): what runs it, made in a page ({Source: its code of numbers, Image: the properties of its Image, Told: the inputs of Image a link reaches}); a worker runs it of that (its Source is code, no graph is read there).
- Run(compiled, parameters, inputs): {Picture: {Width, Height, Data (RGBA bytes), Mean}, Normal: {Width, Height, Data} (of Bump; null with none)}. Make(graph, parameters, inputs): Run of Compiled. Sample(graph): what it is run with to be seen (Preset: the first plant of SceneFlora, when it reads one).
- Its blocks: Bark (Preset, U, V: a pixel of the bark of a preset of SceneFlora, round its trunk across and up the plant, of the graph of its pattern: R, G, B, Bump) and Leaves (Preset: the atlas of the leaves of a preset, Size by Tall pixels, Tile a cluster: SceneFlora.LeafPicture).

The library's pictures (ElemenxGraphics/image/<name>): bark and leaves (SceneFlora.Textures). The same functions run in Node.

## Methods

- `Sample(graph)`
- `Make(graph, parameters, inputs)`
- `Compiled(graph)`
- `Run(compiled, parameters, inputs)`

## Tests

- [declares the kind image and its blocks, and makes a picture of each pixel of a graph](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ImageBlueprints/ImageBlueprints.test.js#L41) — `libraries/ElemenxGraphics/services/ImageBlueprints/ImageBlueprints.test.js`
- [takes a picture made whole, and runs it once](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ImageBlueprints/ImageBlueprints.test.js#L64) — `libraries/ElemenxGraphics/services/ImageBlueprints/ImageBlueprints.test.js`
- [refuses a graph of another kind and one of no Image](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ImageBlueprints/ImageBlueprints.test.js#L76) — `libraries/ElemenxGraphics/services/ImageBlueprints/ImageBlueprints.test.js`
- [shows a picture in BlueprintPreview](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ImageBlueprints/ImageBlueprints.test.js#L86) — `libraries/ElemenxGraphics/services/ImageBlueprints/ImageBlueprints.test.js`
