<!-- generated -->
# Platform

Платформа, на которой работает приложение, — один API, где бы оно ни работало: его окна, его иконка, панель задач, трей, диалоги, уведомления и другие возможности системы. В программе elemenx build --native (настольная: Electron, мобильная: Capacitor) он обращается к системе через мост программы (window.ElemenxNative); в браузере делает то, что может веб: выбор файла, скачивание, confirm, новая вкладка, полный экран. Каждый вызов принимает callback(error, result); возможность, которой здесь нет, возвращает ошибку.

Available() — true в нативной программе, Platform() — 'electron', 'capacitor', 'android' (ElemenxView своей программы для Android: elemenx build --native android-library) или 'web', Has(feature) сообщает, работает ли здесь возможность (window, dialogs, menu, tray, external, taskbar, hotkeys, autostart, links, power, update, notifications; files в мобильной программе).

- Window(action, callback, id): minimize, maximize, restore, toggle-maximize, fullscreen, focus, close, show (окно, спрятанное в трей, возвращается) и quit (программа завершается даже с CloseToTray); результат — состояние {Maximized, Minimized, Fullscreen, Focused}. id — окно OpenWindow (его собственные кнопки); без него — первое окно. Title(text, callback): заголовок окна.
- Frame(id): рамка окон программы (Native.Desktop.Frame) или окна id из OpenWindow: system, hidden (системный заголовок спрятан под страницей, его кнопки поверх неё, их место — в env(titlebar-area-*)), none или transparent (заголовок рисует Приложение: элемент с elemenx-native-drag перемещает окно; TitleBar из ElemenxUI); в вебе — web. <html> хранит её в data-elemenx-frame, а материал — в data-elemenx-material. TitleBarOverlay({Color, Symbol, Height}, callback): цвета системных кнопок поверх страницы с Frame hidden (TitleBar даёт им свои), true, когда система их приняла.
- Open({Accept, Multiple, Read, Title}, callback): файлы, выбранные пользователем, [{Name, Path, Size, Text или Data}]; Read 'text' (по умолчанию), 'data' (base64) или 'none'; [], если пользователь отменил. Мобильная программа выбирает их, как веб.
- Save({Name, Text или Data, Accept, Title}, callback): файл, записанный туда, куда укажет пользователь, {Path} (null в вебе, где это скачивание), null, если пользователь отменил. Мобильная программа записывает его в «Документы» устройства (Name — путь там; @capacitor/filesystem), {Path} — его URI.
- Message({Title, Text, Buttons, Kind}, callback): сообщение с кнопками, номер нажатой.
- Menu(items, callback): меню программы ([{Label, Items: [{ID, Label, Hotkey, Disabled, Checked, Separator, Items, Role}]}]; null убирает его); щелчок — событие menu {ID}. ContextMenu(items, callback): меню у указателя, выбранный ID или null.
- Tray({Icon, Tooltip, Items}, callback): иконка в системном лотке (Icon — путь в приложении; null убирает её); событие tray {ID, Kind}: пункт её меню (Kind menu) или сама иконка (ID null, Kind click, double или right). С Native.Desktop.CloseToTray закрытие окна прячет программу в трей, а щелчок по иконке возвращает её. С Window ({Component, Props, Element, Width, Height}, 320 на 420) щелчок по иконке открывает рядом с ней маленькое окно приложения, как окна трея у программ (без рамки, не на панели задач, прячется, теряя фокус), а меню открывается правой кнопкой; TrayWindow(show, callback) показывает его (true) или прячет (false), например после выбора в нём. TrayMenu(items, callback) меняет меню значка, не трогая сам значок и его окно (так делает NativeMenu с Target tray и Look system).
- TrayPopup({Component, Props, Element, Width, Height}, callback): окно Приложения у указателя по правой кнопке значка вместо системного меню (так NativeMenu с Target tray рисует своё меню); null убирает его. ShowTrayPopup(show, callback) показывает его, прячет или меняет размер ({Width, Height}). TrayIcon({Icon или Image, Tooltip}, callback) меняет картинку иконки (и её подсказку) на месте: Icon — путь в приложении, текст SVG, data URL или {Light, Dark} (рисуется в PNG), Image — data URL картинки PNG (в сети, не в сети...).
- Icon(icon, callback): иконка приложения (Elemenx.Icon): фавиконка в вебе, иконка окон программы (панель задач, заголовок, Dock в macOS; рисуется в PNG). icon — URL (или путь в приложении), текст SVG, data URL или {Light, Dark}, по одной для каждой схемы системы; null возвращает иконку страницы (и ту, с которой собрана программа). Программа следует за каждым изменением Elemenx.Icon, и за $Icon компонентов тоже. ResetIcon(callback): иконка страницы, без значка и прогресса. IconState() — {Icon, Badge, Progress}.
- Notify({ID, Title, Text, Icon, Image, Variant, Actions, Silent, Urgency, Tag, Timeout, Look}, callback): уведомление, callback(error, {ID}). Look system (по умолчанию) — системное: Electron в программе (Icon — путь в Приложении; Silent; Urgency low, normal или critical; Actions — в macOS), Notification браузера в вебе (сначала спрашивает разрешение). Look elemenx — карточка ElemenxUI (NotificationHost: Image, Variant info, success, warning или danger, Actions везде), нарисованная темой: в программе — у угла экрана, в собственном окне поверх остальных, которое не забирает фокус, в вебе — в углу страницы; закрывается через Timeout миллисекунд (6000; 0 — когда закроет пользователь; пока над ней указатель, время стоит, а оставшееся время видно полоской). Карточка с тем же ID встаёт на место прежней (Progress от 0 до 1 — например, загрузка). Component и Props рисуют карточку своим компонентом Приложения, который получает Notification {ID, Choose(action), Close()} (Bare — без рамки карточки: CallInvite, приглашение в звонок); Priority high держит её у угла сверх лимита; Sound (URL, Loop) играет, пока она не уйдёт. Notifications({Limit, Corner}) — сколько карточек видно (4; остальные считаются, +N) и в каком углу экрана или страницы; CloseNotification(id) убирает одну. Событие notification {ID, Kind, Action}: click (нажали на уведомление), action (его кнопку, Action — её ID), close (закрыл пользователь) или timeout.
- Role(role, callback): то, что система делает для пункта меню с этой ролью (undo, copy, reload, zoomIn, minimize, quit...); в вебе — правка через document.execCommand.
- External(url, callback): открывает ссылку http, https или mailto в браузере системы.
- Badge(count, callback): число на иконке: значок системы в программе (в Windows — маленькая картинка поверх иконки, нарисованная здесь) и в установленном веб-приложении, а также красный круг с числом, нарисованный поверх фавиконки (99+ после 99; 'dot' — круг без числа; 0 убирает его). Progress(value, callback): ход выполнения от 0 до 1 на кнопке окна и кольцо вокруг фавиконки (null убирает его) или {Value, State}, где State — normal, indeterminate (без значения: идёт), paused или error.
- Attention(on, callback): кнопка окна мигает (иконка в Dock подпрыгивает), пока окно не выйдет вперёд; в вебе заголовок страницы и фавиконка мигают, пока страница скрыта.
- Thumbar(buttons, callback): кнопки под миниатюрой окна в Windows ([{ID, Icon, Tooltip, Disabled}], не больше семи; [] убирает их); нажатие — событие thumbar {ID}.
- Tasks(callback): задачи списка переходов программы (Native.Desktop.Tasks: [{ID, Label, Description}], в Windows), которые запустили её или пришли после последнего вызова; задача, выбранная позже, — событие task {ID}.
- Shortcuts(keys, callback): глобальные сочетания клавиш программы, слышные, даже когда фокус у другой программы (['CommandOrControl+Shift+K']; [] убирает их); результат перечисляет выданные системой (сочетание может держать другая программа); нажатие — событие shortcut {Keys}.
- Autostart(enabled, callback): запускает программу при входе пользователя (true) или нет (false); без enabled только сообщает; результат — {Enabled} (Windows и macOS).
- Links(callback): ссылки схемы программы (Native.Desktop.Protocol: myapp://...), которые открыли её или пришли после последнего вызова; ссылка, пришедшая позже, — событие link {URL}, и вторая программа не запускается.
- Power(callback): {OnBattery, Idle (секунды без ввода), State (active, idle, locked, unknown)}; событие power {State}: suspend, resume, lock-screen, unlock-screen, on-ac, on-battery, shutdown. Awake(on, callback) не даёт экрану уснуть (в вебе через Screen Wake Lock), результат {Awake}.
- Update(callback): спрашивает ленту версий (Native.Desktop.Update: JSON {Version, URL, Notes}), вышла ли новая версия: {Current, Latest, Available, URL, Notes}; затем External(URL) открывает загрузку.
- OpenWindow({ID, Component, Props, Element, Title, Width, Height, Frame}, callback): ещё одно окно того же приложения: его Component (с Props) или Element живёт в отдельном окне со стилями, темой и направлением страницы, с состоянием и сервисами одного приложения. Ссылка приложения, нажатая там, ведёт маршрутизатор страницы. Уже открытый ID выходит вперёд. callback(error, {ID, Window}); браузер открывает окно только после нажатия или клавиши пользователя. Windows() перечисляет открытые ID, FocusWindow(id) выводит окно вперёд, CloseWindow(id) закрывает его; закрытое окно (и пользователем) уносит свой Component и даёт событие closed {ID}. В программе окна закрываются вместе с первым.
- On(name, callback) / Off(name, callback): события menu, tray, window ({Maximized, Minimized, Fullscreen, Focused}), shortcut, link, task, thumbar, closed и power.

## Методы

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

## Пример

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

## Тесты

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

+22 ещё в тех же файлах
