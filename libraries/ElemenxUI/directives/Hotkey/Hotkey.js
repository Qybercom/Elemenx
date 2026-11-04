/*
 * *hotkey="'Mod+S'" (or *hotkey="{Keys: 'Mod+S', Scope: 'local', Description: 'Save', Group: 'File'}") clicks the
 * element when the keys are pressed, unless it is disabled or hidden, and sets its aria-keyshortcuts. Scope 'local'
 * limits the shortcut to the focus inside the closest section, dialog or form of the element. Uses the Hotkeys Service.
 */
Elemenx.Directive('hotkey', {
	$Meta: {
		Description: '*hotkey="\'Mod+S\'" (or *hotkey="{Keys: \'Mod+S\', Scope: \'local\', Description: \'Save\', Group: \'File\'}") clicks the element when the keys are pressed, unless it is disabled or hidden, and sets its aria-keyshortcuts.'
	},
	$OnUpdate: function (context) {
		var element = context.Element;
		var value = context.Value;
		var options = value && typeof value === 'object' ? value : {Keys: value};
		var hotkeys = context.Component.$Service('Hotkeys');
		var key = JSON.stringify([options.Keys, options.Scope || '', options.Description || '', options.Group || '']);
		if (context.Data.Key === key) return;

		context.Data.Key = key;

		if (context.Data.ID)
			hotkeys.Unbind(context.Data.ID);

		context.Data.ID = null;

		if (!options.Keys) {
			element.removeAttribute('aria-keyshortcuts');

			return;
		}

		element.setAttribute('aria-keyshortcuts', String(options.Keys).replace(/Mod/g, hotkeys.Mac ? 'Meta' : 'Control'));

		context.Data.ID = hotkeys.Bind(options.Keys, function () {
			if (element.disabled || element.getAttribute('aria-disabled') === 'true' || !element.isConnected || !element.getClientRects().length) return;

			element.click();
		}, {
			Scope: options.Scope === 'local' ? element.closest('section, dialog, form, [role="dialog"]') : null,
			Description: options.Description || element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent.trim(),
			Group: options.Group || ''
		});
	},

	$OnDestroy: function (context) {
		if (context.Data.ID)
			context.Component.$Service('Hotkeys').Unbind(context.Data.ID);
	}
});
