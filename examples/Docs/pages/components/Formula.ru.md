<!-- generated -->
# Formula

Формула, записанная как в LaTeX (то, что читает сервис Formulas: дроби, корни, степени и индексы, суммы и интегралы с пределами, греческие буквы, матрицы...), нарисованная браузером как MathML. Value — формула; Display ставит её на отдельную строку, по центру и крупнее, вместо строки текста; Label — то, что о ней скажет экранная читалка (по умолчанию — сама запись формулы).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Display` | `false` |
| `Label` | `''` |

## Пример

```example
<Formula Display="true" Value="x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}" />
<Formula Display="true" Value="\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}" />
<p class="elemenx-text">Inline: the area is <Formula Value="\pi r^2" />, and <Formula Value="e^{i\pi} + 1 = 0" />.</p>
<Formula Display="true" Value="A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}" />
```
