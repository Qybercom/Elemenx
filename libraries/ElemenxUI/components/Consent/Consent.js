/*
 * A request for consent, of any kind: cookies and analytics, the terms of a service, mail of news. Key names the
 * consent and Version its text (a new version asks again); Purposes are what it asks for, [{ID, Label, Description,
 * Required}] (a required one is always on). It shows itself while the Consents Service keeps no decision of that
 * version (Open true or false decides instead): Accept all, Reject (only the required ones) and Customize (a switch
 * for each purpose, then Save) keep the decision there and emit change with it. Show() opens it again with the
 * choices kept (a link "Cookie settings"). Placement: bottom (a banner over the bottom of the page), center (a card in
 * the middle) or inline (in its place). Its text is Text, or the content of its tag; Policy links to the full text.
 */
Elemenx.Component('Consent', {
	$TemplateURL: 'Consent.html',
	$StyleURL: 'Consent.css',
	$Meta: {
		Group: 'feedback',
		Icon: 'check',
		Description: 'A request for consent, of any kind: cookies and analytics, the terms of a service, mail of news.',
		Container: true,
		Events: {
			change: 'A decision was made: {Version, Choices: {purpose: true or false}, Time}.',
			close: 'It was hidden after a decision.'
		},
		Props: {
			Key: 'The name of the consent in the Consents Service.',
			Version: 'The version of its text: a decision of another version asks again.',
			Purposes: {Schema: {ID: 'text', Label: 'text', Description: 'text', Required: 'bool'}, Description: 'What it asks for: [{ID, Label, Description, Required}].'},
			Title: 'Its title.',
			Text: 'Its text, without content in its tag.',
			Policy: 'The address of the full text (a policy, the terms).',
			PolicyLabel: 'The text of the link to it.',
			Placement: {Options: ['bottom', 'center', 'inline'], Description: 'bottom (a banner), center (a card in the middle) or inline (in its place).'},
			Reject: 'Shows Reject (only the required purposes).',
			Customize: 'Shows Customize (a switch for each purpose).',
			Open: 'Shows it (true) or hides it (false); by default it shows while no decision of its Version is kept.'
		},
		Sample: {Key: 'sample', Placement: 'inline', Purposes: [{ID: 'necessary', Label: 'Necessary', Required: true}, {ID: 'analytics', Label: 'Analytics'}]}
	},
	Key: 'default',
	Version: '',
	Purposes: [],
	Title: '',
	Text: '',
	Policy: '',
	PolicyLabel: '',
	Placement: 'bottom',
	Reject: true,
	Customize: true,
	Open: null,
	Shown: false,
	Editing: false,
	Choices: {},

	$OnCreate: function () {
		var self = this;

		this.TitleID = 'elemenx-consent-' + Math.random().toString(36).slice(2, 10);

		this.Required = function (purpose) {
			return purpose.Required === true || purpose.Required === 'true';
		};

		this.On = function (choices, purpose) {
			return self.Required(purpose) || choices[purpose.ID] === true;
		};

		/* Another tab, or code, decided: shown by default, it follows. */
		this.Listener = function (key) {
			if (key === self.Key && (self.Open === null || self.Open === ''))
				self.Shown = !self.Consents().Valid(self.Key, self.Version);
		};
	},

	$OnReady: function () {
		this.Consents().OnChange(this.Listener);

		this.Choices = this.Kept();

		this.Follow();
	},

	$OnProps: function (changed) {
		if (changed.Open !== undefined || changed.Key !== undefined || changed.Version !== undefined)
			this.Follow();
	},

	$OnDestroy: function () {
		this.Consents().OffChange(this.Listener);
	},

	/* Shown by Open, or, without it, while no decision of its Version is kept. */
	Follow: function () {
		this.Shown = this.Open === null || this.Open === '' ? !this.Consents().Valid(this.Key, this.Version) : this.Open === true || this.Open === 'true';
	},

	Consents: function () {
		return this.$Service('Consents');
	},

	/* The choices of the decision kept, or none. */
	Kept: function () {
		var decision = this.Consents().Get(this.Key);

		return decision ? Object.assign({}, decision.Choices) : {};
	},

	Show: function () {
		this.Choices = this.Kept();
		this.Editing = false;
		this.Shown = true;

		return this;
	},

	/* all: true accepts every purpose, false only the required ones, null the switches as they are. */
	Decide: function (all) {
		var self = this;
		var choices = {};
		var decision;

		(this.Purposes || []).forEach(function (purpose) {
			choices[purpose.ID] = all === true || self.Required(purpose) || (all === null && self.Choices[purpose.ID] === true);
		});

		decision = this.Consents().Set(this.Key, this.Version, choices);

		this.Choices = choices;
		this.Editing = false;
		this.Shown = false;

		this.$Emit('change', decision);
		this.$Emit('close');
	},

	AcceptAll: function () {
		this.Decide(true);
	},

	RejectAll: function () {
		this.Decide(false);
	},

	Save: function () {
		this.Decide(null);
	},

	Edit: function () {
		this.Editing = true;
	},

	/* A switch of a purpose: its native change bubbles here, with the purpose on its wrapper. */
	Chosen: function (event, node) {
		var choices = Object.assign({}, this.Choices);

		choices[node.getAttribute('data-id')] = !!event.target.checked;

		this.Choices = choices;
	}
});
