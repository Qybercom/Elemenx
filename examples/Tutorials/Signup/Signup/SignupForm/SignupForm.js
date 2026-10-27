/*
 * The form to sign up. Its model is made in code: the validators of each field, one of the whole form (the password
 * and its repetition), a name the server checks while it is typed, and a list of phones. The Form shows the errors of a
 * field once it is left, and emits submit only when all of it is valid; the server checks again and may refuse.
 */
Elemenx.Component('SignupForm', {
	$TemplateURL: 'SignupForm.html',
	$StyleURL: 'SignupForm.css',
	Account: null,
	Mismatch: false,
	EmailError: '',
	Refused: '',
	Busy: false,
	Created: '',
	Failure: '',

	$OnCreate: function () {
		var self = this;
		var forms = this.$Service('Forms');
		var rules = forms.Validators;
		var accounts = this.$Service('Accounts');

		/* An async validator: it asks the server once the name stays the same for a moment. */
		function free (control, callback) {
			var name = control.Value;

			window.setTimeout(function () {
				/* Typed on since: only the answer for the present value counts, this one is dropped. */
				if (control.Value !== name) {
					callback(null);

					return;
				}

				accounts.IsFree(name, function (error, isFree) {
					if (error) callback({network: 'The name could not be checked'});
					else callback(isFree ? null : {taken: 'This name is taken'});
				});
			}, 250);
		}

		/* A validator with a text of its own: {key: 'text'}. */
		function digit (control) {
			return !control.Value || /[0-9]/.test(control.Value) ? null : {digit: 'Add a digit'};
		}

		this.Account = forms.Group({
			Name: forms.Control('', {Validators: [rules.Required, rules.MinLength(3), rules.Pattern('[A-Za-z0-9_]+')], Async: [free]}),
			Email: forms.Control('', [rules.Required, rules.Email]),
			Password: forms.Control('', [rules.Required, rules.MinLength(8), digit]),
			Repeat: forms.Control('', [rules.Required]),
			Phones: forms.Array([forms.Control('', [rules.Pattern('\\+?[0-9 ]{6,}')])]),
			Terms: forms.Control(false, [rules.RequiredTrue])
		}, [rules.Equal('Password', 'Repeat')]);

		/* The error of the whole form goes under the repetition, once it is left; the refusal of the server under the
		 * email, until the email changes. */
		this.Watch = function () {
			self.Mismatch = !!self.Account.Error('equal') && self.Account.Get('Repeat').Touched;

			if (self.Account.Get('Email').Value !== self.Refused)
				self.EmailError = '';
		};

		this.Account.OnChange(this.Watch);
	},

	$OnDestroy: function () {
		this.Account.OffChange(this.Watch);
	},

	AddPhone: function () {
		this.Account.Get('Phones').Push(this.$Service('Forms').Control('', [this.$Service('Forms').Validators.Pattern('\\+?[0-9 ]{6,}')]));
	},

	/* The button of a row: the ID of its control is on the row. */
	RemovePhone: function (event) {
		var phones = this.Account.Get('Phones');
		var id = Number(event.target.closest('[data-id]').getAttribute('data-id'));

		phones.Controls.forEach(function (control, index) {
			if (control.ID === id)
				phones.RemoveAt(index);
		});
	},

	/* Valid in the browser: the server has the last word. */
	Submitted: function (event) {
		var self = this;
		var value = event.Value;

		this.Busy = true;
		this.Failure = '';

		this.$Service('Accounts').Create({Name: value.Name, Email: value.Email, Password: value.Password, Phones: value.Phones.filter(Boolean)}, function (error, result) {
			self.Busy = false;

			if (error) {
				self.Failure = error.message;

				return;
			}

			if (result.Errors) {
				self.Refused = value.Email;
				self.EmailError = result.Errors.Email || '';

				return;
			}

			self.Created = value.Name;
		});
	},

	Again: function () {
		this.Created = '';

		this.Account.Reset();
	}
});
