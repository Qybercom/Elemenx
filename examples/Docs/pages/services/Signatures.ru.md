<!-- generated -->
# Signatures

Насколько подпись похожа на другую или на образцы человека: помощь интерфейсу (подсказка, что подпись не совпадает с образцом, повод взглянуть ещё раз), а не проверка безопасности: подпись, нарисованную в браузере, можно скопировать, а страницу — заставить сказать что угодно. Проверка, которая что-то решает, выполняется на сервере тем же кодом в Node, по образцам, которых клиент не видит.
Подпись — её штрихи [[{X, Y, P, T}]], как их даёт SignaturePad (P — нажим, T — миллисекунды от начала; оба могут отсутствовать). Сравнение не учитывает место и размер: подпись центрируется, масштабируется, каждый штрих перевыбирается в равноудалённые точки.
- Compare(a, b): {Score (от 0 до 1), Parts: {Shape (траектории, по динамическому выравниванию времени), Strokes (число и длины штрихов), Proportions (ширина к высоте, направления движения), Dynamics (ритм и нажим: null без T)}}. b может быть эталоном Enroll: a сравнивается с каждым образцом, берётся лучший.
- Enroll(samples): эталон из нескольких подписей человека ({Samples, Mean, Spread, Threshold}): насколько образцы похожи друг на друга, задаёт оценку, которую должна набрать подпись этого человека (Threshold, от 0.5 до 0.85).
- Match(signature, reference, threshold): {Score, Parts, Match (Score >= порога: переданного, Threshold эталона или 0.75), Threshold}.
- Normalize(signature): подпись в том виде, в каком она сравнивается ({Points, Strokes, Ratio, Length, Duration}), или null без точек.

## Методы

- `Normalize(signature)`
- `Compare(a, b)`
- `Enroll(samples)`
- `Match(signature, reference, threshold)`

## Тесты

- [scores a signature against another and against the samples of a person, its parts told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-signatures.test.js#L61) — `tests/regression/library-signatures.test.js`
- [compares what is drawn with its Reference after each stroke, tells compare and says whether it looks like it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-signatures.test.js#L87) — `tests/regression/library-signatures.test.js`
- [compares signatures and lays out items with the Services of ElemenxUI](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L25) — `tests/regression/headless.test.js`
