<!-- generated -->
# Gallery

Галерея: одна картинка за раз из Items [{ID, Image, Thumb, Alt, Title, Description, Tags}] с кнопками к предыдущей и следующей, точками, счётчиком и миниатюрами. Index — показанная картинка; change отправляет новую, select — элемент при нажатии на картинку.

- Что показывается: ShowTitle, ShowDescription, ShowTags (подпись: Caption 'overlay' — поверх картинки, по умолчанию, или 'below' — под ней), ShowArrows, ShowDots, ShowCounter, ShowThumbs. Подпись, которой нечего показать, не выводится.
- Autoplay переходит к следующей картинке (Direction 'next') или предыдущей ('previous') каждые Interval миллисекунд; ждёт, пока указатель или фокус на галерее и пока страница скрыта; кнопка ставит на паузу и запускает. Loop (true) зацикливает на краях.
- Effect: slide (по умолчанию) или fade. Fit: cover (по умолчанию) или contain. Ratio — пропорции картинки ('16 / 9').
- Стрелки (Home, End) меняют картинку, когда галерея в фокусе; на сенсорном экране картинка следует за пальцем (*swipe), а свайп переходит к следующей или предыдущей (на краях без Loop — с сопротивлением).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Index` | `0` |
| `ShowTitle` | `true` |
| `ShowDescription` | `true` |
| `ShowTags` | `true` |
| `ShowArrows` | `true` |
| `ShowDots` | `true` |
| `ShowCounter` | `true` |
| `ShowThumbs` | `false` |
| `Caption` | `'overlay'` |
| `Autoplay` | `false` |
| `Interval` | `5000` |
| `Direction` | `'next'` |
| `Loop` | `true` |
| `Effect` | `'slide'` |
| `Fit` | `'cover'` |
| `Ratio` | `'16 / 9'` |
| `Label` | `''` |

## События

`change`, `select`

## Пример

```example
<Gallery [items]="Pictures" ShowThumbs="true" Label="Places" (change)="Changed" />
<p class="elemenx-text small muted">Picture {{Index + 1}} of {{Pictures.length}}</p>
<script>
({
	Index: 0,
	Pictures: [
		{ID: 'mountains', Image: '/data/cards/mountains.svg', Title: 'Mountains', Description: 'The northern range at dawn.', Tags: ['nature', 'cold']},
		{ID: 'sea', Image: '/data/cards/sea.svg', Title: 'Sea', Description: 'A calm bay in the south.', Tags: ['nature', 'water']},
		{ID: 'city', Image: '/data/cards/city.svg', Title: 'City', Description: 'Lights of the old town.', Tags: ['night']}
	],

	Changed: function (index) {
		this.Index = index;
	}
})
</script>
```
