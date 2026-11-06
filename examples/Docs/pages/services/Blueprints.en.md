<!-- generated -->
# Blueprints

Blueprints: graphs of blocks joined by links, kept in the JSON of Flowprint (https://github.com/Qybercom/Flowprint), and made into what runs: a shader, a list of passes of a picture, a function or a flow of actions.

The JSON is the one of Flowprint, with its keys as they are, and a few more of the same kind: {version, type (of the graph), name, parameters: [{key, type, value, min, max, comment}], blocks: [{id, type (of the block), x, y, properties: [{key, value}], enabled, comment, pins: [{id, key, content, direction: {in, out}, place (header or body), kind (flow or value), type (of its value), enabled, comment}]}], links: [{id, x1, y1, x2, y2, p1 (the pin it comes from), p2 (the pin it goes to), kind, enabled, comment}]}. A file of Flowprint without them reads as version 1; a block without a type is Generic and runs as nothing. What is not known is kept as it is.

Types of values: float, vec2, vec3, vec4, int, bool (numbers, and lists of them in code), texture (a picture), text, object, any, and flow (the way an action goes on). The numbers go into each other (a float fills a vector, a vector gives its first parts); a block of type same takes the widest of what comes to it.

- Node(type, definition) adds a type of block or replaces it: {Graphs (where it may stand: a list of the types of graphs, or '*'), Title, Group, Comment, Inputs and Outputs ([{Key, Type, Value (what an input is when nothing comes to it), Default (the same as code of GLSL)}], or a function of the properties of a block giving them: the pins follow its properties, and Pins drops those it names no more), Flow ({In: [keys], Out: [keys]}), Properties ([{Key, Type (number, text, bool, color, select, vector, object, code: lines of code), Value, Options, Min, Max}]), and what it does in each kind of graph: GLSL (in a graph of shaders: a text with its inputs as {Key}, or function (context) giving {Output: code}, context.Lines to add lines before), Needs (parts of Renderer.Chunks it calls): the shaders, of BlueprintShaders), Compute (function (inputs, properties, context) giving {Output: value}), Run (an action of a flow, below) and Pass (a pass of a picture, below)}. Nodes(graph) lists the types that may stand in a graph of a type, NodeOf(type) gives one.
- Graph(type, {Compile(plan, options), End, Uses, Bake(made), Unbake(record), Text(glsl, options)}) adds a kind of graph (End: the type of block it ends at; Uses: kinds whose blocks stand in it too, as an effect takes the blocks of a generator; Bake and Unbake: what is made as JSON and back; Text: what is made of a text written by hand); Graphs() lists them. This library has generator (code of numbers that gives each Result by its Key) and flow (events and actions, run by Start). The kinds of shaders are of the Service BlueprintShaders (ElemenxUI), which defines them, with the GLSL of the blocks, as it is made: pass (a fragment shader over the whole picture, its Output a vec4), material (a function of GLSL that changes a surface, its Surface the color, alpha, roughness, metalness, glow and normal) and render (passes of a picture, each a block whose Pass(context, inputs, properties, block) gives its textures, ending at Present). A Service of any Library adds kinds and blocks the same way, and declares them in $Provides ({Blueprints: {Graphs: [...], Nodes: [...]}}): a graph of such a kind or a block of such a type (Read, Create, Check, Compile, Add, NodeOf), or a list of them (Nodes, Graphs), makes that Service first.
- Create(type, options) is an empty graph ({name, parameters}); Block(type, options) a block of a type with its pins ({id, x, y, properties: {key: value}}); Add(graph, type, options) puts one into a graph; Link(graph, from, to) joins an output to an input ([block id, key] or a pin id) and gives the link; Remove(graph, id) takes a block, with its links, or a link; Pin(block, key, out) finds a pin; Pins(block) makes the pins of a block as its type has them, and Prune(graph) takes away the links of pins that are there no more (it returns them).
- Read(json) reads a text or an object of JSON and gives the graph (a version newer than Version is an error; the pins a type has are added where they are missing); Write(graph) gives it as the text of a file.
- Check(graph) lists what is wrong ([{Block, Pin, Link, Message}]): a type not known or not for this graph, a link of pins not there or of kinds that do not go together, two links to one input, a circle of values, a graph with no end. Order(graph) gives the blocks so each one comes after what it reads.
- Compile(graph, options) makes it (an error, with its list in Problems, when Check finds anything): the same graph is made once (Hash: what makes it, not where its blocks are). Of a pass {Type, Hash, Fragment, Uniforms [{Name, Type}], Textures [{Name, Uniform}], Parameters, Values(parameters, extra)}: Values gives the uniforms of the parameters (by key, else their value) and of extra (Time, Pixel, Textures by name). Of a material the same with Source (the function blueprintSurface) in place of Fragment. Of a render {Passes, Run(context, parameters)}; of a generator {Run(parameters, inputs)}; of a flow {Start(context)}. Code(graph) makes a generator JavaScript: {Source (the body of a function of (B, M, N): Blueprints, Math, Noise), Run (the same values as the Run of Compile, with no walk of its blocks: a ground reads it at every point), Keys}, null when a block of it has no code; a worker makes Run of Source with its own Services. A graph written by hand, {type, glsl (its text), parameters (none: those of the text)}, is made by Text of its kind, once for the same text (a shader of BlueprintShaders: pass, material).
- Parameters of a graph are what is set from outside it: a block Parameter (its key) gives the value; in a shader it is a uniform, so changing it makes nothing again.
- Bake(graph) gives a pass or a material made, as JSON ({version, type, hash, parameters, baked}): Compile reads it back with no node at all. Graphs of code (render, generator, flow) are not baked: their blocks run as code.
- Start(graph, context) runs a flow: {Emit(name, payload, callback) (the events of that name start, the callback has (error) when all they started is done), On(name, handler) (what an Emit block tells; it returns what stops listening), Variables, Stop()}. context: Actions ({Name: function (value, done (error, result))}), Timer (function (seconds, run), setTimeout by default) and anything the blocks read. A block's Run(context) gets {Inputs, Properties, Block, Instance, Payload, Set(key, value) (its output), Later() (a function to go on with later: (key)) } and gives the key of the flow it goes on by, a list of them, or {Key, Values} (its outputs while that way runs: the Index of a For). More than Steps (100000) at once is an error: a flow that never ends.

The types of this library: Number, Vector, Color, Text, Bool, Parameter, Time, Input, Add, Subtract, Multiply, Divide, Min, Max, Pow, Step, Sin, Cos, Abs, Floor, Fract, Sqrt, Exp, OneMinus, Saturate, Mix, Clamp, Smoothstep, Remap, Dot, Length, Normalize, Split, Combine, Noise, Fbm, NoiseSpec (a noise of the Noise Service by its spec), Result, Compare, And, Or, Not, Field, Get, Set, Event, Branch, Sequence, For, Delay, Action, Emit; BlueprintShaders adds UV, Pixel, Position, Normal, Texture, Output, Surface and Present, and the GLSL of the numbers. Errors start with 'Elemenx Blueprints:'. The same functions run in Node: they read no page.

## Methods

- `Node(type, definition)`
- `Nodes(graph)`
- `NodeOf(type)`
- `Graph(type, definition)`
- `Graphs()`
- `Create(type, options)`
- `Block(type, options)`
- `Pins(block)`
- `Prune(graph)`
- `Pin(block, key, out, kind)`
- `Add(graph, type, options)`
- `Link(graph, from, to)`
- `Remove(graph, id)`
- `Read(json)`
- `Write(graph)`
- `Check(graph)`
- `Order(graph)`
- `Compile(graph, options)`
- `Bake(graph)`
- `Unbake(record)`
- `Code(graph)`
- `Start(graph, context)`

## Tests

- [reads a file of Flowprint as it is: version 1, keys of pins from their ids, a link drawn backwards turned, the rest kept](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L43) — `tests/regression/blueprints.test.js`
- [makes a pass a fragment shader whose parameters are uniforms, and draws it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L69) — `tests/regression/blueprints.test.js`
- [makes its Service of shaders as a graph of shaders is met: the kinds of shaders and their blocks come with it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L115) — `tests/regression/blueprints.test.js`
- [makes a graph once, whatever where its blocks stand; what it is made of makes it again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L136) — `tests/regression/blueprints.test.js`
- [makes nothing again when only the value of a parameter changes: the uniform and the code take the new one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L156) — `tests/regression/blueprints.test.js`
- [tells what is wrong with a graph, and makes none of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L183) — `tests/regression/blueprints.test.js`
- [lets a block switched off pass what comes to it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L235) — `tests/regression/blueprints.test.js`
- [runs the code of a GLSL block on its pins, makes the pins its properties name, and tells its errors on it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L252) — `tests/regression/blueprints.test.js`
- [makes a vertex graph a function that moves a corner and its normal, of blocks or of GLSL written by hand](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L319) — `tests/regression/blueprints.test.js`
- [makes a material and a pass written by hand of their GLSL, and draws the pass](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L354) — `tests/regression/blueprints.test.js`
- [bakes a pass and a material into JSON made again with no block at all; a graph of code is not baked](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L397) — `tests/regression/blueprints.test.js`
- [runs a generator of numbers with the very noise of the shaders, its parameters and inputs given](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L438) — `tests/regression/blueprints.test.js`

+50 more in the same files
