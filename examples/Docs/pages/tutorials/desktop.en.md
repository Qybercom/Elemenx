# A desktop program

The same Application as a program of Windows, macOS and Linux, with Electron: its own title bar and menu, the tray, notifications, the dialogs to open and save files, and an installer. The finished project is `examples/Native`.

What you learn: `Native.Desktop` of `elemenx.config.js`, the `Native` Service of ElemenxUI (the system from the page), `TitleBar` and `NativeMenu`, and the builds of a program.

## 1. Electron in the project

```bash
npx elemenx native add desktop
```

It installs Electron and its packager into the project, once (Elemenx carries neither: Electron is about 100 MB, and the project picks its version). `elemenx dev` still runs the Application in a browser, where the `Native` Service does what the web can.

## 2. The program

```js
module.exports = {
	Application: 'Native',
	Entry: 'app.js',
	Index: 'index.html',
	Output: 'dist',

	/* The icon of the Application everywhere: the page, the program, its installer, the phones. */
	Icon: '/icons/app.png',

	/* The splash of its page: shown until the Application is ready, in the window and on the phone too. */
	Splash: {Image: '/icons/tray.png', Text: 'Elemenx native', Background: '#1e1f22', Color: '#dfe1e5', MinTime: 600},

	Native: {
		Desktop: {
			Name: 'Elemenx native',
			Width: 960,
			Height: 640,
			Frame: 'hidden',
			CloseToTray: true,
			Tasks: [
				{ID: 'compose', Label: 'New note', Description: 'Write a new note'},
				{ID: 'inbox', Label: 'Inbox'}
			],
			Targets: ['zip', 'installer', 'portable']
		}
	}
};
```

`Frame: 'hidden'` keeps the buttons of the system over a title bar the Application draws; `CloseToTray` hides the window in the tray when it closes; `Tasks` are the items of its jump list; `Targets` the files a build makes.

## 3. The title bar and the menu

`TitleBar` is the bar the user moves the window by; `NativeMenu` declares the menu of the program as a menu of the page. A `MenuItem` with a `Role` does what the system does (undo, copy, quit...); a `Shortcut` is a hotkey of the program.

```html
<TitleBar Title="Elemenx native" Image="/icons/app.png">
	<NativeMenu (select)="MenuChosen" (apply)="MenuApplied">
		<MenuItem [label]="$T('native.menu.file')">
			<MenuItem ID="note" [label]="$T('native.menu.newNote')" Shortcut="Mod+N" />
			<MenuItem ID="open" [label]="$T('native.menu.open')" Shortcut="Mod+O" />
			<MenuItem ID="save" [label]="$T('native.menu.save')" Shortcut="Mod+S" />
			<MenuItem Separator="true" />
			<MenuItem [label]="$T('native.menu.quit')" Role="quit" />
		</MenuItem>
		<MenuItem [label]="$T('native.menu.edit')">
			<MenuItem [label]="$T('native.menu.undo')" Role="undo" />
			<MenuItem [label]="$T('native.menu.copy')" Role="copy" />
			<MenuItem [label]="$T('native.menu.paste')" Role="paste" />
		</MenuItem>
	</NativeMenu>
</TitleBar>
<NativeMenu Target="tray" (select)="MenuChosen">
	<MenuItem ID="show" [label]="$T('native.menu.show')" />
	<MenuItem [label]="$T('native.menu.quit')" Role="quit" />
</NativeMenu>
```

On the web the menu is a `MenuBar` of the page without the items of the system, and the menu of the tray shows nothing.

## 4. The system from the page

The window runs no Node: the page asks the system through the `Native` Service, as a callback `(error, result)`:

```js
Opened: function () {
	var self = this;

	this.$Service('Native').Open({Accept: ['.txt', '.md', '.json'], Read: 'text'}, function (error, files) {
		if (error) {
			self.Said('Open: error, ' + error.message);

			return;
		}

		self.Said('Open: ' + files.map(function (file) {
			return file.Name + ' (' + file.Size + ' bytes)';
		}).join(', ') || 'nothing');
	});
},

Saved: function () {
	this.$Service('Native').Save({Name: 'elemenx.txt', Text: 'Saved by Elemenx at ' + new Date().toISOString() + '\n'}, this.Answer('Save'));
}
```

`Said` and `Answer` are helpers of the example that show the result. `Platform()` tells where the Application runs (`electron`, `capacitor` or `web`), and `Has(feature)` whether the system can do a thing (`tray`, `notifications`, `taskbar`, `hotkeys`...): a button of a feature the system lacks can hide. In a browser the same calls do what the web can: a file input, a download, a notification of the browser.

## 5. Build

```bash
npx elemenx build --native desktop
```

`dist/native/desktop-bin` is the program for this system, and `dist/native/desktop-dist` its zip, its installer and its portable program. `Native.Desktop.Platform` and `Arch` build for another system.

## Next

- [A mobile application](/tutorials/mobile): the same project on Android and iOS.
- [Builds](/guide/build): every option of `Native.Desktop`.
