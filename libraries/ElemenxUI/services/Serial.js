/*
 * Serial ports (COM ports, UART: Arduino, GPS, scales, printers...) through Web Serial: Chrome and Edge on the
 * desktop, HTTPS or localhost. Every method takes callback(error, result); error.name is the name of the browser
 * error ('NotFoundError' when the user picks no port, 'NotSupportedError' without Web Serial).
 * - Supported(). Request({Filters: [{VendorID, ProductID}]}, callback): the user picks a port (from a press: the
 *   browser asks for a gesture); the result is a port. Ports(callback): the ports the user already allowed.
 * - A port: Info {VendorID, ProductID}; Open({BaudRate (9600), DataBits, StopBits, Parity, FlowControl, Text}, callback)
 *   opens it and starts reading: the data event carries what comes (a text with Text: true, the default, or a
 *   Uint8Array), the line event each line of text; Write(data, callback) sends a text or bytes; Signals({DTR, RTS,
 *   Break}, callback); Close(callback); On(name, callback) / Off(name, callback) for data, line, error and close;
 *   Opened().
 * - On('connect' or 'disconnect', callback): a port of the page joins or leaves ({Port}).
 */
Elemenx.Service('Serial', {
	$OnCreate: function () {
		var self = this;

		this.Listeners = {connect: [], disconnect: []};
		this.Known = [];

		this.Changed = function (event) {
			var port = self.Port(event.target || event.port);

			(self.Listeners[event.type] || []).slice().forEach(function (callback) {
				callback({Port: port});
			});
		};

		if (this.Supported()) {
			navigator.serial.addEventListener('connect', this.Changed);
			navigator.serial.addEventListener('disconnect', this.Changed);
		}
	},

	$OnDestroy: function () {
		if (this.Supported()) {
			navigator.serial.removeEventListener('connect', this.Changed);
			navigator.serial.removeEventListener('disconnect', this.Changed);
		}
	},

	Supported: function () {
		return typeof navigator !== 'undefined' && !!navigator.serial;
	},

	Fail: function (name, message) {
		var error = new Error(message);

		error.name = name;

		return error;
	},

	Request: function (options, callback) {
		var self = this;

		if (typeof options === 'function') {
			callback = options;
			options = {};
		}

		if (!this.Supported()) {
			callback(this.Fail('NotSupportedError', 'Elemenx Serial: this browser has no Web Serial'));

			return;
		}

		navigator.serial.requestPort({filters: ((options || {}).Filters || []).map(function (filter) {
			var result = {};

			if (filter.VendorID != null)
				result.usbVendorId = Number(filter.VendorID);

			if (filter.ProductID != null)
				result.usbProductId = Number(filter.ProductID);

			return result;
		})}).then(function (port) {
			callback(null, self.Port(port));
		}, callback);
	},

	Ports: function (callback) {
		var self = this;

		if (!this.Supported()) {
			callback(null, []);

			return;
		}

		navigator.serial.getPorts().then(function (ports) {
			callback(null, ports.map(function (port) {
				return self.Port(port);
			}));
		}, callback);
	},

	On: function (name, callback) {
		if (this.Listeners[name])
			this.Listeners[name].push(callback);
	},

	Off: function (name, callback) {
		if (this.Listeners[name]) {
			this.Listeners[name] = this.Listeners[name].filter(function (item) {
				return item !== callback;
			});
		}
	},

	/* The handle of a port of the browser: one for each port, so its state and listeners stay. */
	Port: function (port) {
		var known = this.Known.filter(function (entry) {
			return entry.Native === port;
		})[0];
		var info = port.getInfo ? port.getInfo() : {};
		var listeners = {data: [], line: [], error: [], close: []};
		var state = {Open: false, Reader: null, Text: true, Rest: ''};
		var decoder = typeof TextDecoder === 'function' ? new TextDecoder() : null;
		var handle;
		var emit = function (name, value) {
			listeners[name].slice().forEach(function (callback) {
				callback(value);
			});
		};
		var read = function () {
			var reader = port.readable && port.readable.getReader();
			if (!reader) return;

			state.Reader = reader;

			(function next () {
				reader.read().then(function (result) {
					var text;
					var lines;

					if (result.done) {
						reader.releaseLock();

						state.Reader = null;

						return;
					}

					if (state.Text && decoder) {
						text = decoder.decode(result.value, {stream: true});
						lines = (state.Rest + text).split(/\r?\n/);

						state.Rest = lines.pop();

						emit('data', text);

						lines.forEach(function (line) {
							emit('line', line);
						});
					}
					else {
						emit('data', result.value);
					}

					next();
				}, function (error) {
					state.Reader = null;

					emit('error', error);
				});
			})();
		};

		if (known)
			return known.Handle;

		handle = {
			Info: {VendorID: info.usbVendorId == null ? null : info.usbVendorId, ProductID: info.usbProductId == null ? null : info.usbProductId},
			Native: port,
			Opened: function () {
				return state.Open;
			},
			Open: function (options, callback) {
				options = options || {};
				callback = callback || function () {};

				state.Text = options.Text !== false;

				port.open({baudRate: Number(options.BaudRate) || 9600, dataBits: options.DataBits || 8, stopBits: options.StopBits || 1, parity: options.Parity || 'none', flowControl: options.FlowControl || 'none'}).then(function () {
					state.Open = true;

					read();

					callback(null, handle);
				}, callback);
			},
			Write: function (data, callback) {
				var writer;
				var bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;

				callback = callback || function () {};

				if (!state.Open || !port.writable) {
					callback(new Error('Elemenx Serial: the port is not open'));

					return;
				}

				writer = port.writable.getWriter();

				writer.write(bytes).then(function () {
					writer.releaseLock();

					callback(null, bytes.length);
				}, function (error) {
					writer.releaseLock();

					callback(error);
				});
			},
			Signals: function (signals, callback) {
				var value = {};

				signals = signals || {};
				callback = callback || function () {};

				if (signals.DTR != null)
					value.dataTerminalReady = !!signals.DTR;

				if (signals.RTS != null)
					value.requestToSend = !!signals.RTS;

				if (signals.Break != null)
					value.break = !!signals.Break;

				port.setSignals(value).then(function () {
					callback(null, true);
				}, callback);
			},
			Close: function (callback) {
				var reader = state.Reader;

				callback = callback || function () {};

				(reader ? reader.cancel() : Promise.resolve()).then(function () {
					return port.close();
				}).then(function () {
					state.Open = false;

					emit('close', handle);

					callback(null, true);
				}, callback);
			},
			On: function (name, callback) {
				if (listeners[name])
					listeners[name].push(callback);
			},
			Off: function (name, callback) {
				if (listeners[name]) {
					listeners[name] = listeners[name].filter(function (item) {
						return item !== callback;
					});
				}
			}
		};

		this.Known.push({Native: port, Handle: handle});

		return handle;
	}
});
