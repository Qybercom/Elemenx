/*
 * Reads QR codes (and other barcodes, Formats) from the camera: the picture of the camera at the back of a phone in
 * a frame, and scan with {Value, Format} for each code read. Continuous false (the default) stops after the first
 * code; true goes on (a new code each time, the same one again after Repeat milliseconds). Active starts and stops the
 * camera (Start() and Stop() too). The browser reads the codes (BarcodeDetector: Chrome and Edge on Android, ChromeOS
 * and macOS, Safari): elsewhere, and when the camera is refused, it says so and emits error ({Reason: 'unsupported',
 * 'denied' or 'camera'}); the content of its tag shows then (a field to type the code).
 */
Elemenx.Component('QRScanner', {
	$TemplateURL: 'QRScanner.html',
	$StyleURL: 'QRScanner.css',
	$Meta: {
		Group: 'media',
		Icon: 'camera',
		Description: 'Reads QR codes (and other barcodes) from the camera.',
		Container: true,
		Events: {
			scan: 'A code was read: {Value, Format}.',
			error: 'It cannot read: {Reason: unsupported, denied or camera}.'
		},
		Props: {
			Active: 'Runs the camera.',
			Continuous: 'Goes on reading after a code.',
			Repeat: 'The milliseconds before the same code counts again (2000).',
			Formats: 'The formats read: [\'qr_code\'] by default (ean_13, code_128...).',
			Height: 'The height of the picture in pixels.',
			Label: 'The name of the scanner for screen readers.'
		}
	},
	Active: true,
	Continuous: false,
	Repeat: 2000,
	Formats: ['qr_code'],
	Height: 280,
	Label: '',
	State: 'idle',
	Last: '',

	$OnCreate: function () {
		var own = {Stream: null, Timer: 0, Detector: null, Seen: {}};

		this.Own = function () {
			return own;
		};
	},

	$OnReady: function () {
		if (this.Active && this.Active !== 'false')
			this.Start();
	},

	$OnProps: function (changed) {
		if (changed.Active === undefined) return;

		if (this.Active && this.Active !== 'false') this.Start();
		else this.Stop();
	},

	$OnSleep: function () {
		this.Stop();
	},

	$OnWake: function () {
		if (this.Active && this.Active !== 'false')
			this.Start();
	},

	$OnDestroy: function () {
		this.Stop();
	},

	/* The phrase of a reason it cannot read. */
	Problem: function (state) {
		var problems = {unsupported: {Key: 'ui.qrScanner.unsupported'}, denied: {Key: 'ui.qrScanner.denied'}, camera: {Key: 'ui.qrScanner.camera'}};

		return problems[state] ? problems[state].Key : '';
	},

	Supported: function () {
		return typeof window.BarcodeDetector === 'function' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
	},

	Fail: function (reason) {
		this.State = reason;

		this.$Emit('error', {Reason: reason});
	},

	Start: function () {
		var self = this;
		var own = this.Own();
		if (own.Stream || this.State === 'starting') return this;

		if (!this.Supported()) {
			this.Fail('unsupported');

			return this;
		}

		this.State = 'starting';

		try {
			own.Detector = new window.BarcodeDetector({formats: this.Formats && this.Formats.length ? this.Formats : ['qr_code']});
		}
		catch (error) {
			this.Fail('unsupported');

			return this;
		}

		navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}, audio: false}).then(function (stream) {
			var video = self.$Element() && self.$Element().querySelector('.elemenx-qr-scanner-video');
			var playing;

			if (self.State !== 'starting' || !video) {
				stream.getTracks().forEach(function (track) {
					track.stop();
				});

				return;
			}

			own.Stream = stream;
			video.srcObject = stream;

			/* A stop before the picture plays rejects play(): nothing is lost. */
			playing = video.play();

			if (playing && playing.catch)
				playing.catch(function () {});

			self.State = 'active';

			self.Read();
		}, function (error) {
			self.Fail(error && (error.name === 'NotAllowedError' || error.name === 'SecurityError') ? 'denied' : 'camera');
		});

		return this;
	},

	Stop: function () {
		var own = this.Own();
		var video = this.$Element() && this.$Element().querySelector('.elemenx-qr-scanner-video');

		if (own.Timer)
			window.clearTimeout(own.Timer);

		own.Timer = 0;

		if (own.Stream) {
			own.Stream.getTracks().forEach(function (track) {
				track.stop();
			});
		}

		own.Stream = null;

		if (video)
			video.srcObject = null;

		if (this.State === 'active' || this.State === 'starting')
			this.State = 'idle';

		return this;
	},

	/* A look at the picture five times a second; a code seen again within Repeat does not count. */
	Read: function () {
		var self = this;
		var own = this.Own();
		var video = this.$Element().querySelector('.elemenx-qr-scanner-video');

		if (!own.Stream) return;

		own.Detector.detect(video).then(function (codes) {
			var now = Date.now();
			var code = codes && codes[0];

			if (!own.Stream) return;

			if (code && (!own.Seen[code.rawValue] || now - own.Seen[code.rawValue] > Number(self.Repeat))) {
				own.Seen[code.rawValue] = now;
				self.Last = code.rawValue;

				self.$Emit('scan', {Value: code.rawValue, Format: code.format});

				if (!self.Continuous || self.Continuous === 'false') {
					self.Stop();

					self.State = 'done';

					return;
				}
			}

			own.Timer = window.setTimeout(function () {
				self.Read();
			}, 200);
		}, function () {
			own.Timer = window.setTimeout(function () {
				self.Read();
			}, 400);
		});
	}
});
