<!-- generated -->
# BlueprintShaders

BlueprintShaders: the graphs of Blueprints made into shaders and passes of a picture. Blueprints (ElemenxCommon) has the graphs, their checks and what runs as code; this Service defines, as it is made, the kinds that need the parts of the shaders of Renderer, and the GLSL of the blocks of numbers:

- pass: a fragment shader over the whole picture, its Output a vec4;
- material: a function of GLSL that changes a surface (blueprintSurface), its Surface the color, alpha, roughness, metalness, glow and normal;
- render: passes of a picture, each a block whose Pass(context, inputs, properties, block) gives its textures, ending at Present;
- vertex: a function of GLSL that moves a corner of a shape (blueprintVertex(position, normal, uv, sway, phase, size, inout world, inout bent): its place in the model, its normal and uv, how far the wind bends the copy, its phase and its size given; its place in the world and its normal moved), ending at Vertex. World is where the corner is before, Sway, Phase and Size those of the copy, Wind the gust of the scene. A Scene puts it, as the Vertex of a material, in every pass that draws the shape: the picture, its glow, its shadows, its view from above and the light it gives back; and its wind is a vertex graph too (Scene.WindGraph), run before.

A pass and a material are baked (Blueprints.Bake) as JSON and read back with no node at all. Both are written by hand too: Blueprints.Compile({type: 'material' or 'pass', glsl}). The text of a material is its blueprintSurface and what it calls; the one of a pass its main (the head, vQuad and outColor added) or a whole fragment shader (#version), kept as it is. Its uniforms are read from its lines (uniform <type> <name>;): uParameter_<Key> a parameter of the graph, its value by a comment after it (// = 0.5, // = #ff8000, // = 1, 0, 0), a sampler2D a texture (uTexture_Name by its Name); // needs: Noise, Lights puts those parts of the shaders in. The block GLSL is code written in a graph of shaders: its Code (lines of GLSL in a scope of their own, its Inputs there as variables of their names, its Outputs given by setting them; a uniform line declares one), its pins named by its properties Inputs and Outputs ("Tint: vec3, Gain: float"), Needs the parts of the shaders it calls. Its code is numbered as a source of its own (#line 1 <1000 and on>, Sources of what Compile gives: {source: block id}); Lined(text) numbers what follows it in a whole shader, Errors(made, log) gives the errors of the log of a shader that did not compile each on its block: [{Block, Line, Message}]. The blocks it adds: UV, Pixel, Position, Normal, Texture, Output, Surface, Present; the numbers of Blueprints (Number, Vector, Color, Bool, Parameter, Time, the operators, Mix, Clamp, Smoothstep, Remap, Dot, Length, Normalize, Split, Combine, Noise, Fbm) stand in its graphs with their GLSL. It declares them in $Provides: Blueprints makes it when it meets a graph of these kinds or one of these blocks, so there is nothing to call first. The same functions run in Node: they read no page.

## Methods

- `Lined(text)`
- `Errors(made, log)`

## Tests

- [runs the code of a GLSL block on its pins, makes the pins its properties name, and tells its errors on it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L252) — `tests/regression/blueprints.test.js`
