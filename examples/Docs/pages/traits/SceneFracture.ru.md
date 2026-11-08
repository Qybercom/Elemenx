<!-- generated -->
# SceneFracture

SceneFracture: разрушаемость — физическое свойство предмета, а не правило игры.

Предмет с трейтом Fracture ({Material, Toughness, Integrity (1), Pattern (voronoi, parts или grid), Pieces (8), Inner, Impacts (true)}) хранит долю себя, которая ещё цела (Integrity, от 1 до 0). Всё, что в него попадает — выстрел, взрыв, сильный удар или Damage, — отнимает от неё столько, сколько позволяет его прочность: прочность материала (Toughness), умноженная на размер предмета. Материал берётся из трейта, иначе из Values.Material предмета, иначе stone.

Каждый удар оставляет трещину там, где пришёлся, по узору материала:
- стекло и лёд — звезда из лучей и рваные кольца;
- камень, бетон, кирпич, керамика, пластик — сеть ветвящихся трещин и сколы в середине;
- дерево — длинные трещины вдоль волокон со щепой;
- металл — вмятины;
- ткань — дыры с рваным краем.

Чем меньше цело, тем дальше расходятся трещины. Трещины держатся на предмете и движутся вместе с ним. Когда целого не остаётся, предмет раскалывается: Break из SceneDebris с узором Pattern (по умолчанию voronoi — сплошные куски, мельче у места удара, с гранями излома цвета Inner).

Fractures(materials) возвращает таблицу материалов ({имя: {Toughness, Pattern (radial, web, splinter, dent, tear), Inner, Light}}), предварительно задав переданные. Damage(id, amount, {Point, Normal, Kind: kinetic, explosive или impact}) возвращает то, что осталось целым: 0 — предмет раскололся, null — у предмета нет Fracture. Взрыв ломает хрупкое (Toughness меньше 1) в полтора раза сильнее выстрела. Integrity(id) — сколько цело сейчас.

Сцена выдаёт событие crack ({ID, Integrity, Point, Amount}) при каждом ударе, который предмет пережил, и break, когда он раскололся. Выстрел SceneWeapons и сильное касание физики (Impulse больше 40 Н·с, для Impacts не false) ранят предмет сами. Здоровье (Vitals из ElemenxGaming) — отдельная вещь: игра может их связать — вызвать Damage на своё попадание или Break при гибели.

В демо «Combat and magic» ящик, стекло, стальная пластина и каменная стена разрушаемые; на стене сразу видны две трещины, кнопка Crack the wall добавляет ещё.

## Методы

- `Fractures(materials)`
- `Damage(id, amount, hit)`
- `Integrity(id)`

## Тесты

- [cuts a thing by Voronoi cells denser near the hit, keeps all of its faces, and closes each piece by its hull](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js#L80) — `libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js`
- [takes from what is whole of a thing as strong as its material and size, cracks it at each blow, and breaks it at nothing](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js#L121) — `libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js`
- [cracks a thing hit before its first frame, its crack placed with it; one added again is whole again](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js#L172) — `libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js`
- [breaks a thing by the pieces of its model (Pattern parts), and a shot of SceneWeapons hurts it by itself](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js#L199) — `libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js`
