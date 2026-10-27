<!-- generated -->
# Десктоп-программа

То же приложение как программа для Windows, macOS и Linux на Electron: своя шапка окна и меню, трей, уведомления, диалоги открытия и сохранения файлов и установщик. Готовый проект — `examples/Native`.

Чему вы научитесь: `Native.Desktop` в `elemenx.config.js`, сервис `Native` из ElemenxUI (система из страницы), `TitleBar` и `NativeMenu`, сборки программы.

## 1. Electron в проекте

```bash
npx elemenx native add desktop
```

Команда один раз устанавливает Electron и его упаковщик в проект (Elemenx не несёт ни того, ни другого: Electron весит около 100 МБ, и версию выбирает проект). `elemenx dev` по-прежнему запускает приложение в браузере, где сервис `Native` делает то, что может веб.

## 2. Программа

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

`Frame: 'hidden'` оставляет кнопки системы поверх шапки, которую рисует приложение; `CloseToTray` прячет окно в трей при закрытии; `Tasks` — пункты списка переходов; `Targets` — файлы, которые делает сборка.

## 3. Шапка и меню

`TitleBar` — полоса, за которую пользователь двигает окно; `NativeMenu` описывает меню программы как меню страницы. `MenuItem` с `Role` делает то, что делает система (отмена, копирование, выход...); `Shortcut` — горячая клавиша программы.

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

В вебе меню — это `MenuBar` страницы без пунктов системы, а меню трея ничего не показывает.

## 4. Система из страницы

В окне нет Node: страница обращается к системе через сервис `Native` с колбэком `(error, result)`:

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

`Said` и `Answer` — помощники примера, которые показывают результат. `Platform()` сообщает, где работает приложение (`electron`, `capacitor` или `web`), а `Has(feature)` — умеет ли система нужное (`tray`, `notifications`, `taskbar`, `hotkeys`...): кнопку возможности, которой нет у системы, можно спрятать. В браузере те же вызовы делают то, что может веб: поле выбора файла, скачивание, уведомление браузера.

## 5. Сборка

```bash
npx elemenx build --native desktop
```

`dist/native/desktop-bin` — программа для этой системы, а `dist/native/desktop-dist` — её zip, установщик и portable-версия. `Native.Desktop.Platform` и `Arch` собирают для другой системы.

## Дальше

- [Мобильное приложение](/tutorials/mobile): тот же проект на Android и iOS.
- [Сборки](/guide/build): все параметры `Native.Desktop`.
