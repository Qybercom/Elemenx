<!-- generated -->
# TitleBar

The title bar of a window of a program drawn by the Application (Native.Desktop.Frame hidden, none or transparent), the header of the page on the web. Its empty places move the window (elemenx-native-drag; a double click maximizes it there), what it holds stays clickable. Icon (a name of an icon) or Image (the URL of a picture) and Title; the default slot holds its content after the icon (a NativeMenu or a MenuBar, a search...), the actions slot buttons before the buttons of the window. Controls: auto (by default) draws the buttons of the window (minimize, maximize or restore, close) where the system draws none (Frame none or transparent), true in every program, false never. With Frame hidden the buttons of the system stay over the bar, its content clear of them (env(titlebar-area-*)), and they take the colors of the bar, which follow the theme. Window: the ID of the window of OpenWindow it is the bar of (the first window without).

## Properties

| Property | Default |
| --- | --- |
| `Title` | `''` |
| `Icon` | `''` |
| `Image` | `''` |
| `Controls` | `'auto'` |
| `Window` | `''` |
| `Frame` | `'web'` |

## Slots

default, `actions`
