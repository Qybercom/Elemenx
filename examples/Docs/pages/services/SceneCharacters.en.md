<!-- generated -->
# SceneCharacters

SceneCharacters: the walkers of a game as data, each a character a game keeps as a file of its own (or many of them in one catalogue): what it is made of, how it moves, what it holds. Of it the model of a unit is made (SceneModels), and Scene.Add('unit', ...) takes what Unit gives to have it walk.

A character: {Name, Model (a file of a model, glb, gltf or fbx; or the name of a model of code: mannequin), Size (how tall it stands, metres: 1.8), Bones ({role: the name of a node}: the bones of a skeleton whose names tell nothing, SceneModels Bones), Clips ({clip: a file of a clip of another skeleton, or {URL, Stride, Held}}: SceneModels Motions; or the name of a set of them, Sets), Hold ({Model (a file or the name of a model), Bone, Aim, At, Turn, Size}: what it holds in a hand, Hold of a unit of a Scene)}. A file is read from the folder of the file of the character (Base) when its path is not absolute.

- Sets(name, clips) keeps a set of clips by its name, for many characters (those of Mixamo of a game); Sets(name) gives it back.
- Define(name, character, base) makes the models of a character ('character-<name>' and what it holds, 'character-<name>-hold'), defined once: {Name, Label, Model, Hold, Size, File (the file of its model; '' for one of code)}.
- Load(url, callback(error, names)) reads a character ({Name, Model...}: its name the name of its file) or a catalogue ({Sets: {name: clips}, Characters: {name: character}}) and defines each; its files from the folder of url.
- Get(name) is what Define made, Names() the names of all in the order they came, Unit(name, more) what Scene.Add('unit', ...) takes ({Model, Hold, Size} over more), its models asked for.

Regression: the characters of the demos, their clips and the grip of a rifle were written in a demo, each demo a copy.

## Methods

- `Sets(name, clips)`
- `Define(name, character, base)`
- `Load(url, callback)`
- `Get(name)`
- `Names()`
- `Unit(name, more)`

## Tests

- [reads a catalogue: its sets of clips, its characters in their order, their files from its folder](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-characters.test.js#L26) — `tests/regression/library-characters.test.js`
- [reads one character, named after its file, and tells what it cannot read](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-characters.test.js#L55) — `tests/regression/library-characters.test.js`
