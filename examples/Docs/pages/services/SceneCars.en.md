<!-- generated -->
# SceneCars

SceneCars: the cars of a game as data, each a file of its own (or many in a catalogue): its model and what its parts are by their roles (ModelRoles: its wheels and what stops them, its doors and windows, its steering wheel, paddles, pedals and wipers, its lamps), how it goes, where its pipes, mirrors and screens are. Of it a model is made (SceneModels, its Roles in its recipe), and Scene.Add('unit', ...) takes what Unit gives to have it driven.

A car: {Name, Model (a file of a model: glb, gltf or fbx), Size (how large it stands: 1.25), Apart (a word of the names of what its file keeps as one piece to cut at its gaps: four wheels in one mesh), Materials (SceneModels Materials of its recipe), Roles ([ModelRoles roles]), Yaw (degrees its model is turned from ahead), Seat ([x, y, z] of the driver), Mass, Base (between its axles, metres), Width, Gears, Shift (auto or manual), Tune ({...} of a Vehicle: Turn, Brake, Grip, Power...), Pipes ([[x, y, z]]: where its exhaust pops), Mirrors and Screens (of a Vehicle)}. A file is read from the folder of the file of the car (Base) when its path is not absolute.

- Define(name, car, base) makes its model ('car-<name>'), once: {Name, Label, Model, File, Car}.
- Load(url, callback(error, names)) reads a car ({Name, Model...}: its name the name of its file) or a catalogue ({Cars: {name: a car, or the path of the file of one}}) and defines each; its files from the folder of the file.
- Get(name) is what Define made, Names() the names of all in the order they came, Unit(name, more, tune) what Scene.Add('unit', ...) takes ({Model, Size, Vehicle} over more: Heading of more is the way it faces; tune over its own Tune), its model asked for. What its roles open is set by Scene.Part(id, role).Set (doors: Part(id, 'doors')).

Regression: the cars of Racing were written in the demo, their parts found by words of the names of their materials and boxes round them (Match, Low, High), a copy in each demo that drove them.

## Methods

- `Define(name, car, base)`
- `Load(url, callback)`
- `Get(name)`
- `Names()`
- `Unit(name, more, tune)`

## Tests

- [reads a catalogue of cars, each of a file of its own or in it, their models of their roles, their files from their folders](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-cars.test.js#L26) — `tests/regression/library-cars.test.js`
- [reads one car, named after its file, and tells what it cannot read](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-cars.test.js#L56) — `tests/regression/library-cars.test.js`
