/*
 * A label, a hint and an error around a control. Error shows an error of its own. In a form it shows the errors of a
 * control of the Forms Service once the control is touched (left once, or the form submitted):
 * - Control: a control made in code (Forms.Control, or Model.Get('email') of a Group);
 * - or Name, inside a Form: the Field asks the Form for the control of that name; when the Model of the Form has none,
 *   it is made of the Field: its first value (Value, or the value of the control inside), and its validators Required,
 *   Email, Min, Max, MinLength, MaxLength, Pattern and Match (the name of a field whose value it must repeat).
 * The value comes from the control inside: a native one (input, textarea, select: its value, or checked for a check
 * box) or a Component of ElemenxUI (its change); the control is touched when the focus leaves the field, and a value
 * set in code goes back into a native control. Messages ({required: 'text'...}) give the errors texts of their own,
 * otherwise they are the phrases of the Forms Service.
 */
Elemenx.Component('Field', {
	$TemplateURL: 'Field.html',
	$StyleURL: 'Field.css',
	$Meta: {
		Group: 'inputs',
		Icon: 'edit',
		Description: 'A label, a hint and an error around a control.',
		Container: true,
		Props: {
			Label: 'The label above the control.',
			Hint: 'A text under the control.',
			Error: 'An error of its own, in place of the hint.',
			Required: 'The value must not be empty (and the label shows a mark).',
			Horizontal: 'The label beside the control, not above it.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Control: 'A control of the Forms Service made in code.',
			Name: 'The name of its control in a Form.',
			Value: 'The first value of the control it makes in a Form.',
			Email: 'The value must be an email address.',
			Min: 'The least number.',
			Max: 'The greatest number.',
			MinLength: 'The least length of the text.',
			MaxLength: 'The greatest length of the text.',
			Pattern: 'A regular expression the value must match.',
			Match: 'The name of a field whose value it must repeat (a password twice).',
			Messages: 'Texts of its own for the errors: {required: \'...\'}.'
		},
		Sample: {Label: 'Name', Hint: 'As it is written in your passport.', Required: true}
	},
	Label: '',
	Hint: '',
	Error: '',
	Required: false,
	Horizontal: false,
	Disabled: false,
	Control: null,
	Name: '',
	Value: '',
	Email: false,
	Min: null,
	Max: null,
	MinLength: null,
	MaxLength: null,
	Pattern: '',
	Match: '',
	Messages: null,

	$OnCreate: function () {
		var self = this;

		/* The error shown: Error, or the first error of a touched control in error. */
		this.Shown = function (error, control, messages) {
			var errors;
			var key;

			if (error)
				return error;

			if (!control || !control.Touched || control.Status !== 'invalid') return '';

			errors = control.Errors || {};

			for (key in errors) {
				if (Object.prototype.hasOwnProperty.call(errors, key) && messages && messages[key]) return messages[key];
			}

			return self.$Service('Forms').Message(errors);
		};

		/* A value set in code goes back into the native control inside (not while it is the one that changed it). */
		this.Sync = function (control) {
			var native = self.Native();
			if (!native || native === (native.ownerDocument || document).activeElement) return;

			if (native.type === 'checkbox') native.checked = !!control.Value;
			else if (native.type !== 'radio' && native.value !== String(control.Value === null || control.Value === undefined ? '' : control.Value)) native.value = control.Value === null || control.Value === undefined ? '' : control.Value;
		};
	},

	$OnReady: function () {
		this.Join(0);
	},

	/*
	 * The control of the Field: its Control, or the one the Form around gives it for its Name. A Field is ready before
	 * the template around puts it into the page: it asks the Form once it is in the page (a task later, a few times at most).
	 */
	Join: function (attempt) {
		var self = this;
		var root = this.$Element();
		var native;
		var detail;

		if (this.Gone) return;

		if (!this.Control && this.Name) {
			if (!root.isConnected) {
				if (attempt < 50) {
					window.setTimeout(function () {
						self.Join(attempt + 1);
					}, 0);
				}

				return;
			}

			native = this.Native();

			detail = {Name: this.Name, Value: this.Value !== '' ? this.Value : native ? this.Read(native) : '', Validators: this.Validators(), Control: null};

			root.dispatchEvent(new CustomEvent('elemenx-form-field', {bubbles: true, detail: detail}));

			if (detail.Control) {
				this.Control = detail.Control;
				this.Registered = true;
			}
		}

		if (this.Control) {
			this.Control.OnChange(this.Sync);
			this.Sync(this.Control);
		}
	},

	$OnDestroy: function () {
		this.Gone = true;

		if (!this.Control) return;

		this.Control.OffChange(this.Sync);

		if (this.Registered)
			this.$Element().dispatchEvent(new CustomEvent('elemenx-form-leave', {bubbles: true, detail: {Name: this.Name, Control: this.Control}}));
	},

	/* The validators of the props of the Field. */
	Validators: function () {
		var validators = this.$Service('Forms').Validators;
		var list = [];
		var match = this.Match;

		if (this.Required === true || this.Required === 'true')
			list.push(validators.Required);

		if (this.Email === true || this.Email === 'true')
			list.push(validators.Email);

		if (this.Min !== null && this.Min !== '')
			list.push(validators.Min(Number(this.Min)));

		if (this.Max !== null && this.Max !== '')
			list.push(validators.Max(Number(this.Max)));

		if (this.MinLength !== null && this.MinLength !== '')
			list.push(validators.MinLength(Number(this.MinLength)));

		if (this.MaxLength !== null && this.MaxLength !== '')
			list.push(validators.MaxLength(Number(this.MaxLength)));

		if (this.Pattern)
			list.push(validators.Pattern(this.Pattern));

		if (match) {
			list.push(validators.Custom('match', function (value, control) {
				var other = control.Parent && control.Parent.Get(match);

				return !other || other.Value === value;
			}));
		}

		return list;
	},

	/* The first native control inside, not one of the inner parts of a Component (a hidden input, a button of a list). */
	Native: function () {
		return this.$Element().querySelector('input:not([type="hidden"]):not([tabindex="-1"]), textarea, select');
	},

	Read: function (native) {
		if (native.type === 'checkbox') return native.checked;

		if (native.type === 'radio')
			return native.checked ? native.value : '';

		return native.value;
	},

	/* A native control inside changed. */
	Typed: function (event) {
		var target = event.target;
		if (!this.Control || !/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || (target.type === 'radio' && !target.checked)) return;

		this.Control.SetValue(this.Read(target));
	},

	/* A Component inside changed (its change, as elemenx-change): its value. */
	Picked: function (event) {
		if (this.Control)
			this.Control.SetValue(event.detail);
	},

	/* The focus leaves the field: the control is touched, its errors show. */
	Left: function (event) {
		if (this.Control && !this.$Element().contains(event.relatedTarget))
			this.Control.Touch();
	},

	Focus: function (event, node) {
		var control = node.parentNode.querySelector('input:not([type="hidden"]):not([tabindex="-1"]), textarea, select, button:not([tabindex="-1"]), [tabindex="0"]');
		if (control)
			control.focus();
	}
});
