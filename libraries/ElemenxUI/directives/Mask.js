/*
 * *mask="{Mask: Mask, Value: Value}" keeps an <input> strictly inside a mask.
 * Slots: # digit, A Latin letter, * digit or letter; every other mask character is a literal.
 * Value holds only the slot characters. After every input (typing, paste, drop, autofill) the text is rebuilt
 * from the accepted characters, so nothing outside the mask survives. The element then dispatches a "mask"
 * DOM event whose detail is {Value, Text, Complete}; a listener may rewrite detail.Value.
 */
Elemenx.Directive('mask', {
	$OnCreate: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Mask = '';
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
			var matched;

			while (i < text.length && m < mask.length) {
				character = text.charAt(i);
				matched = false;

				if (!slot(mask.charAt(m)) && mask.charAt(m) === character) {
					m++;
					matched = true;
				}

				if (!matched) {
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

		function format (raw, mask) {
			var text = '';
			var r = 0;
			var m = 0;

			while (m < mask.length && r < raw.length) {
				if (slot(mask.charAt(m))) {
					text += raw.charAt(r);
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

		/* A listener may correct detail.Value (a month above 12, for example); the correction is applied at once. */
		function notify () {
			var detail = {
				Value: data.Raw,
				Text: data.Text,
				Complete: data.Raw.length === slots(data.Mask)
			};

			element.dispatchEvent(new CustomEvent('mask', {detail: detail}));

			if (detail.Value === data.Raw) return;

			data.Apply(String(detail.Value || ''));

			if (document.activeElement === element)
				element.setSelectionRange(data.Text.length, data.Text.length);
		}

		data.Apply = function (raw) {
			data.Raw = normalize(extract(raw, data.Mask), data.Mask);
			data.Text = format(data.Raw, data.Mask);

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
				if (type === 'deleteContentBackward' && before > 0) {
					raw = previous.substring(0, before - 1) + previous.substring(before);
					before--;
				}
				else if (type === 'deleteContentForward') {
					raw = previous.substring(0, before) + previous.substring(before + 1);
				}
			}

			data.Raw = raw;
			data.Text = format(raw, mask);
			element.value = data.Text;

			if (document.activeElement === element) {
				position = before >= raw.length ? data.Text.length : caret(data.Text, mask, before);

				element.setSelectionRange(position, position);
			}

			notify();
		};

		data.Notify = notify;

		element.addEventListener('input', data.Input, true);
	},

	$OnUpdate: function (context) {
		var data = context.Data;
		var options = context.Value || {};
		var raw = options.Value == null ? '' : String(options.Value);

		data.Mask = String(options.Mask || '');

		if (!data.Mask) return;

		data.Apply(raw);

		if (data.Raw !== raw)
			data.Notify();
	},

	$OnDestroy: function (context) {
		context.Element.removeEventListener('input', context.Data.Input, true);
	}
});