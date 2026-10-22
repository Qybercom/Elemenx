# Библиотеки и ElemenxUI

Библиотека — граф компонентов, сервисов, охранников и директив, общий для приложений: те же файлы `index.js`, та же загрузка при разработке, та же упаковка при сборке. ElemenxUI — библиотека, которая поставляется с Elemenx.

## Использование библиотеки

@block 1

`Elemenx.Library(name, {$Root, $Locales})` объявляет библиотеку до приложений, которые её используют; `$Use` называет её (имя или список), а `$Libraries()` приложения перечисляет их. ElemenxUI объявлять не нужно: `$Use: ['ElemenxUI']` берёт её файлы из `libraries/ElemenxUI` рядом с работающим `elemenx.js`, так что фреймворк с CDN берёт библиотеку оттуда же.

При разработке компонент, которого нет в приложении, ищется в его библиотеках; их сервисы и директивы загружаются до запуска корня, а CSS-файлы, перечисленные в их `index.js`, подключаются один раз. Неизвестное имя в `$Use` пропускается с предупреждением. При сборке упаковываются компоненты библиотек, которые отрисовывает приложение (по тегам в его шаблонах, затем в их шаблонах), а остальные опускаются (см. [Сборки](/guide/build)).

## Своя библиотека

Библиотека — папка с `index.js`, устроенная как граф приложения:

@block 2

`packs.json` в её корне называет большие файлы, нужные немногим страницам, чтобы однофайловая сборка несла их, только когда приложение их использует: `{"brands": {"Files": ["icons/brands.svg"], "Uses": ["brands:"]}}` (`Uses` — тексты, выдающие использование; `Language` делает пакет одного языка).

## ElemenxUI

Около 130 компонентов, 36 сервисов и 13 директив, с английскими и русскими фразами, светлой и тёмной схемами, темами, раскладкой справа налево и поддержкой клавиатуры и экранных читалок. У каждого есть страница в разделах «Компоненты», «Сервисы» и «Директивы»; по темам:

| Тема | Компоненты |
| --- | --- |
| Действия | [Button](/components/Button), [ButtonGroup](/components/ButtonGroup), [Menu](/components/Menu), [MenuList](/components/MenuList), [MenuItem](/components/MenuItem), [ContextMenu](/components/ContextMenu), [CommandPalette](/components/CommandPalette) |
| Текстовые поля | [Input](/components/Input), [TextArea](/components/TextArea), [NumberInput](/components/NumberInput), [MoneyInput](/components/MoneyInput), [PhoneInput](/components/PhoneInput), [OTPInput](/components/OTPInput), [TagInput](/components/TagInput), [Combobox](/components/Combobox), [ColorInput](/components/ColorInput), [Field](/components/Field), [Form](/components/Form) |
| Даты и места | [DateInput](/components/DateInput), [DateRangeInput](/components/DateRangeInput), [TimeInput](/components/TimeInput), [Calendar](/components/Calendar), [CityInput](/components/CityInput), [CurrencySelect](/components/CurrencySelect) |
| Оплата | [CardNumberInput](/components/CardNumberInput), [CardExpiryInput](/components/CardExpiryInput), [CVVInput](/components/CVVInput), [PlanCard](/components/PlanCard), [PlanPicker](/components/PlanPicker) |
| Выбор | [Checkbox](/components/Checkbox), [Radio](/components/Radio), [RadioGroup](/components/RadioGroup), [Toggle](/components/Toggle), [Select](/components/Select), [MultiSelect](/components/MultiSelect), [Slider](/components/Slider), [Knob](/components/Knob), [Rating](/components/Rating), [Tabs](/components/Tabs) |
| Навигация | [Breadcrumbs](/components/Breadcrumbs), [NavList](/components/NavList), [Pagination](/components/Pagination), [Steps](/components/Steps), [Tree](/components/Tree), [SettingsMenu](/components/SettingsMenu) |
| Данные | [Table](/components/Table), [VirtualList](/components/VirtualList), [Properties](/components/Properties), [Property](/components/Property), [Timeline](/components/Timeline), [Chart](/components/Chart), [Sparkline](/components/Sparkline), [Meter](/components/Meter), [Progress](/components/Progress) |
| Раскладка | [Section](/components/Section), [Block](/components/Block), [Card](/components/Card), [Centered](/components/Centered), [Splitter](/components/Splitter), [MasterDetail](/components/MasterDetail), [Dashboard](/components/Dashboard), [DashboardWidget](/components/DashboardWidget), [Settings](/components/Settings), [TileGrid](/components/TileGrid), [Tile](/components/Tile), [TileGroup](/components/TileGroup) |
| Рамки приложений | [Workspace](/components/Workspace), [WorkspaceToolbar](/components/WorkspaceToolbar), [WorkspaceToolWindow](/components/WorkspaceToolWindow), [Ribbon](/components/Ribbon), [RibbonTab](/components/RibbonTab), [RibbonGroup](/components/RibbonGroup), [RibbonButton](/components/RibbonButton), [RibbonGallery](/components/RibbonGallery), [RibbonBackstage](/components/RibbonBackstage), [RibbonPage](/components/RibbonPage), [Window](/components/Window) |
| Поверх страницы | [Dialog](/components/Dialog), [DialogHost](/components/DialogHost), [Drawer](/components/Drawer), [Popover](/components/Popover), [ToastHost](/components/ToastHost), [Tour](/components/Tour), [AchievementHost](/components/AchievementHost) |
| Обратная связь | [Spinner](/components/Spinner), [Skeleton](/components/Skeleton), [EmptyState](/components/EmptyState), [Presence](/components/Presence) |
| Редакторы и просмотр | [RichEditor](/components/RichEditor), [CodeEditor](/components/CodeEditor), [Terminal](/components/Terminal), [Markdown](/components/Markdown), [CodeView](/components/CodeView), [Formula](/components/Formula), [FindBar](/components/FindBar) |
| Люди и медиа | [Avatar](/components/Avatar), [Image](/components/Image), [Gallery](/components/Gallery), [FileUpload](/components/FileUpload), [FileIcon](/components/FileIcon), [Icon](/components/Icon) |
| Карточки | [PostCard](/components/PostCard), [ProductCard](/components/ProductCard), [ProfileCard](/components/ProfileCard), [CommentCard](/components/CommentCard) |
| Переписка | [Chat](/components/Chat), [ChatMessage](/components/ChatMessage), [ChatComposer](/components/ChatComposer), [EmojiPicker](/components/EmojiPicker), [StickerPicker](/components/StickerPicker), [ExpressionPicker](/components/ExpressionPicker) |
| Устройства ввода и звук | [Keyboard](/components/Keyboard), [DialPad](/components/DialPad), [Piano](/components/Piano), [Mixer](/components/Mixer), [MixerChannel](/components/MixerChannel), [GameKey](/components/GameKey) |
| Игры | [GameHud](/components/GameHud), [GameBar](/components/GameBar), [GameSlot](/components/GameSlot), [GameInventory](/components/GameInventory), [GameItemCard](/components/GameItemCard), [GameDialogue](/components/GameDialogue), [GameMenu](/components/GameMenu), [GameTabs](/components/GameTabs), [GameQuests](/components/GameQuests), [GameMinimap](/components/GameMinimap), [GameLeaderboard](/components/GameLeaderboard) |
| Тема | [ThemeSwitch](/components/ThemeSwitch) |

Сервисы: страница ([Theme](/services/Theme), [Toast](/services/Toast), [Dialogs](/services/Dialogs), [Hotkeys](/services/Hotkeys), [Windows](/services/Windows), [Print](/services/Print), [PictureInPicture](/services/PictureInPicture), [Idle](/services/Idle)), данные ([Forms](/services/Forms), [Formats](/services/Formats), [Format](/services/Format), [Countries](/services/Countries), [Currencies](/services/Currencies), [Cities](/services/Cities), [Emoji](/services/Emoji), [Stickers](/services/Stickers)), текст ([RichText](/services/RichText), [Syntax](/services/Syntax), [Diff](/services/Diff), [Find](/services/Find), [Formulas](/services/Formulas)), устройство ([Clipboard](/services/Clipboard), [Permissions](/services/Permissions), [Biometric](/services/Biometric), [Push](/services/Push), [Native](/services/Native), [Gamepad](/services/Gamepad), [Serial](/services/Serial), [USB](/services/USB), [NFC](/services/NFC)) и прочее ([Icons](/services/Icons), [Badges](/services/Badges), [Menus](/services/Menus), [Reveal](/services/Reveal), [Achievements](/services/Achievements), [GameItems](/services/GameItems)).

## Фразы и направления

Каждая фраза, которую показывает ElemenxUI, — ключ `Elemenx.Locale` под `ui.`, со словарями на английском и русском; текстовое свойство компонента (`Placeholder`, `Empty`...) по умолчанию пусто, так что показывается фраза языка, а значение владельца её заменяет. Даты, числа, страны и валюты тоже следуют за языком. Язык с письмом справа налево зеркалит компоненты: логические свойства CSS, стрелки, сохраняющие смысл, ползунки справа налево, всплывающие панели у начала якоря, развёрнутые иконки направлений.

## Иконки

`<Icon Name="save" />` рисует иконку из спрайта библиотеки; имя с набором впереди рисует другой набор: `files:pdf`, `brands:github`, `weather:rain`, `music:`, `sport:`, `racing:`, `science:`, `art:`, `cinema:`, `games:`. Набор загружается, когда впервые показывается одна из его иконок. Сервис `Icons` добавляет наборы приложения и заменяет иконки (`Override`); `elemenx icons` делает набор из папки SVG-файлов (см. [CLI](/guide/cli)).

## Стили

`index.css` библиотеки содержит основу страницы (шрифты, цвета темы, полосы прокрутки), классы раскладки (`elemenx-screen`, `elemenx-container`, `elemenx-column` и их модификаторы), типографику, списки, блоки, таблицы и общие части элементов управления; каждый остальной компонент несёт свою таблицу стилей. Размеры следуют сетке 8-4-2-1: высота элементов управления — 24, 32, 40 и 56 пикселей (`small`, `medium`, `large`, `giant`), текст — 14 на 20. См. [Темы](/guide/theming).

## Пример

@block 3
