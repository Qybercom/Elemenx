/*
 * The posts of the blog: List(callback) gives the list of data/posts.json, Text(id, callback) the Markdown of a post.
 * Both load once and keep what they loaded. callback(error, result).
 */
Elemenx.Service('Posts', {
	$OnCreate: function () {
		this.Loaded = null;
		this.Texts = {};
	},

	/* A file of data/ as a text. */
	Load: function (url, callback) {
		var request = this.$Network().XHR({URL: url, ResponseType: 'text'});

		request.On('Transport.Success', function (event) {
			if (event.Data.Status === 200) callback(null, event.Data.Response);
			else callback(new Error('Not found: ' + url));
		});

		request.On('Transport.Error', function () {
			callback(new Error('The network failed: ' + url));
		});

		request.Execute();
	},

	List: function (callback) {
		var self = this;

		if (this.Loaded) {
			callback(null, this.Loaded);

			return;
		}

		this.Load('/data/posts.json', function (error, text) {
			if (error) {
				callback(error);

				return;
			}

			self.Loaded = JSON.parse(text);

			callback(null, self.Loaded);
		});
	},

	Text: function (id, callback) {
		var self = this;

		if (this.Texts[id]) {
			callback(null, this.Texts[id]);

			return;
		}

		this.Load('/data/posts/' + encodeURIComponent(id) + '.md', function (error, text) {
			if (!error)
				self.Texts[id] = text;

			callback(error, text);
		});
	}
});
