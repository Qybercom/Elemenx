/*
 * A titled section. Collapsible lets the user fold its body; Collapsed is the state and the toggle event reports it.
 * Slots: default (the body), before and after (controls on each side of the title), actions (controls at the right
 * end of the header), note (extra content next to the caption). NotePlacement: end (the caption at the right of the
 * header, by default) or below (under the header line).
 */
Elemenx.Component('Section', {
	$TemplateURL: 'Section.html',
	$StyleURL: 'Section.css',
	$Meta: {
		Group: 'layout',
		Icon: 'panel-left',
		Description: 'A titled section.',
		Container: true,
		Slots: ['before', 'after', 'note', 'actions'],
		Events: {
			toggle: 'It was folded or unfolded: Collapsed.'
		},
		Props: {
			Title: 'The title of the section.',
			Icon: 'An icon before the title.',
			Note: 'A caption beside the title, or under it with NotePlacement below.',
			NotePlacement: {Options: ['end', 'below'], Description: 'end (at the right of the header) or below (under the header line).'},
			Level: 'The level of the title as a heading (h2 by default).',
			Collapsible: 'Lets the user fold the body.',
			Collapsed: 'Whether the body is folded.'
		},
		Sample: {Title: 'Settings', Collapsible: true}
	},
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