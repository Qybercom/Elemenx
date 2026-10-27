# An application that works offline

Notes that the user installs from the browser as an application of the system, that run without the network, and that update when the user says so (a PWA). The finished project is `examples/PWA`.

What you learn: the `PWA` of `elemenx.config.js`, the service worker a build makes, `Elemenx.Install` (the prompt to install, the state, the updates), and data kept on the device.

## 1. The build makes the PWA

```js
module.exports = {
	Application: 'PWA',
	Entry: 'app.js',
	Index: 'index.html',
	Output: 'dist',

	/* The icon of the Application: the page, and the icons of the installed application (192 and 512 pixels). */
	Icon: '/icons/app.png',

	PWA: {
		Name: 'Elemenx notes',
		ShortName: 'Notes',
		Description: 'Notes that work without the network: an installable Elemenx application.',
		Theme: '#2f4fd8',
		Background: '#f4f5f7',
		Update: 'prompt'
	}
};
```

`npm run build` writes the manifest, the icons of every size from `Icon`, and a service worker that keeps the files of the build: once the page has loaded, it runs without the network. Nothing of it is written by hand. `Update` decides what a new build does: `auto` takes it for the next start, `prompt` waits until the Application applies it (checked at the start and every hour), `manual` waits and checks only when asked.

## 2. The state of the installation

`Elemenx.Install.State()` is `{Available, Installed, Manual, Waiting, Version}`; `OnChange` tells each change. The component keeps it in its state, so the template follows:

```js
$OnCreate: function () {
	var self = this;

	this.Store = this.$Storage.Local.Namespace('ElemenxNotes');
	this.Notes = this.Store.Get('Notes') || [];
	this.Online = navigator.onLine !== false;
	this.Install = Elemenx.Install.State();

	this.Heard = function (state) {
		self.Install = state;
	};

	this.Network = function () {
		self.Online = navigator.onLine !== false;
	};

	Elemenx.Install.OnChange(this.Heard);

	window.addEventListener('online', this.Network);
	window.addEventListener('offline', this.Network);
},

$OnDestroy: function () {
	Elemenx.Install.OffChange(this.Heard);

	window.removeEventListener('online', this.Network);
	window.removeEventListener('offline', this.Network);
}
```

```html
<div class="pwa-fact"><span class="elemenx-caption">Network</span><strong class="pwa-online">{{Online ? 'online' : 'offline'}}</strong></div>
<div class="pwa-fact"><span class="elemenx-caption">Build</span><strong class="pwa-version">{{Install.Version || 'not kept yet'}}</strong></div>
<div class="pwa-fact"><span class="elemenx-caption">Application</span><strong class="pwa-installed">{{Install.Installed ? 'installed' : Install.Available ? 'can be installed' : Install.Manual ? 'Share, Add to Home Screen' : 'in the browser'}}</strong></div>
```

## 3. The button that installs

The browser offers to install the page by itself; `Elemenx.Install` keeps that prompt so the Application shows it when it wants, from its own button:

```js
Installed: function () {
	var self = this;

	Elemenx.Install.Prompt(function (error, result) {
		self.Said = error ? error.message : result.Outcome === 'accepted' ? 'Installed.' : 'Not now.';
	});
}
```

On a system that installs only by its own menu (Safari on iOS: Share, Add to Home Screen), `Manual` is true: the page tells the user how.

## 4. Updates when the user says

```js
Checked: function () {
	var self = this;

	this.Busy = true;
	this.Said = 'Checking...';

	Elemenx.Install.Update(function (error, result) {
		self.Busy = false;

		if (error) self.Said = error.message;
		else self.Said = result.Available ? 'A new build is ready: ' + result.Version + '.' : 'This is the newest build.';
	});
},

Updated: function () {
	var self = this;

	this.Said = 'Updating...';

	Elemenx.Install.Apply(function (error) {
		self.Said = error.message;
	});
}
```

`Apply` takes the new build at once: every page of the application reloads with it. Its callback is called only when it cannot.

## 5. Data on the device

The notes are in the storage of the browser (`this.$Storage.Local`), on the device: they are there without the network. A larger application keeps them in IndexedDB (see [IndexedDB](/data/indexeddb)) and sends them to its server when the network comes back.

## 6. Try it

```bash
npm run build
```

```bash
npm run serve
```

Open the page, then turn the network off in the developer tools of the browser and reload: the notes are still there. Build again with a change and press Check for updates.

## Next

- [Builds](/guide/build): every option of `PWA`.
- [A desktop program](/tutorials/desktop): the same Application as a program of Windows, macOS and Linux.
