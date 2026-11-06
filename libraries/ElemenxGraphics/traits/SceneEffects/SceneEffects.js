/*
 * Effects: what burns, smokes and flies off in a Scene. Kind effect (Type, Size, Power, Aim, Height, Light, Follow, Offset,
 * X, Y, Z, At (a place of the world as it is: on a wall, CastOn), Appear, the seconds it takes to come; Draw, the seconds a
 * circle takes to be written ring by ring (Dispel(id, seconds) unwrites it and it goes); Tune, what is changed of its type, below; Color and Hot, the body and the heart of its fire, Volume, how much of it there is and how wide, Intensity, how bright,
 * Length, how far it reaches, Width, how wide, Smoke, how much of it) stands on the ground or goes with an object; Burst(type, place) is one that happens once, as an explosion.
 *
 * Nothing is simulated: each particle is a quad whose place is worked out in its vertex shader from its seed and the time, so
 * a fire costs a draw and no work of the processor. A type is a list of layers of particles {Count, Life, Speed, Spread,
 * Gravity, Rise, Drag, Bounce, Size, Stretch, Wander, Wind (how much the wind moves them, 1), Kind, Blend, Color}; Kind says what they
 * look like: flame, smoke, spark, mote or bubble (clear, a bright rim and a glint, wobbling until it bursts).
 * Where the picture has the depth of the scene they meet what stands there softly. Smoke takes its light from the sun and from
 * the fire under it.
 *
 * What has a body is no quad at all: a layer of Kind fire, stream or ball is a volume, a box over the effect through which the
 * eye goes step by step, reading noise that runs along it, so it is round from every side. Its Size is its width and its
 * Speed its length; Blend alpha lets it stand before what is behind it, add lets it shine through. Kind beam is a shaft of light
 * along its Aim, shell a bubble, and bolt a lightning that goes a new way at every flicker.
 *
 * Everything of a type can be told for one effect by Tune, by the Kind of the layer: Tune: {mote: {Count: 200, Color: '#ff0000'}, sigil:
 * {Rings: [...]}, smoke: false}: what is told replaces what the type has, false leaves the layer out, a list adds layers. Effects({Name:
 * {...}}) makes a whole type of its own, from any layers.
 *
 * A type is also an effect graph of the Blueprints Service: EffectGraph(name) gives the one of a type (its Layer blocks one
 * after the other, its Effect at the end), Effects({Name: graph}) makes a type of one, and an effect with Blueprint (a graph)
 * burns as it says. Parameters are the values of its parameters: a Parameter block linked to a number or a color of a layer
 * is that value, so one graph makes many effects; a type made of a graph takes Parameters of its own too.
 *
 * What lies flat is a plate across its Aim: Kind sigil is a magic circle of the Sigils service, of the Seed of the effect, or of its
 * Rings, a list of rings each with a Speed of its own, and Spin turns them all faster or slower; Kind swirl is the mouth of a portal, pool the light that falls on what it stands on, wave a ring that
 * runs out and fades.
 *
 * What burns lights what is round it (the lamp of the type, flickering, the nearest ones with shadows) and the air over it
 * trembles. Types: spark, torch, campfire, smoke, steam, dust, exhaust, fumes, backfire, explosion, wake (the foam a boat leaves), spray (water thrown up), roadspray (the mist of wheels on a wet road); of magic aura, circle, portal, shield, lightning,
 * healing, frost, poison, beam, fireball, teleport, and pillar, a shaft of light; mana, bubbles that rise slowly round what it follows;
 * glow, the light of the body of what it follows (Glow of a type: the color of it): Where body (by default), held (what it holds) or
 * both, brightest at its edges. Effects({Type: {...}}) adds types of its own.
 * A type with Fly goes along its Aim so many units a second while it lasts, and Then is what bursts where it ends.
 *
 * Pulse of an effect changes what it is told as time goes: {Size: {From: 1, To: 2, Time: 3}, Color: {From: '#ff0000', To: '#0000ff'}, ...}
 * for any of Size, Power, Intensity, Volume, Length, Width, Spin, Smoke, Color and Hot. Time is the seconds of a round, Shape how it goes
 * (wave, there and back evenly; ping, there and back on a straight line; saw, there and back at a stroke; step, one or the other; flicker,
 * a new value at each tenth of a round; once, there and stays), Delay what it waits, Phase (0 to 1) where in a round it starts. What is
 * not told of From and To is the value of the effect.
 */
Elemenx.Trait('SceneEffects', {
	EffectsStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var renderer = engine.Renderer;
		var math = this.$Service('Math');
		var vectors = math.Vectors;
		var head = '#version 300 es\nprecision highp float;\nprecision highp int;\nprecision highp sampler3D;\nprecision highp sampler2D;\n';
		var meshes = {};
		var bursts = [];
		var kinds = {flame: 0, smoke: 1, spark: 2, mote: 3, bubble: 4};
		var volumes = {fire: 0, stream: 1, ball: 2, beam: 3, shell: 4};
		var plates = {sigil: 0, swirl: 1, pool: 2, wave: 3, nozzle: 4, flare: 5};
		var born = {};
		var sigils = this.$Service('Sigils');
		var circles = {};
		var program = null;
		var volume = null;
		var plateProgram = null;
		var boltProgram = null;
		var box = null;
		var plate = null;
		var ribbon = null;
		var fire = [1, 0.62, 0.3];
		var compiled = {Graphs: new WeakMap(), Texts: {}};

		var types = scene.EffectTypes = {
			spark: {Lamp: null, Layers: [
				{Kind: 'spark', Count: 48, Life: 1.3, Speed: [2, 7], Spread: 0.8, Gravity: 9, Drag: 0.6, Bounce: 0.35, Size: [0.022, 0.008], Stretch: 0.03, Color: [1, 0.72, 0.35], Blend: 'add'}
			]},
			torch: {Lamp: {Color: '#ff9a4a', Power: 0.07, Radius: 7, Flicker: 0.32}, Heat: 0.5, Layers: [
				{Kind: 'fire', Life: 1, Speed: [1.1, 1.1], Size: [0.26, 0.26], Color: fire, Blend: 'alpha'},
				{Kind: 'smoke', Count: 12, Life: 2.6, Speed: [0.5, 1], Spread: 0.2, Rise: 0.4, Drag: 0.5, Size: [0.14, 0.7], Wander: 0.3, Color: [0.2, 0.19, 0.18], Opacity: 0.16, Blend: 'alpha', Start: 0.3},
				{Kind: 'spark', Count: 7, Life: 1, Speed: [0.8, 2], Spread: 0.45, Rise: 0.8, Drag: 1.2, Size: [0.01, 0.004], Stretch: 0.025, Wander: 0.2, Color: [1, 0.6, 0.25], Blend: 'add'}
			]},
			campfire: {Lamp: {Color: '#ff8c3c', Power: 0.12, Radius: 10, Flicker: 0.28}, Heat: 1, Layers: [
				{Kind: 'fire', Life: 1, Speed: [1.7, 1.7], Size: [0.42, 0.42], Color: fire, Blend: 'alpha'},
				{Kind: 'smoke', Count: 26, Life: 4.2, Speed: [0.7, 1.4], Spread: 0.25, Rise: 0.5, Drag: 0.4, Size: [0.3, 2.2], Wander: 0.5, Color: [0.16, 0.15, 0.15], Opacity: 0.22, Blend: 'alpha', Start: 0.6},
				{Kind: 'spark', Count: 22, Life: 1.7, Speed: [1.2, 3.4], Spread: 0.42, Rise: 1, Drag: 1, Size: [0.012, 0.004], Stretch: 0.025, Wander: 0.4, Color: [1, 0.55, 0.2], Blend: 'add'}
			]},
			smoke: {Lamp: null, Layers: [
				{Kind: 'smoke', Count: 44, Life: 5, Speed: [0.8, 1.6], Spread: 0.3, Rise: 0.5, Drag: 0.4, Size: [0.5, 3], Wander: 0.6, Color: [0.26, 0.26, 0.27], Opacity: 0.32, Blend: 'alpha'}
			]},
			steam: {Lamp: null, Layers: [
				{Kind: 'smoke', Count: 30, Life: 1.8, Speed: [1, 2], Spread: 0.3, Rise: 0.8, Drag: 1, Size: [0.2, 1.4], Wander: 0.4, Color: [0.82, 0.84, 0.86], Opacity: 0.2, Blend: 'alpha'}
			]},
			/* What a boat leaves on the water behind it: foam that spreads and fades where it lies. */
			wake: {Lamp: null, Lasts: 0.5, Layers: [
				{Kind: 'smoke', Count: 10, Life: 3, Speed: [0.2, 0.8], Spread: 1.4, Rise: 0, Drag: 1.8, Size: [0.5, 2.2], Wander: 0.15, Wind: 0, Color: [1, 1, 1], Opacity: 0.42, Blend: 'alpha'}
			]},
			/* Water thrown up by a bow that strikes a wave, falling back. */
			spray: {Lamp: null, Lasts: 0.3, Layers: [
				{Kind: 'smoke', Count: 16, Life: 0.9, Speed: [2, 4.5], Spread: 0.6, Rise: 0.6, Gravity: 9, Drag: 0.8, Size: [0.1, 0.6], Wander: 0.1, Wind: 0.2, Color: [0.92, 0.95, 0.97], Opacity: 0.4, Blend: 'alpha'}
			]},
			/* The mist the wheels throw up off a wet road: wide, light, hanging a while behind what drives; it scatters light (adds), never darkens. */
			roadspray: {Lamp: null, Lasts: 0.5, Layers: [
				{Kind: 'smoke', Count: 10, Life: 1.1, Speed: [1, 3.2], Spread: 0.9, Rise: 0.5, Gravity: 1.5, Drag: 1.4, Size: [0.5, 2.2], Wander: 0.2, Wind: 0.4, Color: [0.5, 0.54, 0.6], Opacity: 0.07, Blend: 'add'},
				{Kind: 'smoke', Count: 8, Life: 0.5, Speed: [3, 6], Spread: 0.35, Rise: 0.4, Gravity: 9, Drag: 0.6, Size: [0.08, 0.3], Wander: 0.05, Wind: 0.1, Color: [0.7, 0.75, 0.8], Opacity: 0.25, Blend: 'add'}
			]},
			dust: {Lamp: null, Layers: [
				{Kind: 'smoke', Count: 20, Life: 1.6, Speed: [0.3, 1], Spread: 1.2, Rise: 0.1, Drag: 1.6, Size: [0.2, 1.2], Wander: 0.2, Color: [0.5, 0.42, 0.32], Opacity: 0.2, Blend: 'alpha'}
			]},
			fumes: {Lamp: null, Aim: [0, 0, -1], Layers: [
				{Kind: 'smoke', Count: 22, Life: 0.8, Speed: [1.6, 3.2], Spread: 0.14, Rise: 0.25, Drag: 1.1, Size: [0.08, 0.55], Wander: 0.12, Color: [0.3, 0.3, 0.32], Opacity: 0.3, Blend: 'alpha'}
			]},
			backfire: {Lasts: 0.4, Lamp: {Color: '#ff9a4a', Power: 0.2, Radius: 5, Flicker: 0.4}, Layers: [
				{Kind: 'ball', Life: 0.2, Speed: [1, 1], Size: [0.42, 0.42], Color: [1, 0.5, 0.15], Blend: 'add'},
				{Kind: 'spark', Count: 14, Life: 0.35, Speed: [2, 7], Spread: 0.32, Drag: 1.2, Size: [0.03, 0.01], Stretch: 0.03, Color: [1, 0.68, 0.3], Blend: 'add'}
			]},
			exhaust: {Lamp: {Color: '#7fb6ff', Power: 0.22, Radius: 10, Flicker: 0.12}, Heat: 1.4, Aim: [0, 0, -1], Layers: [
				{Kind: 'stream', Life: 1, Speed: [5.5, 5.5], Size: [0.42, 0.42], Color: [0.3, 0.55, 1], Blend: 'alpha'},
				{Kind: 'nozzle', Size: [0.5, 0.5], Color: [0.35, 0.6, 1], Blend: 'add'},
				{Kind: 'smoke', Count: 16, Life: 1.1, Speed: [10, 14], Spread: 0.1, Drag: 2.2, Size: [0.4, 1.6], Wander: 0.3, Color: [0.5, 0.5, 0.52], Opacity: 0.035, Blend: 'alpha', Start: 0.25}
			]},
			/* Bubbles of mana: slow, wobbling as they rise, a bright rim and a glint, growing until they burst. */
			mana: {Lamp: {Color: '#7aa8ff', Power: 0.08, Radius: 6, Flicker: 0.05}, Layers: [
				{Kind: 'pool', Size: [1.6, 1.6], Color: [0.3, 0.5, 1], Blend: 'add'},
				{Kind: 'bubble', Count: 30, Life: 5, Speed: [0.04, 0.12], Spread: 0.5, Rise: 0.28, Drag: 0.5, Size: [0.04, 0.1], Wander: 0.2, Wind: 0.15, Color: [0.4, 0.62, 1], Hot: [0.9, 0.96, 1], Blend: 'add', Base: 12},
				{Kind: 'mote', Count: 18, Life: 2.4, Speed: [0.05, 0.2], Spread: 0.8, Rise: 0.4, Drag: 0.5, Size: [0.03, 0.008], Wander: 0.3, Wind: 0.3, Color: [0.5, 0.7, 1], Blend: 'add', Base: 12}
			]},
			/* The glow of what it follows: its body (or what it holds, Where) lit from within, brighter at its edges; a few motes round it. */
			glow: {Lamp: {Color: '#8fc8ff', Power: 0.1, Radius: 5, Flicker: 0.04}, Glow: [0.45, 0.75, 1], Layers: [
				{Kind: 'mote', Count: 22, Life: 1.8, Speed: [0.05, 0.2], Spread: 0.8, Rise: 0.45, Drag: 0.6, Size: [0.025, 0.006], Wander: 0.3, Wind: 0.3, Color: [0.55, 0.8, 1], Blend: 'add', Base: 10}
			]},
			aura: {Lamp: {Color: '#ffd27a', Power: 0.14, Radius: 8, Flicker: 0.1}, Layers: [
				{Kind: 'pool', Size: [2.4, 2.4], Color: [1, 0.66, 0.24], Blend: 'add'},
				{Kind: 'sigil', Size: [1.7, 1.7], Color: [1, 0.72, 0.3], Hot: [1, 0.95, 0.8], Blend: 'add', Rings: [{Kind: 'double', Radius: 0.97, Speed: 0}, {Kind: 'ticks', Radius: 0.9, Count: 48, Speed: 0.05}, {Kind: 'arcs', Radius: 0.78, Count: 6, Speed: -0.09}]},
				{Kind: 'beam', Life: 1, Speed: [2.6, 2.6], Size: [0.95, 0.95], Hollow: 0.82, Color: [1, 0.66, 0.24], Blend: 'add'},
				{Kind: 'mote', Count: 70, Life: 2.4, Speed: [0.3, 0.9], Spread: 1.5, Rise: 0.9, Drag: 0.4, Size: [0.05, 0.015], Wander: 0.35, Color: [1, 0.78, 0.36], Blend: 'add', Base: 12}
			]},
			circle: {Lamp: {Color: '#7fc4ff', Power: 0.16, Radius: 9, Flicker: 0.06}, Layers: [
				{Kind: 'pool', Size: [3.4, 3.4], Color: [0.3, 0.6, 1], Blend: 'add'},
				{Kind: 'sigil', Size: [2.4, 2.4], Color: [0.3, 0.62, 1], Hot: [0.86, 0.96, 1], Blend: 'add'},
				{Kind: 'beam', Life: 1, Speed: [1.1, 1.1], Size: [1.9, 1.9], Hollow: 0.96, Color: [0.3, 0.6, 1], Blend: 'add'},
				{Kind: 'mote', Count: 50, Life: 2.2, Speed: [0.2, 0.7], Spread: 1.6, Rise: 0.7, Drag: 0.5, Size: [0.04, 0.012], Wander: 0.3, Color: [0.5, 0.78, 1], Blend: 'add', Base: 14}
			]},
			portal: {Lamp: {Color: '#a070ff', Power: 0.3, Radius: 12, Flicker: 0.14}, Heat: 0.6, Aim: [0, 0, 1], Stand: 1.85, Layers: [
				{Kind: 'swirl', Size: [1.5, 1.5], Color: [0.55, 0.3, 1], Hot: [0.86, 0.72, 1], Blend: 'alpha'},
				{Kind: 'sigil', Size: [1.72, 1.72], Color: [0.6, 0.36, 1], Hot: [0.92, 0.84, 1], Blend: 'add', Rings: [{Kind: 'double', Radius: 0.97, Speed: 0.02}, {Kind: 'runes', Radius: 0.9, Count: 22, Speed: -0.06}]},
				{Kind: 'mote', Count: 60, Life: 1.8, Speed: [0.6, 1.6], Spread: 1.6, Drag: 1.2, Size: [0.05, 0.01], Wander: 0.4, Color: [0.72, 0.5, 1], Blend: 'add', Base: 9},
				{Kind: 'spark', Count: 16, Life: 1.1, Speed: [1, 3], Spread: 1.2, Gravity: 3, Drag: 1, Size: [0.012, 0.004], Stretch: 0.03, Color: [0.8, 0.6, 1], Blend: 'add', Base: 9}
			]},
			shield: {Lamp: {Color: '#7ad8ff', Power: 0.12, Radius: 8, Flicker: 0.05}, Layers: [
				{Kind: 'pool', Size: [2.3, 2.3], Color: [0.28, 0.72, 1], Blend: 'add'},
				{Kind: 'sigil', Size: [1.55, 1.55], Color: [0.3, 0.8, 1], Hot: [0.86, 1, 1], Blend: 'add', Rings: [{Kind: 'double', Radius: 0.97, Speed: 0.03}, {Kind: 'runes', Radius: 0.88, Count: 18, Speed: -0.05}, {Kind: 'star', Radius: 0.7, Count: 6, Step: 2, Speed: 0.04}]},
				{Kind: 'shell', Life: 1, Speed: [3, 3], Size: [1.5, 1.5], Color: [0.28, 0.72, 1], Hot: [0.86, 1, 1], Blend: 'add'},
				{Kind: 'mote', Count: 36, Life: 2, Speed: [0.2, 0.5], Spread: 1.6, Rise: 0.5, Drag: 0.6, Size: [0.035, 0.01], Wander: 0.25, Color: [0.6, 0.9, 1], Blend: 'add', Base: 13}
			]},
			lightning: {Lamp: {Color: '#a8c8ff', Power: 0.6, Radius: 14, Flicker: 0.9}, Layers: [
				{Kind: 'pool', Size: [1.8, 1.8], Color: [0.5, 0.68, 1], Blend: 'add'},
				{Kind: 'bolt', Life: 1, Speed: [7, 7], Size: [0.09, 0.09], Reach: 0.1, Color: [0.5, 0.68, 1], Hot: [0.96, 0.98, 1], Blend: 'add', Seed: 1},
				{Kind: 'bolt', Life: 1, Speed: [6, 6], Size: [0.06, 0.06], Reach: 0.14, Color: [0.5, 0.68, 1], Hot: [0.96, 0.98, 1], Blend: 'add', Seed: 2},
				{Kind: 'bolt', Life: 1, Speed: [4.5, 4.5], Size: [0.04, 0.04], Reach: 0.2, Color: [0.62, 0.5, 1], Hot: [0.96, 0.98, 1], Blend: 'add', Seed: 3},
				{Kind: 'spark', Count: 24, Life: 0.7, Speed: [2, 6], Spread: 1.3, Gravity: 8, Drag: 0.8, Bounce: 0.3, Size: [0.012, 0.004], Stretch: 0.03, Color: [0.7, 0.82, 1], Blend: 'add'},
				{Kind: 'mote', Count: 14, Life: 0.5, Speed: [0.2, 0.8], Spread: 1.4, Drag: 1, Size: [0.14, 0.04], Color: [0.6, 0.76, 1], Blend: 'add'}
			]},
			healing: {Lamp: {Color: '#8affb0', Power: 0.14, Radius: 8, Flicker: 0.08}, Layers: [
				{Kind: 'pool', Size: [2.2, 2.2], Color: [0.3, 1, 0.55], Blend: 'add'},
				{Kind: 'sigil', Size: [1.6, 1.6], Color: [0.3, 1, 0.55], Hot: [0.9, 1, 0.9], Blend: 'add', Rings: [{Kind: 'line', Radius: 0.97, Speed: 0}, {Kind: 'dots', Radius: 0.9, Count: 24, Speed: 0.07}, {Kind: 'runes', Radius: 0.78, Count: 16, Speed: -0.05}, {Kind: 'star', Radius: 0.56, Count: 8, Step: 3, Speed: 0.05}]},
				{Kind: 'beam', Life: 1, Speed: [3.2, 3.2], Size: [1, 1], Hollow: 0.35, Soft: 0.5, Color: [0.3, 1, 0.55], Blend: 'add'},
				{Kind: 'mote', Count: 90, Life: 2.2, Speed: [0.3, 0.8], Spread: 1.4, Rise: 1.3, Drag: 0.5, Size: [0.06, 0.012], Wander: 0.3, Color: [0.5, 1, 0.66], Blend: 'add', Base: 10}
			]},
			frost: {Lamp: {Color: '#a8e4ff', Power: 0.12, Radius: 8, Flicker: 0.04}, Layers: [
				{Kind: 'pool', Size: [2.5, 2.5], Color: [0.45, 0.85, 1], Blend: 'add'},
				{Kind: 'sigil', Size: [1.9, 1.9], Color: [0.45, 0.85, 1], Hot: [0.92, 1, 1], Blend: 'add', Rings: [{Kind: 'double', Radius: 0.97, Speed: 0.01}, {Kind: 'star', Radius: 0.9, Count: 6, Step: 1, Speed: -0.015}, {Kind: 'star', Radius: 0.9, Count: 12, Step: 5, Speed: 0.02}, {Kind: 'ticks', Radius: 0.56, Count: 36, Speed: -0.03}]},
				{Kind: 'smoke', Count: 30, Life: 3, Speed: [0.2, 0.6], Spread: 1.5, Rise: 0.08, Drag: 1, Size: [0.3, 1.4], Wander: 0.3, Color: [0.72, 0.88, 1], Opacity: 0.16, Blend: 'alpha', Base: 9},
				{Kind: 'spark', Count: 44, Life: 1.6, Speed: [0.8, 2.2], Spread: 0.6, Gravity: 2.5, Drag: 0.9, Size: [0.016, 0.008], Stretch: 0.06, Color: [0.72, 0.92, 1], Hot: [0.92, 1, 1], Blend: 'add', Base: 8},
				{Kind: 'mote', Count: 36, Life: 2.6, Speed: [0.1, 0.4], Spread: 1.5, Rise: 0.25, Drag: 0.4, Size: [0.03, 0.008], Wander: 0.3, Color: [0.8, 0.96, 1], Blend: 'add', Base: 12}
			]},
			poison: {Lamp: {Color: '#9cff5a', Power: 0.1, Radius: 7, Flicker: 0.2}, Layers: [
				{Kind: 'pool', Size: [2.1, 2.1], Color: [0.5, 1, 0.2], Blend: 'add'},
				{Kind: 'sigil', Size: [1.5, 1.5], Color: [0.5, 1, 0.2], Hot: [0.9, 1, 0.6], Blend: 'add', Rings: [{Kind: 'arcs', Radius: 0.96, Count: 9, Speed: 0.04}, {Kind: 'runes', Radius: 0.84, Count: 14, Speed: -0.03}]},
				{Kind: 'smoke', Count: 44, Life: 3.6, Speed: [0.2, 0.7], Spread: 1.4, Rise: 0.3, Drag: 0.6, Size: [0.3, 1.5], Wander: 0.5, Color: [0.3, 0.55, 0.12], Opacity: 0.3, Blend: 'alpha', Base: 8},
				{Kind: 'mote', Count: 46, Life: 1.8, Speed: [0.2, 0.7], Spread: 1.3, Rise: 0.8, Drag: 0.8, Size: [0.04, 0.09], Wander: 0.2, Color: [0.6, 1, 0.25], Blend: 'add', Base: 9}
			]},
			beam: {Lamp: {Color: '#ff8ae0', Power: 0.34, Radius: 12, Flicker: 0.12}, Aim: [0, 0, 1], Stand: 1.2, Heat: 0.5, Layers: [
				{Kind: 'beam', Life: 1, Speed: [14, 14], Size: [0.3, 0.3], Hollow: 0, Color: [1, 0.3, 0.8], Hot: [1, 0.92, 1], Blend: 'add'},
				{Kind: 'sigil', Size: [0.75, 0.75], Color: [1, 0.36, 0.8], Hot: [1, 0.9, 1], Blend: 'add', Rings: [{Kind: 'double', Radius: 0.97, Speed: 0.3}, {Kind: 'star', Radius: 0.88, Count: 5, Step: 2, Speed: -0.2}, {Kind: 'runes', Radius: 0.64, Count: 10, Speed: 0.2}]},
				{Kind: 'mote', Count: 40, Life: 1, Speed: [3, 9], Spread: 0.16, Drag: 0.3, Size: [0.06, 0.015], Wander: 0.2, Color: [1, 0.5, 0.9], Blend: 'add'},
				{Kind: 'spark', Count: 18, Life: 0.8, Speed: [3, 8], Spread: 0.5, Gravity: 4, Drag: 0.9, Size: [0.012, 0.004], Stretch: 0.03, Color: [1, 0.66, 0.9], Blend: 'add'}
			]},
			pillar: {Lamp: {Color: '#ffeec0', Power: 0.5, Radius: 14, Flicker: 0.04}, Layers: [
				{Kind: 'pool', Size: [3.2, 3.2], Color: [1, 0.8, 0.45], Blend: 'add'},
				{Kind: 'beam', Life: 1, Speed: [18, 18], Size: [0.9, 0.9], Hollow: 0, Soft: 1, Color: [1, 0.86, 0.5], Hot: [1, 0.98, 0.9], Blend: 'add'},
				{Kind: 'beam', Life: 1, Speed: [18, 18], Size: [1.8, 1.8], Hollow: 0, Soft: 3, Color: [1, 0.8, 0.45], Hot: [1, 0.9, 0.7], Blend: 'add'},
				{Kind: 'sigil', Size: [2.2, 2.2], Color: [1, 0.8, 0.4], Hot: [1, 0.98, 0.9], Blend: 'add', Rings: [{Kind: 'line', Radius: 0.96, Speed: 0}, {Kind: 'ticks', Radius: 0.9, Count: 60, Speed: 0.03}, {Kind: 'line', Radius: 0.5, Speed: 0}]},
				{Kind: 'mote', Count: 80, Life: 3.2, Speed: [0.3, 1], Spread: 1.5, Rise: 2.4, Drag: 0.3, Size: [0.05, 0.012], Wander: 0.25, Color: [1, 0.9, 0.6], Blend: 'add', Base: 9}
			]},
			fireball: {Lamp: {Color: '#ff8c3c', Power: 0.5, Radius: 12, Flicker: 0.26}, Heat: 1, Once: true, Lasts: 2.6, Fly: 11, Then: 'explosion', Layers: [
				{Kind: 'ball', Life: 3, Hold: true, Speed: [0.8, 0.8], Size: [0.8, 0.8], Color: fire, Blend: 'alpha'},
				{Kind: 'mote', Count: 30, Life: 3, Hold: true, Speed: [0.4, 1.2], Spread: 1.6, Drag: 1, Size: [0.12, 0.03], Color: [1, 0.6, 0.2], Blend: 'add'},
				{Kind: 'spark', Count: 30, Life: 3, Hold: true, Speed: [0.8, 2.4], Spread: 1.6, Gravity: 3, Drag: 1, Size: [0.012, 0.004], Stretch: 0.03, Color: [1, 0.6, 0.25], Blend: 'add'}
			]},
			teleport: {Lamp: {Color: '#8ad4ff', Power: 1.4, Radius: 16, Flicker: 0}, Heat: 1, Once: true, Lasts: 1.6, Layers: [
				{Kind: 'wave', Life: 0.9, Size: [4, 4], Color: [0.4, 0.8, 1], Hot: [0.9, 1, 1], Blend: 'add'},
				{Kind: 'beam', Life: 1.2, Speed: [8, 8], Size: [0.9, 0.9], Hollow: 0, Color: [0.4, 0.75, 1], Hot: [0.95, 1, 1], Blend: 'add'},
				{Kind: 'sigil', Life: 1.5, Size: [2.2, 2.2], Color: [0.35, 0.75, 1], Hot: [0.9, 1, 1], Blend: 'add'},
				{Kind: 'mote', Count: 90, Life: 1.3, Speed: [0.8, 3], Spread: 1.6, Rise: 2.4, Drag: 1.4, Size: [0.06, 0.012], Wander: 0.2, Color: [0.5, 0.82, 1], Blend: 'add', Base: 9},
				{Kind: 'spark', Count: 40, Life: 1, Speed: [2, 7], Spread: 1.5, Gravity: 6, Drag: 1, Size: [0.012, 0.004], Stretch: 0.03, Color: [0.7, 0.9, 1], Blend: 'add'}
			]},
			explosion: {Lamp: {Color: '#ffa050', Power: 2, Radius: 26, Flicker: 0}, Heat: 2, Once: true, Lasts: 3.6, Layers: [
				{Kind: 'ball', Life: 1.5, Speed: [4.2, 4.2], Size: [4.2, 4.2], Color: fire, Blend: 'alpha'},
				{Kind: 'flame', Count: 80, Life: 0.9, Speed: [3, 13], Spread: 1.9, Rise: 2, Drag: 3.2, Size: [1.1, 2.4], Wander: 0.3, Color: fire, Blend: 'add'},
				{Kind: 'smoke', Count: 46, Life: 3.4, Speed: [2, 9], Spread: 1.7, Rise: 0.9, Drag: 2, Size: [1, 5], Wander: 0.7, Color: [0.11, 0.1, 0.1], Opacity: 0.6, Blend: 'alpha', Start: 0.12},
				{Kind: 'spark', Count: 90, Life: 2, Speed: [6, 24], Spread: 1.9, Gravity: 12, Drag: 0.9, Bounce: 0.3, Size: [0.03, 0.01], Stretch: 0.02, Color: [1, 0.7, 0.3], Blend: 'add'}
			]}
		};

		/* A depth of nothing, for a picture that has none to read. */
		function blank () {
			scene.EffectBlank = scene.EffectBlank || renderer.Texture({Width: 1, Height: 1, Data: new Uint8Array([255, 255, 255, 255])}, {Nearest: true});

			return scene.EffectBlank;
		}

		function given (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		function trait (object) {
			return object && object.Traits ? object.Traits.Effect || null : null;
		}

		/* The quads of a layer: four corners each, the seed of a particle in all four. */
		function quads (count) {
			var geometry = {Positions: [], Normals: [], UVs: [], Indices: []};
			var random = 11;
			var i;

			if (meshes[count])
				return meshes[count];

			function next () {
				random = (random * 16807) % 2147483647;

				return random / 2147483647;
			}

			for (i = 0; i < count; i++) {
				var seed = [(i + next()) / count, next(), next()];

				[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (corner) {
					geometry.Positions.push(corner[0], corner[1], 0);
					geometry.Normals.push(seed[0], seed[1], seed[2]);
					geometry.UVs.push(0, 0);
				});

				geometry.Indices.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
			}

			meshes[count] = renderer.Mesh(geometry);

			return meshes[count];
		}

		/*
		 * The type of an effect: of its Blueprint (an effect graph of the Blueprints Service) with its Parameters, of its
		 * Type made of a blueprint with Parameters of its own, or the Type as it is. A type is made once for each set of
		 * parameters; a graph that cannot be made is told once, and burns as nothing.
		 */
		function typeOf (settings, fallback) {
			var type = types[settings.Type || fallback];

			if (settings.Blueprint)
				return blueprinted(settings.Blueprint, settings.Parameters);

			if (type && type.Blueprint && settings.Parameters)
				return blueprinted(type.Blueprint, settings.Parameters);

			return type;
		}

		function blueprinted (graph, parameters) {
			var key = JSON.stringify(parameters || {});
			var made = typeof graph === 'string' ? compiled.Texts[graph] : compiled.Graphs.get(graph);
			var type;

			if (made === undefined) {
				try {
					made = self.$Service('Blueprints').Compile(typeof graph === 'string' ? JSON.parse(graph) : graph);
					made.Types = {};
				}
				catch (error) {
					made = null;

					engine.Told('effect', typeof graph === 'string' ? 'Blueprint' : graph.name || 'Blueprint', [{Block: null, Line: 0, Message: error.message}], error.message, 'Elemenx Scene: the Blueprint of an effect cannot be made: ' + error.message);
				}

				if (typeof graph === 'string') compiled.Texts[graph] = made;
				else compiled.Graphs.set(graph, made);
			}

			if (!made)
				return null;

			if (!made.Types[key]) {
				if (Object.keys(made.Types).length > 64)
					made.Types = {};

				type = made.Types[key] = made.Make(parameters || {});
				type.Blueprint = graph;
			}

			return made.Types[key];
		}

		engine.EffectBlueprint = blueprinted;


		function placeOf (object, settings) {
			var follows = object.Values.Follow ? scene.Objects[object.Values.Follow] : null;
			var offset = object.Values.Offset || [0, 0, 0];
			var type = typeOf(settings);
			var height = given(settings.Height, 0) || (type && type.Stand ? type.Stand * given(settings.Size, 1) : 0);
			var x = given(object.Values.X, 0);
			var z = given(object.Values.Y, 0);

			if (follows && follows.World) {
				var turned = follows.Turn ? math.Apply(follows.Turn, offset) : offset;

				return vectors.Add(follows.World, vectors.Add(turned, [0, height, 0]));
			}

			/* A place of the world given as it is (on a wall, a ceiling: CastOn). */
			if (Array.isArray(object.Values.At)) return object.Values.At.slice();

			if (!scene.Ground)
				return object.World || [x, given(object.Values.Z, 0), z];

			return [x, Math.max(0, scene.Ground.Field.Height(x, z, object.Values.Z === undefined ? undefined : given(object.Values.Z, 0))) + height, z];
		}

		function aimOf (object, settings, type) {
			var aim = settings.Aim || type.Aim || [0, 1, 0];
			var follows = object.Values.Follow ? scene.Objects[object.Values.Follow] : null;

			return follows && follows.Turn ? [follows.Turn[0] * aim[0] + follows.Turn[4] * aim[1] + follows.Turn[8] * aim[2], follows.Turn[1] * aim[0] + follows.Turn[5] * aim[1] + follows.Turn[9] * aim[2], follows.Turn[2] * aim[0] + follows.Turn[6] * aim[1] + follows.Turn[10] * aim[2]] : aim;
		}

		/* Half the sides of an opening of a mount, in the scene. */
		function mouthOf (settings, object) {
			var mouth = settings.Mouth;
			var size = object.Size || 1;

			if (!mouth)
				return null;

			return Array.isArray(mouth) ? [mouth[0] / 2 * size, mouth[1] / 2 * size] : [mouth * size, mouth * size];
		}

		/* A place of a round of a pulse, from 0 to 1. */
		function shaped (wave, age) {
			var round = (age - given(wave.Delay, 0)) / Math.max(0.001, given(wave.Time, 1)) + given(wave.Phase, 0);
			var part = round - Math.floor(round);

			if (round < 0) return 0;

			if (wave.Shape === 'once')
				return Math.min(1, round);

			if (wave.Shape === 'ping')
				return 1 - Math.abs(part * 2 - 1);

			if (wave.Shape === 'saw') return part;

			if (wave.Shape === 'step')
				return part < 0.5 ? 0 : 1;

			if (wave.Shape === 'flicker')
				return Math.abs(Math.sin(Math.floor(round * 10) * 91.7) * 4373.5) % 1;

			return 0.5 - 0.5 * Math.cos(part * Math.PI * 2);
		}

		/* What an effect is told at an age, with its pulses. */
		function pulsed (settings, age) {
			var pulses = settings.Pulse;
			var made;

			if (!pulses)
				return settings;

			made = Object.assign({}, settings);

			Object.keys(pulses).forEach(function (name) {
				var wave = pulses[name];
				var part = shaped(wave, age);
				var own = settings[name];

				if (name === 'Color' || name === 'Hot') {
					var from = tint(wave.From || own || '#ffffff');
					var to = tint(wave.To || own || '#ffffff');

					made[name] = [from[0] + (to[0] - from[0]) * part, from[1] + (to[1] - from[1]) * part, from[2] + (to[2] - from[2]) * part];

					return;
				}

				var low = given(wave.From, given(own, 1));

				made[name] = low + (given(wave.To, given(own, 1)) - low) * part;
			});

			return made;
		}

		/* What an effect is told to look like. */
		function looks (settings) {
			return {Color: settings.Color ? tint(settings.Color) : null, Hot: settings.Hot ? tint(settings.Hot) : null, Volume: Math.max(0.1, given(settings.Volume, 1)), Intensity: Math.max(0, given(settings.Intensity, 1)), Length: Math.max(0.1, given(settings.Length, 1)), Width: Math.max(0.1, given(settings.Width, 1)), Smoke: Math.max(0, given(settings.Smoke, 1))};
		}

		function tint (value) {
			var text = String(value).replace('#', '');

			return Array.isArray(value) ? value : [parseInt(text.slice(0, 2), 16) / 255, parseInt(text.slice(2, 4), 16) / 255, parseInt(text.slice(4, 6), 16) / 255];
		}

		/* The layers of a type with what an effect says of them. */
		function layersOf (type, parts) {
			var kept = [];

			if (!parts)
				return type.Layers;

			type.Layers.forEach(function (layer) {
				var told = parts[layer.Kind];
				if (told === false) return;

				kept.push(told ? Object.assign({}, layer, told, {Told: !!told.Color}) : layer);
			});

			Object.keys(parts).forEach(function (kind) {
				(Array.isArray(parts[kind]) ? parts[kind] : []).forEach(function (layer) {
					kept.push(Object.assign({Kind: kind, Blend: 'add', Size: [1, 1], Speed: [1, 1], Life: 1, Count: 20, Color: [1, 1, 1], Told: true}, layer));
				});
			});

			return kept;
		}

		function shade (one, layer) {
			return tint(layer.Told || !one.Color ? layer.Color : one.Color);
		}

		/* Where what flies has come to. */
		function flown (burst) {
			var fly = (burst.Type.Fly || 0) * burst.Size;

			return fly ? vectors.Add(burst.At, vectors.Scale(vectors.Normalize(burst.Aim), fly * (scene.Seconds - burst.Start))) : burst.At;
		}

		/* What burns now: those of the scene and the bursts still going, each {Type, At, Aim, Size, Power, Since}. */
		function burning () {
			var gone = [];
			var list = scene.Order.filter(function (object) {
				return !!trait(object);
			}).map(function (object) {
				var told = trait(object);

				born[object.ID] = born[object.ID] === undefined ? scene.Seconds : born[object.ID];

				var settings = pulsed(told, scene.Seconds - born[object.ID]);
				var type = typeOf(settings);

				var carrier = object.Values.Follow ? scene.Objects[object.Values.Follow] : null;
				var coming = given(settings.Appear, 0.45);
				/* A circle written ring by ring as it comes (Draw, seconds), unwritten as it goes (Dispel). */
				var writing = given(settings.Draw, 0);
				var going = scene.Dispelled ? scene.Dispelled[object.ID] : null;
				var drawn = writing > 0 ? Math.min(1, (scene.Seconds - born[object.ID]) / writing) : 1;
				var fading = 1;

				if (going) {
					fading = Math.max(0, 1 - (scene.Seconds - going.Start) / going.Seconds);
					drawn = Math.min(drawn, fading);

					if (fading <= 0)
						gone.push(object.ID);
				}

				var seen = looks(settings);

				/* What burns on a thing that drives goes with its thrust. */
				if (carrier && carrier.Thrust !== undefined)
					seen.Length *= 0.25 + carrier.Thrust;

				return type && settings.On !== false && settings.On !== 'false' ? Object.assign(seen, {Type: type, At: placeOf(object, settings), Aim: aimOf(object, settings, type), Size: given(settings.Size, 1), Power: given(settings.Power, 1), Since: scene.Seconds + (object.Seed || 0) * 40, Light: settings.Light, Key: object.ID, Seed: settings.Seed || object.ID, Rings: settings.Rings, Spin: given(settings.Spin, 1), Grown: (coming > 0 ? Math.min(1, (scene.Seconds - born[object.ID]) / coming) : 1) * Math.min(1, fading * 1.5), Drawn: drawn, Layers: layersOf(type, settings.Tune)}) : null;
			}).filter(Boolean);

			gone.forEach(function (id) {
				delete scene.Dispelled[id];

				self.Remove(id);
			});

			/* What burns on what a vehicle is built of. */
			scene.Order.forEach(function (object) {
				engine.MountsOf(object).forEach(function (mount) {
					var key = object.ID + ':' + mount.Index;
					var engineOn = mount.Kind === 'engine';
					var told = mount.Mount;
					if (told.On === false || !told.Type && !engineOn) return;

					born[key] = born[key] === undefined ? scene.Seconds : born[key];

					var settings = pulsed(told, scene.Seconds - born[key]);
					var type = typeOf(settings, 'exhaust');
					var seen = looks(settings);

					if (!type) return;

					if (engineOn) {
						seen.Length *= 0.25 + (object.Thrust || 0);
						seen.Intensity *= Math.min(1, (object.Thrust || 0) * 6) * (0.9 + 1.5 * Math.min(1, object.Thrust || 0));
						seen.Inside = seen.Intensity * 0.75;
						seen.Intensity *= veilOf(mount.At);
					}

					list.push(Object.assign(seen, {Type: type, At: mount.At, Aim: told.Aim ? mount.Aim : type.Aim ? vectors.Subtract(math.Apply(object.Turn || math.Identity(), type.Aim), math.Apply(object.Turn || math.Identity(), [0, 0, 0])) : mount.Aim, Size: given(settings.Size, 0.3) * (object.Size || 1), Mouth: mouthOf(settings, object), MouthRound: !Array.isArray(settings.Mouth), Up: vectors.Subtract(math.Apply(object.Turn || math.Identity(), [0, 1, 0]), math.Apply(object.Turn || math.Identity(), [0, 0, 0])), Twist: given(settings.Twist, 0) * Math.PI / 180, Glare: given(settings.Glare, 1) * Math.min(1, 0.35 + (object.Thrust || 0)), Power: given(settings.Power, 1), Since: scene.Seconds - born[key], Light: settings.Light === undefined ? engineOn : settings.Light, Key: key, Seed: settings.Seed || key, Rings: settings.Rings, Spin: given(settings.Spin, 1), Grown: 1, Layers: layersOf(type, settings.Tune)}));
				});
			});

			var ended = bursts.filter(function (burst) {
				return scene.Seconds - burst.Start >= burst.Type.Lasts;
			});

			bursts = bursts.filter(function (burst) {
				return ended.indexOf(burst) === -1;
			});

			ended.forEach(function (burst) {
				if (burst.Type.Then)
					engine.EffectBurst(burst.Type.Then, flown(burst), burst.Options);
			});

			return list.concat(bursts.map(function (burst) {
				var told = pulsed(burst.Options, scene.Seconds - burst.Start);

				return Object.assign(looks(told), {Type: burst.Type, At: flown(burst), Aim: burst.Aim, Size: told.Size === undefined ? burst.Size : given(told.Size, 1), Power: told.Power === undefined ? burst.Power : given(told.Power, 1), Since: scene.Seconds - burst.Start, Once: true, Key: burst.Key, Seed: burst.Key, Rings: burst.Options.Rings, Spin: given(told.Spin, 1), Grown: 1, Layers: layersOf(burst.Type, burst.Options.Tune)});
			}));
		}

		engine.EffectBurst = function (type, at, options) {
			var settings = options || {};
			var made = type && typeof type === 'object' ? blueprinted(type, settings.Parameters) : typeOf({Type: type, Parameters: settings.Parameters});
			if (!made)
				return false;

			bursts.push({Type: Object.assign({Lasts: 4}, made), At: at, Aim: settings.Aim || [0, 1, 0], Size: given(settings.Size, 1), Power: given(settings.Power, 1), Start: scene.Seconds, Key: 'burst-' + scene.Seconds, Options: settings});

			return true;
		};

		engine.EffectsWarm = function () {
			var made = self.EffectShaders(head);

			program = program || renderer.Program(made.Vertex, made.Fragment);
			volume = volume || renderer.Program(made.BoxVertex, made.Volume);
			plateProgram = plateProgram || renderer.Program(made.PlateVertex, made.Plate);
			boltProgram = boltProgram || renderer.Program(made.BoltVertex, made.Bolt);
		};

		engine.EffectsCount = function () {
			return burning().length;
		};

		/*
		 * What glows: the object an effect of a type with Glow follows gets Glow {Color (its light, by its Color and Intensity, as it
		 * comes), Body, Held} for the frame: Where body (by default), held (what it holds) or both.
		 */
		engine.EffectGlow = function () {
			scene.Order.forEach(function (object) {
				object.Glow = null;
			});

			burning().forEach(function (one) {
				var owner = scene.Objects[one.Key];
				var carrier = owner && owner.Values.Follow ? scene.Objects[owner.Values.Follow] : null;
				var where = owner ? String(trait(owner).Where || 'body') : 'body';
				var light = vectors.Scale(one.Color || one.Type.Glow || [1, 1, 1], one.Intensity * one.Power * one.Grown);

				if (!one.Type.Glow || !carrier) return;

				carrier.Glow = {Color: light, Body: where !== 'held', Held: where !== 'body'};
			});
		};

		/* The lamps of what burns: the nearest of them cast shadows, as any lamp does. */
		engine.EffectLamps = function () {
			return burning().filter(function (one) {
				return one.Type.Lamp && one.Light !== false && one.Light !== 'false';
			}).map(function (one) {
				var lamp = one.Type.Lamp;
				var fade = one.Once ? Math.max(0, 1 - one.Since / 0.7) : 1;

				return {Object: {Seed: one.At[0] * 0.13 + one.At[2] * 0.07, Values: {}}, Effect: true, At: one.Mouth ? vectors.Add(one.At, vectors.Scale(vectors.Normalize(one.Aim), one.Mouth[0] * 1.5)) : [one.At[0], one.At[1] + one.Size * 0.5, one.At[2]], Far: vectors.Distance(one.At, scene.Eye), Settings: {Color: one.Color || lamp.Color, Power: lamp.Power * one.Power * one.Intensity * fade, Radius: lamp.Radius * one.Size, Flicker: lamp.Flicker, Aim: one.Mouth ? one.Aim : null, Spot: one.Mouth ? 170 : 0}};
			});
		};

		/* Where the air trembles on the screen: [x, y, radius, strength], up to four, the nearest first. */
		engine.EffectHeat = function (matrix, aspect) {
			var data = [];

			burning().filter(function (one) {
				return one.Type.Heat;
			}).sort(function (a, b) {
				return vectors.Distance(a.At, scene.Eye) - vectors.Distance(b.At, scene.Eye);
			}).slice(0, 4).forEach(function (one) {
				var size = one.Size * 1.6;
				var seen = math.Apply(matrix, vectors.Subtract(vectors.Add(one.At, [0, size * 1.3, 0]), scene.Eye));
				var far = vectors.Distance(one.At, scene.Eye);

				data.push(seen[0] * 0.5 + 0.5, seen[1] * 0.5 + 0.5, size / Math.max(0.5, far) * 0.7 / Math.max(1, aspect / 2), seen[2] < 1 ? one.Type.Heat * one.Power : 0);
			});

			while (data.length < 16)
				data.push(0, 0, 1, 0);

			return data;
		};

		/* A body of fire, drawn on the far faces of its box, so an eye inside it still sees it; the depth of the picture ends it. */
		/* What lies across an aim: a mouth goes with the hull it is cut in, leaning by its Twist; all else stands by the world. */
		function acrossOf (one, aim) {
			var up = one.Up || [0, 1, 0];
			var side = vectors.Normalize(vectors.Cross(aim, Math.abs(vectors.Dot(aim, vectors.Normalize(up))) > 0.9 ? one.Up ? vectors.Cross(up, aim) : [1, 0, 0] : up));
			var other = vectors.Cross(aim, side);
			var twist = one.Twist || 0;

			return twist ? [vectors.Add(vectors.Scale(side, Math.cos(twist)), vectors.Scale(other, Math.sin(twist))), vectors.Subtract(vectors.Scale(other, Math.cos(twist)), vectors.Scale(side, Math.sin(twist)))] : [side, other];
		}

		function drawVolume (one, layer, matrix, view, depth, tone, wind) {
			var aim = vectors.Normalize(one.Aim);
			var across = acrossOf(one, aim);
			var side = across[0];
			var other = across[1];
			var ball = layer.Kind === 'ball' || layer.Kind === 'shell';
			var age = one.Once && !layer.Hold ? one.Since / layer.Life : 0;
			var wide = one.Mouth ? one.Mouth[0] * one.Width : layer.Size[0] * one.Size * Math.sqrt(one.Volume) * one.Width;
			var high = one.Mouth ? one.Mouth[1] * one.Width : wide;
			var long = (one.Mouth ? Math.max(one.Mouth[0], one.Mouth[1]) * 8 : layer.Speed[0] * one.Size) * one.Length;
			var level = self.Graphics().Level;

			if (one.Once && age >= 1) return;

			if (layer.Kind === 'ball' && !layer.Hold)
				wide *= 0.28 + 0.72 * (1 - Math.exp(-age * 7));

			if (ball)
				long = wide * 2;

			box = box || renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1], Indices: [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5]});
			volume = volume || renderer.Program(self.EffectShaders(head).BoxVertex, self.EffectShaders(head).Volume);

			var from = vectors.Subtract(ball ? vectors.Subtract(one.At, vectors.Scale(aim, wide)) : one.At, scene.Eye);

			renderer.Draw(box, volume, {
				uViewProjection: matrix,
				uFrom: from,
				uSide: side,
				uOther: other,
				uAim: aim,
				uSpan: [wide, high, long],
				uForward: view.Forward,
				uShape: volumes[layer.Kind],
				uStraight: one.Mouth ? 1 : 0,
				uHollow: layer.Hollow || 0,
				uSoftEdge: layer.Soft || 0,
				uSteps: level === 'low' ? 10 : level === 'medium' ? 14 : level === 'high' ? 20 : 28,
				uAge: age,
				uClock: scene.Seconds % 1000 + (one.At[0] + one.At[2]) * 0.37,
				uColor: shade(one, layer),
				uHot: one.Hot || layer.Hot || [1, 0.93, 0.7],
				uIntensity: one.Intensity * one.Power * one.Grown * (one.Once && layer.Kind === 'beam' ? Math.sin(Math.min(1, age) * Math.PI) : 1),
				uBlow: [vectors.Dot(side, [wind[0], 0, wind[1]]) / Math.max(wide, 0.05) * 0.2, vectors.Dot(other, [wind[0], 0, wind[1]]) / Math.max(wide, 0.05) * 0.2],
				uNoise: engine.NoiseBlock(),
				uScene: depth || blank(),
				uSoft: depth ? 1 : 0,
				uScreen: [renderer.Width, renderer.Height, view.Near, view.Far],
				uSplit: view.Split ? 1 : 0
			}, depth ? {Depth: false, DepthWrite: false, Blend: one.Mouth ? 'add' : layer.Blend, Cull: 'front'} : {DepthWrite: false, Blend: one.Mouth ? 'add' : layer.Blend, Cull: 'back'});
		}

		/*
		 * What burns on a hull beside a star: the eye shut to the star sees less of it the nearer it stands, so that nothing lights up at the
		 * edge of the disc. 0 over the disc, 1 from Veil radii of the disc on, and 1 again while something hides the star from the eye.
		 */
		function veilOf (at) {
			var star = engine.NearestStar();
			if (!star || star.Veil <= 1) return 1;

			var way = vectors.Subtract(star.At, scene.Eye);
			var to = vectors.Subtract(at, scene.Eye);
			var apart = Math.atan2(vectors.Length(vectors.Cross(way, to)), vectors.Dot(way, to));
			var near = Math.min(1, Math.max(0, (apart / Math.atan2(star.Size, vectors.Length(way)) - 1) / (star.Veil - 1)));

			return 1 - (1 - near * near * (3 - 2 * near)) * engine.SunEye();
		}

		/* A plate across the aim of an effect: a magic circle, that lies over the ups and downs of the ground, or the mouth of a portal. */
		function drawPlate (one, layer, matrix, view, depth) {
			var aim = vectors.Normalize(one.Aim);
			var across = acrossOf(one, aim);
			var side = across[0];
			var other = across[1];
			var mouth = layer.Kind === 'nozzle' && one.Mouth;
			var wide = mouth ? one.Mouth[0] : layer.Size[0] * one.Size * Math.sqrt(one.Volume) * one.Width * (0.4 + 0.6 * one.Grown);
			var high = mouth ? one.Mouth[1] : wide;
			var fade = (one.Once ? Math.min(1, one.Since * 6) * Math.max(0, 1 - one.Since / (layer.Life || 1)) : 1) * one.Grown;
			var key = layer.Rings ? layer : one.Rings || one.Seed;
			var circle = layer.Kind === 'sigil' ? one.Rings ? sigils.Make(one.Seed, {Layout: one.Rings}) : layer.Rings ? circleOf(layer) : circleOf(key) : null;

			plate = plate || renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
			plateProgram = plateProgram || renderer.Program(self.EffectShaders(head).PlateVertex, self.EffectShaders(head).Plate);

			renderer.Draw(plate, plateProgram, Object.assign({
				uViewProjection: matrix,
				uFrom: vectors.Subtract(vectors.Add(one.At, vectors.Scale(aim, 0.03 * one.Size)), scene.Eye),
				uSide: vectors.Scale(side, wide),
				uOther: vectors.Scale(other, high),
				uShape: plates[layer.Kind],
				uSquare: layer.Square || mouth && !one.MouthRound ? 1 : 0,
				uColor: shade(one, layer),
				uHot: one.Hot || layer.Hot || [1, 0.93, 0.7],
				uAge: one.Once ? one.Since / (layer.Life || 1) : 0,
				/* The metal round a mouth keeps a star out of it: only what comes out goes in the light of the star. */
				uIntensity: (mouth ? Math.max(one.Intensity, one.Inside || 0) : one.Intensity) * one.Power * fade,
				uClock: scene.Seconds % 1000,
				uNoise: engine.NoiseBlock(),
				uScene: depth || blank(),
				uSoft: depth && layer.Kind !== 'swirl' && !mouth ? wide * 0.35 : 0,
				uScreen: [renderer.Width, renderer.Height, view.Near, view.Far],
				uSplit: view.Split ? 1 : 0,
				uDrawn: one.Drawn === undefined ? 1 : one.Drawn
			}, circle ? sigils.Uniforms(circle, scene.Seconds, one.Spin) : {uRingCount: 0}), {Depth: !(depth && layer.Kind !== 'swirl') || !!mouth, DepthWrite: false, Blend: layer.Blend, Cull: 'none'});
		}

		/*
		 * What a burning mouth does to the eye: a soft glow round it and a thin streak, facing the view. Most straight into it, gently less
		 * from the side, and much less than a sun. Glare of a mount says how much.
		 */
		function drawFlare (one, layer, matrix, view, depth) {
			var aim = vectors.Normalize(one.Aim);
			var away = vectors.Normalize(vectors.Subtract(scene.Eye, one.At));
			var facing = Math.max(0, vectors.Dot(aim, away));
			var strength = one.Glare * one.Intensity * one.Power * (0.12 + 0.88 * facing * facing);
			var wide = Math.max(one.Mouth[0], one.Mouth[1]) * 7;

			if (strength < 0.01) return;

			/* Where the mouth is on the screen, to look there at what stands before it: metal round it hides it, and its glare goes. */
			var place = vectors.Subtract(one.At, scene.Eye);
			var clip = [matrix[0] * place[0] + matrix[4] * place[1] + matrix[8] * place[2] + matrix[12], matrix[1] * place[0] + matrix[5] * place[1] + matrix[9] * place[2] + matrix[13], matrix[3] * place[0] + matrix[7] * place[1] + matrix[11] * place[2] + matrix[15]];
			var near = Math.max(clip[2], 1e-6);
			var spare = Math.max(Math.max(one.Mouth[0], one.Mouth[1]), near * 0.012);
			var side = Math.max(one.Mouth[0], one.Mouth[1]) * 0.8 / near * Math.abs(matrix[0]) * 0.5;

			renderer.Draw(plate, plateProgram, {
				uViewProjection: matrix,
				uTap: depth ? [clip[0] / near * 0.5 + 0.5, clip[1] / near * 0.5 + 0.5, side, side * renderer.Width / Math.max(1, renderer.Height)] : [0, 0, 0, 0],
				uTapFar: [near - spare * 2, near - spare],
				uFrom: vectors.Subtract(vectors.Add(one.At, vectors.Scale(aim, one.Mouth[0])), scene.Eye),
				uSide: vectors.Scale(view.Right, wide),
				uOther: vectors.Scale(view.Up, wide),
				uShape: plates.flare,
				uSquare: 0,
				uColor: shade(one, layer),
				uHot: one.Hot || layer.Hot || [1, 0.93, 0.7],
				uAge: 0,
				uIntensity: strength,
				uClock: scene.Seconds % 1000,
				uNoise: engine.NoiseBlock(),
				uScene: depth || blank(),
				uSoft: 0,
				uScreen: [renderer.Width, renderer.Height, view.Near, view.Far],
				uSplit: view.Split ? 1 : 0,
				uRingCount: 0
			}, {Depth: false, DepthWrite: false, Blend: 'add', Cull: 'none'});
		}

		/* A circle is made once for what asks for it. */
		function circleOf (asked) {
			var key = typeof asked === 'string' ? asked : asked.Key = asked.Key || 'layer-' + Object.keys(circles).length;

			circles[key] = circles[key] || sigils.Make(key, typeof asked === 'string' ? {} : {Layout: asked.Rings});

			return circles[key];
		}

		/* A lightning: a ribbon along the aim that goes a new way at every flicker. */
		function drawBolt (one, layer, matrix, view) {
			var aim = vectors.Normalize(one.Aim);
			var side = vectors.Normalize(vectors.Cross(aim, Math.abs(aim[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]));
			var long = layer.Speed[0] * one.Size * one.Length;
			var rows = [];
			var i;

			if (!ribbon) {
				for (i = 0; i <= 40; i++)
					rows.push(-1, i / 40, 0, 1, i / 40, 0);

				var joins = [];

				for (i = 0; i < 40; i++)
					joins.push(i * 2, i * 2 + 1, i * 2 + 3, i * 2, i * 2 + 3, i * 2 + 2);

				ribbon = renderer.Mesh({Positions: rows, Indices: joins});
			}

			boltProgram = boltProgram || renderer.Program(self.EffectShaders(head).BoltVertex, self.EffectShaders(head).Bolt);

			renderer.Draw(ribbon, boltProgram, {
				uViewProjection: matrix,
				uFrom: vectors.Subtract(one.At, scene.Eye),
				uAim: vectors.Scale(aim, long),
				uSide: side,
				uOther: vectors.Cross(aim, side),
				uForward: view.Forward,
				uWide: layer.Size[0] * one.Size * one.Width,
				uReach: layer.Reach * long,
				uSeed: layer.Seed + (one.At[0] + one.At[2]) * 0.1,
				uClock: scene.Seconds % 1000,
				uColor: one.Color || layer.Color,
				uHot: one.Hot || layer.Hot || [1, 1, 1],
				uIntensity: one.Intensity * one.Power
			}, {DepthWrite: false, Blend: 'add', Cull: 'none'});
		}

		/* Over all that stands in the scene: alpha first, what adds light on top of it. */
		/* view {Right, Up, Forward, Near, Far, Only}: Only the ID of the one object whose effects are drawn (a ship over a surface). */
		engine.EffectsDraw = function (matrix, view) {
			var list = burning().filter(function (one) {
				return !view.Only || String(one.Key).indexOf(view.Only + ':') === 0;
			});
			var depth;

			if (!list.length) return;

			program = program || renderer.Program(self.EffectShaders(head).Vertex, self.EffectShaders(head).Fragment);
			depth = engine.PostDepth ? engine.PostDepth() : null;

			var ground = scene.Ground;
			var now = engine.WeatherNow ? engine.WeatherNow() : {};
			var tone = ground ? [ground.SkyLight[0] * 1.2 + ground.SunColor[0] * 0.6, ground.SkyLight[1] * 1.2 + ground.SunColor[1] * 0.6, ground.SkyLight[2] * 1.2 + ground.SunColor[2] * 0.6] : [0.5, 0.5, 0.5];
			var wind = now.Way ? [now.Way[0] * now.Blow * 0.8, now.Way[1] * now.Blow * 0.8] : [0, 0];

			/* The alpha of the picture says how glossy a surface is: what floats in the air leaves it alone. */
			renderer.GL.colorMask(true, true, true, false);

			['alpha', 'add'].forEach(function (blend) {
				list.forEach(function (one) {
					one.Layers.forEach(function (layer) {
						/* What comes out of a mouth is light: over what shines it adds nothing to see, as it should. */
						if ((one.Mouth && layer.Kind === 'stream' ? 'add' : layer.Blend) !== blend) return;

						if (volumes[layer.Kind] !== undefined) {
							drawVolume(one, layer, matrix, view, depth, tone, wind);

							return;
						}

						if (plates[layer.Kind] !== undefined) {
							drawPlate(one, layer, matrix, view, depth);

							if (layer.Kind === 'nozzle' && one.Mouth)
								drawFlare(one, layer, matrix, view, depth);

							return;
						}

						if (layer.Kind === 'bolt') {
							drawBolt(one, layer, matrix, view);

							return;
						}

						var size = one.Size;
						var much = layer.Kind === 'smoke' ? 1 : one.Volume;
						var body = layer.Kind === 'smoke' ? tint(layer.Color) : shade(one, layer);
						var count = Math.max(1, Math.round(layer.Count * Math.min(3, much)));

						renderer.Draw(quads(count), program, {
							uViewProjection: matrix,
							uRight: view.Right,
							uUp: view.Up,
							uForward: view.Forward,
							uFrom: vectors.Subtract(one.At, scene.Eye),
							uAim: one.Aim,
							uTick: [one.Since, one.Once && !layer.Hold ? 1 : 0, layer.Start || 0, layer.Base || 0.2],
							uMove: [layer.Life, layer.Speed[0] * size * one.Length, layer.Speed[1] * size * one.Length, layer.Spread * Math.sqrt(much)],
							uFall: [(layer.Gravity || 0) * size, layer.Drag || 0, layer.Bounce || 0, (layer.Rise || 0) * size],
							uGrow: [layer.Size[0] * size * Math.sqrt(much) * one.Width, layer.Size[1] * size * Math.sqrt(much) * one.Width, layer.Stretch || 0, (layer.Wander || 0) * size],
							uBlow: [wind[0] * (layer.Wind === undefined ? 1 : layer.Wind), wind[1] * (layer.Wind === undefined ? 1 : layer.Wind)],
							uKind: kinds[layer.Kind],
							uColor: body,
							uHot: one.Hot || layer.Hot || [1, 0.93, 0.7],
							uClock: scene.Seconds % 1000,
							uIntensity: layer.Kind === 'smoke' ? 1 : one.Intensity,
							uLight: tone,
							uSun: ground ? ground.Sun : [0.3, 0.9, 0.3],
							uRight2: view.Right,
							uUp2: view.Up,
							uWarm: one.Type.Lamp ? (one.Color || one.Type.Lamp.Color && tint(one.Type.Lamp.Color)) : [0, 0, 0],
							uOpacity: (layer.Opacity === undefined ? 1 : layer.Opacity) * one.Power * (layer.Kind === 'smoke' ? one.Smoke : 1),
							uNoise: engine.NoiseBlock(),
							uScene: depth || blank(),
							uSoft: depth ? 1 : 0,
							uScreen: [renderer.Width, renderer.Height, view.Near, view.Far],
							uSplit: view.Split ? 1 : 0,
							uSoftness: 0.12 * size
						}, {DepthWrite: false, Blend: blend, Cull: 'none'});
					});
				});
			});

			renderer.GL.colorMask(true, true, true, true);
		};
	},

	/* Adds types of effects, or a type of the same name in the place of one: its data, or an effect graph of Blueprints. */
	Effects: function (types) {
		var engine = this.Engine();
		var made = {};

		Object.keys(types).forEach(function (name) {
			var type = types[name];

			made[name] = type && (type.blocks || typeof type === 'string') ? engine.EffectBlueprint(type) : type;
		});

		Object.assign(this.Scene().EffectTypes, made);
	},

	/* The effect graph of a type of effect: its layers one after the other, its lamp and the rest on its Effect; to change in a Blueprint. */
	EffectGraph: function (name) {
		var blueprints = this.$Service('Blueprints');
		var type = this.Scene().EffectTypes[name];
		var graph;
		var under = null;
		var end;
		var lamp;

		if (!type)
			throw new Error('Elemenx Scene: no type of effect ' + name);

		if (type.Blueprint && typeof type.Blueprint === 'object') return JSON.parse(JSON.stringify(type.Blueprint));

		graph = blueprints.Create('effect', {name: name});

		type.Layers.forEach(function (layer, index) {
			var block = blueprints.Add(graph, 'Layer', {id: 'layer' + (index + 1), x: 40 + index * 260, y: 40 + index % 2 * 60, properties: JSON.parse(JSON.stringify(layer))});

			if (under)
				blueprints.Link(graph, [under.id, 'Layers'], [block.id, 'Under']);

			under = block;
		});

		lamp = type.Lamp || {};
		end = blueprints.Add(graph, 'Effect', {id: 'effect', x: 40 + type.Layers.length * 260, y: 40, properties: JSON.parse(JSON.stringify({Once: !!type.Once, Then: type.Then || '', Heat: type.Heat, Stand: type.Stand, Lasts: type.Lasts, Fly: type.Fly, Aim: type.Aim, Glow: type.Glow, LampColor: lamp.Color, LampPower: lamp.Power, LampRadius: lamp.Radius, LampFlicker: lamp.Flicker}))});

		if (under)
			blueprints.Link(graph, [under.id, 'Layers'], [end.id, 'Layers']);

		return graph;
	},

	/*
	 * An effect laid on whatever surface a ray meets (a wall, a ceiling, a slope; a magic circle most of all), across it:
	 * CastOn(type, {From, Way} or [x, y, z], options) with options Normal (when a point is given), Size, Draw (seconds to
	 * write it, ring by ring: 1.6), Color, Hot, Seed, ID. The ID of the new effect, or '' when the ray meets nothing.
	 */
	CastOn: function (type, at, options) {
		var settings = options || {};
		var vectors = this.$Service('Math').Vectors;
		var found = null;
		var point;
		var normal;
		var spec;

		if (Array.isArray(at)) {
			point = at;
			normal = settings.Normal || [0, 1, 0];
		}
		else if (at && at.From && at.Way && this.Trace) {
			found = this.Trace(at.From, at.Way, at.Range || 300);

			if (!found) return '';

			point = found.Point;
			normal = found.Normal;
		}

		if (!point) return '';

		normal = vectors.Normalize(normal);
		spec = {ID: settings.ID || 'cast-' + Math.random().toString(36).slice(2, 8), Type: type || 'circle', At: vectors.Add(point, vectors.Scale(normal, 0.015)), Aim: normal, Size: settings.Size || 1, Draw: settings.Draw === undefined ? 1.6 : settings.Draw, Light: settings.Light !== false};

		['Color', 'Hot', 'Seed', 'Rings', 'Spin', 'Power', 'Intensity'].forEach(function (name) {
			if (settings[name] !== undefined)
				spec[name] = settings[name];
		});

		return this.Add('effect', spec);
	},

	/* An effect goes: a circle unwritten ring by ring, all of it fading, then removed (seconds, 1.2). False when there is none. */
	Dispel: function (id, seconds) {
		var scene = this.Scene();
		if (!scene.Objects[id]) return false;

		scene.Dispelled = scene.Dispelled || {};
		scene.Dispelled[id] = {Start: scene.Seconds, Seconds: Math.max(0.05, Number(seconds) || 1.2)};

		return true;
	},

	/* An effect that happens once at a place [x, y, z] of the world: Burst('explosion', [0, 1, 0], {Size, Power, Aim}). */
	Burst: function (type, place, options) {
		return this.Engine().EffectBurst(type, place, options);
	},

	EffectShaders: function (head) {
		return {
			Vertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uRight;',
				'uniform vec3 uUp;',
				'uniform vec3 uForward;',
				'uniform vec3 uFrom;',
				'uniform vec3 uAim;',
				'uniform vec4 uTick;',
				'uniform vec4 uMove;',
				'uniform vec4 uFall;',
				'uniform vec4 uGrow;',
				'uniform vec2 uBlow;',
				'uniform int uKind;',
				'out vec2 vAt;',
				'out float vAge;',
				'out float vSeed;',
				'out float vFar;',
				'void main() {',
				'	vec3 seed = aNormal;',
				'	float life = uMove.x * (0.65 + 0.7 * seed.y);',
				/* A fire goes on, each particle at its moment of the same round; a burst happens once and is over. */
				'	float age = uTick.y > 0.5 ? uTick.x / life : fract(uTick.x / uMove.x + seed.x);',
				'	vAge = age;',
				'	vSeed = seed.z;',
				'	if (age >= 1.0 || age < 0.0) {',
				'		gl_Position = vec4(2.0, 2.0, 2.0, 1.0);',
				'		vAt = vec2(0.0);',
				'		vFar = 0.0;',
				'		return;',
				'	}',
				'	float t = age * life;',
				'	vec3 aim = normalize(uAim);',
				'	vec3 side = normalize(cross(aim, abs(aim.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0)));',
				'	vec3 other = cross(aim, side);',
				'	float round = seed.y * 6.2831853;',
				'	float wide = sqrt(seed.z) * uMove.w;',
				'	vec3 way = normalize(aim + (side * cos(round) + other * sin(round)) * wide);',
				'	float speed = mix(uMove.y, uMove.z, fract(seed.x * 37.3));',
				'	float drag = max(uFall.y, 0.001);',
				'	vec3 p = way * speed * (1.0 - exp(-drag * t)) / drag;',
				'	float pull = uFall.w - uFall.x;',
				'	p.y += pull * t * t * 0.5;',
				'	p.xz += uBlow * t * t * 0.5;',
				'	p += vec3(sin(t * 3.1 + seed.y * 40.0), sin(t * 2.3 + seed.x * 21.0) * 0.4, cos(t * 2.7 + seed.z * 30.0)) * uGrow.w * age;',
				/* What falls leaps off the ground it was born on, lower each time. */
				'	if (uFall.z > 0.0 && p.y < 0.0) p.y = abs(sin(p.y * 1.4)) * uFall.z * max(0.0, 1.0 - age) * length(way.xz + 0.2) * speed * 0.16;',
				'	vec3 moving = way * speed * exp(-drag * t) + vec3(0.0, pull * t, 0.0);',
				'	float base = uTick.w;',
				'	p += (side * cos(round) + other * sin(round)) * sqrt(fract(seed.x * 13.7)) * base * uGrow.x * (1.0 - age);',
				'	float size = mix(uGrow.x, uGrow.y, uKind == 1 ? sqrt(age) : age);',
				'	vec3 right = uRight;',
				'	vec3 up = uUp;',
				'	float tall = 1.0;',
				/* Fast things are drawn along their way. */
				'	if (uGrow.z > 0.0) {',
				'		vec3 seen = moving - uForward * dot(moving, uForward);',
				'		float fast = length(seen);',
				'		if (fast > 0.001) {',
				'			up = seen / fast;',
				'			right = normalize(cross(up, uForward));',
				'			tall = 1.0 + min(fast * uGrow.z / max(size, 0.002) * 0.4, 7.0);',
				'		}',
				'	}',
				'	else {',
				'		float c = cos(seed.y * 20.0 + t * (uKind == 1 ? 0.5 : 0.0));',
				'		float s = sin(seed.y * 20.0 + t * (uKind == 1 ? 0.5 : 0.0));',
				'		right = uRight * c + uUp * s;',
				'		up = uUp * c - uRight * s;',
				'	}',
				'	vec3 world = uFrom + p + right * aPosition.x * size + up * aPosition.y * size * tall;',
				'	vAt = aPosition.xy;',
				'	gl_Position = uViewProjection * vec4(world, 1.0);',
				'	vFar = gl_Position.w;',
				'}'
			].join('\n'),

			Fragment: head + [
				'in vec2 vAt;',
				'in float vAge;',
				'in float vSeed;',
				'in float vFar;',
				'uniform sampler3D uNoise;',
				'uniform sampler2D uScene;',
				'uniform float uSplit;',
				'uniform int uKind;',
				'uniform vec3 uColor;',
				'uniform vec3 uHot;',
				'uniform float uClock;',
				'uniform float uIntensity;',
				'uniform vec3 uLight;',
				'uniform vec3 uSun;',
				'uniform vec3 uRight2;',
				'uniform vec3 uUp2;',
				'uniform vec3 uWarm;',
				'uniform vec4 uScreen;',
				'uniform vec4 uTick;',
				'uniform float uOpacity;',
				'uniform float uSoft;',
				'uniform float uSoftness;',
				'out vec4 outColor;',
				'void main() {',
				'	float r = length(vAt);',
				'	if (r >= 1.0 && uKind != 3) discard;',
				'	float noise = texture(uNoise, vec3(vAt * 0.3 + vSeed * 3.0, vAge * 0.7 + vSeed)).b - 0.5;',
				'	float fine = texture(uNoise, vec3(vAt * 0.9 + vSeed, vAge * 1.3)).g - 0.5;',
				/* It fades where it meets what stands behind it, not in a hard line. */
				'	float soft = 1.0;',
				'	if (uSoft > 0.5) {',
				'		float z = (uSplit > 0.5 ? min(1.0, texture(uScene, gl_FragCoord.xy / uScreen.xy).r * 2.0) : texture(uScene, gl_FragCoord.xy / uScreen.xy).r) * 2.0 - 1.0;',
				'		float far = 2.0 * uScreen.z * uScreen.w / (uScreen.w + uScreen.z - z * (uScreen.w - uScreen.z));',
				'		soft = clamp((far - vFar) / uSoftness, 0.0, 1.0);',
				'	}',
				'	float inward = 1.0 - vAge;',
				'	vec3 ball = normalize(uRight2 * vAt.x + uUp2 * vAt.y + cross(uRight2, uUp2) * sqrt(max(1.0 - r * r, 0.0)));',
				'	if (uKind == 0) {',
				/* Flame: hottest at its heart and at its birth; red, then its own color, gold only at the very heart: it stays fire and does not go white. */
				'		float shape = smoothstep(1.0, 0.1, r + noise * 1.1 + fine * 0.4);',
				'		float heat = shape * pow(inward, 1.3) * smoothstep(0.0, 0.06, vAge);',
				'		vec3 ramp = mix(vec3(0.62, 0.035, 0.0), uColor * uColor * 1.15, smoothstep(0.06, 0.42, heat));',
				'		ramp = mix(ramp, uHot, smoothstep(0.62, 1.0, heat) * 0.7);',
				'		outColor = vec4(ramp * (0.8 + heat * 0.5) * (0.6 + 0.4 * uIntensity), min(1.0, heat * 0.2 * uIntensity) * soft);',
				'		return;',
				'	}',
				'	if (uKind == 1) {',
				/* Smoke: lit by the sky, dark inside; born late, so it rises from the flame and not out of the ground. */
				'		float shape = smoothstep(1.0, 0.15, r + noise * 1.3 + fine * 0.5);',
				'		float born = smoothstep(uTick.z * 0.5, uTick.z + 0.12, vAge);',
				'		float sunny = 0.55 + 0.6 * max(dot(normalize(ball + vec3(noise, fine, -noise)), uSun), 0.0);',
				'		float under = (1.0 - smoothstep(0.0, 0.3, vAge)) * max(-ball.y * 0.6 + 0.4, 0.0);',
				'		outColor = vec4(uColor * (uLight + 0.03) * (0.8 + noise) * sunny + uWarm * under * 0.5, shape * born * pow(inward, 1.4) * uOpacity * soft);',
				'		return;',
				'	}',
				'	if (uKind == 2) {',
				'		float dot2 = pow(1.0 - r, 1.5);',
				'		vec3 ramp = mix(vec3(1.0, 0.92, 0.7), uColor, smoothstep(0.0, 0.4, vAge));',
				'		ramp = mix(ramp, vec3(0.7, 0.1, 0.02), smoothstep(0.5, 1.0, vAge));',
				'		outColor = vec4(ramp * 2.6, dot2 * inward * soft);',
				'		return;',
				'	}',
				/* A bubble: clear inside, a bright rim, a glint where the light comes from; it wobbles, grows and bursts at its end. */
				'	if (uKind == 4) {',
				'		float wobble = r * (1.0 + 0.06 * sin(atan(vAt.y, vAt.x) * 3.0 + uClock * 3.0 + vSeed * 20.0));',
				'		float rim = smoothstep(0.62, 0.92, wobble) * smoothstep(1.0, 0.92, wobble);',
				'		float glint = smoothstep(0.22, 0.0, length(vAt - vec2(-0.35, 0.38)));',
				'		float burst = smoothstep(1.0, 0.9, vAge) * smoothstep(0.0, 0.15, vAge);',
				'		outColor = vec4(mix(uColor, uHot, glint) * (0.6 + 0.4 * uIntensity), min(1.0, rim * 0.9 + glint * 0.8 + 0.06) * burst * soft);',
				'		return;',
				'	}',
				/* A mote of light: a point in its own soft glow, that wakes, twinkles and goes out. */
				'	float twinkle = 0.6 + 0.4 * sin(uClock * 7.0 + vSeed * 60.0);',
				'	float mote = pow(1.0 - r, 3.0) + smoothstep(0.3, 0.0, r) * 1.2;',
				'	outColor = vec4(mix(uColor, uHot, smoothstep(0.1, 0.0, r)), min(1.0, mote * twinkle * smoothstep(0.0, 0.12, vAge) * inward * (0.6 + 0.4 * uIntensity)) * soft);',
				'}'
			].join('\n'),

			PlateVertex: head + [
				'in vec3 aPosition;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uFrom;',
				'uniform vec3 uSide;',
				'uniform vec3 uOther;',
				'out vec2 vAt;',
				'out float vFar;',
				'void main() {',
				'	vAt = aPosition.xy;',
				'	gl_Position = uViewProjection * vec4(uFrom + uSide * aPosition.x + uOther * aPosition.y, 1.0);',
				'	vFar = gl_Position.w;',
				'}'
			].join('\n'),

			/*
			 * A magic circle is drawn of distances, so it is sharp at any size and each ring turns by itself. Every ring has its kind of
			 * marks; a rune is a few strokes on a small grid, chosen by the seed of the ring and the number of the rune.
			 */
			Plate: head + [
				'in vec2 vAt;',
				'in float vFar;',
				'uniform sampler3D uNoise;',
				'uniform sampler2D uScene;',
				'uniform float uSplit;',
				'uniform float uSoft;',
				'uniform vec4 uScreen;',
				'uniform float uSquare;',
				'uniform vec4 uTap;',
				'uniform vec2 uTapFar;',
				'uniform int uShape;',
				'uniform vec3 uColor;',
				'uniform vec3 uHot;',
				'uniform float uIntensity;',
				'uniform float uClock;',
				'uniform float uAge;',
				'uniform int uRingCount;',
				'uniform vec4 uRings[12];',
				'uniform vec4 uRingsMore[12];',
				/* How much of the circle is written (1: all of it): ring by ring from the rim, each round from its top. */
				'uniform float uDrawn;',
				'out vec4 outColor;',
				'float hash1(float x) {',
				'	return fract(sin(x * 91.17) * 43758.5453);',
				'}',
				'float segment(vec2 p, vec2 a, vec2 b) {',
				'	vec2 ab = b - a;',
				'	return length(p - a - ab * clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0));',
				'}',
				'float rune(vec2 p, float seed) {',
				'	float d = 1e3;',
				'	for (int i = 0; i < 4; i++) {',
				'		float n = seed + float(i) * 7.3;',
				'		vec2 a = floor(vec2(hash1(n), hash1(n + 1.0)) * 3.0) - 1.0;',
				'		vec2 b = floor(vec2(hash1(n + 2.0), hash1(n + 3.0)) * 3.0) - 1.0;',
				'		if (a == b) b = -a + vec2(0.0, 1.0);',
				'		d = min(d, segment(p, a * vec2(0.55, 0.8), b * vec2(0.55, 0.8)));',
				'	}',
				'	return d;',
				'}',
				/* How far a place is from the marks of a ring. */
				'float mark(vec2 p, float r, vec4 ring, vec4 more) {',
				'	float R = ring.x;',
				'	float W = ring.y;',
				'	int kind = int(ring.z + 0.5);',
				'	float n = max(ring.w, 1.0);',
				'	float angle = atan(p.y, p.x) + more.x;',
				'	float sector = 6.2831853 / n;',
				'	float cell = angle / sector;',
				'	float index = floor(cell);',
				'	float along = (fract(cell) - 0.5) * sector * r;',
				'	if (kind == 0) return abs(r - R) - W;',
				'	if (kind == 1) return min(abs(r - R) - W, abs(r - R + W * 3.0) - W * 0.5);',
				'	if (kind == 2) {',
				'		float tall = mod(index, 5.0) < 0.5 ? W * 4.5 : W * 2.5;',
				'		return max(abs(r - R) - tall, abs(along) - W * 0.5);',
				'	}',
				'	if (kind == 3) return length(vec2(r - R, along)) - W * 1.4;',
				'	if (kind == 4) return max(abs(r - R) - W, abs(along) - sector * r * 0.32);',
				'	if (kind == 5) {',
				'		vec2 q = vec2(along, r - R) / (W * 0.62);',
				'		if (abs(q.x) > 1.2 || abs(q.y) > 1.4) return 1.0;',
				'		return rune(q, index + more.y) * W * 0.62 - W * 0.09;',
				'	}',
				'	float folded = mod(angle, sector) - sector * 0.5;',
				'	vec2 f = r * vec2(cos(folded), sin(folded));',
				'	float reach = cos(3.1415927 * more.w / n) * R;',
				'	return max(abs(f.x - reach) - W, r - R);',
				'}',
				'void main() {',
				'	float r = length(vAt);',
				'	if (r >= 1.0) discard;',
				/* What stands well before it hides it; ground that only rises through it does not. */
				'	if (uSoft > 0.0) {',
				'		float z = (uSplit > 0.5 ? min(1.0, texture(uScene, gl_FragCoord.xy / uScreen.xy).r * 2.0) : texture(uScene, gl_FragCoord.xy / uScreen.xy).r) * 2.0 - 1.0;',
				'		float far = 2.0 * uScreen.z * uScreen.w / (uScreen.w + uScreen.z - z * (uScreen.w - uScreen.z));',
				'		if (far < vFar - uSoft) discard;',
				'	}',
				/* Light fallen on what stands under it, breathing a little. */
				'	if (uShape == 2) {',
				'		float pool = pow(1.0 - r, 2.2) * (0.3 + 0.05 * sin(uClock * 2.3));',
				'		outColor = vec4(uColor, pool * min(uIntensity, 1.5));',
				'		return;',
				'	}',
				/* A ring that runs out: bright at its front, gone behind it. */
				/* The whole mouth of what burns, white at its heart: round, or square as a nozzle of a hull is. */
				'	if (uShape == 4) {',
				'		float mouth = uSquare > 0.5 ? max(abs(vAt.x), abs(vAt.y)) : r;',
				'		float fill = smoothstep(1.0, 0.82, mouth);',
				'		outColor = vec4(mix(uColor, uHot, smoothstep(0.85, 0.15, mouth)) * (0.6 + uIntensity * 0.75), fill * clamp(uIntensity * 2.0, 0.0, 1.0));',
				'		return;',
				'	}',
				'	if (uShape == 5) {',
				'		float halo = exp(-r * r * 9.0) * 0.5 + exp(-r * 3.4) * smoothstep(1.0, 0.2, r) * 0.2;',
				'		float streak = exp(-abs(vAt.y) * 46.0) * pow(max(1.0 - abs(vAt.x), 0.0), 3.0) * 0.32;',
				'		float open = 1.0;',
				'		if (uTap.z > 0.0) {',
				'			open = 0.0;',
				'			for (int i = 0; i < 9; i++) {',
				'				float a = float(i) * 0.698;',
				'				vec2 at = uTap.xy + (i == 8 ? vec2(0.0) : vec2(cos(a), sin(a))) * uTap.zw;',
				'				float z = (uSplit > 0.5 ? min(1.0, texture(uScene, at).r * 2.0) : texture(uScene, at).r) * 2.0 - 1.0;',
				/* Far off a depth is not exact: what stands just before the mouth hides it by degrees, or a mouth would go out by itself. */
				'				open += smoothstep(uTapFar.x, uTapFar.y, 2.0 * uScreen.z * uScreen.w / (uScreen.w + uScreen.z - z * (uScreen.w - uScreen.z)));',
				'			}',
				'			open /= 9.0;',
				'		}',
				'		outColor = vec4(mix(uColor, uHot, exp(-r * r * 40.0)), min(1.0, (halo + streak) * uIntensity * open));',
				'		return;',
				'	}',
				'	if (uShape == 3) {',
				'		float front = 1.0 - pow(1.0 - clamp(uAge, 0.0, 1.0), 3.0);',
				'		float off = r - front * 0.96;',
				'		float ring = exp(-off * off * (off > 0.0 ? 4000.0 : 90.0));',
				'		outColor = vec4(mix(uColor, uHot, ring * ring), ring * (1.0 - uAge) * min(uIntensity * 3.0, 1.0));',
				'		return;',
				'	}',
				'	if (uShape == 1) {',
				/* The mouth of a portal: currents wind down into a dark middle, a bright lip round them. */
				'		float a = atan(vAt.y, vAt.x);',
				'		float wind = a * 2.0 + 3.4 * log(r + 0.04) + uClock * 1.7;',
				'		vec3 q = vec3(cos(wind), sin(wind), r * 1.6 - uClock * 0.3) * 0.4;',
				'		float flow = texture(uNoise, q).r * 0.6 + texture(uNoise, q * 2.3).g * 0.4;',
				'		float lip = smoothstep(0.62, 0.96, r);',
				'		vec3 deep = mix(vec3(0.015, 0.0, 0.04), uColor * 0.55, smoothstep(0.1, 0.8, r) * flow * 1.6);',
				'		vec3 color = mix(deep, uHot, lip * lip * flow * 1.2);',
				'		outColor = vec4(color * (0.7 + 0.5 * uIntensity), smoothstep(1.0, 0.92, r) * min(uIntensity * 2.0, 1.0));',
				'		return;',
				'	}',
				'	float ink = 0.0;',
				'	float glow = exp(-r * 2.4) * 0.05;',
				'	float px = fwidth(r);',
				'	float written = uDrawn * float(uRingCount);',
				'	float round = fract(atan(vAt.x, vAt.y) / 6.2831853 + 1.0);',
				'	float pen = 0.0;',
				'	for (int i = 0; i < 12 && i < uRingCount; i++) {',
				'		float part = clamp(written - float(i), 0.0, 1.0);',
				'		if (part <= 0.0) continue;',
				'		float d = mark(vAt, r, uRings[i], uRingsMore[i]);',
				'		float line = (1.0 - smoothstep(-px, px, d)) * (part >= 1.0 ? 1.0 : step(round, part));',
				'		ink = max(ink, line * uRingsMore[i].z);',
				'		glow += exp(-max(d, 0.0) * 42.0) * 0.26 * uRingsMore[i].z * (part >= 1.0 ? 1.0 : step(round, part));',
				/* The tip of the pen that writes it: a spark where the ring has come to. */
				'		if (part < 1.0) pen = max(pen, exp(-max(d, 0.0) * 30.0) * exp(-abs(round - part) * 90.0));',
				'	}',
				'	ink = max(ink, pen);',
				'	glow += pen * 1.5;',
				'	vec3 color = uColor * glow * 1.3 + uHot * ink;',
				'	float seen = clamp(ink + glow * 1.4, 0.0, 1.0) * min(uIntensity, 1.0);',
				'	if (seen < 0.003) discard;',
				'	outColor = vec4(color * (0.7 + 0.5 * uIntensity) / max(clamp(ink + glow * 1.4, 0.0, 1.0), 0.05), seen);',
				'}'
			].join('\n'),

			BoltVertex: head + [
				'in vec3 aPosition;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uFrom;',
				'uniform vec3 uAim;',
				'uniform vec3 uSide;',
				'uniform vec3 uOther;',
				'uniform vec3 uForward;',
				'uniform float uWide;',
				'uniform float uReach;',
				'uniform float uSeed;',
				'uniform float uClock;',
				'out vec2 vAt;',
				'out float vShow;',
				/* Three scales of jags, each of its own at every flicker. */
				'float wander(float t, float seed) {',
				'	return sin(t * 7.0 + seed) * 0.5 + sin(t * 17.0 + seed * 2.3) * 0.3 + sin(t * 43.0 + seed * 5.1) * 0.15 + sin(t * 89.0 + seed * 7.7) * 0.07;',
				'}',
				'vec3 place(float t, float seed) {',
				'	float edge = sin(min(t, 1.0) * 3.1415927 * 0.5 + 0.2);',
				'	return uFrom + uAim * t + (uSide * wander(t, seed) + uOther * wander(t, seed + 3.7)) * uReach * edge;',
				'}',
				'void main() {',
				'	float flick = floor(uClock * 13.0 + uSeed * 3.0);',
				'	float seed = fract(sin(flick * 12.9898 + uSeed) * 43758.5453) * 40.0;',
				'	vec3 at = place(aPosition.y, seed);',
				'	vec3 way = normalize(place(aPosition.y + 0.01, seed) - at);',
				'	vec3 across = normalize(cross(way, uForward));',
				'	vAt = vec2(aPosition.x, aPosition.y);',
				'	vShow = step(0.22, fract(seed * 1.37));',
				'	gl_Position = uViewProjection * vec4(at + across * aPosition.x * uWide * (1.0 - aPosition.y * 0.7), 1.0);',
				'}'
			].join('\n'),

			Bolt: head + [
				'in vec2 vAt;',
				'in float vShow;',
				'uniform vec3 uColor;',
				'uniform vec3 uHot;',
				'uniform float uIntensity;',
				'out vec4 outColor;',
				'void main() {',
				'	float off = abs(vAt.x);',
				'	float heart = smoothstep(0.22, 0.05, off);',
				'	float halo = exp(-off * off * 4.0) * 0.55;',
				'	outColor = vec4(mix(uColor, uHot, heart), (heart + halo) * vShow * (1.0 - vAt.y * 0.5) * min(uIntensity, 1.0));',
				'}'
			].join('\n'),

			BoxVertex: head + [
				'in vec3 aPosition;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uFrom;',
				'uniform vec3 uSide;',
				'uniform vec3 uOther;',
				'uniform vec3 uAim;',
				'uniform vec3 uSpan;',
				'out vec3 vWorld;',
				'void main() {',
				'	vWorld = uFrom + uSide * aPosition.x * uSpan.x + uOther * aPosition.y * uSpan.y + uAim * aPosition.z * uSpan.z;',
				'	gl_Position = uViewProjection * vec4(vWorld, 1.0);',
				'}'
			].join('\n'),

			/*
			 * A body in steps along the eye: inside the box x and y run from -1 to 1 across it and z from 0 to 1 along it. Each step
			 * gives light by how hot the place is and takes away from what lies behind it by how thick it is.
			 */
			Volume: head + [
				'in vec3 vWorld;',
				'uniform sampler3D uNoise;',
				'uniform sampler2D uScene;',
				'uniform float uSplit;',
				'uniform vec3 uFrom;',
				'uniform vec3 uSide;',
				'uniform vec3 uOther;',
				'uniform vec3 uAim;',
				'uniform vec3 uSpan;',
				'uniform vec3 uForward;',
				'uniform int uShape;',
				'uniform float uStraight;',
				'uniform float uHollow;',
				'uniform float uSoftEdge;',
				'uniform int uSteps;',
				'uniform float uAge;',
				'uniform float uClock;',
				'uniform vec3 uColor;',
				'uniform vec3 uHot;',
				'uniform float uIntensity;',
				'uniform vec2 uBlow;',
				'uniform vec4 uScreen;',
				'uniform float uSoft;',
				'out vec4 outColor;',
				/* Tongues: thick at the foot, gone at the top, bent by the wind and torn by noise that rises through them. */
				'vec2 firePlace(vec3 p) {',
				'	float h = p.z;',
				'	vec2 at = p.xy - uBlow * h * h - vec2(sin(h * 5.0 + uClock * 3.1), cos(h * 4.0 + uClock * 2.3)) * 0.1 * h;',
				'	vec3 q = vec3(at * 0.7, h * 1.2 - uClock * 1.3);',
				'	float n = texture(uNoise, q).r * 0.55 + texture(uNoise, q * 2.3 + 0.4).g * 0.3 + texture(uNoise, q * 5.1 + 0.7).b * 0.15 - 0.5;',
				'	float wide = 0.78 * pow(1.0 - h, 1.1) * smoothstep(-0.05, 0.08, h);',
				'	float thick = clamp((wide - length(at) + n * (1.0 + h * 2.4)) / max(wide, 0.05) * 2.2, 0.0, 1.0);',
				'	return vec2(thick, clamp(thick * pow(1.0 - h, 0.5) * (0.5 + n * 2.0 + 0.6 * smoothstep(0.55, 0.0, length(at) + h * 0.3)), 0.0, 1.0));',
				'}',
				/* A stream: a narrow neck, a white heart, bright knots where the gas overshoots, the edge torn further on. */
				'vec2 streamPlace(vec3 p) {',
				'	float h = p.z;',
				'	float r = length(p.xy);',
				'	vec3 q = vec3(p.xy * 0.5, h * 1.6 - uClock * 3.2);',
				'	float n = texture(uNoise, q).r - 0.5;',
				/* From a mouth it comes as wide as the mouth is, and only far off spreads. */
				'	float wide = uStraight > 0.5 ? mix(0.66, 0.5, h) + h * h * 0.3 : mix(0.3, 0.09, pow(h, 0.7)) * (1.0 + 0.3 * sin(h * 44.0) * (1.0 - h)) + h * h * 0.14;',
				'	float off = r / wide + n * h * 1.9;',
				'	float body = exp(-off * off * 1.7) * pow(1.0 - h, 1.5) * smoothstep(0.0, 0.02, h);',
				'	float knots = pow(0.5 + 0.5 * cos(h * 44.0), 6.0) * exp(-off * off * 4.0) * (1.0 - h);',
				'	return vec2(body, body * 0.7 + knots * 0.9);',
				'}',
				/* A ball of fire: it swells at once, burns through from its middle out, and what is left of it is dark red. */
				'vec2 ballPlace(vec3 p) {',
				'	vec3 at = vec3(p.xy, p.z * 2.0 - 1.0);',
				'	vec3 q = at * 0.5 + vec3(0.0, 0.0, -uClock * 0.2);',
				'	float n = texture(uNoise, q).r * 0.6 + texture(uNoise, q * 2.4).g * 0.4 - 0.5;',
				'	float r = length(at) + n * 0.95;',
				'	float thick = smoothstep(0.92, 0.6, r);',
				'	return vec2(thick, thick * smoothstep(1.1, 0.15, r + uAge * 0.95) * (1.0 - uAge * 0.7));',
				'}',
				/* A shaft of light: a bright heart or a hollow wall, dust that rises through it, gone at its far end. */
				'vec2 beamPlace(vec3 p) {',
				'	float h = p.z;',
				'	float r = length(p.xy);',
				'	vec3 q = vec3(p.xy * 0.5, h * 2.4 - uClock * 0.9);',
				'	float n = texture(uNoise, q).r * 0.6 + texture(uNoise, q * 2.7).g * 0.4;',
				'	float wall = uHollow > 0.0 ? exp(-pow((r - uHollow) / 0.1, 2.0)) : exp(-r * r * (uSoftEdge > 0.0 ? 5.0 / uSoftEdge : 12.0));',
				'	float ends = smoothstep(1.0, 0.25, h) * smoothstep(0.0, 0.02, h);',
				'	float body = wall * ends * (0.45 + n * 0.9);',
				'	return vec2(body, body * (uHollow > 0.0 ? 0.45 : 0.75) + exp(-r * r * 60.0) * ends * (uHollow > 0.0 ? 0.0 : 0.8));',
				'}',
				/* A bubble: bright at its rim, a net of cells that breathes, seen on both of its sides. */
				'vec3 bubble(vec3 from, vec3 way, out float seen) {',
				'	vec3 o = vec3(from.xy, from.z * 2.0 - 1.0);',
				'	vec3 w = vec3(way.xy, way.z * 2.0);',
				'	float a = dot(w, w);',
				'	float b = dot(o, w);',
				'	float c = dot(o, o) - 0.94;',
				'	float h = b * b - a * c;',
				'	seen = 0.0;',
				'	if (h <= 0.0) return vec3(0.0);',
				'	h = sqrt(h);',
				'	vec3 sum = vec3(0.0);',
				'	for (int i = 0; i < 2; i++) {',
				'		float t = (-b + (i == 0 ? -h : h)) / a;',
				'		if (t < 0.0) continue;',
				'		vec3 n = normalize(o + w * t);',
				'		float rim = pow(1.0 - abs(dot(n, normalize(w))), 3.0);',
				'		vec2 tile = vec2(atan(n.y, n.x) * 3.0, n.z * 7.0);',
				'		vec2 cell = abs(fract(vec2(tile.x + 0.5 * floor(tile.y), tile.y)) - 0.5);',
				'		float net = smoothstep(0.42, 0.5, max(cell.x * 1.1 + cell.y * 0.55, cell.y * 1.1));',
				'		float wave = texture(uNoise, n * 0.5 + vec3(0.0, 0.0, uClock * 0.2)).r;',
				'		float part = rim * 0.9 + net * 0.1 * (0.2 + wave * 1.6) + 0.025;',
				'		sum += mix(uColor, uHot, rim) * part * (i == 0 ? 1.0 : 0.45);',
				'		seen = max(seen, part);',
				'	}',
				'	return sum;',
				'}',
				'void main() {',
				'	vec3 ray = normalize(vWorld);',
				'	vec3 scale = uSpan;',
				'	vec3 from = vec3(-dot(uFrom, uSide), -dot(uFrom, uOther), -dot(uFrom, uAim)) / scale;',
				'	vec3 way = vec3(dot(ray, uSide), dot(ray, uOther), dot(ray, uAim)) / scale;',
				'	vec3 low = (vec3(-1.0, -1.0, 0.0) - from) / way;',
				'	vec3 high = (vec3(1.0, 1.0, 1.0) - from) / way;',
				'	vec3 first = min(low, high);',
				'	vec3 last = max(low, high);',
				'	float start = max(max(max(first.x, first.y), first.z), 0.0);',
				'	float end = min(min(last.x, last.y), last.z);',
				'	if (uSoft > 0.5) {',
				'		float z = (uSplit > 0.5 ? min(1.0, texture(uScene, gl_FragCoord.xy / uScreen.xy).r * 2.0) : texture(uScene, gl_FragCoord.xy / uScreen.xy).r) * 2.0 - 1.0;',
				'		float far = 2.0 * uScreen.z * uScreen.w / (uScreen.w + uScreen.z - z * (uScreen.w - uScreen.z));',
				'		end = min(end, far / max(dot(ray, uForward), 0.05));',
				'	}',
				'	if (end <= start) discard;',
				'	if (uShape == 4) {',
				'		float part = 0.0;',
				'		vec3 shell = bubble(from, way, part);',
				'		if (part < 0.003) discard;',
				'		outColor = vec4(shell / max(part, 0.05) * (0.8 + 0.4 * uIntensity), clamp(part, 0.0, 1.0) * min(uIntensity, 1.0));',
				'		return;',
				'	}',
				'	float step1 = (end - start) / float(uSteps);',
				'	float across = min(uSpan.x, uSpan.z);',
				'	float t = start + step1 * fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));',
				'	float hold = uShape == 3 ? 0.9 : uShape == 1 ? 2.2 : uShape == 0 ? 2.4 : 5.0;',
				'	vec3 sum = vec3(0.0);',
				'	float clear = 1.0;',
				'	for (int i = 0; i < uSteps; i++) {',
				'		vec3 p = from + way * t;',
				'		vec2 at = uShape == 0 ? firePlace(p) : uShape == 1 ? streamPlace(p) : uShape == 3 ? beamPlace(p) : ballPlace(p);',
				'		if (at.x > 0.002) {',
				'			float amount = step1 / across;',
				'			vec3 ramp = mix(vec3(0.62, 0.05, 0.0), uColor * uColor * 1.15, smoothstep(0.08, 0.45, at.y));',
				'			ramp = mix(ramp, uHot, smoothstep(0.55, 1.0, at.y) * 0.85);',
				'			if (uShape == 2) ramp *= smoothstep(0.0, 0.22, at.y) * 0.92 + 0.08;',
				'			if (uShape == 1 || uShape == 3) ramp = mix(uColor, uHot, smoothstep(0.2, 0.75, at.y));',
				'			float taken = (1.0 - exp(-at.x * amount * hold)) * clear;',
				'			sum += ramp * taken;',
				'			clear -= taken;',
				'		}',
				'		t += step1;',
				'	}',
				/* What the eye meets first gives its color: a fire stays the color of fire, over the brightest ground too. */
				'	float seen = 1.0 - clear;',
				'	if (seen < 0.003) discard;',
				'	outColor = vec4(sum / seen * (0.8 + 0.4 * uIntensity), seen * min(uIntensity, 1.0));',
				'}'
			].join('\n')
		};
	}
});
