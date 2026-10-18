/*
 * *mask="{Mask: Mask, Value: Value}" keeps an <input> strictly inside a mask.
 * Slots: # digit, A Latin letter, * digit or letter; every other mask character is a literal.
 * Value holds only the slot characters. After every input (typing, paste, drop, autofill) the text is rebuilt
 * from the accepted characters, so nothing outside the mask survives. The element then dispatches a "mask"
 * DOM event whose detail is {Value, Text, Complete}; a listener may rewrite detail.Value.
 *
 * Guide: a character ('_', or true for '_') shown in the empty slots while the field is focused or filled, so the
 * whole template stays in place and a deleted character is visible. Backspace: 'delete' (default) deletes the
 * character before a literal under the caret; 'skip' only moves the caret over the literal.
 */
Elemenx.Directive('mask', {
	$OnCreate: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Mask = '';
		data.Guide = '';
		data.Backspace = 'delete';
		data.Raw = '';
		data.Text = '';

		function slot (character) {
			return character === '#' || character === 'A' || character === '*';
		}

		function accepts (character, value) {
			if (character === '#')
				return /[0-9]/.test(value);

			if (character === 'A')
				return /[A-Za-z]/.test(value);

			return /[0-9A-Za-z]/.test(value);
		}

		function slots (mask) {
			var count = 0;
			var i = 0;

			while (i < mask.length) {
				if (slot(mask.charAt(i)))
					count++;

				i++;
			}

			return count;
		}

		function prefixDigits (mask) {
			var result = '';
			var i = 0;

			while (i < mask.length && !slot(mask.charAt(i))) {
				if (/[0-9]/.test(mask.charAt(i)))
					result += mask.charAt(i);

				i++;
			}

			return result;
		}

		/* A literal is consumed only where the text has it in place; otherwise the literals are skipped up to the next slot. */
		function extract (text, mask) {
			var raw = '';
			var m = 0;
			var i = 0;
			var character;

			while (i < text.length && m < mask.length) {
				character = text.charAt(i);

				if (!slot(mask.charAt(m)) && mask.charAt(m) === character) {
					m++;
				}
				else {
					while (m < mask.length && !slot(mask.charAt(m))) {
						m++;
					}

					if (m < mask.length && accepts(mask.charAt(m), character)) {
						raw += character;
						m++;
					}
				}

				i++;
			}

			return raw;
		}

		/* The text of raw: without a guide it stops after the last character, with a guide it shows the whole mask. */
		function format (raw, mask, guide) {
			var text = '';
			var r = 0;
			var m = 0;

			while (m < mask.length && (guide || r < raw.length)) {
				if (slot(mask.charAt(m))) {
					text += r < raw.length ? raw.charAt(r) : guide;
					r++;
				}
				else {
					text += mask.charAt(m);
				}

				m++;
			}

			return text;
		}

		/* The text position right before the slot number "count"; it follows the literals after the previous slot. */
		function caret (text, mask, count) {
			var seen = 0;
			var i = 0;

			while (i < text.length && i < mask.length) {
				if (slot(mask.charAt(i))) {
					if (seen === count) return i;

					seen++;
				}

				i++;
			}

			return text.length;
		}

		function normalize (raw, mask) {
			var limit = slots(mask);
			var prefix = prefixDigits(mask);
			if (prefix && raw.length > limit && raw.indexOf(prefix) === 0)
				raw = raw.substring(prefix.length);

			return raw.substring(0, limit);
		}

		function focused () {
			return element.getRootNode().activeElement === element;
		}

		/* The guide shows only while the field is focused or holds characters; an empty idle field shows its placeholder. */
		function render (raw) {
			if (!raw && !focused()) return '';

			return format(raw, data.Mask, data.Guide);
		}

		function place (position) {
			if (focused())
				element.setSelectionRange(position, position);
		}

		function notify () {
			var detail = {
				Value: data.Raw,
				Text: data.Text,
				Complete: data.Raw.length === slots(data.Mask)
			};

			element.dispatchEvent(new CustomEvent('mask', {detail: detail}));

			if (detail.Value === data.Raw) return;

			data.Apply(String(detail.Value || ''));

			place(data.Guide ? caret(data.Text, data.Mask, data.Raw.length) : data.Text.length);
		}

		data.Apply = function (raw) {
			data.Raw = normalize(extract(raw, data.Mask), data.Mask);
			data.Text = render(data.Raw);

			if (element.value !== data.Text)
				element.value = data.Text;
		};

		data.Input = function (event) {
			var mask = data.Mask;
			var text = element.value;
			var position = element.selectionStart === null ? text.length : element.selectionStart;
			var type = event && event.inputType ? event.inputType : '';
			var previous = data.Raw;
			var raw;
			var before;

			if (!mask) return;

			raw = normalize(extract(text, mask), mask);
			before = Math.min(extract(text.substring(0, position), mask).length, raw.length);

			if (type.indexOf('delete') === 0 && raw === previous && text.length < data.Text.length) {
				if (data.Backspace === 'skip') {
					element.value = data.Text;

					place(type === 'deleteContentForward' ? position + 1 : position);

					return;
				}

				if (type === 'deleteContentBackward' && before > 0) {
					raw = previous.substring(0, before - 1) + previous.substring(before);
					before--;
				}
				else if (type === 'deleteContentForward') {
					raw = previous.substring(0, before) + previous.substring(before + 1);
				}
			}

			data.Raw = raw;
			data.Text = render(raw);
			element.value = data.Text;

			place(!data.Guide && before >= raw.length ? data.Text.length : caret(data.Text, mask, before));

			notify();
		};

		/* Only an empty field changes on focus (it shows the guide); a filled one keeps its text and the user's selection. */
		data.Focus = function () {
			if (!data.Mask || !data.Guide || data.Raw) return;

			data.Text = render('');
			element.value = data.Text;

			place(caret(data.Text, data.Mask, 0));
		};

		data.Blur = function () {
			if (!data.Mask || !data.Guide || data.Raw) return;

			data.Text = '';
			element.value = '';
		};

		data.Notify = notify;

		element.addEventListener('input', data.Input, true);
		element.addEventListener('focus', data.Focus);
		element.addEventListener('blur', data.Blur);
	},

	$OnUpdate: function (context) {
		var data = context.Data;
		var options = context.Value || {};
		var raw = options.Value == null ? '' : String(options.Value);

		data.Mask = String(options.Mask || '');
		data.Guide = options.Guide === true ? '_' : String(options.Guide || '').charAt(0);
		data.Backspace = options.Backspace === 'skip' ? 'skip' : 'delete';

		if (!data.Mask) return;

		data.Apply(raw);

		if (data.Raw !== raw)
			data.Notify();
	},

	$OnDestroy: function (context) {
		context.Element.removeEventListener('input', context.Data.Input, true);
		context.Element.removeEventListener('focus', context.Data.Focus);
		context.Element.removeEventListener('blur', context.Data.Blur);
	}
});