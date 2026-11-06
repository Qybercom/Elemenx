Земли игры: Names(), Has(name), Get(name), Define(name, {Ground, Scatter, Grass}) — temperate, taiga, tundra, desert, savanna, swamp и alien; Village(field, {X, Y, Houses, Radius, Seed, Shapes}) выкладывает дома и дороги на ровном и сухом месте. Работает и в Node.

У биомов есть Climate — где они лежат на земле с биомами по климату (Biomes у SceneTerrainGenerator.Flat): {Height, Moisture, Temperature} или список таких конвертов. Встроенные temperate, taiga, tundra, desert, savanna и swamp вместе покрывают весь климат без пробелов; у alien конверта нет.

Check(list, field) проверяет, как биомы покрывают землю и её высоты: range — пустой диапазон; gap — полоса высот, где для какого-то климата нет биома (Heights, Moisture, Temperature этого пробела); unreachable — биом, чьих высот на земле нет; unused — биом, которого на земле нет совсем; uncovered — доля земли без биома. Возвращает {Problems, Share (доля земли каждого биома), Gap, Heights (диапазон высот, где биом есть)}. Без field проверяется только климат по полосам высот.

У палитры биома может быть Materials — из какого материала SceneMaterials сделана каждая её часть (Sand, Low, High, Rock, Snow, Deep, Road). Встроенные: taiga — почва с мхом и гравий, tundra — снег и гравий, desert — песок, savanna — глина на возвышенностях, swamp — почва и глина; temperate — материалы земли по умолчанию (газон, почва, скала, песок).
