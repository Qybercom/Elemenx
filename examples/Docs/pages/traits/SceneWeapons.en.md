<!-- generated -->
# SceneWeapons

SceneWeapons: what a Scene shoots and what a shot does where it hits. The scene knows no health: each hit is told (the event hit, and the hook Hit of its behaviours: the Vitals of ElemenxGaming make damage of it).

A weapon is a type (Weapons({name: {...}}) adds or changes them): Kind bullet (a ray at once, a tracer flying along it), beam (a ray as long as it is held: the laser), rail (a ray at once that leaves a spiral of light), projectile (a body that flies: Speed, Gravity, Homing, Size, Glow, Trail; plasma, rocket, shell, arrow); Damage (each hit; a beam a second), Type (kinetic, energy, explosive, fire... for the resistances), Rate (shots a second), Range (metres), Spread (degrees), Pellets (rays a shot), Radius (a blast where it ends: damage less with distance, things pushed, Then the effect of it), Color and Width (of its light), Muzzle (the effect at the muzzle), Recoil (how much the view of the hero kicks), Magazine and Reload (seconds), Lock {Time (seconds on the aim to lock), Cone (degrees), Count (targets at once)}, Crosshair (dot, cross, circle, chevron). Built in: pistol, rifle, shotgun, sniper, laser, railgun, plasma, rocket, artillery, mortar, bow.

Fire(id, options) shoots the weapon of an object (Values.Weapon, or options.Weapon) from its muzzle toward options.At (a point [x, y, z] or the ID of an object; an artillery shell takes the arc to reach it) or along options.Way; false while the weapon is not ready (its rate, its magazine). The hero with a Weapon fires with the left button while the pointer is taken, toward the middle of the view, and locks what stays under its aim (Lock of the weapon): lock and unlock events, Locked() the IDs; a homing shot goes to them.

Where a shot hits it asks the material there (Values.Material of an object; the name of the material of the part of the model hit; walkers flesh, vehicles metal, plants wood, buildings and rocks stone; of the ground: water, snow, a road, soil) and the rules (HitRules({material: {Effect, Decal, Factor}, 'type/material': {...}})): the effect it bursts, the mark it leaves (hole, dent, chip, scorch, crack: they stay for MarkSeconds, the oldest go past MarkCount, the marks of a thing go with it) and the factor of its damage. The event hit: {Weapon, Type, Source, Team, Target (the ID, null for the ground), Part, Point, Normal, Material, Amount, Distance, ID (of the hit)}; fire ({ID, Weapon, From, Way}).

Crosshair of the scene ('' as the weapon of the hero says, none, dot, cross, circle, chevron) is drawn over the view while the hero holds a weapon, wider as it moves and fires; it flashes on a hit and red on a kill (Scene.Killed(id)). Locks are marks on their targets, closing in as they lock, at the edge of the view when the target is out of it.

## Methods

- `Weapons(types)`
- `HitRules(rules)`
- `Fire(id, options)`
- `Locked()`
- `Killed(id)`
