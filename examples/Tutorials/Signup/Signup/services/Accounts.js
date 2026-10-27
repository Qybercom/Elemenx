/*
 * The accounts, on the server (Server.Request of elemenx.config.js): IsFree(name, callback) calls back (error, true or
 * false), Create(account, callback) calls back (error, {ID}) or, when the server refuses it, (null, {Errors}), the
 * errors by the name of a field.
 */
Elemenx.Service('Accounts', {
	/* A request with a JSON answer: callback(error, status, value). */
	Ask: function (method, url, data, callback) {
		var request = this.$Network().XHR({Method: method, URL: url, Data: data === null ? null : JSON.stringify(data), Headers: {'Content-Type': 'application/json'}, ResponseType: 'text'});

		request.On('Transport.Success', function (event) {
			var value;

			try {
				value = JSON.parse(event.Data.Response);
			}
			catch (error) {
				callback(new Error('The server answered no JSON: ' + url));

				return;
			}

			callback(null, event.Data.Status, value);
		});

		request.On('Transport.Error', function () {
			callback(new Error('The network failed: ' + url));
		});

		request.Execute();
	},

	IsFree: function (name, callback) {
		this.Ask('GET', '/api/names?name=' + encodeURIComponent(name), null, function (error, status, value) {
			callback(error, !error && value.Free);
		});
	},

	Create: function (account, callback) {
		this.Ask('POST', '/api/accounts', account, function (error, status, value) {
			if (error) callback(error);
			else if (status === 201) callback(null, {ID: value.ID});
			else if (status === 422) callback(null, {Errors: value.Errors});
			else callback(new Error('The server answered ' + status));
		});
	}
});
