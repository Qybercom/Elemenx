<!-- generated -->
# Property

A property: its name (Label) and its value (Value with its Unit, or the default slot in place of them), the value set apart. Tone colors the value: success, danger, warning or accent. Goes in Properties, or in a dl of its own.

## Properties

| Property | Default |
| --- | --- |
| `Label` | `''` |
| `Value` | `''` |
| `Unit` | `''` |
| `Tone` | `''` |

## Slots

default

## Example

```example
<Properties Columns="2" Label="Server">
	<Property Label="Uptime" Value="99.9" Unit="%" Tone="success" />
	<Property Label="Errors" Value="3" Tone="danger" />
	<Property Label="Region" Value="eu-west" />
	<Property Label="Version"><code class="elemenx-code">0.9.2</code></Property>
</Properties>
```
