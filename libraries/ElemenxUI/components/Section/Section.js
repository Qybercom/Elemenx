/*
 * A titled section. Collapsible lets the user fold its body; Collapsed is the state and the toggle event reports it.
 * Slots: default (the body), before and after (controls on each side of the title), actions (controls at the right
 * end of the header), note (extra content next to the caption). NotePlacement: end (the caption at the right of the
 * header, by default) or below (under the header line).
 */
Elemenx.Component('Section', {
	$TemplateURL: 'Section.html',
	$StyleURL: 'Section.css',
	Title: '',
	Icon: '',
	Note: '',
	NotePlacement: 'end',
	Level: 2,
	Collapsible: false,
	Collapsed: false,

	Toggle: function () {
		if (!this.Collapsible) return;

		this.Collapsed = !this.Collapsed;

		this.$Emit('toggle', this.Collapsed);
	}
});