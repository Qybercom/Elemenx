/*
 * The first screen of a landing: an Overline, a large Title, its Text, the Actions and a picture. Layout: split (the
 * picture beside the text, under it on a phone), center (the text in the middle, the picture under it) or cover (the
 * picture behind the text, darkened). Image and ImageAlt, and the slot media (a video, a form, a mockup in its place).
 * Actions: [{ID, Label, Href, Variant (primary, secondary or ghost), Icon, Goal, Experiment}]: a link with Href, else a
 * button; Goal tells the Audience a conversion of the Experiment it stands in (or of the one Experiment names). The
 * default slot goes under the actions (a note, logos).
 * Events: action ({ID, Label, Href, Goal}).
 */
Elemenx.Component('LandingHero', {
	$TemplateURL: 'LandingHero.html',
	$StyleURL: 'LandingHero.css',
	$Meta: {
		Group: 'landing',
		Icon: 'layout',
		Description: 'The first screen of a landing: a title, its text, actions and a picture, beside, under or behind.',
		Container: true,
		Events: {
			action: 'An action was pressed: {ID, Label, Href, Goal}.'
		},
		Props: {
			Overline: 'The line above the title.',
			Title: 'The title.',
			Text: 'The text under it.',
			Image: 'The picture.',
			ImageAlt: 'What the picture shows, for screen readers.',
			Layout: {Options: ['split', 'center', 'cover'], Description: 'split (the picture beside), center (under) or cover (behind).'},
			Actions: {Schema: {ID: 'text', Label: 'text', Href: 'text', Variant: 'text'}, Description: 'The actions: [{ID, Label, Href, Variant, Icon, Goal}].'}
		},
		Sample: {Title: 'Ship faster', Text: 'One file, no build step.', Actions: [{ID: 'start', Label: 'Start'}]}
	},
	Overline: '',
	Title: '',
	Text: '',
	Image: '',
	ImageAlt: '',
	Layout: 'split',
	Actions: [],

	/* The picture behind the text of a cover. */
	Cover: function (layout, image) {
		return layout === 'cover' && image ? 'background-image: url("' + String(image).replace(/["\\]/g, '\\$&') + '");' : null;
	},

	Acted: function (action, event) {
		if (action.Goal)
			this.$Service('Audience').Goal(action.Experiment || event.currentTarget, action.Goal, {Action: action.ID || action.Label});

		this.$Emit('action', {ID: action.ID || '', Label: action.Label || '', Href: action.Href || '', Goal: action.Goal || ''});
	}
});
