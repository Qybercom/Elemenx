<!-- generated -->
# Native

The native features of the system around the Application, one API wherever it runs. In a program of elemenx build --native (desktop: Electron, mobile: Capacitor) it asks the system through the bridge of the program (window.ElemenxNative); in a browser it does what the web can: a file picker, a download, confirm, a new tab, the full screen. Every call takes callback(error, result); a feature the place lacks calls back an error.

Available() is true in a native program, Platform() 'electron', 'capacitor' or 'web', Has(feature) tells whether a feature works here (window, dialogs, menu, tray, external, taskbar, hotkeys, autostart, links, power, update; files in a mobile program).

- Window(action, callback): minimize, maximize, restore, toggle-maximize, fullscreen, focus, close, show (a window hidden in the tray comes back) and quit (the program quits, even with CloseToTray); the result is the state {Maximized, Minimized, Fullscreen, Focused}. Title(text, callback): the title of the window.
- Open({Accept, Multiple, Read, Title}, callback): files chosen by the user, [{Name, Path, Size, Text or Data}]; Read 'text' (by default), 'data' (base64) or 'none'; [] when the user cancels. A mobile program picks them as the web.
- Save({Name, Text or Data, Accept, Title}, callback): a file written where the user says, {Path} (null on the web, where it is a download), null when the user cancels. A mobile program writes it in the Documents of the device (Name a path there; @capacitor/filesystem), {Path} its URI.
- Message({Title, Text, Buttons, Kind}, callback): a message with buttons, the index of the one pressed.
- Menu(items, callback): the menu of the program ([{Label, Items: [{ID, Label, Hotkey, Disabled, Checked, Separator, Items, Role}]}]; null removes it); a click is the menu event {ID}. ContextMenu(items, callback): a menu at the pointer, the ID chosen or null.
- Tray({Icon, Tooltip, Items}, callback): an icon in the tray (Icon a path in the Application; null removes it); the tray event {ID, Kind}: an item of its menu (Kind menu), or the icon itself (ID null, Kind click, double or right). With Native.Desktop.CloseToTray, closing the window hides the program in the tray and a click on the icon brings it back. With Window ({Component, Props, Element, Width, Height}, 320 by 420) a click on the icon opens a small window of the Application by it, as the tray windows of programs do (no frame, not on the taskbar, hidden when it loses the focus), and the menu opens with the right button; TrayWindow(show, callback) shows it (true) or hides it (false), after a choice in it say.
- External(url, callback): opens an http, https or mailto link in the browser of the system.
- Badge(count, callback): a number on the icon of the program (0 removes it; on Windows a small picture over the icon, drawn here). Progress(value, callback): a progress from 0 to 1 on the button of the window (null removes it), or {Value, State} with State normal, indeterminate (no value: it runs), paused or error.
- Attention(on, callback): the button of the window flashes (the dock bounces) until the window comes to the front; on the web the title of the page blinks while the page is hidden.
- Thumbar(buttons, callback): the buttons under the thumbnail of the window on Windows ([{ID, Icon, Tooltip, Disabled}], seven at most; [] removes them); a press is the thumbar event {ID}.
- Tasks(callback): the tasks of the jump list of the program (Native.Desktop.Tasks: [{ID, Label, Description}], on Windows) that started it or came since the last call; a task chosen later is the task event {ID}.
- Shortcuts(keys, callback): the global hotkeys of the program, heard even when another program has the focus (['CommandOrControl+Shift+K']; [] removes them); the result lists the ones the system gave (another program may hold one); a press is the shortcut event {Keys}.
- Autostart(enabled, callback): starts the program when the user signs in (true), or not (false); without enabled it only tells; the result is {Enabled} (Windows and macOS).
- Links(callback): the links of the scheme of the program (Native.Desktop.Protocol: myapp://...) that opened it or came since the last call; a link that comes later is the link event {URL}, and starts no second program.
- Power(callback): {OnBattery, Idle (seconds without input), State (active, idle, locked, unknown)}; the power event {State}: suspend, resume, lock-screen, unlock-screen, on-ac, on-battery, shutdown. Awake(on, callback) keeps the screen from sleeping (on the web through the Screen Wake Lock), the result {Awake}.
- Update(callback): asks the feed of the versions (Native.Desktop.Update: a JSON {Version, URL, Notes}) whether a newer version is out: {Current, Latest, Available, URL, Notes}; External(URL) then opens the download.
- OpenWindow({ID, Component, Props, Element, Title, Width, Height}, callback): one more window of the same Application: its Component (with its Props), or an Element, lives in a window of its own, with the styles, the theme and the direction of the page, the state and the Services of the one Application. A link of the Application pressed there routes the page. An ID open already comes to the front. callback(error, {ID, Window}); a browser opens one only after a press or a key of the user. Windows() lists the IDs open, FocusWindow(id) brings one to the front, CloseWindow(id) closes it; a window closed (by the user too) takes its Component away and is the closed event {ID}. In a program the windows close with the first one.
- On(name, callback) / Off(name, callback): the events menu, tray, window ({Maximized, Minimized, Fullscreen, Focused}), shortcut, link, task, thumbar, closed and power.

## Methods

- `Available()`
- `Platform()`
- `Has(feature)`
- `Window(action, callback)`
- `Title(text, callback)`
- `Open(options, callback)`
- `Save(options, callback)`
- `Message(options, callback)`
- `Menu(items, callback)`
- `ContextMenu(items, callback)`
- `Tray(options, callback)`
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
