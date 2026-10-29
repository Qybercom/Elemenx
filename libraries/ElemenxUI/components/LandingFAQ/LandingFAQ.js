/*
 * The questions of the customers: Items [{ID, Question, Answer}], each a <details> the browser opens and closes (find
 * in the page opens the one it finds). Single keeps one open at a time; Open is the ID of the one open at first.
 * Overline, Title and Text over them; the default slot adds questions of its own. Events: toggle ({ID, Open}).
 */
Elemenx.Component('LandingFAQ', {
	$TemplateURL: 'LandingFAQ.html',
	$StyleURL: 'LandingFAQ.css',
	$Meta: {
		Group: 'landing',
		Icon: 'help',
		Description: 'The questions of the customers, each opened by a press.',
		Container: true,
		Events: {
			toggle: 'A question opened or closed: {ID, Open}.'
		},
		Props: {
			Overline: 'The line above the title.',
			Title: 'The title.',
			Text: 'The text under it.',
			Items: {Schema: {Question: 'text', Answer: 'text'}, Description: 'The questions: [{ID, Question, Answer}].'},
			Single: 'Keeps one question open at a time.',
			Open: 'The ID of the question open at first.'
		},
		Sample: {Items: [{ID: 'price', Question: 'Is it free?', Answer: 'Yes, under the MIT license.'}]}
	},
	Overline: '',
	Title: '',
	Text: '',
	Items: [],
	Single: false,
	Open: '',

	$OnCreate: function () {
		this.Group = 'elemenx-faq-' + Math.random().toString(36).substring(2, 10);
	},

	Toggled: function (event) {
		var node = event.currentTarget;

		this.$Emit('toggle', {ID: node.getAttribute('data-id') || '', Open: node.open});
	}
});
