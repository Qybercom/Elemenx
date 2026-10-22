# Libraries and ElemenxUI

A library is a graph of components, services, guards and directives that Applications share: the same `index.js` files, the same loading in development, the same bundling in a build. ElemenxUI is the library that comes with Elemenx.

## Using a library

```js
Elemenx.Library('Mosaic', {
	$Root: 'libraries/Mosaic',
	$Locales: {URL: 'locales/{language}.json', Languages: ['en', 'de']}
});

Elemenx.Application('Shop', {
	$Use: ['ElemenxUI', 'Mosaic'],
	$Component: 'Layout',
	$Root: 'application'
});
```

`Elemenx.Library(name, {$Root, $Locales})` declares a library before the Applications that use it; `$Use` names it (a name or a list), and `$Libraries()` of the Application lists them. ElemenxUI needs no declaration: `$Use: ['ElemenxUI']` takes its files from `libraries/ElemenxUI` next to the `elemenx.js` that runs, so a framework from a CDN takes its library from there.

In development, a component the Application does not have is looked for in its libraries; their services and directives load before the root starts, and the CSS files their `index.js` lists are attached once. An unknown name in `$Use` is skipped with a warning. In a build, the library components the Application renders (by their tags in its templates, then in theirs) are bundled, and the others are left out (see [Builds](/guide/build)).

## A library of your own

A library is a folder with an `index.js`, laid out as the graph of an Application:

```text
libraries/Mosaic/
├── index.js        ['index.css', 'components', 'services', 'directives']
├── index.css
├── components/
│   ├── index.js    ['Tile/Tile.js', 'TileList/TileList.js']
│   └── Tile/...
├── services/...
└── locales/en.json, de.json
```

`packs.json` in its root names the large files few pages need, so a build in one file carries them only when an Application uses them: `{"brands": {"Files": ["icons/brands.svg"], "Uses": ["brands:"]}}` (`Uses` are the texts that show a use; `Language` makes a pack of one language).

## ElemenxUI

About 130 components, 36 services and 13 directives, with English and Russian phrases, light and dark schemes, themes, right-to-left layout and keyboard and screen reader support. Every one has a page in the sections Components, Services and Directives; by subject:

| Subject | Components |
| --- | --- |
| Actions | [Button](/components/Button), [ButtonGroup](/components/ButtonGroup), [Menu](/components/Menu), [MenuList](/components/MenuList), [MenuItem](/components/MenuItem), [ContextMenu](/components/ContextMenu), [CommandPalette](/components/CommandPalette) |
| Text fields | [Input](/components/Input), [TextArea](/components/TextArea), [NumberInput](/components/NumberInput), [MoneyInput](/components/MoneyInput), [PhoneInput](/components/PhoneInput), [OTPInput](/components/OTPInput), [TagInput](/components/TagInput), [Combobox](/components/Combobox), [ColorInput](/components/ColorInput), [Field](/components/Field), [Form](/components/Form) |
| Dates and places | [DateInput](/components/DateInput), [DateRangeInput](/components/DateRangeInput), [TimeInput](/components/TimeInput), [Calendar](/components/Calendar), [CityInput](/components/CityInput), [CurrencySelect](/components/CurrencySelect) |
| Payment | [CardNumberInput](/components/CardNumberInput), [CardExpiryInput](/components/CardExpiryInput), [CVVInput](/components/CVVInput), [PlanCard](/components/PlanCard), [PlanPicker](/components/PlanPicker) |
| Choice | [Checkbox](/components/Checkbox), [Radio](/components/Radio), [RadioGroup](/components/RadioGroup), [Toggle](/components/Toggle), [Select](/components/Select), [MultiSelect](/components/MultiSelect), [Slider](/components/Slider), [Knob](/components/Knob), [Rating](/components/Rating), [Tabs](/components/Tabs) |
| Navigation | [Breadcrumbs](/components/Breadcrumbs), [NavList](/components/NavList), [Pagination](/components/Pagination), [Steps](/components/Steps), [Tree](/components/Tree), [SettingsMenu](/components/SettingsMenu) |
| Data | [Table](/components/Table), [VirtualList](/components/VirtualList), [Properties](/components/Properties), [Property](/components/Property), [Timeline](/components/Timeline), [Chart](/components/Chart), [Sparkline](/components/Sparkline), [Meter](/components/Meter), [Progress](/components/Progress) |
| Layout | [Section](/components/Section), [Block](/components/Block), [Card](/components/Card), [Centered](/components/Centered), [Splitter](/components/Splitter), [MasterDetail](/components/MasterDetail), [Dashboard](/components/Dashboard), [DashboardWidget](/components/DashboardWidget), [Settings](/components/Settings), [TileGrid](/components/TileGrid), [Tile](/components/Tile), [TileGroup](/components/TileGroup) |
| Application frames | [Workspace](/components/Workspace), [WorkspaceToolbar](/components/WorkspaceToolbar), [WorkspaceToolWindow](/components/WorkspaceToolWindow), [Ribbon](/components/Ribbon), [RibbonTab](/components/RibbonTab), [RibbonGroup](/components/RibbonGroup), [RibbonButton](/components/RibbonButton), [RibbonGallery](/components/RibbonGallery), [RibbonBackstage](/components/RibbonBackstage), [RibbonPage](/components/RibbonPage), [Window](/components/Window) |
| Overlays | [Dialog](/components/Dialog), [DialogHost](/components/DialogHost), [Drawer](/components/Drawer), [Popover](/components/Popover), [ToastHost](/components/ToastHost), [Tour](/components/Tour), [AchievementHost](/components/AchievementHost) |
| Feedback | [Spinner](/components/Spinner), [Skeleton](/components/Skeleton), [EmptyState](/components/EmptyState), [Presence](/components/Presence) |
| Editors and viewers | [RichEditor](/components/RichEditor), [CodeEditor](/components/CodeEditor), [Terminal](/components/Terminal), [Markdown](/components/Markdown), [CodeView](/components/CodeView), [Formula](/components/Formula), [FindBar](/components/FindBar) |
| People and media | [Avatar](/components/Avatar), [Image](/components/Image), [Gallery](/components/Gallery), [FileUpload](/components/FileUpload), [FileIcon](/components/FileIcon), [Icon](/components/Icon) |
| Cards | [PostCard](/components/PostCard), [ProductCard](/components/ProductCard), [ProfileCard](/components/ProfileCard), [CommentCard](/components/CommentCard) |
| Messaging | [Chat](/components/Chat), [ChatMessage](/components/ChatMessage), [ChatComposer](/components/ChatComposer), [EmojiPicker](/components/EmojiPicker), [StickerPicker](/components/StickerPicker), [ExpressionPicker](/components/ExpressionPicker) |
| Input devices and sound | [Keyboard](/components/Keyboard), [DialPad](/components/DialPad), [Piano](/components/Piano), [Mixer](/components/Mixer), [MixerChannel](/components/MixerChannel), [GameKey](/components/GameKey) |
| Games | [GameHud](/components/GameHud), [GameBar](/components/GameBar), [GameSlot](/components/GameSlot), [GameInventory](/components/GameInventory), [GameItemCard](/components/GameItemCard), [GameDialogue](/components/GameDialogue), [GameMenu](/components/GameMenu), [GameTabs](/components/GameTabs), [GameQuests](/components/GameQuests), [GameMinimap](/components/GameMinimap), [GameLeaderboard](/components/GameLeaderboard) |
| Theme | [ThemeSwitch](/components/ThemeSwitch) |

The services: the page ([Theme](/services/Theme), [Toast](/services/Toast), [Dialogs](/services/Dialogs), [Hotkeys](/services/Hotkeys), [Windows](/services/Windows), [Print](/services/Print), [PictureInPicture](/services/PictureInPicture), [Idle](/services/Idle)), data ([Forms](/services/Forms), [Formats](/services/Formats), [Format](/services/Format), [Countries](/services/Countries), [Currencies](/services/Currencies), [Cities](/services/Cities), [Emoji](/services/Emoji), [Stickers](/services/Stickers)), text ([RichText](/services/RichText), [Syntax](/services/Syntax), [Diff](/services/Diff), [Find](/services/Find), [Formulas](/services/Formulas)), the device ([Clipboard](/services/Clipboard), [Permissions](/services/Permissions), [Biometric](/services/Biometric), [Push](/services/Push), [Native](/services/Native), [Gamepad](/services/Gamepad), [Serial](/services/Serial), [USB](/services/USB), [NFC](/services/NFC)) and the rest ([Icons](/services/Icons), [Badges](/services/Badges), [Menus](/services/Menus), [Reveal](/services/Reveal), [Achievements](/services/Achievements), [GameItems](/services/GameItems)).

## Phrases and directions

Every phrase ElemenxUI shows is a key of `Elemenx.Locale` under `ui.`, with dictionaries in English and Russian; a text prop of a component (`Placeholder`, `Empty`...) is empty by default, so the phrase of the language shows, and a value of the owner takes its place. Dates, numbers, countries and currencies follow the language too. A right-to-left language mirrors the components: logical CSS properties, arrows that keep their meaning, sliders from right to left, popups at the start of their anchor, the icons of a direction turned.

## Icons

`<Icon Name="save" />` draws an icon of the sprite of the library; a name with a set before it draws another set: `files:pdf`, `brands:github`, `weather:rain`, `music:`, `sport:`, `racing:`, `science:`, `art:`, `cinema:`, `games:`. A set loads when one of its icons first shows. The `Icons` service adds the sets of an Application and replaces icons (`Override`); `elemenx icons` makes a set from a folder of SVG files (see [The CLI](/guide/cli)).

## Styles

`index.css` of the library holds the base of the page (fonts, the colors of the theme, scrollbars), the layout classes (`elemenx-screen`, `elemenx-container`, `elemenx-column` and their modifiers), typography, lists, blocks, tables and the shared parts of the controls; every other component carries its own stylesheet. Sizes follow a grid of 8-4-2-1: controls are 24, 32, 40 and 56 pixels high (`small`, `medium`, `large`, `giant`), the text 14 on 20. See [Themes](/guide/theming).

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Save" Icon="save" Variant="primary" />
	<Button Icon="bell" Title="Notifications" Badge="3" />
	<Select [options]="[{Value: 'a', Label: 'Alpha'}, {Value: 'b', Label: 'Beta'}]" Value="a" />
	<Toggle Label="On" Checked="true" />
	<Avatar Name="Ada Lovelace" Status="online" />
	<Icon Name="files:pdf" Size="24" />
	<Icon Name="brands:github" Size="24" Colored="true" />
	<Icon Name="weather:rain" Size="24" Colored="true" />
	<Rating Value="4" />
	<Spinner />
</div>
```
