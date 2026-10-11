/*
 * A titled section. Collapsible lets the user fold its body; Collapsed is the state and the toggle event reports it.
 * Slots: default (the body), actions (controls at the right of the header), note (a caption under the title).
 */
Elemenx.Component('Section', {
	$TemplateURL: 'Section.html',
	$StyleURL: 'Section.css',
	Title: '',
	Icon: '',
	Note: '',
	Level: 2,
	Collapsible: false,
	Collapsed: false,

	Toggle: function () {
		if (!this.Collapsible) return;

		this.Collapsed = !this.Collapsed;

		this.$Emit('toggle', this.Collapsed);
	}
});