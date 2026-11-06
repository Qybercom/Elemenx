<!-- generated -->
# ScenePhysics

Rigid: solid things of a ground that fall, roll, tumble and are knocked over, by the World of the Physics Service. An object with the trait Rigid ({Shape: box, sphere or capsule; Size [x, y, z], Radius, Height, Mass (0: it never moves), Bounce, Friction, Rolling}) starts at its X and Y, Lift over the ground, turned by its Facing; from then on the world moves it and it lies as it fell. The walkers and the hero are capsules the world cannot move (Radius 0.4, 1.8 high) that push what they walk into. The ground is the ground of the scene.

A collider is a wall of a shape of its own that stops what comes to it and never moves: an object of kind collider (the trait Collider: Points [[x, z]...] of a convex outline round its X and Y, turned by its Facing, Height, Lift over the ground; or Model, the outline and the height of that model as large as its Size), or an area of type collider of the sketch of the ground (Height, Lift). The rigid bodies strike it, a ray meets it, a car is held off it and a walker walks round it (ColliderHit); the editor (Origin) shows them as outlines. Colliders() gives them: [{ID, Points (the outline in the world, turning left), Bottom, Top}].

The scene emits touch ({ID, With (null: the ground), At, Normal, Impulse}) when two begin to touch. Push(id, impulse, at) knocks one (an impulse [x, y, z], N s, at a point, its middle when none), CastRay(from, direction, max) gives the first {ID (null: the ground), At, Normal, Distance} along a ray, or null; RigidWorld() the World itself.

## Methods

- `Push(id, impulse, at)`
- `CastRay(from, direction, max)`
- `Colliders()`
- `RigidWorld()`
