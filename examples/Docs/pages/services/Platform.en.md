<!-- generated -->
# Platform

The platform the Application runs on, one API wherever it runs: its windows, its icon, the taskbar, the tray, the dialogs, the notifications and the other features of the system. In a program of elemenx build --native (desktop: Electron, mobile: Capacitor) it asks the system through the bridge of the program (window.ElemenxNative); in a browser it does what the web can: a file picker, a download, confirm, a new tab, the full screen. Every call takes callback(error, result); a feature the place lacks calls back an error.

Available() is true in a native program, Platform() 'electron', 'capacitor', 'android' (the ElemenxView of an Android program of its own: elemenx build --native android-library) or 'web', Has(feature) tells whether a feature works here (window, dialogs, menu, tray, external, taskbar, hotkeys, autostart, links, power, update, notifications; files in a mobile program).

- Window(action, callback, id): minimize, maximize, restore, toggle-maximize, fullscreen, focus, close, show (a window hidden in the tray comes back) and quit (the program quits, even with CloseToTray); the result is the state {Maximized, Minimized, Fullscreen, Focused}. id is a window of OpenWindow (its own buttons); the first one without. Title(text, callback): the title of the page and of the windows (Elemenx.Title; a program follows every change of it, $Title of the Components too).
- Frame(id): the frame of the windows of the program (Native.Desktop.Frame), or of the window id of OpenWindow: system, hidden (the title bar of the system hidden under the page, its buttons over it, their place in env(titlebar-area-*)), none or transparent (the Application draws its title bar: an element with elemenx-native-drag moves the window; a TitleBar of ElemenxUI); web on the web. <html> holds it in data-elemenx-frame, and the Material in data-elemenx-material. TitleBarOverlay({Color, Symbol, Height}, callback): the colors of the buttons of the system over a page with Frame hidden (a TitleBar gives them its own), true when the system took them. Scheme(scheme, callback): the scheme of the parts of the system (dialogs, menus, the buttons of the window): system, light or dark; the Theme Service gives it its own.
- Open({Accept, Multiple, Read, Title}, callback): files chosen by the user, [{Name, Path, Size, Text or Data}]; Read 'text' (by default), 'data' (base64) or 'none'; [] when the user cancels. A mobile program picks them as the web.
- Save({Name, Text or Data, Accept, Title}, callback): a file written where the user says, {Path} (null on the web, where it is a download), null when the user cancels. A mobile program writes it in the Documents of the device (Name a path there; @capacitor/filesystem), {Path} its URI.
- Message({Title, Text, Buttons, Kind}, callback): a message with buttons, the index of the one pressed.
- Menu(items, callback): the menu of the program ([{Label, Items: [{ID, Label, Hotkey, Disabled, Checked, Separator, Items, Role}]}]; null removes it); a click is the menu event {ID}. ContextMenu(items, callback): a menu at the pointer, the ID chosen or null.
- Tray({Icon, Tooltip, Items}, callback): an icon in the tray (Icon a path in the Application; null removes it); the tray event {ID, Kind}: an item of its menu (Kind menu), or the icon itself (ID null, Kind click, double or right). With Native.Desktop.CloseToTray, closing the window hides the program in the tray and a click on the icon brings it back. With Window ({Component, Props, Element, Width, Height}, 320 by 420) a click on the icon opens a small window of the Application by it, as the tray windows of programs do (no frame, not on the taskbar, hidden when it loses the focus), and the menu opens with the right button; TrayWindow(show, callback) shows it (true) or hides it (false), after a choice in it say. TrayMenu(items, callback) puts the menu of the icon in place, the icon and its window staying (a NativeMenu with Target tray does). TrayPopup({Component, Props, Element, Width, Height}, callback) is a menu of the tray drawn by the Application: a window of it that the right button of the icon opens at the pointer, in place of the menu of the system (ShowTrayPopup(show) shows it, hides it, or sizes it with {Width, Height}). TrayIcon({Icon or Image, Tooltip}, callback) changes the picture of the icon (and its tooltip) in its place: Icon a path in the Application, the text of an SVG, a data URL or {Light, Dark} (drawn into a PNG), Image a data URL of a PNG (online, offline...).
- Icon(icon, callback): the icon of the Application (Elemenx.Icon): the favicon on the web, the icon of the windows of a program (the taskbar, the title bar, the dock on macOS; drawn into a PNG). icon is a URL (or a path in the Application), the text of an SVG, a data URL, or {Light, Dark}, one for each scheme of the system; null brings back the icon of the page (and the one a program was built with). A program follows every change of Elemenx.Icon, $Icon of the Components too. ResetIcon(callback): the icon of the page, no badge, no progress. IconState() is {Icon, Badge, Progress}.
- Role(role, callback): what the system does for an item of a menu with that role (undo, copy, reload, zoomIn, togglefullscreen, quit...), for a menu the Application draws.
- External(url, callback): opens an http, https or mailto link in the browser of the system.
- Notify({ID, Title, Text, Icon, Image, Variant, Actions: [{ID, Label}], Silent, Urgency, Tag, Timeout, Look}, callback): a notification, callback(error, {ID}). Look system (by default) is the one of the system: Electron in a program (Icon a path in the Application; Silent; Urgency low, normal or critical; Actions on macOS), the Notification of the browser on the web (it asks the user first). Look elemenx is a card of ElemenxUI (NotificationHost: Image, Variant info, success, warning or danger, Actions everywhere), drawn as the theme says: in a program by the corner of the screen, in a window of its own over the others that takes no focus, on the web in the corner of the page; it closes after Timeout milliseconds (6000; 0: when the user closes it; held while the pointer is over it). A card of the same ID takes the place of the one before (Progress, 0 to 1, of a task); Component and Props of the Application draw a card of its own (an invitation to a call: CallInvite), the Component getting Notification {ID, Choose(action), Close()}, Bare leaving out the frame of a card; Priority high keeps it next to the corner past the limit; Sound (a URL; Loop) plays until it goes. Notifications({Limit, Corner}): how many cards show (4; the others told as +N) and in which corner (bottom-right, bottom-left, top-right, top-left). CloseNotification(id) takes one away. The notification event {ID, Kind, Action}: click (the notification pressed), action (a button of it, Action its ID), close (closed by the user) or timeout.
- Badge(count, callback): a number on the icon: the badge of the system in a program (on Windows a small picture over the icon, drawn here) and in an installed web Application, and a red disc with the number drawn over the favicon (99+ past 99; 'dot' a disc alone; 0 removes it). Progress(value, callback): a progress from 0 to 1 on the button of the window and a ring around the favicon (null removes it), or {Value, State} with State normal, indeterminate (no value: it runs), paused or error.
- Attention(on, callback): the button of the window flashes (the dock bounces) until the window comes to the front; on the web the title of the page and the favicon blink while the page is hidden.
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
- `TrayIcon(options, callback)`
- `Icon(icon, callback)`
- `ResetIcon(callback)`
- `IconState()`
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
- `Notifications(settings)`
- `CloseNotification(id)`

## Example

```example
<div class="docs-stack">
	<Properties>
		<Property Label="Platform" [value]="Platform" />
		<Property Label="Features here" [value]="Features" />
	</Properties>
	<div class="docs-row">
		<Button Label="Open a text file" Icon="folder-open" (click)="Open" />
		<Button Label="Save a file" Icon="save" (click)="Save" />
		<Button Label="Full screen" Icon="maximize" Variant="ghost" (click)="Full" />
	</div>
	<p class="elemenx-text small muted">{{Note}}</p>
	<p class="elemenx-text small muted">Look at the icon of this tab while you press the buttons.</p>
	<div class="docs-row">
		<Button Label="A new icon" (click)="Changed" />
		<Button Label="One more message" Icon="comment" (click)="Counted" />
		<Button Label="Upload" Icon="upload" (click)="Uploaded" />
		<Button Label="As it was" Variant="ghost" (click)="Reset" />
	</div>
	<p class="elemenx-text small">Messages: {{Count}}, upload: {{Part === null ? 'none' : Math.round(Part * 100) + '%'}}.</p>
</div>
<script>
({
	Platform: '',
	Features: '',
	Note: 'In a browser the features are those of the web; in a program of elemenx build --native they are those of the system.',
	Count: 0,
	Part: null,
	Timer: 0,

	$OnCreate: function () {
		var platform = this.$Service('Platform');

		this.Platform = platform.Platform();
		this.Features = ['window', 'dialogs', 'menu', 'tray', 'external', 'taskbar', 'hotkeys', 'autostart', 'links', 'power', 'update'].filter(function (feature) {
			return platform.Has(feature);
		}).join(', ');
	},

	$OnDestroy: function () {
		window.clearInterval(this.Timer);
	},

	Open: function () {
		var self = this;

		this.$Service('Platform').Open({Accept: ['.txt', '.md', '.json'], Read: 'text'}, function (error, files) {
			self.Note = error ? error.message : files.length ? files[0].Name + ': ' + files[0].Text.slice(0, 80) : 'Cancelled';
		});
	},

	Save: function () {
		var self = this;

		this.$Service('Platform').Save({Name: 'hello.txt', Text: 'Hello from Elemenx'}, function (error, result) {
			self.Note = error ? error.message : result ? 'Saved' : 'Cancelled';
		});
	},

	Full: function () {
		var self = this;

		this.$Service('Platform').Window('fullscreen', function (error) {
			if (error)
				self.Note = error.message;
		});
	},

	Changed: function () {
		this.$Service('Platform').Icon({
			Light: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1a73e8"/><path d="M18 34l10 10 18-22" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/></svg>',
			Dark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#8ab4f8"/><path d="M18 34l10 10 18-22" stroke="#202124" stroke-width="7" fill="none" stroke-linecap="round"/></svg>'
		});
	},

	Counted: function () {
		this.Count++;

		this.$Service('Platform').Badge(this.Count);
	},

	Uploaded: function () {
		var self = this;

		window.clearInterval(this.Timer);

		this.Part = 0;

		this.Timer = window.setInterval(function () {
			self.Part = Math.min(1, self.Part + 0.1);

			self.$Service('Platform').Progress(self.Part);

			if (self.Part >= 1) {
				window.clearInterval(self.Timer);

				window.setTimeout(function () {
					self.Part = null;

					self.$Service('Platform').Progress(null);
				}, 600);
			}
		}, 300);
	},

	Reset: function () {
		window.clearInterval(this.Timer);

		this.Count = 0;
		this.Part = null;

		this.$Service('Platform').ResetIcon();
	}
})
</script>
```

## Tests

- [is what the Platform Service asks: its handlers in the program, the rest as on the web](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/android-bridge.test.js#L74) — `tests/regression/android-bridge.test.js`
- [opens files with the picker of its web view, the bridge having no handler for them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-mobile.test.js#L49) — `tests/regression/native-mobile.test.js`
- [saves a text or a binary file in the Documents of the device and gives its path](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-mobile.test.js#L73) — `tests/regression/native-mobile.test.js`
- [hides the screen of the system once the page shows, with @capacitor/splash-screen](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-mobile.test.js#L102) — `tests/regression/native-mobile.test.js`
- [names the plugin to install when a program without @capacitor/filesystem saves](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-mobile.test.js#L114) — `tests/regression/native-mobile.test.js`
- [draws a card of ElemenxUI in the corner of the page, its buttons and its close told, gone after its time](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-notify.test.js#L83) — `tests/regression/native-notify.test.js`
- [gives the system the notifications of Look system: the Notification of the browser on the web, the bridge in a program](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-notify.test.js#L128) — `tests/regression/native-notify.test.js`
- [draws the cards of a program in a window of its own by the corner of the screen, as large as they are](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-notify.test.js#L169) — `tests/regression/native-notify.test.js`
- [stacks its cards as toasts: one of an ID updated in place, a limit past which they are counted, the newest next to the corner](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-notify.test.js#L217) — `tests/regression/native-notify.test.js`
- [holds the time of a card while the pointer is over it, and shows the time it has left](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-notify.test.js#L257) — `tests/regression/native-notify.test.js`
- [draws a card of a Component of its own, as an invitation to a call: over the limit, its sound until it goes, its choice told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-notify.test.js#L284) — `tests/regression/native-notify.test.js`
- [needs a title or a text](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-notify.test.js#L333) — `tests/regression/native-notify.test.js`

+22 more in the same files
