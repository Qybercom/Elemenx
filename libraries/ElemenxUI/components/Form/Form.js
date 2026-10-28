/*
 * A form: a <form> that collects its fields into Model, a Group of the Forms Service, and validates them. Model is a
 * Group made in code (Forms.Group, Forms.Control and their validators), or, without one, a Group the Form makes of its
 * Fields: a Field with a Name and its validators (Required, Email, Min, Max, MinLength, MaxLength, Pattern, Match) adds
 * its control to it; a Field whose Name is in the Model takes the control of the Model. A Name of parts, as the forms
 * of a server read them (user[address][city], items[2][name], tags[] for the next item of a list, or user.address.city),
 * nests its control in groups and arrays: Value is {user: {address: {city}}, items: [{name}], tags: [...]}, and the
 * groups a Field leaving empties go with it. On submit (a button of type submit, Enter in a field, or Submit()) every
 * field is touched, so their errors show, and once nothing is pending the form emits submit with {Value, Model} if it
 * is valid, or invalid with {Errors, Model} and the focus goes to the first field in error. A reset (a button of type
 * reset, or Reset()) brings the Model back to its first values; event reset. Disabled disables the fieldset of the form.
 */
Elemenx.Component('Form', {
	$TemplateURL: 'Form.html',
	$StyleURL: 'Form.css',
	$Meta: {
		Group: 'layout',
		Icon: 'file-text',
		Description: 'A form: a <form> that collects its fields into Model, a Group of the Forms Service, and validates them.',
		Container: true,
		Events: {
			submit: 'Submitted and valid: {Value, Model}, the values of the fields and the Group.',
			invalid: 'Submitted with errors: {Errors, Model}; the focus goes to the first field in error.',
			reset: 'Reset to its first values: {Model}.'
		},
		Methods: ['Submit()', 'Reset()'],
		Props: {
			Model: 'A Group of the Forms Service made in code; without one the Form makes it of its Fields.',
			Label: 'The name of the form for screen readers.',
			Disabled: 'Disables every field of the form.'
		},
		Sample: {Label: 'Sign up'}
	},
	Model: null,
	Label: '',
	Disabled: false,

	$OnCreate: function () {
		var fields = {};

		if (!this.Model)
			this.Model = this.$Service('Forms').Group({});

		/* The elements of the Fields that added their controls: not state, so it renders nothing. */
		this.Fields = function () {
			return fields;
		};
	},

	/*
	 * The controls the Fields added, in the order of the Fields on the page, whatever order they came in: a name of the
	 * Model (user, of user[address][city]) where its first Field is.
	 */
	Order: function () {
		var fields = this.Fields();
		var forms = this.$Service('Forms');
		var controls = this.Model.Controls;
		var first = {};
		var ordered = {};

		Object.keys(fields).forEach(function (id) {
			var name = forms.Path(fields[id].Name)[0];
			if (!first[name] || first[name].compareDocumentPosition(fields[id].Element) & Node.DOCUMENT_POSITION_PRECEDING)
				first[name] = fields[id].Element;
		});

		Object.keys(controls).sort(function (a, b) {
			if (!first[a] || !first[b]) return 0;

			return first[a].compareDocumentPosition(first[b]) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
		}).forEach(function (name) {
			ordered[name] = controls[name];
		});

		this.Model.Controls = ordered;
	},

	/*
	 * A Field inside asks for its control (the event elemenx-form-field): the one of the Model, or one made of the Field,
	 * put at its Name (user[address][city]: nested in the groups and arrays of its parts).
	 */
	Registered: function (event) {
		var detail = event.detail;
		var model = this.Model;
		var forms = this.$Service('Forms');
		var control = model.Get(detail.Name);

		event.stopPropagation();

		if (!control && model.Add) {
			control = forms.Place(model, detail.Name, forms.Control(detail.Value, detail.Validators));
			this.Fields()[control.ID] = {Name: detail.Name, Element: event.target};

			this.Order();
		}

		detail.Control = control;
	},

	/* A Field that goes takes the control the Form made of it out of the Model (and the groups made for it that are empty then). */
	Unregistered: function (event) {
		var control = event.detail.Control;

		event.stopPropagation();

		if (control && this.Fields()[control.ID]) {
			delete this.Fields()[control.ID];

			this.$Service('Forms').Detach(control);
		}
	},

	Submitted: function (event) {
		var self = this;
		var model = this.Model;

		if (event)
			event.preventDefault();

		model.Touch();

		model.Validate(function (error, result) {
			var invalid;

			if (result.Valid) {
				self.$Emit('submit', {Value: model.Value, Model: model});

				return;
			}

			self.$Emit('invalid', {Errors: result.Errors, Model: model});

			/* The fields show their errors on this render; the first one in error takes the focus after it. */
			window.setTimeout(function () {
				invalid = self.$Element().querySelector('.elemenx-field.invalid input, .elemenx-field.invalid textarea, .elemenx-field.invalid select, .elemenx-field.invalid [tabindex="0"], .elemenx-field.invalid button');

				if (invalid)
					invalid.focus();
			}, 0);
		});
	},

	Cleared: function (event) {
		if (event)
			event.preventDefault();

		this.Model.Reset();

		this.$Emit('reset', {Model: this.Model});
	},

	Submit: function () {
		this.Submitted(null);
	},

	Reset: function () {
		this.Cleared(null);
	}
});
