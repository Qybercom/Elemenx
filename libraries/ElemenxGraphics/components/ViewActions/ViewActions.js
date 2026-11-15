/*
 * The actions of the view of an editor in a bar over its bottom, for a mouse and for fingers alike: Items [{ID, Icon,
 * Label, Disabled, Danger}] are buttons that tell act ({ID}); Hand (true or false; null leaves it out) is a toggle that
 * gives one finger to the camera (two fingers move it always), told by hand ({Hand}). Label names the bar for screen
 * readers. SceneEditor, ModelEditor and PlanetEditor have it, their context menu the same actions.
 */
Elemenx.Component('ViewActions', {
	$TemplateURL: 'ViewActions.html',
	$StyleURL: 'ViewActions.css',
	$Meta: {
		Group: 'game',
		Icon: 'camera',
		Description: 'The actions of the view of an editor in a bar over its bottom; a toggle gives one finger to the camera.',
		Events: {
			act: 'An action was pressed: {ID}.',
			hand: 'The toggle of one finger for the camera: {Hand}.'
		},
		Props: {
			Items: {Schema: {ID: 'text', Icon: 'icon', Label: 'text', Disabled: 'bool', Danger: 'bool'}, Description: 'The actions: [{ID, Icon, Label, Disabled, Danger}].'},
			Hand: 'One finger moves the camera (true or false); null leaves the toggle out.',
			Label: 'The name of the bar for screen readers.'
		},
		Sample: {Items: [{ID: 'frame', Icon: 'maximize', Label: 'Frame'}, {ID: 'delete', Icon: 'delete', Label: 'Delete', Danger: true}], Hand: false}
	},
	Items: [],
	Hand: null,
	Label: '',

	/* A press or a key on the bar is not one on the view under it (a point of a stroke, a drag of the camera, Enter that ends a stroke). */
	Kept: function (event) {
		event.stopPropagation();
	},

	Handed: function () {
		this.Hand = !this.Hand;

		this.$Emit('hand', {Hand: this.Hand});
	},

	Acted: function (item) {
		if (item.Disabled) return;

		this.$Emit('act', {ID: item.ID});
	}
});
