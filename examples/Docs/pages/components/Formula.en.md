<!-- generated -->
# Formula

A formula written as in LaTeX (the part the Formulas Service reads: fractions, roots, powers and indices, sums and integrals with their limits, Greek letters, matrices...), drawn by the browser as MathML. Value is the formula; Display puts it on a line of its own, centered and larger, instead of in the line of the text; Label is what a screen reader says of it (by default the formula as it is written).

## Properties

| Property | Default |
| --- | --- |
| `Value` | `''` |
| `Display` | `false` |
| `Label` | `''` |

## Example

```example
<Formula Display="true" Value="x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}" />
<Formula Display="true" Value="\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}" />
<p class="elemenx-text">Inline: the area is <Formula Value="\pi r^2" />, and <Formula Value="e^{i\pi} + 1 = 0" />.</p>
<Formula Display="true" Value="A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}" />
```
