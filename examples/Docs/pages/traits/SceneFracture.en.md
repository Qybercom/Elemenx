<!-- generated -->
# SceneFracture

SceneFracture: what breaks as a thing of its material does, a physical property of it, not a rule of a game. An object with the trait Fracture ({Material, Toughness, Integrity (1), Pattern (voronoi, parts or grid), Pieces (8), Inner (the color inside), Impacts (true: struck hard it is hurt too)}) holds a share of itself whole (Integrity, from 1 to 0): what hits it (a shot, a blast, Damage) takes from it as much as its strength lets, its strength being the toughness of its material times its size. Each blow cracks it where it struck, as its material cracks (Fractures: glass a star, stone and concrete a web, wood splinters along its grain, metal dents, fabric tears), the cracks reaching farther as less of it is whole; at nothing it breaks into pieces (Break of SceneDebris, by its Pattern).

The Material is the one of the trait, else Values.Material of the object, else stone. Fractures(materials) gives the table ({name: {Toughness, Pattern (radial, web, splinter, dent, tear), Inner, Light (lines lighter than it: glass)}}) after setting those given. Damage(id, amount, hit) ({Point, Normal, Kind: kinetic, explosive or impact}) takes from it: what is left of it, 0 when it broke, null when it has no Fracture; Integrity(id) what is left. The scene tells crack ({ID, Integrity, Point, Amount}) at each blow it lives through and break when it breaks. A shot of SceneWeapons and a hard touch of the Physics (Impulse over 40 N s) hurt it by themselves. Health (Vitals of ElemenxGaming) is another thing: a game may join them (Damage from a hit of its own, Break at a death).

## Methods

- `Fractures(materials)`
- `Damage(id, amount, hit)`
- `Integrity(id)`

## Tests

- [cuts a thing by Voronoi cells denser near the hit, keeps all of its faces, and closes each piece by its hull](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js#L80) — `libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js`
- [takes from what is whole of a thing as strong as its material and size, cracks it at each blow, and breaks it at nothing](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js#L121) — `libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js`
- [cracks a thing hit before its first frame, its crack placed with it; one added again is whole again](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js#L172) — `libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js`
- [breaks a thing by the pieces of its model (Pattern parts), and a shot of SceneWeapons hurts it by itself](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js#L199) — `libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js`
