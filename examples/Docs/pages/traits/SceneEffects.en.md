<!-- generated -->
# SceneEffects

Effects: what burns, smokes and flies off in a Scene. Kind effect (Type, Size, Power, Aim, Height, Light, Follow, Offset, X, Y, Z, Appear, the seconds it takes to come; Tune, what is changed of its type, below; Color and Hot, the body and the heart of its fire, Volume, how much of it there is and how wide, Intensity, how bright, Length, how far it reaches, Width, how wide, Smoke, how much of it) stands on the ground or goes with an object; Burst(type, place) is one that happens once, as an explosion.

Nothing is simulated: each particle is a quad whose place is worked out in its vertex shader from its seed and the time, so a fire costs a draw and no work of the processor. A type is a list of layers of particles {Count, Life, Speed, Spread, Gravity, Rise, Drag, Bounce, Size, Stretch, Wander, Wind (how much the wind moves them, 1), Kind, Blend, Color}; Kind says what they look like: flame, smoke, spark, mote or bubble (clear, a bright rim and a glint, wobbling until it bursts). Where the picture has the depth of the scene they meet what stands there softly. Smoke takes its light from the sun and from the fire under it.

What has a body is no quad at all: a layer of Kind fire, stream or ball is a volume, a box over the effect through which the eye goes step by step, reading noise that runs along it, so it is round from every side. Its Size is its width and its Speed its length; Blend alpha lets it stand before what is behind it, add lets it shine through. Kind beam is a shaft of light along its Aim, shell a bubble, and bolt a lightning that goes a new way at every flicker.

Everything of a type can be told for one effect by Tune, by the Kind of the layer: Tune: {mote: {Count: 200, Color: '#ff0000'}, sigil: {Rings: [...]}, smoke: false}: what is told replaces what the type has, false leaves the layer out, a list adds layers. Effects({Name: {...}}) makes a whole type of its own, from any layers.

A type is also an effect graph of the Blueprints Service: EffectGraph(name) gives the one of a type (its Layer blocks one after the other, its Effect at the end), Effects({Name: graph}) makes a type of one, and an effect with Blueprint (a graph) burns as it says. Parameters are the values of its parameters: a Parameter block linked to a number or a color of a layer is that value, so one graph makes many effects; a type made of a graph takes Parameters of its own too.

What lies flat is a plate across its Aim: Kind sigil is a magic circle of the Sigils service, of the Seed of the effect, or of its Rings, a list of rings each with a Speed of its own, and Spin turns them all faster or slower; Kind swirl is the mouth of a portal, pool the light that falls on what it stands on, wave a ring that runs out and fades.

What burns lights what is round it (the lamp of the type, flickering, the nearest ones with shadows) and the air over it trembles. Types: spark, torch, campfire, smoke, steam, dust, exhaust, fumes, backfire, explosion, wake (the foam a boat leaves), spray (water thrown up); of magic aura, circle, portal, shield, lightning, healing, frost, poison, beam, fireball, teleport, and pillar, a shaft of light; mana, bubbles that rise slowly round what it follows; glow, the light of the body of what it follows (Glow of a type: the color of it): Where body (by default), held (what it holds) or both, brightest at its edges. Effects({Type: {...}}) adds types of its own. A type with Fly goes along its Aim so many units a second while it lasts, and Then is what bursts where it ends.

Pulse of an effect changes what it is told as time goes: {Size: {From: 1, To: 2, Time: 3}, Color: {From: '#ff0000', To: '#0000ff'}, ...} for any of Size, Power, Intensity, Volume, Length, Width, Spin, Smoke, Color and Hot. Time is the seconds of a round, Shape how it goes (wave, there and back evenly; ping, there and back on a straight line; saw, there and back at a stroke; step, one or the other; flicker, a new value at each tenth of a round; once, there and stays), Delay what it waits, Phase (0 to 1) where in a round it starts. What is not told of From and To is the value of the effect.

## Methods

- `Effects(types)`
- `EffectGraph(name)`
- `Burst(type, place, options)`
