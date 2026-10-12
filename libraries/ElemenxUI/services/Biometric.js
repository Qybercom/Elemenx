/*
 * The fingerprint, face or PIN of the device (Touch ID, Windows Hello, Android) through WebAuthn: HTTPS or localhost.
 * Every method takes callback(error, result); error.name is the name of the browser error ('NotAllowedError' when the
 * user cancels, 'NotSupportedError' without WebAuthn).
 * - Available(callback): {Supported (WebAuthn), Platform (an authenticator built into the device)}.
 * - Register(options, callback): a new credential of this device. options: {Challenge (from the server: an
 *   ArrayBuffer or base64url), User: {ID, Name, DisplayName}, RelyingParty: {ID, Name}, Timeout}. The result,
 *   {ID, Type, ClientData, AttestationObject, Transports} in base64url, goes to the server to keep.
 * - Verify(options, callback): the user proves to be there. options: {Challenge, Credentials (the IDs kept by the
 *   server), RelyingParty ID, Timeout}. The result {ID, ClientData, AuthenticatorData, Signature, UserHandle} goes to
 *   the server, which checks the signature: only that check makes it secure.
 * - Check(callback): the user verification of this device without a server (the first Check registers the device in
 *   localStorage, StorageKey). It is a convenience, not a security measure: a script of the page can skip it.
 * - Forget(): drops the registration of Check.
 * - Guard(options): a guard for Reveal.Guard. Without options it uses Check; with options.Challenge(done) (done(error,
 *   challenge, credentials)) and options.Confirm(result, done) (done(error, true)) it asks the server.
 */
Elemenx.Service('Biometric', {
	StorageKey: 'elemenx-biometric',
	Name: 'Elemenx',

	Supported: function () {
		return typeof window.PublicKeyCredential === 'function' && !!navigator.credentials && typeof navigator.credentials.create === 'function';
	},

	Available: function (callback) {
		var supported = this.Supported();

		if (!supported || typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
			callback(null, {Supported: supported, Platform: false});

			return;
		}

		window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(function (platform) {
			callback(null, {Supported: true, Platform: !!platform});
		}, function () {
			callback(null, {Supported: true, Platform: false});
		});
	},

	/* base64url of bytes, and bytes of base64url (an ArrayBuffer or a typed array passes through). */
	Encode: function (buffer) {
		var bytes = new Uint8Array(buffer);
		var text = '';
		var i = 0;

		while (i < bytes.length) {
			text += String.fromCharCode(bytes[i]);

			i++;
		}

		return window.btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	},

	Decode: function (value) {
		var text;
		var bytes;
		var i = 0;

		if (value instanceof ArrayBuffer) return new Uint8Array(value);

		if (ArrayBuffer.isView(value))
			return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);

		text = window.atob(String(value).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(value).length + 3) % 4));
		bytes = new Uint8Array(text.length);

		while (i < text.length) {
			bytes[i] = text.charCodeAt(i);

			i++;
		}

		return bytes;
	},

	Random: function (length) {
		var bytes = new Uint8Array(length);

		window.crypto.getRandomValues(bytes);

		return bytes;
	},

	Failure: function (name, message) {
		var error = new Error(message);

		error.name = name;

		return error;
	},

	Register: function (options, callback) {
		var self = this;
		var user = options.User || {};
		var party = options.RelyingParty || {};
		var publicKey;

		if (!this.Supported()) {
			callback(this.Failure('NotSupportedError', 'WebAuthn is not supported here'));

			return;
		}

		publicKey = {
			challenge: this.Decode(options.Challenge),
			rp: party.ID ? {id: party.ID, name: party.Name || this.Name} : {name: party.Name || this.Name},
			user: {
				id: typeof user.ID === 'string' ? new TextEncoder().encode(user.ID) : this.Decode(user.ID),
				name: user.Name || 'user',
				displayName: user.DisplayName || user.Name || 'User'
			},
			pubKeyCredParams: [{type: 'public-key', alg: -7}, {type: 'public-key', alg: -257}],
			authenticatorSelection: {authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred'},
			attestation: 'none',
			timeout: options.Timeout || 60000
		};

		navigator.credentials.create({publicKey: publicKey}).then(function (credential) {
			callback(null, {
				ID: self.Encode(credential.rawId),
				Type: credential.type,
				ClientData: self.Encode(credential.response.clientDataJSON),
				AttestationObject: self.Encode(credential.response.attestationObject),
				Transports: typeof credential.response.getTransports === 'function' ? credential.response.getTransports() : []
			});
		}, function (error) {
			callback(error);
		});
	},

	Verify: function (options, callback) {
		var self = this;
		var publicKey;

		if (!this.Supported()) {
			callback(this.Failure('NotSupportedError', 'WebAuthn is not supported here'));

			return;
		}

		publicKey = {
			challenge: this.Decode(options.Challenge),
			allowCredentials: (options.Credentials || []).map(function (id) {
				return {type: 'public-key', id: self.Decode(id)};
			}),
			userVerification: 'required',
			timeout: options.Timeout || 60000
		};

		if (options.RelyingParty)
			publicKey.rpId = options.RelyingParty;

		navigator.credentials.get({publicKey: publicKey}).then(function (credential) {
			callback(null, {
				ID: self.Encode(credential.rawId),
				ClientData: self.Encode(credential.response.clientDataJSON),
				AuthenticatorData: self.Encode(credential.response.authenticatorData),
				Signature: self.Encode(credential.response.signature),
				UserHandle: credential.response.userHandle ? self.Encode(credential.response.userHandle) : null
			});
		}, function (error) {
			callback(error);
		});
	},

	Registered: function () {
		try {
			return window.localStorage.getItem(this.StorageKey) || '';
		}
		catch (error) {
			return '';
		}
	},

	Check: function (callback) {
		var self = this;
		var id = this.Registered();

		if (id) {
			this.Verify({Challenge: this.Random(32), Credentials: [id]}, function (error) {
				callback(error || null, !error);
			});

			return;
		}

		this.Register({Challenge: this.Random(32), User: {ID: this.Random(16), Name: 'device', DisplayName: 'This device'}}, function (error, result) {
			if (error) {
				callback(error, false);

				return;
			}

			try {
				window.localStorage.setItem(self.StorageKey, result.ID);
			}
			catch (failure) {
				/* Without storage the next Check registers again. */
			}

			callback(null, true);
		});
	},

	Forget: function () {
		try {
			window.localStorage.removeItem(this.StorageKey);
		}
		catch (error) {
			/* Nothing kept. */
		}
	},

	/* A guard for the Reveal Service: the value shows only after the user passed the check. */
	Guard: function (options) {
		var self = this;

		options = options || {};

		return function (request) {
			if (typeof options.Challenge !== 'function') {
				self.Check(function (error, passed) {
					if (passed) request.Allow();
					else request.Deny();
				});

				return;
			}

			options.Challenge(function (error, challenge, credentials) {
				if (error) {
					request.Deny();

					return;
				}

				self.Verify({Challenge: challenge, Credentials: credentials || []}, function (failure, result) {
					if (failure) {
						request.Deny();

						return;
					}

					options.Confirm(result, function (rejected, confirmed) {
						if (!rejected && confirmed) request.Allow();
						else request.Deny();
					});
				});
			});
		};
	}
});
