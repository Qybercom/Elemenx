<!-- generated -->
# Blueprints

Blueprints: graphs of blocks joined by links, kept in the JSON of Flowprint (https://github.com/Qybercom/Flowprint), and made into what runs: a shader, a list of passes of a picture, a function or a flow of actions.

The JSON is the one of Flowprint, with its keys as they are, and a few more of the same kind: {version, type (of the graph), name, parameters: [{key, type, value, min, max, comment}], blocks: [{id, type (of the block), x, y, properties: [{key, value}], enabled, comment, pins: [{id, key, content, direction: {in, out}, place (header or body), kind (flow or value), type (of its value), enabled, comment}]}], links: [{id, x1, y1, x2, y2, p1 (the pin it comes from), p2 (the pin it goes to), kind, enabled, comment}]}. A file of Flowprint without them reads as version 1; a block without a type is Generic and runs as nothing. What is not known is kept as it is.

Types of values: float, vec2, vec3, vec4, int, bool (numbers, and lists of them in code), texture (a picture), text, object, any, and flow (the way an action goes on). The numbers go into each other (a float fills a vector, a vector gives its first parts); a block of type same takes the widest of what comes to it.

- Node(type, definition) adds a type of block or replaces it: {Graphs (where it may stand: a list of the types of graphs, or '*'), Title, Group, Comment, Inputs and Outputs ([{Key, Type, Value (what an input is when nothing comes to it), Default (the same as code of GLSL)}]), Flow ({In: [keys], Out: [keys]}), Properties ([{Key, Type (number, text, bool, color, select, vector), Value, Options, Min, Max}]), and what it does in each kind of graph: GLSL (a text with its inputs as {Key}, or function (context) giving {Output: code}, context.Lines to add lines before), Needs (parts of Graphics3D.Chunks it calls), Compute (function (inputs, properties, context) giving {Output: value}), Run (an action of a flow, below) and Pass (a pass of a picture, below)}. Nodes(graph) lists the types that may stand in a graph of a type, NodeOf(type) gives one.
- Graph(type, {Compile(plan, options), End, Uses}) adds a kind of graph (End: the type of block it ends at; Uses: kinds whose blocks stand in it too, as an effect takes the blocks of a generator); Graphs() lists them. The library has: pass (a fragment shader over the whole picture, its Output a vec4), material (a function of GLSL that changes a surface, its Surface the color, alpha, roughness, metalness, glow and normal), render (passes of a picture, each a block whose Pass(context, inputs, properties, block) gives its textures, ending at Present), generator (code of numbers that gives each Result by its Key) and flow (events and actions, run by Start).
- Create(type, options) is an empty graph ({name, parameters}); Block(type, options) a block of a type with its pins ({id, x, y, properties: {key: value}}); Add(graph, type, options) puts one into a graph; Link(graph, from, to) joins an output to an input ([block id, key] or a pin id) and gives the link; Remove(graph, id) takes a block, with its links, or a link; Pin(block, key, out) finds a pin.
- Read(json) reads a text or an object of JSON and gives the graph (a version newer than Version is an error; the pins a type has are added where they are missing); Write(graph) gives it as the text of a file.
- Check(graph) lists what is wrong ([{Block, Pin, Link, Message}]): a type not known or not for this graph, a link of pins not there or of kinds that do not go together, two links to one input, a circle of values, a graph with no end. Order(graph) gives the blocks so each one comes after what it reads.
- Compile(graph, options) makes it (an error, with its list in Problems, when Check finds anything): the same graph is made once (Hash: what makes it, not where its blocks are). Of a pass {Type, Hash, Fragment, Uniforms [{Name, Type}], Textures [{Name, Uniform}], Parameters, Values(parameters, extra)}: Values gives the uniforms of the parameters (by key, else their value) and of extra (Time, Pixel, Textures by name). Of a material the same with Source (the function blueprintSurface) in place of Fragment. Of a render {Passes, Run(context, parameters)}; of a generator {Run(parameters, inputs)}; of a flow {Start(context)}.
- Parameters of a graph are what is set from outside it: a block Parameter (its key) gives the value; in a shader it is a uniform, so changing it makes nothing again.
- Bake(graph) gives a pass or a material made, as JSON ({version, type, hash, parameters, baked}): Compile reads it back with no node at all. Graphs of code (render, generator, flow) are not baked: their blocks run as code.
- Start(graph, context) runs a flow: {Emit(name, payload, callback) (the events of that name start, the callback has (error) when all they started is done), On(name, handler) (what an Emit block tells; it returns what stops listening), Variables, Stop()}. context: Actions ({Name: function (value, done (error, result))}), Timer (function (seconds, run), setTimeout by default) and anything the blocks read. A block's Run(context) gets {Inputs, Properties, Block, Instance, Payload, Set(key, value) (its output), Later() (a function to go on with later: (key)) } and gives the key of the flow it goes on by, a list of them, or {Key, Values} (its outputs while that way runs: the Index of a For). More than Steps (100000) at once is an error: a flow that never ends.

The types of the library: Number, Vector, Color, Text, Bool, Parameter, Time, UV, Pixel, Position, Normal, Texture, Add, Subtract, Multiply, Divide, Min, Max, Pow, Step, Sin, Cos, Abs, Floor, Fract, Sqrt, Exp, OneMinus, Saturate, Mix, Clamp, Smoothstep, Remap, Dot, Length, Normalize, Split, Combine, Noise, Fbm, Output, Surface, Present, Result, Compare, And, Or, Not, Field, Get, Set, Event, Branch, Sequence, For, Delay, Action, Emit. Errors start with 'Elemenx Blueprints:'. The same functions run in Node: they read no page.

## Methods

- `Node(type, definition)`
- `Nodes(graph)`
- `NodeOf(type)`
- `Graph(type, definition)`
- `Graphs()`
- `Create(type, options)`
- `Block(type, options)`
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
- `Values(made)`
- `Start(graph, context)`

## Tests

- [reads a file of Flowprint as it is: version 1, keys of pins from their ids, a link drawn backwards turned, the rest kept](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L41) — `tests/regression/blueprints.test.js`
- [makes a pass a fragment shader whose parameters are uniforms, and draws it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L67) — `tests/regression/blueprints.test.js`
- [makes a graph once, whatever where its blocks stand; what it is made of makes it again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L109) — `tests/regression/blueprints.test.js`
- [makes nothing again when only the value of a parameter changes: the uniform and the code take the new one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L129) — `tests/regression/blueprints.test.js`
- [tells what is wrong with a graph, and makes none of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L156) — `tests/regression/blueprints.test.js`
- [lets a block switched off pass what comes to it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L208) — `tests/regression/blueprints.test.js`
- [bakes a pass and a material into JSON made again with no block at all; a graph of code is not baked](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L224) — `tests/regression/blueprints.test.js`
- [runs a generator of numbers with the very noise of the shaders, its parameters and inputs given](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L265) — `tests/regression/blueprints.test.js`
- [runs a flow: events, branches, variables, loops, delays, actions of the context and what it tells](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L289) — `tests/regression/blueprints.test.js`
- [runs the ways of a Sequence in order, each to its end, and stops a flow that never ends](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L381) — `tests/regression/blueprints.test.js`
- [lets an application add types of blocks and kinds of graphs; the library lists its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L430) — `tests/regression/blueprints.test.js`
- [shows the blocks where they stand with their pins, the links between the pins, and the file it keeps](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-blueprint.test.js#L79) — `tests/regression/library-blueprint.test.js`

+21 more in the same files
