<!-- generated -->
# Приложение, которое работает офлайн

Заметки, которые пользователь устанавливает из браузера как приложение системы, которые работают без сети и обновляются, когда пользователь этого захочет (PWA). Готовый проект — `examples/PWA`.

Чему вы научитесь: `PWA` в `elemenx.config.js`, service worker, который делает сборка, `Elemenx.Install` (предложение установки, состояние, обновления) и данные, хранящиеся на устройстве.

## 1. PWA делает сборка

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

`npm run build` записывает манифест, иконки всех размеров из `Icon` и service worker, который хранит файлы сборки: после первой загрузки страница работает без сети. Ничего из этого не пишется вручную. `Update` решает, что делает новая сборка: `auto` принимает её к следующему запуску, `prompt` ждёт, пока приложение её применит (проверяя при запуске и каждый час), `manual` ждёт и проверяет только по запросу.

## 2. Состояние установки

`Elemenx.Install.State()` — это `{Available, Installed, Manual, Waiting, Version}`; `OnChange` сообщает о каждом изменении. Компонент держит его в своём состоянии, поэтому шаблон следует за ним:

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

## 3. Кнопка установки

Браузер сам предлагает установить страницу; `Elemenx.Install` придерживает это предложение, чтобы приложение показало его, когда захочет, со своей кнопки:

```js
Installed: function () {
	var self = this;

	Elemenx.Install.Prompt(function (error, result) {
		self.Said = error ? error.message : result.Outcome === 'accepted' ? 'Installed.' : 'Not now.';
	});
}
```

В системе, которая устанавливает только через своё меню (Safari на iOS: «Поделиться», «На экран „Домой“»), `Manual` истинно: страница подсказывает пользователю, как это сделать.

## 4. Обновления по желанию пользователя

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

`Apply` сразу принимает новую сборку: каждая страница приложения перезагружается с ней. Его колбэк вызывается, только если это невозможно.

## 5. Данные на устройстве

Заметки лежат в хранилище браузера (`this.$Storage.Local`), на устройстве: они доступны без сети. Приложение побольше хранит их в IndexedDB (см. [IndexedDB](/data/indexeddb)) и отправляет на сервер, когда сеть возвращается.

## 6. Попробуйте

```bash
npm run build
```

```bash
npm run serve
```

Откройте страницу, затем отключите сеть в инструментах разработчика браузера и перезагрузите её: заметки на месте. Соберите снова с изменением и нажмите «Check for updates».

## Дальше

- [Сборки](/guide/build): все параметры `PWA`.
- [Десктоп-программа](/tutorials/desktop): то же приложение как программа для Windows, macOS и Linux.
