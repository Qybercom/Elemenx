/*
 * The call to act of a landing: a band of a Title, its Text and the Actions ([{ID, Label, Href, Variant, Icon, Goal,
 * Experiment}], as in LandingHero: a Goal tells the Audience a conversion of the Experiment it stands in, or of the one
 * Experiment names). Tone: accent (the band in
 * the color of the theme) or neutral. Layout: row (the text and the actions side by side) or center. The default slot
 * goes under the actions (a form of a mail, a note). Events: action ({ID, Label, Href, Goal}).
 */
Elemenx.Component('LandingCTA', {
	$TemplateURL: 'LandingCTA.html',
	$StyleURL: 'LandingCTA.css',
	$Meta: {
		Group: 'landing',
		Icon: 'send',
		Description: 'The call to act of a landing: a band of a title, a text and actions.',
		Container: true,
		Events: {
			action: 'An action was pressed: {ID, Label, Href, Goal}.'
		},
		Props: {
			Title: 'The title.',
			Text: 'The text under it.',
			Actions: {Schema: {ID: 'text', Label: 'text', Href: 'text', Variant: 'text'}, Description: 'The actions: [{ID, Label, Href, Variant, Icon, Goal}].'},
			Tone: {Options: ['accent', 'neutral'], Description: 'accent (in the color of the theme) or neutral.'},
			Layout: {Options: ['row', 'center'], Description: 'row (the actions beside the text) or center.'}
		},
		Sample: {Title: 'Ready?', Actions: [{ID: 'start', Label: 'Start now'}]}
	},
	Title: '',
	Text: '',
	Actions: [],
	Tone: 'accent',
	Layout: 'row',

	Acted: function (action, event) {
		if (action.Goal)
			this.$Service('Audience').Goal(action.Experiment || event.currentTarget, action.Goal, {Action: action.ID || action.Label});

		this.$Emit('action', {ID: action.ID || '', Label: action.Label || '', Href: action.Href || '', Goal: action.Goal || ''});
	}
});
