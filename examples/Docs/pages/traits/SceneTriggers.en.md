<!-- generated -->
# SceneTriggers

SceneTriggers: the places of a scene where something happens, in a game, a tour, a plan of a building or any other world. An object of kind trigger (the trait Trigger) is a shape on the ground: Shape circle (Radius round its X and Y), area (Points [[x, z]...]) or line (Points, Width); empty: an area of three points or more, a line of two, else a circle. Height (0: any) is how high over the ground it reaches. What goes into it are the walkers, the vehicles and the hero (Kinds: the kinds of what counts in their place, their bases too), of its Team when it has one. The scene emits enter when one comes in and leave when it goes out or is removed, with {Trigger, ID, Object}: Trigger is the trigger itself, Trigger(id) of the scene ({ID, Inside(), Action(name, data), Enable(on)}): Inside() tells who stays in it, a handler sends it an action, and the scene emits action ({Trigger, Name, Data}). Once: it fires its first enter alone; Enabled false holds it.

A trigger with Blueprint (a flow graph of the Blueprints Service) runs it: its Event blocks enter and leave start with {Trigger, Object} (the IDs), an action starts the Event block of its name with {Trigger, Data}; its Action blocks call the actions TriggerActions({Name: function (value, done)}) gave the scene. A graph that cannot be made is told once. The action achievement is there by itself: value the ID of an achievement of the Achievements Service (it unlocks it) or {ID, Amount} (it adds to its progress). Achievement of a trigger, the same value, does it as one comes in, with no graph.

An object of kind zone (the trait Zone: Points or a Radius round its X and Y, Tags, Team) is a place of rules a game asks for: ZonesAt(x, z) gives [{ID, Name, Tags, Team}] of the zones there, safe, pvp, no-build or any tag of its own.

Triggers and zones are drawn in a sketch of a ground too (Terrain: trigger, triggerpoint, triggerline, zone).

## Methods

- `Trigger(id)`
- `TriggerActions(actions)`
- `ZonesAt(x, z)`

## Tests

- [takes the base a Component names in $Extends and the Traits of the project into the bundle, the Traits as their own type](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/build-inheritance.test.js#L52) — `tests/regression/build-inheritance.test.js`
