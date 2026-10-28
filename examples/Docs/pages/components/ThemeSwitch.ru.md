<!-- generated -->
# ThemeSwitch

Переключает политику сервиса Theme: system (следует за операционной системой), light или dark; выбор запоминается. Три кнопки (system, light, dark) или, с Compact, одна кнопка, показывающая политику и переходящая к следующей. Size: small (по умолчанию) или medium. Он следует за изменениями, сделанными в другом месте (другой переключатель, код).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Size` | `'small'` |
| `Compact` | `false` |
| `Policy` | `'system'` |

## Пример

```example
<ThemeSwitch />
<ThemeSwitch Compact="true" />
<span class="elemenx-text small muted">Both switch the policy of the page: system, light or dark.</span>
```

## Тесты

- [ThemeSwitch shows the policy of the Theme Service and sets it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L390) — `tests/regression/library-controls.test.js`
