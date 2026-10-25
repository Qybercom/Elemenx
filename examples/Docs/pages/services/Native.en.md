<!-- generated -->
# Native

The native features of the system around the Application, one API wherever it runs. In a program of elemenx build --native (desktop: Electron, mobile: Capacitor) it asks the system through the bridge of the program (window.ElemenxNative); in a browser it does what the web can: a file picker, a download, confirm, a new tab, the full screen. Every call takes callback(error, result); a feature the place lacks calls back an error.

Available() is true in a native program, Platform() 'electron', 'capacitor', 'android' (the ElemenxView of an Android program of its own: elemenx build --native android-library) or 'web', Has(feature) tells whether a feature works here (window, dialogs, menu, tray, external, taskbar, hotkeys, autostart, links, power, update, notifications; files in a mobile program).

- Window(action, callback, id): minimize, maximize, restore, toggle-maximize, fullscreen, focus, close, show (a window hidden in the tray comes back) and quit (the program quits, even with CloseToTray); the result is the state {Maximized, Minimized, Fullscreen, Focused}. id is a window of OpenWindow (its own buttons); the first one without. Title(text, callback): the title of the window.
- Frame(id): the frame of the windows of the program (Native.Desktop.Frame), or of the window id of OpenWindow: system, hidden (the title bar of the system hidden under the page, its buttons over it, their place in env(titlebar-area-*)), none or transparent (the Application draws its title bar: an element with elemenx-native-drag moves the window; a TitleBar of ElemenxUI); web on the web. <html> holds it in data-elemenx-frame, and the Material in data-elemenx-material. TitleBarOverlay({Color, Symbol, Height}, callback): the colors of the buttons of the system over a page with Frame hidden (a TitleBar gives them its own), true when the system took them. Scheme(scheme, callback): the scheme of the parts of the system (dialogs, menus, the buttons of the window): system, light or dark; the Theme Service gives it its own.
- Open({Accept, Multiple, Read, Title}, callback): files chosen by the user, [{Name, Path, Size, Text or Data}]; Read 'text' (by default), 'data' (base64) or 'none'; [] when the user cancels. A mobile program picks them as the web.
- Save({Name, Text or Data, Accept, Title}, callback): a file written where the user says, {Path} (null on the web, where it is a download), null when the user cancels. A mobile program writes it in the Documents of the device (Name a path there; @capacitor/filesystem), {Path} its URI.
- Message({Title, Text, Buttons, Kind}, callback): a message with buttons, the index of the one pressed.
- Menu(items, callback): the menu of the program ([{Label, Items: [{ID, Label, Hotkey, Disabled, Checked, Separator, Items, Role}]}]; null removes it); a click is the menu event {ID}. ContextMenu(items, callback): a menu at the pointer, the ID chosen or null.
- Tray({Icon, Tooltip, Items}, callback): an icon in the tray (Icon a path in the Application; null removes it); the tray event {ID, Kind}: an item of its menu (Kind menu), or the icon itself (ID null, Kind click, double or right). With Native.Desktop.CloseToTray, closing the window hides the program in the tray and a click on the icon brings it back. With Window ({Component, Props, Element, Width, Height}, 320 by 420) a click on the icon opens a small window of the Application by it, as the tray windows of programs do (no frame, not on the taskbar, hidden when it loses the focus), and the menu opens with the right button; TrayWindow(show, callback) shows it (true) or hides it (false), after a choice in it say. TrayMenu(items, callback) puts the menu of the icon in place, the icon and its window staying (a NativeMenu with Target tray does). TrayPopup({Component, Props, Element, Width, Height}, callback) is a menu of the tray drawn by the Application: a window of it that the right button of the icon opens at the pointer, in place of the menu of the system (ShowTrayPopup(show) shows it, hides it, or sizes it with {Width, Height}).
- Role(role, callback): what the system does for an item of a menu with that role (undo, copy, reload, zoomIn, togglefullscreen, quit...), for a menu the Application draws.
- External(url, callback): opens an http, https or mailto link in the browser of the system.
- Notify({ID, Title, Text, Icon, Image, Variant, Actions: [{ID, Label}], Silent, Urgency, Tag, Timeout, Look}, callback): a notification, callback(error, {ID}). Look system (by default) is the one of the system: Electron in a program (Icon a path in the Application; Silent; Urgency low, normal or critical; Actions on macOS), the Notification of the browser on the web (it asks the user first). Look elemenx is a card of ElemenxUI (NotificationHost: Image, Variant info, success, warning or danger, Actions everywhere), drawn as the theme says: in a program by the corner of the screen, in a window of its own over the others that takes no focus, on the web in the corner of the page; it closes after Timeout milliseconds (6000; 0: when the user closes it). The notification event {ID, Kind, Action}: click (the notification pressed), action (a button of it, Action its ID), close (closed by the user) or timeout.
- Badge(count, callback): a number on the icon of the program (0 removes it; on Windows a small picture over the icon, drawn here). Progress(value, callback): a progress from 0 to 1 on the button of the window (null removes it), or {Value, State} with State normal, indeterminate (no value: it runs), paused or error.
- Attention(on, callback): the button of the window flashes (the dock bounces) until the window comes to the front; on the web the title of the page blinks while the page is hidden.
- Thumbar(buttons, callback): the buttons under the thumbnail of the window on Windows ([{ID, Icon, Tooltip, Disabled}], seven at most; [] removes them); a press is the thumbar event {ID}.
- Tasks(callback): the tasks of the jump list of the program (Native.Desktop.Tasks: [{ID, Label, Description}], on Windows) that started it or came since the last call; a task chosen later is the task event {ID}.
- Shortcuts(keys, callback): the global hotkeys of the program, heard even when another program has the focus (['CommandOrControl+Shift+K']; [] removes them); the result lists the ones the system gave (another program may hold one); a press is the shortcut event {Keys}.
- Autostart(enabled, callback): starts the program when the user signs in (true), or not (false); without enabled it only tells; the result is {Enabled} (Windows and macOS).
- Links(callback): the links of the scheme of the program (Native.Desktop.Protocol: myapp://...) that opened it or came since the last call; a link that comes later is the link event {URL}, and starts no second program.
- Power(callback): {OnBattery, Idle (seconds without input), State (active, idle, locked, unknown)}; the power event {State}: suspend, resume, lock-screen, unlock-screen, on-ac, on-battery, shutdown. Awake(on, callback) keeps the screen from sleeping (on the web through the Screen Wake Lock), the result {Awake}.
- Update(callback): asks the feed of the versions (Native.Desktop.Update: a JSON {Version, URL, Notes}) whether a newer version is out: {Current, Latest, Available, URL, Notes}; External(URL) then opens the download.
- OpenWindow({ID, Component, Props, Element, Title, Width, Height, Frame}, callback): one more window of the same Application: its Component (with its Props), or an Element, lives in a window of its own, with the styles, the theme and the direction of the page, the state and the Services of the one Application. A link of the Application pressed there routes the page. An ID open already comes to the front. callback(error, {ID, Window}); a browser opens one only after a press or a key of the user. Windows() lists the IDs open, FocusWindow(id) brings one to the front, CloseWindow(id) closes it; a window closed (by the user too) takes its Component away and is the closed event {ID}. In a program the windows close with the first one; Frame is its own frame (as Frame() names them).
- On(name, callback) / Off(name, callback): the events menu, tray, window ({Maximized, Minimized, Fullscreen, Focused}), shortcut, link, task, thumbar, closed and power.

## Methods

- `Available()`
- `Platform()`
- `Has(feature)`
- `Window(action, callback, id)`
- `Frame(id)`
- `TitleBarOverlay(colors, callback)`
- `Scheme(scheme, callback)`
- `Title(text, callback)`
- `Open(options, callback)`
- `Save(options, callback)`
- `Message(options, callback)`
- `Menu(items, callback)`
- `ContextMenu(items, callback)`
- `Tray(options, callback)`
- `TrayMenu(items, callback)`
- `TrayPopup(options, callback)`
- `ShowTrayPopup(show, callback)`
- `Role(role, callback)`
- `TrayWindow(show, callback)`
- `External(url, callback)`
- `Badge(count, callback)`
- `Progress(value, callback)`
- `Attention(on, callback)`
- `Thumbar(buttons, callback)`
- `Tasks(callback)`
- `Shortcuts(keys, callback)`
- `Autostart(enabled, callback)`
- `Links(callback)`
- `Power(callback)`
- `Awake(on, callback)`
- `Update(callback)`
- `OpenWindow(options, callback)`
- `Windows()`
- `FocusWindow(id)`
- `CloseWindow(id)`
- `On(name, callback)`
- `Off(name, callback)`
- `Notify(options, callback)`

## Example

```example
<Properties>
	<Property Label="Platform" [value]="Platform" />
	<Property Label="Features here" [value]="Features" />
</Properties>
<Button Label="Open a text file" Icon="folder-open" (click)="Open" />
<Button Label="Save a file" Icon="save" (click)="Save" />
<Button Label="Full screen" Icon="maximize" Variant="ghost" (click)="Full" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Platform: '',
	Features: '',
	Note: 'In a browser the features are those of the web; in a program of elemenx build --native they are those of the system.',

	$OnCreate: function () {
		var native = this.$Service('Native');

		this.Platform = native.Platform();
		this.Features = ['window', 'dialogs', 'menu', 'tray', 'external', 'taskbar', 'hotkeys', 'autostart', 'links', 'power', 'update'].filter(function (feature) {
			return native.Has(feature);
		}).join(', ');
	},

	Open: function () {
		var self = this;

		this.$Service('Native').Open({Accept: ['.txt', '.md', '.json'], Read: 'text'}, function (error, files) {
			self.Note = error ? error.message : files.length ? files[0].Name + ': ' + files[0].Text.slice(0, 80) : 'Cancelled';
		});
	},

	Save: function () {
		var self = this;

		this.$Service('Native').Save({Name: 'hello.txt', Text: 'Hello from Elemenx'}, function (error, result) {
			self.Note = error ? error.message : result ? 'Saved' : 'Cancelled';
		});
	},

	Full: function () {
		var self = this;

		this.$Service('Native').Window('fullscreen', function (error) {
			if (error)
				self.Note = error.message;
		});
	}
})
</script>
```
