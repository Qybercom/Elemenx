<!-- generated -->
# FPSMeter

FPSMeter: how smoothly the page draws, by the FPS Service: the frames a second, the median time of a frame, its 95th percentile and the longest, how many were slow (over 25 ms) or long (over 50 ms), a graph of the last frames (Graph), and the numbers what draws tells of its own frames (Sources: a Scene its CPU and GPU milliseconds). Corner puts it over the corner of the nearest positioned element (top-left, top-right, bottom-left, bottom-right); empty, it stands in the page. Every is how often it changes, ms. It times nothing while it is not shown on a page.

## Properties

| Property | Default |
| --- | --- |
| `Corner` | `''` |
| `Graph` | `true` |
| `Sources` | `true` |
| `Every` | `500` |

## Tests

- [times the frames of a page without WebGL while it is watched, and nothing when no one watches](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/fps.test.js#L32) — `tests/regression/fps.test.js`
- [shows the frames a second, the times and a graph, over a corner when asked, and stops timing when it is gone](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/fps.test.js#L84) — `tests/regression/fps.test.js`
- [keeps the numbers of the page for the services of every application, and forgets a source that is gone](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/fps.test.js#L111) — `tests/regression/fps.test.js`
- [hears from a scene the time of its frames, while someone watches](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/fps.test.js#L142) — `tests/regression/fps.test.js`
