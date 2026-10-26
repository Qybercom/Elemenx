<!-- generated -->
# Random

Random numbers of a seed: always the same numbers for the same seed (a map made again, a replay, a picture of Suprematism), or of the time without one.

- Create(seed) returns a generator: Next() (0 to 1), Int(min, max) (both in), Float(min, max), Chance(probability), Pick(list), Weighted(list, weight) (weight: a function of an item, or the name of its field; Weight by default), Shuffle(list) (a new list), Fork(name) (a generator of its own for a part: the same for the same seed and name), Seed.
- Hash(text): a number of 32 bits of a text.
- Noise(seed, size) returns a smooth noise of a plane, noise(x, y) 0 to 1 (size: the cells of one wave, 16 by default): the ground of a map, clouds.

## Methods

- `Hash(text)`
- `Create(seed)`
- `Noise(seed, size)`
