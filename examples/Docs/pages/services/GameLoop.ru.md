<!-- generated -->
# GameLoop

Цикл игры. Create({Step, Update, Render, Speed, MaxSteps, Window}): Update(step, loop) — на каждый Step игрового времени (1000 / 60 мс) при любой частоте экрана, Render(alpha, loop) — раз в кадр (alpha — доля шага после последнего обновления, чтобы рисовать между состояниями). Start(), Stop(), Pause(), Resume(), Advance(elapsed) (время вручную: тест), Running, Paused, Time, Ticks, Fps, Speed, MaxSteps (5: вкладка, вернувшаяся из фона, не прогоняет потерянные минуты).

## Методы

- `Create(options)`
