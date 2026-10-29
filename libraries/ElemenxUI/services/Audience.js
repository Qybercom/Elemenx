/*
 * Who came to a page and which variant of it they see: a landing for a campaign, a language, a phone, or one of an A/B
 * test, the same one again on the next visit. The same code runs in Node (pass the visitor to Context).
 * - Context(options): the visitor: {URL, Params (of the query), UTM {Source, Medium, Campaign, Term, Content}, Referrer
 *   (the host of another site it came from, '' when typed or from the same site), Language, Device (phone, tablet or
 *   desktop), Width, Touch, Visitor (an ID kept for it), Visits (1 on the first), Returning}. Options override what the
 *   browser tells: URL, Referrer, Language, Width, UserAgent, Touch.
 * - Match(rule, context): whether a visitor is one of a rule; every condition given must hold. Source, Medium,
 *   Campaign, Term, Content (the UTM tags), Language (ru matches ru-RU), Device, Referrer (a part of the host, '' for
 *   none, or a RegExp): a value or a list of them, without case. Params: {name: value, list, true (given) or false
 *   (not)}. Returning: true or false. Test: function (context) of your own.
 * - Choose(experiment, variants, options): the variant of a visitor: [{ID, When (a rule), Weight (1), Default}]. First
 *   the one a link forces (?variant=ID or ?variant=experiment:ID, Param names it), then the first whose When holds,
 *   then the one kept for the visitor, then one of those without When by their Weight (kept for the next visit), else
 *   the Default one. Returns {Experiment, ID, Variant, Reason: forced, rule, remembered, split or default}, or null.
 *   Options: Context, Param, Random (a function of 0..1).
 * - Chosen(experiment) the last choice; Forget(experiment) the kept one (all of them without a name).
 * - View(experiment, data) tells that the variant was seen (once for a page), Convert(experiment, goal, data) that its
 *   visitor did what it was for (signup, buy...): OnEvent(callback) / OffEvent(callback) get {Type (view or
 *   conversion), Experiment, Variant, Reason, Goal, Visitor, Source, Medium, Campaign, Referrer, Language, Device,
 *   Data, Time}, to send to the analytics of the site. Goal(element, goal, data) tells a conversion of each Experiment
 *   an element of the page stands in (the action of a Landing block with a Goal does), or of the one it names.
 */
Elemenx.Service('Audience', {
	$Meta: {
		Description: 'Who came to a page and which variant they see: rules by UTM, parameters, referrer, language and device, A/B tests kept for the visitor, views and conversions.',
		Methods: ['Context(options)', 'Match(rule, context)', 'Choose(experiment, variants, options)', 'Chosen(experiment)', 'Forget(experiment)', 'View(experiment, data)', 'Convert(experiment, goal, data)', 'Goal(element, goal, data)', 'OnEvent(callback)', 'OffEvent(callback)']
	},
	StorageKey: 'elemenx-audience',
	Param: 'variant',

	$OnCreate: function () {
		var visitor = Elemenx.Storage.Local.Get(this.StorageKey + ':visitor');

		this.Listeners = this.$Service('ElemenxHelpers').Listeners();
		this.Choices = {};
		this.Viewed = {};

		if (!visitor || typeof visitor !== 'object' || !visitor.ID)
			visitor = {ID: 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10), Visits: 0};

		/* A visit is counted once for a tab: the pages it opens after are the same visit. */
		if (!Elemenx.Storage.Session.Get(this.StorageKey + ':visit')) {
			visitor.Visits = (Number(visitor.Visits) || 0) + 1;

			Elemenx.Storage.Session.Set(this.StorageKey + ':visit', true);
		}

		Elemenx.Storage.Local.Set(this.StorageKey + ':visitor', visitor);

		this.Visitor = visitor;
	},

	$OnDestroy: function () {
		this.Listeners.Clear();
	},

	Context: function (options) {
		var given = options || {};
		var browser = typeof window !== 'undefined' && window.location;
		var url = new URL(given.URL || (browser ? window.location.href : 'http://localhost/'), 'http://localhost/');
		var params = {};
		var referrer = given.Referrer !== undefined ? given.Referrer : browser ? document.referrer : '';
		var host = '';
		var agent = given.UserAgent !== undefined ? given.UserAgent : typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
		var width = given.Width !== undefined ? Number(given.Width) : browser ? window.innerWidth : 1280;
		var touch = given.Touch !== undefined ? !!given.Touch : typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
		var language = given.Language || (Elemenx.Locale && Elemenx.Locale.Language ? Elemenx.Locale.Language() : '') || (typeof navigator !== 'undefined' ? navigator.language : '') || '';
		var device;

		url.searchParams.forEach(function (value, key) {
			if (!Object.prototype.hasOwnProperty.call(params, key))
				params[key] = value;
		});

		try {
			host = referrer ? new URL(referrer).host.toLowerCase() : '';
		}
		catch (error) {
			host = '';
		}

		/* Another page of the same site is no referrer. */
		if (host === url.host.toLowerCase())
			host = '';

		if (/iPad|Tablet/i.test(agent) || /Android/i.test(agent) && !/Mobile/i.test(agent) || touch && width >= 600 && width <= 1024 && !/Mobi/i.test(agent)) device = 'tablet';
		else if (/Mobi|iPhone|iPod/i.test(agent) || width < 600) device = 'phone';
		else device = 'desktop';

		return {
			URL: url.href,
			Params: params,
			UTM: {Source: params.utm_source || '', Medium: params.utm_medium || '', Campaign: params.utm_campaign || '', Term: params.utm_term || '', Content: params.utm_content || ''},
			Referrer: host,
			Language: language,
			Device: device,
			Width: width,
			Touch: touch,
			Visitor: this.Visitor.ID,
			Visits: this.Visitor.Visits,
			Returning: this.Visitor.Visits > 1
		};
	},

	/* Whether a value is one of those of a rule: the same text without case, one of a list, or a RegExp that finds it. */
	Same: function (wanted, value) {
		var text = String(value === undefined || value === null ? '' : value).toLowerCase();

		return [].concat(wanted).some(function (each) {
			if (each instanceof RegExp)
				return each.test(String(value || ''));

			return String(each).toLowerCase() === text;
		});
	},

	Match: function (rule, context) {
		var self = this;
		var visitor = context || this.Context();
		var tags = ['Source', 'Medium', 'Campaign', 'Term', 'Content'];
		var name;

		if (!rule)
			return true;

		if (!tags.every(function (tag) {
			var wanted = rule[tag] !== undefined ? rule[tag] : rule.UTM ? rule.UTM[tag] : undefined;

			return wanted === undefined || self.Same(wanted, visitor.UTM[tag]);
		})) return false;

		if (rule.Language !== undefined && ![].concat(rule.Language).some(function (language) {
			var wanted = String(language).toLowerCase();
			var have = String(visitor.Language || '').toLowerCase();

			return have === wanted || have.split('-')[0] === wanted;
		})) return false;

		if (rule.Device !== undefined && !this.Same(rule.Device, visitor.Device)) return false;

		/* A part of the host of the referrer: google matches www.google.com; '' is a visit without one. */
		if (rule.Referrer !== undefined && ![].concat(rule.Referrer).some(function (wanted) {
			if (wanted instanceof RegExp)
				return wanted.test(visitor.Referrer);

			if (wanted === '' || wanted === false) return visitor.Referrer === '';

			return !!visitor.Referrer && visitor.Referrer.indexOf(String(wanted).toLowerCase()) !== -1;
		})) return false;

		for (name in rule.Params || {}) {
			if (!Object.prototype.hasOwnProperty.call(rule.Params, name)) continue;

			if (rule.Params[name] === true) {
				if (!Object.prototype.hasOwnProperty.call(visitor.Params, name)) return false;
			}
			else if (rule.Params[name] === false) {
				if (Object.prototype.hasOwnProperty.call(visitor.Params, name)) return false;
			}
			else if (!this.Same(rule.Params[name], visitor.Params[name])) {
				return false;
			}
		}

		if (rule.Returning !== undefined && rule.Returning !== null && !!rule.Returning !== visitor.Returning) return false;
		if (typeof rule.Test === 'function' && !rule.Test(visitor)) return false;

		return true;
	},

	Choose: function (experiment, variants, options) {
		var given = options || {};
		var context = given.Context || this.Context();
		var list = (variants || []).map(function (variant) {
			return typeof variant === 'object' ? variant : {ID: variant};
		}).filter(function (variant) {
			return variant.ID !== undefined && variant.ID !== null && variant.ID !== '';
		});
		var key = this.StorageKey + ':' + experiment;
		var forced = String(context.Params[given.Param || this.Param] || '');
		var kept = Elemenx.Storage.Local.Get(key);
		var split = list.filter(function (variant) {
			return !variant.When;
		});
		var self = this;
		var choice = null;
		var total;
		var point;

		function find (id) {
			return list.filter(function (variant) {
				return String(variant.ID) === String(id);
			})[0];
		}

		if (forced.indexOf(':') !== -1)
			forced = forced.split(':')[0] === String(experiment) ? forced.substring(forced.indexOf(':') + 1) : '';

		if (forced && find(forced)) {
			choice = {Variant: find(forced), Reason: 'forced'};
		}
		else {
			list.some(function (variant) {
				if (variant.When && self.Match(variant.When, context))
					choice = {Variant: variant, Reason: 'rule'};

				return !!choice;
			});
		}

		if (!choice && kept && split.indexOf(find(kept)) !== -1)
			choice = {Variant: find(kept), Reason: 'remembered'};

		/* A split by the weights: the variant kept, so that the visitor sees it again. */
		if (!choice && split.length) {
			total = split.reduce(function (sum, variant) {
				return sum + Math.max(0, variant.Weight === undefined || variant.Weight === null ? 1 : Number(variant.Weight) || 0);
			}, 0);
			point = (typeof given.Random === 'function' ? given.Random() : Math.random()) * total;

			split.some(function (variant) {
				point -= Math.max(0, variant.Weight === undefined || variant.Weight === null ? 1 : Number(variant.Weight) || 0);

				if (point < 0)
					choice = {Variant: variant, Reason: 'split'};

				return !!choice;
			});

			if (!choice && total > 0)
				choice = {Variant: split[split.length - 1], Reason: 'split'};

			if (choice)
				Elemenx.Storage.Local.Set(key, String(choice.Variant.ID));
		}

		if (!choice) {
			choice = list.filter(function (variant) {
				return variant.Default === true || variant.Default === 'true';
			})[0];
			choice = choice ? {Variant: choice, Reason: 'default'} : null;
		}

		if (!choice) {
			delete this.Choices[experiment];

			return null;
		}

		this.Choices[experiment] = {Experiment: experiment, ID: String(choice.Variant.ID), Variant: choice.Variant, Reason: choice.Reason, Context: context};

		return {Experiment: experiment, ID: String(choice.Variant.ID), Variant: choice.Variant, Reason: choice.Reason};
	},

	Chosen: function (experiment) {
		var choice = this.Choices[experiment];

		return choice ? {Experiment: experiment, ID: choice.ID, Variant: choice.Variant, Reason: choice.Reason} : null;
	},

	Forget: function (experiment) {
		var prefix = this.StorageKey + ':';

		if (experiment !== undefined && experiment !== null) {
			Elemenx.Storage.Local.Remove(prefix + experiment);

			delete this.Choices[experiment];

			return;
		}

		Object.keys(this.Choices).forEach(function (name) {
			Elemenx.Storage.Local.Remove(prefix + name);
		});

		this.Choices = {};
	},

	/* An event of an experiment for the analytics: what was chosen for whom, and where the visitor came from. */
	Event: function (type, experiment, goal, data) {
		var choice = this.Choices[experiment];
		var context = choice ? choice.Context : this.Context();
		var event = {
			Type: type,
			Experiment: experiment,
			Variant: choice ? choice.ID : null,
			Reason: choice ? choice.Reason : null,
			Goal: goal || null,
			Visitor: this.Visitor.ID,
			Source: context.UTM.Source,
			Medium: context.UTM.Medium,
			Campaign: context.UTM.Campaign,
			Referrer: context.Referrer,
			Language: context.Language,
			Device: context.Device,
			Data: data === undefined ? null : data,
			Time: new Date().toISOString()
		};

		this.Listeners.Tell(event);

		return event;
	},

	/* The variant was seen: told once for a page and its variant. */
	View: function (experiment, data) {
		var choice = this.Choices[experiment];
		var key = experiment + '\u0000' + (choice ? choice.ID : '');
		if (this.Viewed[key]) return null;

		this.Viewed[key] = true;

		return this.Event('view', experiment, null, data);
	},

	Convert: function (experiment, goal, data) {
		return this.Event('conversion', experiment, goal || 'conversion', data);
	},

	/* A conversion of every Experiment an element of the page stands in (a button of a landing), of the one named, or of none. */
	Goal: function (element, goal, data) {
		var self = this;
		var experiments = [];
		var node = element && element.closest ? element.closest('.elemenx-experiment') : null;

		if (typeof element === 'string')
			return [this.Convert(element, goal, data)];

		while (node) {
			experiments.push(node.getAttribute('data-experiment') || 'experiment');

			node = node.parentNode && node.parentNode.closest ? node.parentNode.closest('.elemenx-experiment') : null;
		}

		if (!experiments.length)
			return [this.Convert(null, goal, data)];

		return experiments.map(function (experiment) {
			return self.Convert(experiment, goal, data);
		});
	},

	OnEvent: function (callback) {
		return this.Listeners.On(callback);
	},

	OffEvent: function (callback) {
		this.Listeners.Off(callback);
	}
});
