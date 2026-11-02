<!-- generated -->
# Fbx

Fbx: the skeleton and the animation of an FBX file written as text, as Blender and Mixamo give it; a binary one is refused with a word. It reads no mesh: it is the way a clip made for another skeleton comes to a model (Models.Retarget).

- Parse(text) returns {Bones: [{ID, Name, Parent, Translation, Pre, Rotation}], Length, Curves}. Parent is an index, -1 for a root; Pre and Rotation are degrees, x, y, z. Curves: {bone index: {T: [x, y, z], R: [x, y, z]}}, each [{Times, Values}] in seconds, degrees and the units of the file, or null where nothing moves.
- Sample(curve, time, fallback) is the value of a curve at a second.
- Load(url, callback) fetches and parses: (error, parsed).

## Methods

- `Parse(text)`
- `Sample(curve, time, fallback)`
- `Load(url, callback)`

## Example

```example
<pre class="elemenx-code" style="white-space: pre-wrap;">{{Text}}</pre>
<script>
({
	Text: '',

	$OnCreate: function () {
		var source = this.$Service('Fbx').Parse('Objects:  {\n\tModel: 1, "Model::mixamorig:Hips", "LimbNode" {\n\t\tP: "Lcl Translation", "Lcl Translation", "", "A+",0,100,0\n\t}\n}');

		this.Text = 'Bones: ' + source.Bones.map(function (bone) {
			return bone.Name + ' at ' + bone.Translation.join(', ');
		}).join('; ') + '\n\nOn a model: Models.Define(\'hero\', {URL: \'hero.glb\', Motions: {walk: \'Walk.fbx\'}})';
	}
})
</script>
```

## Tests

- [reads the clip of an FBX as text and lays it on another skeleton, by what its bones are](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L7161) — `tests/regression/library-scene.test.js`
