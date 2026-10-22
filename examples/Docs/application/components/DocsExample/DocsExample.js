/*
 * An example of a page: its code (a template of Elemenx), and beside it the same template running as a component of
 * its own. The component is made once for a code and lives as long as the example.
 */
Elemenx.Component('DocsExample', {
	$TemplateURL: 'DocsExample.html',
	$StyleURL: 'DocsExample.css',
	Code: '',
	Failure: '',

	$OnCreate: function () {
		var own = {Instance: null};

		/* The running component: kept out of the state. */
		this.Own = function () {
			return own;
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
	 * The template and the definition of an example: a <script> after the template holds the object of the definition
	 * (its state and methods), as ({Count: 0, Add: function () {...}}).
	 */
	Definition: function (code) {
		var match = /<script>([\s\S]*?)<\/script>\s*$/.exec(code);
		var definition = match ? new Function('return (' + match[1] + ');')() : {};

		definition.$Template = '<div class="docs-example-root">' + (match ? code.substring(0, match.index) : code) + '</div>';

		return definition;
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

			/* In the Application of the reference: the components of ElemenxUI the example names load as in any template. */
			this.Own().Instance = Elemenx.Component(name)({}, null, {Application: this.$Application()});

			result.appendChild(this.Own().Instance.$Element());
		}
		catch (error) {
			this.Failure = error.message;
		}
	}
});
