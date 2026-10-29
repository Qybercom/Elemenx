/*
 * An example of a page: its code (a template of Elemenx), and beside it the same template running as a component of
 * its own. The component is made once for a code and lives as long as the example. Its code is shown in listings of
 * their own, a tab each: the template (HTML), the definition of the <script> after it (JS) and the rules of a <style>
 * in it (CSS), the ones it has.
 */
Elemenx.Component('DocsExample', {
	$TemplateURL: 'DocsExample.html',
	$StyleURL: 'DocsExample.css',
	Code: '',
	Failure: '',
	Listing: '',

	$OnCreate: function () {
		var self = this;
		var own = {Instance: null};

		/* The running component: kept out of the state. */
		this.Own = function () {
			return own;
		};

		/* The listings of a code: [{ID, Label, Language, Text}], the template first. */
		this.Listings = function (code) {
			var parts = self.Parts(code);

			return [
				{ID: 'html', Label: 'Example.html', Language: 'html', Text: parts.Template},
				{ID: 'js', Label: 'Example.js', Language: 'js', Text: parts.Script ? 'Elemenx.Component(\'Example\', ' + parts.Script + ');' : ''},
				{ID: 'css', Label: 'Example.css', Language: 'css', Text: parts.Style}
			].filter(function (listing) {
				return listing.Text;
			});
		};

		this.Listed = function (code, listing) {
			var shown = self.Shown(code, listing);

			return self.Listings(code).filter(function (item) {
				return item.ID === shown;
			})[0] || {Text: '', Language: 'html'};
		};

		/* The listing shown: the one picked, or the first. */
		this.Shown = function (code, listing) {
			var listings = self.Listings(code);

			return listings.some(function (item) {
				return item.ID === listing;
			}) ? listing : listings.length ? listings[0].ID : '';
		};
	},

	$OnReady: function () {
		this.Run();
	},

	$OnDestroy: function () {
		if (this.Own().Instance)
			this.Own().Instance.$Destroy();
	},

	/* A name of the code (a hash of it): the same code is the same component. */
	Name: function (code) {
		var hash = 5381;
		var i = 0;

		while (i < code.length) {
			hash = ((hash << 5) + hash + code.charCodeAt(i)) >>> 0;

			i++;
		}

		return 'DocsExample' + hash.toString(36);
	},

	/*
	 * The parts of the code of an example: its template; the object of its definition (its state and methods), in a
	 * <script> after the template, as ({Count: 0, Add: function () {...}}); and its rules, in a <style> of it.
	 */
	Parts: function (code) {
		var script = /<script>([\s\S]*?)<\/script>\s*$/.exec(code);
		var template = script ? code.substring(0, script.index) : code;
		var style = /<style>([\s\S]*?)<\/style>\s*/.exec(template);
		if (style)
			template = template.substring(0, style.index) + template.substring(style.index + style[0].length);

		return {
			Template: template.replace(/^\s+|\s+$/g, ''),
			Script: script ? this.Body(script[1]) : '',
			Style: style ? style[1].replace(/^\n+|\s+$/g, '').replace(/^\t/gm, '') : ''
		};
	},

	/*
	 * The object of the definition in the <script> of an example: the object alone, in parentheses (({Count: 0})), or
	 * the call an Application writes (Elemenx.Component('Example', {Count: 0});).
	 */
	Body: function (script) {
		var text = script.replace(/^\s+|\s+$/g, '');
		var call = /^Elemenx\.Component\(\s*(['"])[^'"]*\1\s*,\s*([\s\S]*?)\s*\)\s*;?$/.exec(text);
		var wrapped = /^\(([\s\S]*)\)$/.exec(text);

		if (call)
			return call[2];

		return wrapped ? wrapped[1] : text;
	},

	Definition: function (code) {
		var parts = this.Parts(code);
		var definition = parts.Script ? new Function('return (' + parts.Script + ');')() : {};

		definition.$Template = '<div class="docs-example-root">' + parts.Template + '</div>';

		if (parts.Style)
			definition.$Style = parts.Style;

		return definition;
	},

	Switched: function (id) {
		this.Listing = id;
	},

	Run: function () {
		var name = this.Name(this.Code);
		var result = this.$Element().querySelector('.docs-example-result');

		/* The examples made so far (a name asked of Elemenx.Component would be looked for in the sources). */
		var made = window.ElemenxDocsExamples = window.ElemenxDocsExamples || {};

		try {
			if (!made[name]) {
				Elemenx.Component(name, this.Definition(this.Code));

				made[name] = true;
			}

			/* In the Application of the Docs: the components of ElemenxUI the example names load as in any template. */
			this.Own().Instance = Elemenx.Component(name)({}, null, {Application: this.$Application()});

			result.appendChild(this.Own().Instance.$Element());
		}
		catch (error) {
			this.Failure = error.message;
		}
	}
});
