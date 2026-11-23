<!-- generated -->
# SceneInteriors

SceneInteriors: the inside of a ship (or of any vehicle), so that a character may walk in it, laid out by its class and fitted into its hull: what is inside is as large as what is outside, no room stands out of it (resources/interiors/ classes: Deck, Colors, Drop (the kinds of rooms left out first where the hull is short), Classes [{Name, Most (the longest ship of the class, metres), Gear (how high its legs hold it over the ground parked), Entry (ramp, canopy), Rooms [{Kind (cockpit, bridge, command, corridor, lift, common, quarters, armory, gunnery, engine, cargo, hangar), Length, Width, Seats (the roles of its consoles), Reactors (its reactors stand there), Ramp (a hatch in its floor opens on a ramp down to the ground)}], Turrets [{Place (top, belly), Along (-0.5 at its tail to 0.5 at its nose), Weapon, Arc, Low, High}]: the turrets of the class, of SceneTactics; a ship's own are its Interior.Turrets}]).

- ClassOf(length) is the class of a ship that long (fighter, small, medium, large, capital: the first whose Most it is not longer than); GearOf(ship) how high its legs hold it parked (metres).
- Hull(pieces, options) measures a hull ([{Positions, Indices}] in the frame of its inside: metres, x to its right, y up from the ground under it, its nose along +z): over a grid of columns (Cell, metres; of its length else), the lowest and the highest of its skin in each ({Cell, X, Z, NX, NZ, Bottom, Top, Low, High}).
- Plan(ship, hull) lays its rooms out nose first along +z: with a hull, at the height and along the stretch of it where most room is, each as wide as it is there, shortened (and the rooms of Drop left out) where it is short, lengthened where it is long (Fitted); without one, as the class has them. {Class, Entry, Fitted, Floor, Height, Rooms [{Kind, Low, High}], Doors [{At, Width}], Seats [{ID, Role, At, Console, Exit, Room, Controls}], Ramp ({Low, High, Top, Bottom, Hatch} of a ramp from a hatch in the floor down to the ground; null for a canopy), Free (the boxes one may be in: the rooms within their walls, the doorways, the way down the ramp), Opening (the box of the hull cut away over the ramp), Well (the boxes of the walls round the way down through the hull), Lamps [{At, Color, Power, Radius}], Legs [[x, z, top]], Gear, Length, Width}. Ship: {Length (metres), Interior: {Class, Rooms (over those of the class; Windows of a room: true or false, else a cockpit and a bridge have them), Model}, Reactors (how many: of its Power)}.
- WindowsOf(plan): the glass across the nose wall of each room with windows (none past a door): [{Low, High}], metres of the inside. What is outside is seen through it (SceneAboard cuts the hull forward of it while the eye is inside).
- Solid(plan, hull, point, radius): whether a ball (of radius metres, at a point of the frame of the inside) is in what is solid of the ship: its hull, its walls, its floors and ceilings; not in its rooms, its doorways, the way down its ramp. What the view (and a walker) of the scene keeps out of.
- Parts(plan, tools) are its pieces for SceneModels: a floor (a hatch cut in it over the ramp), walls round each room with a doorway to the next (the nose wall of a room with windows its glass, seen through), the well of the ramp, a console, a seat and a lit screen for each seat, reactors glowing, lamps; Ceiling(plan, tools) its ceilings (a model of their own: a view cut away leaves them out); Ramp(plan, tools) the ramp and the legs.
- Define(models, ship, hull) defines the models of its inside, ceiling and ramp once ({Inside, Ceiling, Ramp, Plan}).

Regression: the rooms were laid out by the class alone, larger than the hull of a ship, open at the top; the hull was not drawn while one was inside and the sky lit them as a house with no roof.

## Methods

- `ClassOf(length)`
- `GearOf(ship)`
- `Hull(pieces, options)`
- `Plan(ship, hull)`
- `Solid(plan, hull, point, radius)`
- `WindowsOf(plan)`
- `Parts(plan, tools)`
- `Ceiling(plan, tools)`
- `Ramp(plan, tools)`
- `Define(models, ship, hull)`

## Tests

- [lays the rooms of a ship out by its class: a fighter a cockpit, a corvette a bridge to a cargo hold on a ramp, a capital ship a command post](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-aboard.test.js#L55) — `tests/regression/library-aboard.test.js`
- [fits the rooms of a ship into its hull: none stands out of it, the kinds of Drop left out of a short one, a fighter a cockpit](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-aboard.test.js#L117) — `tests/regression/library-aboard.test.js`
