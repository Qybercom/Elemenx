<!-- generated -->
# Sigils

Магические круги из сида как данные: кольца линий, засечек, точек, дуг, рун и звёзд, у каждого своя скорость вращения. Make(seed, options) возвращает {Seed, Rings}; Layout в options задаёт кольца вручную, пропущенные поля берутся из сида. Uniforms(circle, seconds, spin) даёт значения для шейдера.

## Методы

- `Make(seed, options)`
- `Uniforms(circle, seconds, spin)`

## Тесты

- [Sigils makes circles of a seed, the same each time, whose rings turn apart](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3441) — `tests/regression/library-scene.test.js`
- [saves a recipe of the kinds of the library and makes the very same thing of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/generated.test.js#L23) — `tests/regression/generated.test.js`
