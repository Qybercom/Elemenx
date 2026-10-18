/*
 * USB devices through WebUSB (Chrome and Edge; HTTPS or localhost): devices with a driver of their own, not the
 * ones the system keeps (keyboards, disks). Every method takes callback(error, result); error.name is the name of the
 * browser error ('NotFoundError' when the user picks no device, 'NotSupportedError' without WebUSB).
 * - Supported(). Request({Filters: [{VendorID, ProductID, ClassCode}]}, callback): the user picks a device (from a
 *   press); the result is a device. Devices(callback): the devices the user already allowed.
 * - A device: Info {VendorID, ProductID, Name, Manufacturer, Serial}; Open({Configuration (1), Interface (0)},
 *   callback) opens it and claims the interface; TransferIn(endpoint, length, callback) reads (a Uint8Array);
 *   TransferOut(endpoint, data, callback) writes a text or bytes (the count written); Control({Type, Recipient,
 *   Request, Value, Index}, data or length, callback): a control transfer, in with a length, out with data;
 *   Close(callback); Opened().
 * - On('connect' or 'disconnect', callback): a device of the page joins or leaves ({Device}).
 */
Elemenx.Service('USB', {
	$OnCreate: function () {
		var self = this;

		this.Listeners = {connect: [], disconnect: []};
		this.Known = [];

		this.Changed = function (event) {
			var device = self.Device(event.device);

			(self.Listeners[event.type] || []).slice().forEach(function (callback) {
				callback({Device: device});
			});
		};

		if (this.Supported()) {
			navigator.usb.addEventListener('connect', this.Changed);
			navigator.usb.addEventListener('disconnect', this.Changed);
		}
	},

	$OnDestroy: function () {
		if (this.Supported()) {
			navigator.usb.removeEventListener('connect', this.Changed);
			navigator.usb.removeEventListener('disconnect', this.Changed);
		}
	},

	Supported: function () {
		return typeof navigator !== 'undefined' && !!navigator.usb;
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
			callback(this.Fail('NotSupportedError', 'Elemenx USB: this browser has no WebUSB'));

			return;
		}

		navigator.usb.requestDevice({filters: ((options || {}).Filters || []).map(function (filter) {
			var result = {};

			if (filter.VendorID != null)
				result.vendorId = Number(filter.VendorID);

			if (filter.ProductID != null)
				result.productId = Number(filter.ProductID);

			if (filter.ClassCode != null)
				result.classCode = Number(filter.ClassCode);

			return result;
		})}).then(function (device) {
			callback(null, self.Device(device));
		}, callback);
	},

	Devices: function (callback) {
		var self = this;

		if (!this.Supported()) {
			callback(null, []);

			return;
		}

		navigator.usb.getDevices().then(function (devices) {
			callback(null, devices.map(function (device) {
				return self.Device(device);
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

	/* The handle of a device of the browser: one for each device. */
	Device: function (device) {
		var known = this.Known.filter(function (entry) {
			return entry.Native === device;
		})[0];
		var claimed = null;
		var handle;
		var bytes = function (data) {
			return typeof data === 'string' ? new TextEncoder().encode(data) : data;
		};
		var setup = function (options) {
			return {requestType: options.Type || 'vendor', recipient: options.Recipient || 'device', request: Number(options.Request) || 0, value: Number(options.Value) || 0, index: Number(options.Index) || 0};
		};

		if (known)
			return known.Handle;

		handle = {
			Info: {VendorID: device.vendorId, ProductID: device.productId, Name: device.productName || '', Manufacturer: device.manufacturerName || '', Serial: device.serialNumber || ''},
			Native: device,
			Opened: function () {
				return !!device.opened;
			},
			Open: function (options, callback) {
				options = options || {};
				callback = callback || function () {};

				device.open().then(function () {
					if (device.configuration === null)
						return device.selectConfiguration(options.Configuration == null ? 1 : Number(options.Configuration));
				}).then(function () {
					claimed = options.Interface == null ? 0 : Number(options.Interface);

					return device.claimInterface(claimed);
				}).then(function () {
					callback(null, handle);
				}, callback);
			},
			TransferIn: function (endpoint, length, callback) {
				device.transferIn(Number(endpoint), Number(length) || 64).then(function (result) {
					callback(null, result.data ? new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength) : new Uint8Array(0));
				}, callback);
			},
			TransferOut: function (endpoint, data, callback) {
				callback = callback || function () {};

				device.transferOut(Number(endpoint), bytes(data)).then(function (result) {
					callback(null, result.bytesWritten);
				}, callback);
			},
			Control: function (options, data, callback) {
				var call = typeof data === 'number' ? device.controlTransferIn(setup(options || {}), data) : device.controlTransferOut(setup(options || {}), data == null ? undefined : bytes(data));

				callback = callback || function () {};

				call.then(function (result) {
					callback(null, result.data ? new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength) : result.bytesWritten);
				}, callback);
			},
			Close: function (callback) {
				callback = callback || function () {};

				(claimed === null ? Promise.resolve() : device.releaseInterface(claimed).catch(function () {})).then(function () {
					return device.close();
				}).then(function () {
					claimed = null;

					callback(null, true);
				}, callback);
			}
		};

		this.Known.push({Native: device, Handle: handle});

		return handle;
	}
});
