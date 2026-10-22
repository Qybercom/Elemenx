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
