<!-- generated -->
# Property

Свойство: название (Label) и значение (Value с Unit или слот по умолчанию вместо них), значение выделено. Tone окрашивает значение: success, danger, warning или accent. Ставится в Properties или в свой dl.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Label` | `''` |
| `Value` | `''` |
| `Unit` | `''` |
| `Tone` | `''` |

## Слоты

по умолчанию

## Пример

```example
<Properties Columns="2" Label="Server">
	<Property Label="Uptime" Value="99.9" Unit="%" Tone="success" />
	<Property Label="Errors" Value="3" Tone="danger" />
	<Property Label="Region" Value="eu-west" />
	<Property Label="Version"><code class="elemenx-code">0.9.2</code></Property>
</Properties>
```
