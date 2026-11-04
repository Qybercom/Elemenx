<!-- generated -->
# FPS

FPS: how smoothly a page draws, for any page, with WebGL or without: the frames of the window are timed by requestAnimationFrame while someone watches, and what draws may tell its own numbers of a frame.

- Watch(callback(stats), every) calls back every every ms (500 by default) while it is watched; returns {Stop()}. Nothing is timed while no one watches, nor where there is no page (Node, a worker): it calls back never there.
- Stats(): {FPS, Frame (the median time between frames, ms), P95, Max, Slow (frames over 25 ms), Long (over 50 ms), Frames (how many the window holds), Heap (MB of the memory of scripts, where the browser tells it: Chrome; else null), Sources: {source: {key: {Last, Mean, Max}}}}, of the last Window frames.
- History(): the times between the last frames, ms, the oldest first.
- Report(source, values): numbers of a frame of what draws ({Cpu, Gpu, Quiet...}); kept for the same window.
- Watching(): whether anyone watches, so that what draws counts only then.
- Name(base): a name of a source of its own, for each of many of a kind on a page (Scene, Scene 2...).
- Forget(source): what is gone tells no more: its numbers are left out of Stats.

The numbers are of the page: the instance of the service of each application reads and adds to the same ones.

- Window: how many frames the numbers are of (240).

## Methods

- `Watch(callback, every)`
- `Watching()`
- `Name(base)`
- `Forget(source)`
- `Report(source, values)`
- `History()`
- `Stats()`

## Tests

- [a prop goes to the value of its letters, not to a method whose name differs only in case (FPS and Fps)](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/component-contracts.test.js#L64) — `tests/regression/component-contracts.test.js`
- [times the frames of a page without WebGL while it is watched, and nothing when no one watches](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/fps.test.js#L32) — `tests/regression/fps.test.js`
- [shows the frames a second, the times and a graph, over a corner when asked, and stops timing when it is gone](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/fps.test.js#L84) — `tests/regression/fps.test.js`
- [keeps the numbers of the page for the services of every application, and forgets a source that is gone](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/fps.test.js#L111) — `tests/regression/fps.test.js`
- [hears from a scene the time of its frames, while someone watches](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/fps.test.js#L142) — `tests/regression/fps.test.js`
- [loads every Service of ElemenxCommon through its entry for Node: a loop runs on timers, FPS waits in silence](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L129) — `tests/regression/headless.test.js`
