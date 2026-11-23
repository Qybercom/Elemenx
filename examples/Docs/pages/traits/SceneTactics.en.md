<!-- generated -->
# SceneTactics

SceneTactics: what who sits in a vehicle does from its seat, by the role of the seat (Seats of SceneVehicles, the consoles of a ship standing of SceneAboard). A mode owns the view (one at a time): '' the seat itself (at a console: its screen), helm (pilot, copilot: the view round the vehicle from outside), turret (gunner, tactical: the view of a turret of the vehicle, the pointer taken, the left button firing its weapon), radar (sensors, tactical: the view from high over the vehicle, the pointer free, a press on what it knows makes that the target) and schematic (engineer: the view round the vehicle cut open, its hull a ghost round its rooms, its shields as shells) and strategic (captain, commander: as over the map of a strategy, round a point the keys carry: WASD and the arrows over the ground, R and F up and down through space, Q and E turn it, the wheel brings it near; StrategyPoint(point) is that point). What is shown over a view (GameTargets, GameRadar, GameFlight) goes with any mode.

The roles no seat of a vehicle has fall to its seat of command (the captain, else the commander, the pilot, the first): alone in a fighter its pilot has all of them. Tactics(id) lists the modes of an actor in its seat ('' first; none when it sits nowhere); Tactic(kind) is the mode of the hero (one of its Tactics; none: as it is), the event tactic ({Kind, Vehicle, Seat}) as it changes. At a turret 1 to 9 go to the turrets of the vehicle (it begins at the one best turned to its target, on it). Escape gives the pointer of a turret back, then goes back to the seat. A mode is left as the hero leaves its seat; leaving one keeps the vehicle as it was (its course, where its turrets look).

Turrets(id) are the turrets of a vehicle: its Mounts of Kind turret ({At, Place, Weapon, Arc, Low, High}), else the turret parts of its model (roles of Kind turret: their pivot), else those of the class of its inside (Turrets of a class of SceneInteriors: Place top or belly, Along its length from -0.5 at its tail to 0.5 at its nose), each {ID, At, Up, Weapon, Arc (degrees each side of the nose), Low, High (degrees of elevation), From (mount, role, class)}. Who mans one turns it (Values.Aim {Yaw, Pitch} of the vehicle, degrees: its turret and barrel parts follow) within its Arc, Low and High.

Command(id) is whom an actor commands from its seat (none with no strategic view): {Kind (crew, fleet), Fleet, Vehicle, Vehicles, Units: [{ID, Vehicle, Seated, Post}]}: the crew of its vehicle (who sits in it, and the walkers whose Crew is its ID), or at the seat of a commander, or of command of a vehicle that is the Flagship of its fleet with no commander aboard, every crew of its fleet (the vehicles of the same Fleet of their Vehicle). GameStrategy with Command seat orders those of them on foot.

Contacts(id) are what a vehicle knows round it (within the Range of its Sensors, km; 2 with none): vehicles, walkers, what has a Team, places (NavPoint), blockers of warp (WarpBlocker), each {ID, Name, Kind (ship, vehicle, walker, place, jammer, thing), Team, Hostile (of a team other than the vehicle's, its crew's or the Team of the scene), At, Distance, Bearing (degrees from the nose, right positive), Elevation (degrees), Velocity (m/s), Target}. The target of a vehicle is one for all its seats: SetTarget(id, target) (the event target {Vehicle, Target}), TargetOf(id).

## Methods

- `Tactic(kind)`
- `Tactics(id)`
- `Command(id)`
- `StrategyPoint(point)`
- `Turrets(id)`
- `Contacts(id)`
- `SetTarget(id, target)`
- `TargetOf(id)`
