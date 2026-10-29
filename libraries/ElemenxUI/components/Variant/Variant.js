/*
 * A variant of an Experiment: its content shows only when the Experiment chose it for the visitor. <Variant ID="ads"
 * Source="google" Campaign="spring">. ID names it; its rule: Source, Medium, Campaign, Term, Content (the UTM tags),
 * Language, Device, Referrer (texts, several separated by commas), Params (name=value&other=value, a name alone when
 * it is only given), Returning (true or false). A variant without a rule takes part in the split by its Weight (1);
 * Default shows when no other one does.
 */
Elemenx.Component('Variant', {
	$TemplateURL: 'Variant.html',
	$Meta: {
		Group: 'layout',
		Icon: 'branch',
		Description: 'A variant of an Experiment, shown when it is chosen for the visitor: <Variant ID="ads" Source="google">.',
		Container: true,
		Props: {
			ID: 'The ID of the variant.',
			Weight: 'Its share of a split (1), when it has no rule.',
			Default: 'Shows it when no other variant does.',
			Source: 'The utm_source it is for (several: separated by commas).',
			Medium: 'The utm_medium it is for.',
			Campaign: 'The utm_campaign it is for.',
			Term: 'The utm_term it is for.',
			Content: 'The utm_content it is for.',
			Language: 'The languages it is for (ru matches ru-RU).',
			Device: 'The devices it is for: phone, tablet, desktop.',
			Referrer: 'A part of the host of the referrer it is for.',
			Params: 'The parameters of the link it is for: name=value&other (given).',
			Returning: 'For visitors who came before (true) or for the first time (false).'
		},
		Sample: {ID: 'ads', Source: 'google'}
	},
	ID: '',
	Weight: null,
	Default: false,
	Source: '',
	Medium: '',
	Campaign: '',
	Term: '',
	Content: '',
	Language: '',
	Device: '',
	Referrer: '',
	Params: '',
	Returning: null,
	Shown: false,

	$OnCreate: function () {
		/* The variant for the Experiment: {ID, Weight, Default, When} (When only with a rule). */
		this.Declared = function (id, weight, fallback, source, medium, campaign, term, content, language, device, referrer, params, returning) {
			var when = {};
			var item = {ID: id};
			var list = function (text) {
				return String(text).split(',').map(function (each) {
					return each.trim();
				}).filter(Boolean);
			};

			[['Source', source], ['Medium', medium], ['Campaign', campaign], ['Term', term], ['Content', content], ['Language', language], ['Device', device], ['Referrer', referrer]].forEach(function (pair) {
				if (pair[1])
					when[pair[0]] = list(pair[1]);
			});

			if (params) {
				when.Params = {};

				String(params).split('&').forEach(function (part) {
					var at = part.indexOf('=');

					if (part.trim())
						when.Params[(at === -1 ? part : part.substring(0, at)).trim()] = at === -1 ? true : list(part.substring(at + 1));
				});
			}

			if (returning === true || returning === 'true') when.Returning = true;
			else if (returning === false || returning === 'false') when.Returning = false;

			if (weight !== null && weight !== undefined && weight !== '')
				item.Weight = Number(weight);

			if (fallback === true || fallback === 'true')
				item.Default = true;

			if (Object.keys(when).length)
				item.When = when;

			return JSON.stringify(item);
		};
	}
});
