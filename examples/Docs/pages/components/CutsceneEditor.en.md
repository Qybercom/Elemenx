<!-- generated -->
# CutsceneEditor

An editor of the cutscenes of a Scene (SceneCinema) on a line of time (Timeline): each track a lane, its keys and its items ranges on it (dragged in time, a title or a subtitle by its edges too), the playhead the moment shown in the Scene (a press on the line goes there), the fields of the one selected beside it.

Value is the cutscenes by name ({Name: {Tracks, Restore, Skip, Loop}}, as Cutscenes of the Scene); change emits them after each edit. Scene is the Scene they play in (the component): Play shows the cutscene from the playhead, Record plays it from its start as a video and gives the file (record {Name, Video}). Target is the object a move or a cut goes to by default (the selection of an editor). Camera from view asks for a camera where the view of the Scene is (camera {Props}); Key from view keys the move of the Target there, at the playhead. Methods: Cutscene() (the one edited), Add(type), Remove(), Preview(seconds), Play(), Stop(), Record().

## Properties

| Property | Default |
| --- | --- |
| `Value` | `null` |
| `Scene` | `null` |
| `Target` | `''` |
| `Label` | `''` |

## Events

- `change`: The cutscenes changed: {Name: {Tracks...}}.
- `camera`: Camera from view was pressed: {Props} of a camera where the view is.
- `record`: A recording ended: {Name, Video (a Blob)}.

## Methods

- `Cutscene()`
- `Add(type)`
- `Remove()`
- `Preview(seconds)`
- `Play()`
- `Stop()`
- `Record()`

## Tests

- [creates a cutscene, adds what a film has at the playhead as ranges of its lanes, moves them, edits their fields, takes them away](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/CutsceneEditor/CutsceneEditor.test.js#L53) — `libraries/ElemenxGraphics/components/CutsceneEditor/CutsceneEditor.test.js`
- [shows the Scene at the moment the playhead is at, keys the move of its target where the view is, asks for a camera there](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/CutsceneEditor/CutsceneEditor.test.js#L111) — `libraries/ElemenxGraphics/components/CutsceneEditor/CutsceneEditor.test.js`
