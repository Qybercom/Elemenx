<!-- generated -->
# Native

Нативные возможности системы вокруг приложения — один API, где бы оно ни работало. В программе elemenx build --native (настольная: Electron, мобильная: Capacitor) он обращается к системе через мост программы (window.ElemenxNative); в браузере делает то, что может веб: выбор файла, скачивание, confirm, новая вкладка, полный экран. Каждый вызов принимает callback(error, result); возможность, которой здесь нет, возвращает ошибку.

Available() — true в нативной программе, Platform() — 'electron', 'capacitor' или 'web', Has(feature) сообщает, работает ли здесь возможность (window, dialogs, menu, tray, external, taskbar, hotkeys, autostart, links, power, update; files в мобильной программе).

- Window(action, callback): minimize, maximize, restore, toggle-maximize, fullscreen, focus, close, show (окно, спрятанное в трей, возвращается) и quit (программа завершается даже с CloseToTray); результат — состояние {Maximized, Minimized, Fullscreen, Focused}. Title(text, callback): заголовок окна.
- Open({Accept, Multiple, Read, Title}, callback): файлы, выбранные пользователем, [{Name, Path, Size, Text или Data}]; Read 'text' (по умолчанию), 'data' (base64) или 'none'; [], если пользователь отменил. Мобильная программа выбирает их, как веб.
- Save({Name, Text или Data, Accept, Title}, callback): файл, записанный туда, куда укажет пользователь, {Path} (null в вебе, где это скачивание), null, если пользователь отменил. Мобильная программа записывает его в «Документы» устройства (Name — путь там; @capacitor/filesystem), {Path} — его URI.
- Message({Title, Text, Buttons, Kind}, callback): сообщение с кнопками, номер нажатой.
- Menu(items, callback): меню программы ([{Label, Items: [{ID, Label, Hotkey, Disabled, Checked, Separator, Items, Role}]}]; null убирает его); щелчок — событие menu {ID}. ContextMenu(items, callback): меню у указателя, выбранный ID или null.
- Tray({Icon, Tooltip, Items}, callback): иконка в системном лотке (Icon — путь в приложении; null убирает её); событие tray {ID, Kind}: пункт её меню (Kind menu) или сама иконка (ID null, Kind click, double или right). С Native.Desktop.CloseToTray закрытие окна прячет программу в трей, а щелчок по иконке возвращает её. С Window ({Component, Props, Element, Width, Height}, 320 на 420) щелчок по иконке открывает рядом с ней маленькое окно приложения, как окна трея у программ (без рамки, не на панели задач, прячется, теряя фокус), а меню открывается правой кнопкой; TrayWindow(show, callback) показывает его (true) или прячет (false), например после выбора в нём.
- External(url, callback): открывает ссылку http, https или mailto в браузере системы.
- Badge(count, callback): число на иконке программы (0 убирает его; в Windows — маленькая картинка поверх иконки, нарисованная здесь). Progress(value, callback): ход выполнения от 0 до 1 на кнопке окна (null убирает его) или {Value, State}, где State — normal, indeterminate (без значения: бежит), paused или error.
- Attention(on, callback): кнопка окна мигает (значок в Dock подпрыгивает), пока окно не выйдет вперёд; в браузере мигает заголовок страницы, пока она скрыта.
- Thumbar(buttons, callback): кнопки под миниатюрой окна в Windows ([{ID, Icon, Tooltip, Disabled}], не больше семи; [] убирает их); нажатие — событие thumbar {ID}.
- Tasks(callback): задачи списка переходов программы (Native.Desktop.Tasks: [{ID, Label, Description}], в Windows), которые запустили её или пришли после последнего вызова; задача, выбранная позже, — событие task {ID}.
- Shortcuts(keys, callback): глобальные сочетания клавиш программы, слышные, даже когда фокус у другой программы (['CommandOrControl+Shift+K']; [] убирает их); результат перечисляет выданные системой (сочетание может держать другая программа); нажатие — событие shortcut {Keys}.
- Autostart(enabled, callback): запускает программу при входе пользователя (true) или нет (false); без enabled только сообщает; результат — {Enabled} (Windows и macOS).
- Links(callback): ссылки схемы программы (Native.Desktop.Protocol: myapp://...), которые открыли её или пришли после последнего вызова; ссылка, пришедшая позже, — событие link {URL}, и вторая программа не запускается.
- Power(callback): {OnBattery, Idle (секунды без ввода), State (active, idle, locked, unknown)}; событие power {State}: suspend, resume, lock-screen, unlock-screen, on-ac, on-battery, shutdown. Awake(on, callback) не даёт экрану уснуть (в вебе через Screen Wake Lock), результат {Awake}.
- Update(callback): спрашивает ленту версий (Native.Desktop.Update: JSON {Version, URL, Notes}), вышла ли новая версия: {Current, Latest, Available, URL, Notes}; затем External(URL) открывает загрузку.
- OpenWindow({ID, Component, Props, Element, Title, Width, Height}, callback): ещё одно окно того же приложения: его Component (с Props) или Element живёт в отдельном окне со стилями, темой и направлением страницы, с состоянием и сервисами одного приложения. Ссылка приложения, нажатая там, ведёт маршрутизатор страницы. Уже открытый ID выходит вперёд. callback(error, {ID, Window}); браузер открывает окно только после нажатия или клавиши пользователя. Windows() перечисляет открытые ID, FocusWindow(id) выводит окно вперёд, CloseWindow(id) закрывает его; закрытое окно (и пользователем) уносит свой Component и даёт событие closed {ID}. В программе окна закрываются вместе с первым.
- On(name, callback) / Off(name, callback): события menu, tray, window ({Maximized, Minimized, Fullscreen, Focused}), shortcut, link, task, thumbar, closed и power.

## Методы

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

## Пример

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
