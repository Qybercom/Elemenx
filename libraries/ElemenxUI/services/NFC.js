/*
 * NFC tags through Web NFC: Chrome on Android, HTTPS. Every method takes callback(error, result); error.name is the
 * name of the browser error ('NotAllowedError' when the user refuses, 'NotSupportedError' without Web NFC).
 * - Supported().
 * - Scan(callback): reads the tags held to the device until Stop(); callback(error, tag) for each one, tag {Serial,
 *   Records: [{Type, Text, URL, Data (a Uint8Array), MediaType, ID, Language}]} (Text for a text, URL for a link).
 *   Stop() ends it.
 * - Write(message, options, callback): writes a tag held to the device. message: a text, {URL}, {Text, Language} or
 *   {Records: [{Type, Text, URL, Data, MediaType, ID}]}; options: {Overwrite (true)}.
 * - Lock(callback): makes the tag held to the device read only, for good.
 */
Elemenx.Service('NFC', {
	$OnCreate: function () {
		this.Reading = null;
	},

	$OnDestroy: function () {
		this.Stop();
	},

	Supported: function () {
		return typeof window !== 'undefined' && typeof window.NDEFReader === 'function';
	},

	Fail: function (name, message) {
		var error = new Error(message);

		error.name = name;

		return error;
	},

	/* A record of the browser as plain data. */
	Record: function (record) {
		var decoder = typeof TextDecoder === 'function' ? new TextDecoder(record.encoding || 'utf-8') : null;
		var data = record.data ? new Uint8Array(record.data.buffer, record.data.byteOffset, record.data.byteLength) : null;
		var result = {Type: record.recordType, MediaType: record.mediaType || null, ID: record.id || null, Language: record.lang || null, Data: data};

		if (decoder && data && (record.recordType === 'text' || record.recordType === 'url' || record.recordType === 'absolute-url'))
			result[record.recordType === 'text' ? 'Text' : 'URL'] = decoder.decode(data);

		return result;
	},

	Scan: function (callback) {
		var self = this;
		var reader;
		var controller;

		if (!this.Supported()) {
			callback(this.Fail('NotSupportedError', 'Elemenx NFC: this browser has no Web NFC'));

			return;
		}

		this.Stop();

		reader = new window.NDEFReader();
		controller = typeof AbortController === 'function' ? new AbortController() : null;

		reader.onreading = function (event) {
			callback(null, {Serial: event.serialNumber || '', Records: Array.prototype.map.call(event.message.records || [], function (record) {
				return self.Record(record);
			})});
		};

		reader.onreadingerror = function () {
			callback(self.Fail('NotReadableError', 'Elemenx NFC: the tag could not be read'));
		};

		this.Reading = controller;

		reader.scan(controller ? {signal: controller.signal} : {}).then(null, function (error) {
			self.Reading = null;

			callback(error);
		});
	},

	Stop: function () {
		if (this.Reading)
			this.Reading.abort();

		this.Reading = null;
	},

	/* A message to write as the browser takes it. */
	Message: function (message) {
		if (typeof message === 'string') return message;

		if (message && message.Records) {
			return {records: message.Records.map(function (record) {
				var result = {recordType: record.Type || (record.URL ? 'url' : 'text')};

				if (record.URL) result.data = record.URL;
				else if (record.Text != null) result.data = record.Text;
				else if (record.Data) result.data = record.Data;

				if (record.MediaType)
					result.mediaType = record.MediaType;

				if (record.ID)
					result.id = record.ID;

				if (record.Language)
					result.lang = record.Language;

				return result;
			})};
		}

		if (message && message.URL)
			return {records: [{recordType: 'url', data: message.URL}]};

		return {records: [{recordType: 'text', data: String(message && message.Text || ''), lang: message && message.Language || undefined}]};
	},

	Write: function (message, options, callback) {
		if (typeof options === 'function') {
			callback = options;
			options = {};
		}

		callback = callback || function () {};

		if (!this.Supported()) {
			callback(this.Fail('NotSupportedError', 'Elemenx NFC: this browser has no Web NFC'));

			return;
		}

		new window.NDEFReader().write(this.Message(message), {overwrite: !options || options.Overwrite !== false}).then(function () {
			callback(null, true);
		}, callback);
	},

	Lock: function (callback) {
		callback = callback || function () {};

		if (!this.Supported() || typeof window.NDEFReader.prototype.makeReadOnly !== 'function') {
			callback(this.Fail('NotSupportedError', 'Elemenx NFC: this browser cannot lock a tag'));

			return;
		}

		new window.NDEFReader().makeReadOnly().then(function () {
			callback(null, true);
		}, callback);
	}
});
