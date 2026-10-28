<!-- generated -->
# ProfileCard

Карточка человека: Cover (картинка или Color), Avatar (или инициалы) со Status (online, away, busy или offline), Name (Verified), Role, Bio, Stats ([{Label, Value}]; числа сокращаются: 12.4K) и кнопки Follow (Following) и Message. Layout: card или compact (одна строка для списков: аватар, имя, роль и Follow). Variant и Href — как в Card. Слот по умолчанию добавляет содержимое под описанием. События: follow ({Following}), message.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Name` | `''` |
| `Role` | `''` |
| `Bio` | `''` |
| `Avatar` | `''` |
| `Cover` | `''` |
| `Color` | `''` |
| `Status` | `''` |
| `Verified` | `false` |
| `Stats` | `[]` |
| `Follow` | `true` |
| `Following` | `false` |
| `Message` | `true` |
| `Layout` | `'card'` |
| `Variant` | `'outlined'` |
| `Href` | `''` |
| `FollowLabel` | `''` |
| `FollowingLabel` | `''` |
| `MessageLabel` | `''` |
| `VerifiedLabel` | `''` |

## События

- `follow`: Кнопка подписки: {Following}.
- `message`: Кнопка сообщения: {Name}.

## Слоты

по умолчанию

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px; align-items: flex-start;">
	<div style="width: 300px;"><ProfileCard Name="Ada Lovelace" Role="Analyst" Status="online" Verified="true" Cover="/data/cards/sea.svg" Bio="Writes the notes on the engine." [stats]="[{Label: 'Posts', Value: 312}, {Label: 'Followers', Value: 12400}, {Label: 'Following', Value: 87}]" [following]="Following" (follow)="Followed" (message)="Messaged" /></div>
	<div style="width: 360px;"><ProfileCard Layout="compact" Name="Alan Turing" Role="Engineer" Status="away" /></div>
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Following: false,
	Note: 'Press Follow or Message.',

	Followed: function (event) {
		this.Following = event.Following;
		this.Note = event.Following ? 'Following' : 'Not following';
	},

	Messaged: function (event) {
		this.Note = 'A message to ' + event.Name;
	}
})
</script>
```

## Тесты

- [the cards of posts, profiles, comments and products tell their buttons, and a comment makes buttons of its mentions and tags](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L454) — `tests/regression/library-controls.test.js`
