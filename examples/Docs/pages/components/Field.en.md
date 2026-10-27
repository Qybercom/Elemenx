<!-- generated -->
# Field

A label, a hint and an error around a control; the label names the control for a screen reader (aria-labelledby, unless the control has a name of its own). Error shows an error of its own. In a form it shows the errors of a control of the Forms Service once the control is touched (left once, or the form submitted):

- Control: a control made in code (Forms.Control, or Model.Get('email') of a Group);
- or Name, inside a Form: the Field asks the Form for the control of that name; when the Model of the Form has none, it is made of the Field: its first value (Value, or the value of the control inside), and its validators Required, Email, Min, Max, MinLength, MaxLength, Pattern and Match (the name of a field whose value it must repeat).

The value comes from the control inside: a native one (input, textarea, select: its value, or checked for a check box) or a Component of ElemenxUI (its change); the control is touched when the focus leaves the field, and a value set in code goes back into a native control. Messages ({required: 'text'...}) give the errors texts of their own, otherwise they are the phrases of the Forms Service.

## Properties

| Property | Default |
| --- | --- |
| `Label` | `''` |
| `Hint` | `''` |
| `Error` | `''` |
| `Required` | `false` |
| `Horizontal` | `false` |
| `Disabled` | `false` |
| `Control` | `null` |
| `Name` | `''` |
| `Value` | `''` |
| `Email` | `false` |
| `Min` | `null` |
| `Max` | `null` |
| `MinLength` | `null` |
| `MaxLength` | `null` |
| `Pattern` | `''` |
| `Match` | `''` |
| `Messages` | `null` |

## Slots

default

## Example

```example
<Field Label="Name" Hint="As it is written in your passport." Required="true"><Input Placeholder="Your name" /></Field>
<Field Label="Email" Error="This address is taken."><Input Type="email" Value="ada@example.com" Invalid="true" /></Field>
<Field Label="Plan" Horizontal="true"><Select [options]="[{Value: 'free', Label: 'Free'}, {Value: 'pro', Label: 'Pro'}]" Value="pro" /></Field>
<Field Label="Disabled" Disabled="true"><Input Value="Read only for now" Disabled="true" /></Field>
```
