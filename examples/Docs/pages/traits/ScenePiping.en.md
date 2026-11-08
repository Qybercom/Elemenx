<!-- generated -->
# ScenePiping

ScenePiping: the pipes of a Scene. An object of kind pipe (the trait Pipe: Points [[x, z] or [x, z, y]...], Radius, Wall, Laid (above, ground or buried), Lift, Depth, Bend, Ends, Flanges, Spacing, Color, Inside, Metal, Fluid ({Type, Fill, Flow, Pressure}) and Leaks; see ScenePipes) is drawn as its model, made again when it changes or the ground under it does; a buried one cuts the ground (Carves): all of one a man may go in, the open ends of a smaller one. Pipes() gives them laid out ([{ID, Radius, Wall, Laid, Ends, Fluid, Leaks, Points}]). A walker and the hero stand on the bottom of a pipe they are in and on the top of one they are on, and go through no wall of one but in and out at its open ends; the Physics hold what is solid (trait Rigid) in a pipe or out of it (a tube of its World). A buried one is the ground's: its floor is the ground's.

What flows in a pipe comes out of it as it is: a liquid (water, sewage, mud, oil, fuel) as a fluid of particles of the Physics, as heavy and as thick as it is, out of its open end as fast and as much as its Flow and Fill make (ScenePipes.Mouth) and out of each hole of its wall under the level of it as fast as its Pressure drives (Leaks, ScenePipes.Spurt); it falls, runs over the ground, gathers in its hollows and soaks away (water in 12 s, sewage 20, fuel 15, oil and mud in a minute). A gas or steam is no fluid: a plume rises from the hole (steam white, a gas only a shimmer). A crack of a pipe of the trait Fracture is a hole where it struck, as large as the blow; a pipe that breaks spills what was in it there. 400 particles at most in a scene, the oldest go first; those of a pipe farther than 200 m from the eye wait. Fluids() gives them now.

## Methods

- `Fluids()`
- `Pipes()`
