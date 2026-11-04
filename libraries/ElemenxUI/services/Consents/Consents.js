/*
 * The consents the user gave, of any kind: cookies and analytics, the terms of a service, mail of news, the use of the
 * camera. A consent has a Key and a Version, and the choice for each of its purposes: Get(key) is the decision kept
 * ({Version, Choices: {purpose: true or false}, Time}) or null, Granted(key, purpose) whether that purpose is allowed,
 * Set(key, version, choices) keeps a decision, Clear(key) forgets it (the Consent asks again), Valid(key, version)
 * whether a decision of that version is kept. OnChange(callback) / OffChange(callback) report every decision
 * (callback(key, decision or null)), also from another tab of the site. They are kept in localStorage (in memory
 * where the page may not use it), under StorageKey and the key.
 */
Elemenx.Service('Consents', {
	$Meta: {
		Description: 'The consents the user gave, of any kind: cookies and analytics, the terms of a service, the use of the camera.',
		Methods: ['Get(key)', 'Granted(key, purpose)', 'Valid(key, version)', 'Set(key, version, choices)', 'Clear(key)', 'OnChange(callback)', 'OffChange(callback)']
	},
	StorageKey: 'elemenx-consent',

	$OnCreate: function () {
		var self = this;

		this.Listeners = this.$Service('ElemenxHelpers').Listeners();

		/* A decision of another tab of the site. */
		this.Shared = function (event) {
			var prefix = self.StorageKey + ':';
			if (!event.key || event.key.indexOf(prefix) !== 0) return;

			self.Changed(event.key.substring(prefix.length));
		};

		window.addEventListener('storage', this.Shared);
	},

	$OnDestroy: function () {
		window.removeEventListener('storage', this.Shared);
	},

	Name: function (key) {
		return this.StorageKey + ':' + key;
	},

	Get: function (key) {
		var decision = Elemenx.Storage.Local.Get(this.Name(key));

		return decision && typeof decision === 'object' && decision.Choices ? decision : null;
	},

	Granted: function (key, purpose) {
		var decision = this.Get(key);

		return !!(decision && decision.Choices[purpose] === true);
	},

	/* Whether a decision is kept, of this version when one is given: a new version of the terms asks again. */
	Valid: function (key, version) {
		var decision = this.Get(key);

		return !!decision && (version === undefined || version === null || version === '' || String(decision.Version) === String(version));
	},

	Set: function (key, version, choices) {
		var decision = {Version: version === undefined || version === null ? '' : String(version), Choices: {}, Time: new Date().toISOString()};
		var purpose;

		for (purpose in choices || {}) {
			if (Object.prototype.hasOwnProperty.call(choices, purpose))
				decision.Choices[purpose] = choices[purpose] === true;
		}

		Elemenx.Storage.Local.Set(this.Name(key), decision);

		this.Changed(key);

		return decision;
	},

	Clear: function (key) {
		Elemenx.Storage.Local.Remove(this.Name(key));

		this.Changed(key);
	},

	OnChange: function (callback) {
		return this.Listeners.On(callback);
	},

	OffChange: function (callback) {
		this.Listeners.Off(callback);
	},

	Changed: function (key) {
		this.Listeners.Tell(key, this.Get(key));
	}
});
