/*
 * An experiment of a page: one of its Variant children shows, the one the Audience Service chooses for the visitor (by
 * their rules, the split of the others kept for the visitor, or a link that forces one: ?variant=ID). Name is its name
 * (the key kept and the one of its events); Variants ([{ID, When, Weight, Default}]) adds variants from code, to the
 * declared ones of the same ID or as new ones. Param names the parameter of a link that forces a variant (variant).
 * Track (true) tells the Audience a view of the variant chosen. Visitor ({URL, Referrer, Language, Width, UserAgent},
 * the options of Audience.Context) shows the page as such a visitor would see it: a preview of a campaign.
 * Events: choose ({Experiment, ID, Reason}). Methods: Convert(goal, data) tells a conversion of the variant shown,
 * Choose() chooses again (after Forget()), Forget() forgets the variant kept for the visitor.
 */
Elemenx.Component('Experiment', {
	$TemplateURL: 'Experiment.html',
	$StyleURL: 'Experiment.css',
	$Meta: {
		Group: 'layout',
		Icon: 'branch',
		Description: 'An experiment of a page: the Variant chosen for the visitor by UTM, parameters, referrer, language, device or an A/B split.',
		Container: true,
		Children: ['Variant'],
		Events: {
			choose: 'A variant was chosen: {Experiment, ID, Reason}.'
		},
		Methods: ['Convert(goal, data)', 'Choose()', 'Forget()'],
		Props: {
			Name: 'Its name: the key of the variant kept and of its events.',
			Variants: {Schema: {ID: 'text', Weight: 'number'}, Description: 'Variants from code: [{ID, When, Weight, Default}].'},
			Param: 'The parameter of a link that forces a variant (variant).',
			Track: 'Tells the Audience Service a view of the variant chosen.',
			Visitor: 'A visitor to show it to, a preview: {URL, Referrer, Language, Width, UserAgent}.'
		},
		Sample: {Name: 'hero'}
	},
	Name: '',
	Variants: [],
	Param: '',
	Track: true,
	Visitor: null,
	Chosen: '',
	Reason: '',

	$OnReady: function () {
		var self = this;
		var root = this.$Element();
		var own = {Declared: null};

		this.Own = function () {
			return own;
		};

		/* Its own variants: those of an Experiment inside it are that one's. */
		own.Nodes = function () {
			return Array.prototype.filter.call(root.querySelectorAll('.elemenx-variant'), function (node) {
				return node.parentNode.closest('.elemenx-experiment') === root;
			});
		};

		own.Read = function () {
			var declared = own.Nodes().map(function (node) {
				return node.getAttribute('data-item') || '{}';
			}).join('\n');
			if (declared === own.Declared) return;

			own.Declared = declared;

			if (!self.Chosen || !self.List().some(function (variant) {
				return String(variant.ID) === self.Chosen;
			})) self.Choose();
			else self.Show();
		};

		own.Watcher = new MutationObserver(own.Read);

		own.Watcher.observe(root, {subtree: true, childList: true, attributes: true, attributeFilter: ['data-item']});

		own.Read();
	},

	/* Another visitor, or other variants from code: chosen again. */
	$OnProps: function (changed) {
		if ((changed.Visitor !== undefined || changed.Variants !== undefined || changed.Name !== undefined) && this.Own)
			this.Choose();
	},

	$OnDestroy: function () {
		if (this.Own && this.Own().Watcher)
			this.Own().Watcher.disconnect();
	},

	/* The variants declared and given: one given of a declared ID adds to it. */
	List: function () {
		var list = this.Own().Nodes().map(function (node) {
			return JSON.parse(node.getAttribute('data-item') || '{}');
		});

		(this.Variants || []).forEach(function (variant) {
			var same = list.filter(function (each) {
				return String(each.ID) === String(variant.ID);
			})[0];

			if (same) Object.assign(same, variant);
			else list.push(Object.assign({}, variant));
		});

		return list;
	},

	Key: function () {
		return this.Name || 'experiment';
	},

	Choose: function () {
		var audience = this.$Service('Audience');
		var options = {};
		var choice;

		if (this.Param)
			options.Param = this.Param;

		if (this.Visitor && typeof this.Visitor === 'object')
			options.Context = audience.Context(this.Visitor);

		choice = audience.Choose(this.Key(), this.List(), options);

		this.Chosen = choice ? choice.ID : '';
		this.Reason = choice ? choice.Reason : '';

		this.Show();

		if (!choice)
			return null;

		if (this.Track && this.Track !== 'false')
			audience.View(this.Key());

		this.$Emit('choose', {Experiment: this.Key(), ID: choice.ID, Reason: choice.Reason});

		return choice;
	},

	/* The chosen variant shown, the others hidden. */
	Show: function () {
		var chosen = this.Chosen;

		this.Own().Nodes().forEach(function (node) {
			var variant = Elemenx.Instance(node);
			var item = JSON.parse(node.getAttribute('data-item') || '{}');

			if (variant)
				variant.Shown = !!chosen && String(item.ID) === chosen;
		});
	},

	Convert: function (goal, data) {
		return this.$Service('Audience').Convert(this.Key(), goal, data);
	},

	Forget: function () {
		this.$Service('Audience').Forget(this.Key());
	}
});
