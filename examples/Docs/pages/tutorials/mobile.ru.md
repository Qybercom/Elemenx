<!-- generated -->
# Мобильное приложение

Тот же проект как программы для Android и iOS на Capacitor: приложение в нативном окне телефона, его иконка и заставка и возможности телефона через тот же сервис `Platform`. Готовый проект — `examples/Native`.

Чему вы научитесь: `Native.Mobile` в `elemenx.config.js`, проект Capacitor, который делает сборка, и как одно приложение работает на телефоне, на десктопе и в вебе.

## 1. Capacitor в проекте

```bash
npx elemenx native add mobile
```

Команда один раз устанавливает Capacitor и его платформы в проект. Для сборки программ нужны Android Studio (Android) и Xcode на Mac (iOS).

## 2. Программа для телефона

```js
Native: {
	Mobile: {
		AppID: 'dev.elemenx.nativeexample',
		Name: 'Elemenx native'
	}
}
```

`AppID` — идентификатор программы в магазинах; `Icon` и `Splash` из `elemenx.config.js` становятся её иконкой и заставкой всех размеров, которые нужны платформам.

## 3. Одно приложение, три места

Сервис `Platform` сообщает, где он работает и что умеет система:

```js
$OnCreate: function () {
	var native = this.$Service('Platform');

	this.Platform = native.Platform();
	this.Features = ['dialogs', 'notifications', 'external', 'tray', 'taskbar'].filter(function (feature) {
		return native.Has(feature);
	});
}
```

Раскладка из ElemenxUI уже следует за экраном: на узком экране `Menu` или `ContextMenu` с `Sheet="auto"` открывается шторкой снизу, `Workspace` выводит свои панели поверх основной области, а `Swipe` (`*swipe`) принимает жесты пальцем.

## 4. Сборка и запуск

```bash
npx elemenx build --native mobile
```

Сборка записывает приложение в `dist/native/mobile`, добавляет установленные платформы и копирует приложение в них. Затем:

```bash
npx cap open android
```

Android Studio открывает проект и запускает его на телефоне или эмуляторе; `npx cap open ios` открывает Xcode. `npm run android` примера собирает и запускает его на Android за один шаг.

## Своя программа для Android

Существующая программа на Java или Kotlin может показать приложение Elemenx без Capacitor: `elemenx build --native android-library` делает модуль Gradle с `ElemenxView` (см. [Сборки](/guide/build)).

## Дальше

- [Десктоп-программа](/tutorials/desktop).
- [Приложение, работающее офлайн](/tutorials/pwa): установка из браузера, без магазина.
