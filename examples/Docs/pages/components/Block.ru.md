<!-- generated -->
# Block

Блок: содержимое в рамке с заголовком на полосе, врезанной в верх рамки. Note — подпись после заголовка, слот actions держит элементы управления в конце полосы, слот по умолчанию — содержимое. Padding: medium, compact или spacious (отступы elemenx-block). HeaderShape 'trapezoid' превращает блок в папку: заголовок (и подпись) на вкладке шириной с текст, её край скошен вниз к телу, действия — за скосом. Внешний вид задают токены темы --elemenx-block-*.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Title` | `''` |
| `Note` | `''` |
| `Level` | `3` |
| `Padding` | `'medium'` |
| `HeaderShape` | `'default'` |

## Слоты

`actions`, по умолчанию

## Пример

```example
<Block Title="Reactor" Note="Ring B" Level="3">
	<Properties Columns="2">
		<Property Label="Core" Value="86" Unit="%" Tone="success" />
		<Property Label="Coolant" Value="412" Unit="K" />
	</Properties>
</Block>
<Block Title="Logs" HeaderShape="trapezoid" Padding="small">
	<p class="elemenx-text small">A frame whose title is a folder tab.</p>
</Block>
```

## Тесты

- [puts the actions of a folder Block at the end of its header, without a padding after them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/folder-shapes.test.js#L61) — `tests/regression/folder-shapes.test.js`
- [draws the slope of a folder Block in a game panel whose band is a gradient](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/folder-shapes.test.js#L67) — `tests/regression/folder-shapes.test.js`
- [a block frames its content under a title on a band set into the frame, with a note, actions and paddings](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4925) — `tests/examples/ui-kit.spec.js`
- [properties set a value apart from its name, in one column or two, with tones and values of their own](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4975) — `tests/examples/ui-kit.spec.js`
