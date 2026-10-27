# A mobile application

The same project as the programs of Android and iOS, with Capacitor: the Application in a native window of the phone, its icon and splash screen, and the features of the phone through the same `Native` Service. The finished project is `examples/Native`.

What you learn: `Native.Mobile` of `elemenx.config.js`, the Capacitor project the build makes, and how one Application reads the phone, the desktop and the web.

## 1. Capacitor in the project

```bash
npx elemenx native add mobile
```

It installs Capacitor and its platforms into the project, once. To build the programs you need Android Studio (Android) and Xcode on a Mac (iOS).

## 2. The program of the phone

```js
Native: {
	Mobile: {
		AppID: 'dev.elemenx.nativeexample',
		Name: 'Elemenx native'
	}
}
```

`AppID` is the identity of the program in the stores; `Icon` and `Splash` of `elemenx.config.js` become its icon and its splash screen, of every size the platforms want.

## 3. One Application, three places

The `Native` Service tells where it runs, and what the system can do:

```js
$OnCreate: function () {
	var native = this.$Service('Native');

	this.Platform = native.Platform();
	this.Features = ['dialogs', 'notifications', 'external', 'tray', 'taskbar'].filter(function (feature) {
		return native.Has(feature);
	});
}
```

A layout made of ElemenxUI follows the screen already: on a narrow screen a `Menu` or a `ContextMenu` with `Sheet="auto"` opens as a sheet from the bottom, a `Workspace` puts its panels over the main area, and `Swipe` (`*swipe`) takes the gestures of a finger.

## 4. Build and run

```bash
npx elemenx build --native mobile
```

The build writes the Application into `dist/native/mobile`, adds the platforms installed, and copies the Application into them. Then:

```bash
npx cap open android
```

Android Studio opens the project, and runs it on a phone or an emulator; `npx cap open ios` opens Xcode. `npm run android` of the example builds and runs it on Android in one step.

## A program of Android of your own

An existing program in Java or Kotlin can show an Elemenx Application without Capacitor: `elemenx build --native android-library` makes a module of Gradle with `ElemenxView` (see [Builds](/guide/build)).

## Next

- [A desktop program](/tutorials/desktop).
- [An application that works offline](/tutorials/pwa): installed from the browser, no store.
