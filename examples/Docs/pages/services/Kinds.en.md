<!-- generated -->
# Kinds

The kinds of the objects of a game, made of three axes: what a kind extends (Extends, one base), what it can do (Traits: {Name: params}, each the data of a system of the scene: Orbit, Surface, Model, Mover...) and what it is made of (Parts: [{ID, Kind, Position, Rotation, Traits...}], each an object of its own, placed in its parent). The same rules merge them as the Components of the framework merge their layers: the later wins a value, Traits merge by their name and then by their fields, Parts by their ID.

- Define(name, kind) registers a kind {Extends, Traits, Parts, Values} (Values: the plain fields of its objects: Name, Team, Radius...); Get(name) returns it as it was given, Has(name), Names().
- Resolve(name) returns a kind made whole: {Name, Chain (its bases, the farthest first), Traits, Parts, Values}.
- Make(kind, props) makes an object of a kind: {ID, Kind, Values, Traits, Parts: [objects]}; props are fields of its own ({ID, Name, Team...}), Traits of its own over the ones of its kind and Parts of its own over the parts of the kind (by ID; a part {ID, Removed: true} takes one away). A part of an object has the address parent/part.
- Field(object, name) finds a field in any case (radius is Radius) among its Values and the params of its Traits, or the name of a trait and its field together (surfacetype is the Type of Surface): {Trait, Name} or null; Fields(kind) lists them.
- Diff(object) is what a saved game keeps: the kind and what differs from it ({ID, Kind, Values, Traits, Parts}); Restore(saved) makes the object again.

Kinds that are not defined throw: 'Elemenx Kinds: unknown kind <name>'; a kind that extends itself through others: 'Elemenx Kinds: <name> extends itself: a, b, a'. The same functions run in Node: they read no page.

## Methods

- `Define(name, kind)`
- `Get(name)`
- `Has(name)`
- `Names()`
- `Resolve(name, chain)`
- `Make(kind, props)`
- `Fields(kind)`
- `Field(object, name)`
- `Diff(object)`
- `Restore(saved)`

## Example

```example
<pre class="elemenx-code" style="white-space: pre-wrap;">{{Text}}</pre>
<script>
({
	Text: '',

	$OnCreate: function () {
		var kinds = this.$Service('Kinds');
		var tank;

		kinds.Define('vehicle', {Traits: {Mover: {Speed: 2}, Health: {Max: 100}}, Values: {Team: 'neutral'}});
		kinds.Define('turret', {Traits: {Model: {Shape: 'cylinder'}, Health: {Max: 40}}});
		kinds.Define('tank', {Extends: 'vehicle', Traits: {Health: {Max: 400}}, Parts: [{ID: 'hull', Traits: {Model: {Shape: 'box'}}}, {ID: 'turret', Kind: 'turret', Position: [0, 0.6, 0]}]});

		tank = kinds.Make('tank', {ID: 'tank-1', Team: 'red', Parts: [{ID: 'turret', Traits: {Health: {Max: 60}}}]});
		tank.Parts.splice(0, 1);

		this.Text = 'Resolve(tank): ' + JSON.stringify(kinds.Resolve('tank').Traits) + '\n\nParts: ' + tank.Parts.map(function (part) {
			return part.ID + ' (' + part.Kind + ')';
		}).join(', ') + '\n\nDiff (a saved game): ' + JSON.stringify(kinds.Diff(tank));
	}
})
</script>
```

## Tests

- [makes a kind whole of its base, its Traits by their fields and its Parts by their ID, and tells its fields in any case](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L257) — `tests/regression/library-scene.test.js`
- [makes an object of a kind with parts of its own, and keeps of it only what differs: restored the same](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L278) — `tests/regression/library-scene.test.js`
- [puts planets on their orbits and makes shapes of three dimensions with the Services of ElemenxUI](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L48) — `tests/regression/headless.test.js`
