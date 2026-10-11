/*
 * *droppable="{Accept: ['task'], Files: true, Text: true}" makes the element a drop target.
 * Accept lists the Types of *draggable items it takes (true takes every item). Files and Text accept files and
 * text dragged from outside the browser (native drag and drop). During a drag the element gets the class
 * drop-target when it accepts the item and drop-over while the item is over it.
 * Sort ('vertical', 'horizontal' or 'grid') makes the element an ordered list of its *draggable items: a line marks the
 * place a dragged item would take (Marker: false hides it) and Index in the detail tells it.
 * The element dispatches "dropenter", "dropleave", "dropmove" (items only) and "dropped" with {Kind ('item', 'files'
 * or 'text'), Type, Data, Files, Text, Source, ClientX, ClientY, Index (-1 without Sort)}.
 */
Elemenx.Directive('droppable', {
	$OnCreate: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Depth = 0;

		function native (event) {
			var drop = element.ElemenxDrop || {};
			var types = event.dataTransfer ? Array.prototype.slice.call(event.dataTransfer.types || []) : [];

			if (drop.Disabled) return '';
			if (drop.Files && types.indexOf('Files') !== -1) return 'files';
			if (drop.Text && types.indexOf('text/plain') !== -1) return 'text';

			return '';
		}

		function emit (name, event, kind) {
			var transfer = event.dataTransfer;

			element.dispatchEvent(new CustomEvent(name, {detail: {
				Kind: kind,
				Type: '',
				Data: null,
				Files: name === 'dropped' && transfer && transfer.files ? Array.prototype.slice.call(transfer.files) : [],
				Text: name === 'dropped' && transfer ? transfer.getData('text/plain') : '',
				Source: null,
				ClientX: event.clientX,
				ClientY: event.clientY,
				Index: -1
			}}));
		}

		data.Enter = function (event) {
			var kind = native(event);
			if (!kind) return;

			event.preventDefault();

			data.Depth++;

			if (data.Depth === 1) {
				element.classList.add('drop-over');

				emit('dropenter', event, kind);
			}
		};

		data.Over = function (event) {
			var kind = native(event);
			if (!kind) return;

			event.preventDefault();

			event.dataTransfer.dropEffect = 'copy';
		};

		data.Leave = function (event) {
			var kind = native(event);
			if (!kind) return;

			data.Depth = Math.max(0, data.Depth - 1);

			if (!data.Depth) {
				element.classList.remove('drop-over');

				emit('dropleave', event, kind);
			}
		};

		data.Drop = function (event) {
			var kind = native(event);
			if (!kind) return;

			event.preventDefault();

			data.Depth = 0;

			element.classList.remove('drop-over');

			emit('dropped', event, kind);
		};

		element.addEventListener('dragenter', data.Enter);
		element.addEventListener('dragover', data.Over);
		element.addEventListener('dragleave', data.Leave);
		element.addEventListener('drop', data.Drop);
	},

	$OnUpdate: function (context) {
		var value = context.Value;
		var options = value && typeof value === 'object' && !Array.isArray(value) ? value : {Accept: value};

		context.Element.ElemenxDrop = {
			Accept: options.Accept === true || Array.isArray(options.Accept) ? options.Accept : options.Accept ? [options.Accept] : [],
			Files: !!options.Files,
			Text: !!options.Text,
			Disabled: !!options.Disabled,
			Sort: options.Sort === true ? 'vertical' : options.Sort || '',
			Marker: options.Marker !== false
		};

		context.Element.classList.add('elemenx-droppable');
	},

	$OnDestroy: function (context) {
		var element = context.Element;

		element.removeEventListener('dragenter', context.Data.Enter);
		element.removeEventListener('dragover', context.Data.Over);
		element.removeEventListener('dragleave', context.Data.Leave);
		element.removeEventListener('drop', context.Data.Drop);
		element.classList.remove('elemenx-droppable', 'drop-target', 'drop-over');

		element.ElemenxDrop = null;
	}
});