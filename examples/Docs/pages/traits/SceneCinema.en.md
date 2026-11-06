<!-- generated -->
# SceneCinema

SceneCinema: what a film does with the picture of a scene, and its cutscenes. Over the canvas lies a layer of HTML of its own (themed by the tokens of the Scene: --elemenx-scene-title-*): a fade to a color, the bars of a wide picture (letterbox), titles and subtitles, typed out as they come if they are told to.

A cutscene is data: {Name, Tracks, Restore (true: the camera that showed the world comes back at its end), Skip (true: Escape ends it), Loop (false)}; Cutscenes of the scene (a property, kept by Save and Load) holds them by name. PlayCutscene(cutscene or name, callback) plays it: callback(error, {Name, Stopped}) at its end; StopCutscene() ends it, PauseCutscene(on) holds it, SeekCutscene(seconds) goes to a moment of it (what its layer shows is of that moment; no cue of what was passed fires), Cutscene() tells {Name, Time, Length, Paused} or null. Its events: cutscene ({Name, State: start, end or stop}) and cue ({Cutscene, Name, Data, At}).

Its tracks, each {Type, ...}, their moments At in seconds from its start:

- camera: Keys [{At, Camera, Fly}]: the camera that shows the world from that moment, cut to or flown to in Fly seconds;
- move: ID (a camera or any object), Keys [{At, Ease (linear, smooth, in, out), and any number of it: X, Y, Z, Lift, Yaw, Pitch, Roll, Focal, Focus, Aperture...}]: its numbers from key to key, its place along a smooth curve through them (Path linear: straight); a dolly, a crane, a zoom (Focal), a pull of focus (Focus);
- orbit: ID (a camera), At, Length, Around (an ID or [x, y, z]), Radius (10), Height (2), From, To (degrees round it);
- fade: Keys [{At, Value (0 clear to 1 all of the color), Color ('#000000')}];
- letterbox: Keys [{At, Value (0 none to 1 the whole bars), Ratio (2.39: the picture left between them)}];
- title: Items [{At, Length, Text, Kind (title, chapter, caption, credits), Place (center, top, bottom, top-left, bottom-left), Typing (letters a second; 0: whole at once), In, Out (seconds of fading in and out, 0.5)}];
- subtitle: Items [{At, Length, Text, Speaker}];
- clip: Items [{At, ID, Clip}]: an object plays a clip (Play);
- cue: Items [{At, Name, Data}]: the scene emits cue as its moment passes.

The layer can be set without a cutscene too: Cinema({Fade, FadeColor, Letterbox, Ratio, Title, Subtitle}) (Title and Subtitle as items without At), Cinema(null) clears it. Record(options, callback) records what the scene shows as a video, the layer laid in it; a cutscene with Record gives its video to its callback as Video (see recorder).

## Methods

- `PlayCutscene(cutscene, callback)`
- `StopCutscene()`
- `PauseCutscene(on)`
- `SeekCutscene(seconds)`
- `Cutscene()`
- `Record(options, callback)`
- `Cinema(given)`
