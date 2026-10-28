<!-- generated -->
# Hotkeys

Сочетания клавиш страницы. Bind(keys, callback, options) возвращает ID привязки; Unbind(id) удаляет её. keys: модификаторы и клавиша через '+' ('Mod+K', 'Ctrl+Shift+P', 'Alt+ArrowUp', 'Escape', 'F2', '?'); Mod — это Ctrl или Command в macOS. Пробел задаёт последовательность, нажимаемую по очереди ('g i', в пределах секунды). Буквы и цифры совпадают и по месту на клавиатуре, так что 'Mod+K' работает в любой раскладке. Параметры: Scope (элемент: привязка работает, только пока фокус внутри него, и побеждает привязки без Scope), Inputs (true: также при вводе в поле; по умолчанию сочетание без Ctrl, Alt или Command в поле не срабатывает), Prevent (false сохраняет действие клавиши по умолчанию), Description и Group (их показывают List и CommandPalette). callback(event, binding). List() возвращает привязки [{ID, Keys, Label, Description, Group}]; Format(keys) — подпись клавиш в этой системе ('Ctrl+K', '⌘K'). Trigger(id) выполняет привязку, как будто нажаты её клавиши (callback(null, binding)). Pause() и Resume() выключают и включают все привязки (вложенные Pause считаются). OnChange(callback) / OffChange(callback): callback() после добавления или удаления привязки (часть страницы, отрисованная позже, *lazy, привязывает свои клавиши тогда).

## Методы

- `Bind(keys, callback, options)`
- `Unbind(id)`
- `OnChange(callback)`
- `OffChange(callback)`
- `List()`
- `Trigger(id)`
- `Pause()`
- `Resume()`
- `Format(keys)`

## Пример

```example
<p class="elemenx-text">Press <kbd class="elemenx-kbd">{{Keys}}</kbd> or the sequence <kbd class="elemenx-kbd">g</kbd> <kbd class="elemenx-kbd">h</kbd>: {{Note}}</p>
<ul class="elemenx-ul"><li *for="binding of List" *key="binding.ID">{{binding.Label}} — {{binding.Description}}</li></ul>
<script>
({
	Note: 'nothing yet',
	Keys: '',
	List: [],

	$OnCreate: function () {
		var self = this;
		var hotkeys = this.$Service('Hotkeys');

		this.Keys = hotkeys.Format('Mod+Shift+L');
		this.Bindings = [
			hotkeys.Bind('Mod+Shift+L', function () {
				self.Note = 'Mod+Shift+L at ' + new Date().toLocaleTimeString();
			}, {Description: 'An example shortcut', Group: 'Docs'}),
			hotkeys.Bind('g h', function () {
				self.Note = 'the sequence g h';
			}, {Description: 'An example sequence', Group: 'Docs'})
		];

		this.List = hotkeys.List().filter(function (binding) {
			return binding.Group === 'Docs';
		});
	},

	$OnDestroy: function () {
		var hotkeys = this.$Service('Hotkeys');

		this.Bindings.forEach(function (id) {
			hotkeys.Unbind(id);
		});
	}
})
</script>
```

## Тесты

- [draws the menu of the window of a program with ElemenxUI by default: a bar, the menu of the system taken away, a role done by the system](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-menu.test.js#L135) — `tests/regression/native-menu.test.js`
- [is a bar of menus on the web, without the items of the system, its shortcuts hotkeys of the page](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-menu.test.js#L248) — `tests/regression/native-menu.test.js`
- [opens a window with the element in it and hears the hotkeys pressed there until it closes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/other-document.test.js#L144) — `tests/regression/other-document.test.js`
- [a keyboard lays out its keys, marks hotkeys, shows the keys held and takes presses](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L3122) — `tests/examples/ui-kit.spec.js`
