/*
 * A settings layout like the settings of an IDE, built on elemenx-screen, elemenx-container and elemenx-column.
 * Slots: nav (the tree of sections, often a searchable NavList), default (the form of the section), actions (at the
 * right of the title), footer (the buttons: OK, Cancel, Apply). Path is the trail of the current section; its last
 * part is the title. The navigation is resized by its edge.
 */
Elemenx.Component('Settings', {
	$TemplateURL: 'Settings.html',
	$StyleURL: 'Settings.css',
	$Meta: {
		Group: 'layout',
		Icon: 'settings',
		Description: 'A settings layout like the settings of an IDE, built on elemenx-screen, elemenx-container and elemenx-column.',
		Container: true,
		Slots: ['nav', 'actions', 'footer'],
		Props: {
			Path: 'The trail of the current section; its last part is the title.',
			Description: 'A text under the title.'
		},
		Sample: {Description: 'Options of the code editor'}
	},
	Path: [],
	Description: ''
});