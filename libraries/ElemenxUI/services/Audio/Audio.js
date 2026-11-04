/*
 * The sound of the Application (Web Audio): one AudioContext for every part of it, the analysis of what plays and the
 * reading of sound files.
 * - Context(): the AudioContext (made on the first call; a browser starts it suspended until the user presses or types
 *   in the page, then it is resumed by itself). Supported() is false without Web Audio.
 * - Node(source): the AudioNode of a source: an AudioNode as it is, an <audio> or a <video> (its sound still goes to the
 *   speakers; an element has one node for good, the same at every call), a MediaStream of a microphone (not to the
 *   speakers: no echo).
 * - Analyser(source, options): an AnalyserNode fed by the source; options Size (the size of its FFT, 2048), Smoothing
 *   (0 to 1, 0.8), MinDb (-100) and MaxDb (-20). Release(analyser) disconnects it.
 * - Bands(analyser, count, options): the levels of count bands of what it hears now, from 0 to 1; options Scale (log, the
 *   default, as an ear hears, or linear), MinFrequency (30) and MaxFrequency (16000) in Hz. Levels(analyser) is the
 *   loudness of the sound now, {Rms, Peak} from 0 to 1.
 * - Curve(analyser, count, options): the spectrum at count points spread from MinFrequency (20) to MaxFrequency (20000;
 *   Scale log or linear), each from 0 to 1 between the MinDb and the MaxDb of the analyser, as the analysers of the
 *   studios draw it: between two bins a point takes the line between them, over several bins the loudest; Tilt (dB by
 *   octave around 1 kHz, 0) raises the highs, which a mix has quieter.
 * - Decode(source, callback): a sound file as an AudioBuffer: callback(error, buffer); the source is a URL, a Blob (a
 *   File), an ArrayBuffer or an AudioBuffer.
 * - Peaks(buffer, count, from, to): the shape of a sound in count columns: [{Min, Max}] from -1 to 1, the channels
 *   mixed; from and to (seconds) take a part of it.
 * Notes and instruments:
 * - Midi(note): the number of a note (C4 is 60, A4 69; C#4, Db4, a number as it is); NoteName(midi) the other way
 *   (sharps: C#4); Frequency(note) its pitch in Hz (A4 is 440).
 * - Instrument(options): a synth (options Wave: sine, triangle, square or sawtooth) or a sampler (Samples: {note:
 *   source}, a source as Decode takes it; a note plays its nearest sample, faster or slower), Envelope {Attack, Decay,
 *   Sustain, Release} (seconds, Sustain from 0 to 1), Gain (0.5), Destination (an AudioNode: the speakers). It has
 *   Load(callback) (callback(error) once its samples are read), Loaded, Play(note, {Velocity (0 to 1), Time (of the
 *   context: now), Duration (seconds: held until Release when none)}), Release(note, time), Stop(), Output (its
 *   GainNode: a Spectrum hears it there) and Destroy().
 * - Transport(options): plays Notes ([{Note, Start, Length, Velocity}], Start and Length in beats) on an Instrument at
 *   Bpm (120), Beats (4) to a bar, Metronome (a click on each beat, higher on the first of a bar), Loop ({Start, End}
 *   in beats, or null: it stops after its last note). It has Play(), Pause(), Stop() (back to the start), Seek(beat),
 *   Position() (the beat it plays now), Playing, Set(options) (any of them, while it plays), On(name, callback) and
 *   Off(name, callback) for beat ({Beat, Bar, Accent}), note (a note as it sounds), end; Destroy(). It schedules a
 *   little ahead on the clock of the context, so a busy page does not make it late.
 */
Elemenx.Service('Audio', {
	$Meta: {
		Description: 'The sound of the Application (Web Audio): one AudioContext, the analysis of what plays, the reading of sound files, instruments and a transport.',
		Methods: ['Supported()', 'Context()', 'Node(source)', 'Analyser(source, options)', 'Release(analyser)', 'Bands(analyser, count, options)', 'Curve(analyser, count, options)', 'Levels(analyser)', 'Decode(source, callback)', 'Peaks(buffer, count, from, to)', 'Midi(note)', 'NoteName(midi)', 'Frequency(note)', 'Instrument(options)', 'Transport(options)']
	},
	Names: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],

	$OnCreate: function () {
		/* The context, made on the first call; the nodes of the media elements, one for each for good. */
		this.Shared = null;
		this.Elements = typeof WeakMap === 'function' ? new WeakMap() : null;
	},

	Supported: function () {
		return typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);
	},

	Context: function () {
		var self = this;
		var Kind;

		if (this.Shared)
			return this.Shared;

		Kind = window.AudioContext || window.webkitAudioContext;

		if (!Kind)
			throw new Error('Elemenx Audio needs Web Audio (AudioContext)');

		this.Shared = new Kind();

		/* A context made before a gesture of the user stays suspended: the first press or key resumes it. */
		if (this.Shared.state === 'suspended') {
			var wake = function () {
				document.removeEventListener('pointerdown', wake, true);
				document.removeEventListener('keydown', wake, true);

				if (self.Shared.state === 'suspended')
					self.Shared.resume();
			};

			document.addEventListener('pointerdown', wake, true);
			document.addEventListener('keydown', wake, true);
		}

		return this.Shared;
	},

	Node: function (source) {
		var context = this.Context();
		var node;

		if (!source)
			throw new Error('Elemenx Audio.Node expects an AudioNode, a media element or a MediaStream');

		if (typeof AudioNode === 'function' && source instanceof AudioNode) return source;

		if (typeof HTMLMediaElement === 'function' && source instanceof HTMLMediaElement) {
			node = this.Elements ? this.Elements.get(source) : null;

			if (!node) {
				node = context.createMediaElementSource(source);

				node.connect(context.destination);

				if (this.Elements)
					this.Elements.set(source, node);
			}

			return node;
		}

		if (typeof MediaStream === 'function' && source instanceof MediaStream) return context.createMediaStreamSource(source);

		throw new Error('Elemenx Audio.Node expects an AudioNode, a media element or a MediaStream');
	},

	Analyser: function (source, options) {
		var settings = options || {};
		var context = this.Context();
		var analyser = context.createAnalyser();
		var node = this.Node(source);

		analyser.fftSize = Number(settings.Size) || 2048;
		analyser.smoothingTimeConstant = settings.Smoothing === undefined ? 0.8 : Number(settings.Smoothing);
		analyser.minDecibels = settings.MinDb === undefined ? -100 : Number(settings.MinDb);
		analyser.maxDecibels = settings.MaxDb === undefined ? -20 : Number(settings.MaxDb);

		node.connect(analyser);

		analyser.__ElemenxSource = node;

		return analyser;
	},

	Release: function (analyser) {
		if (!analyser || !analyser.__ElemenxSource) return;

		try {
			analyser.__ElemenxSource.disconnect(analyser);
		}
		catch (error) {
			/* Disconnected already. */
		}

		analyser.__ElemenxSource = null;
	},

	Bands: function (analyser, count, options) {
		var settings = options || {};
		var bins = analyser.frequencyBinCount;
		var data = new Uint8Array(bins);
		var rate = analyser.context.sampleRate;
		var low = Number(settings.MinFrequency) || 30;
		var high = Math.min(Number(settings.MaxFrequency) || 16000, rate / 2);
		var linear = settings.Scale === 'linear';
		var total = Math.max(1, Math.round(Number(count) || 32));
		var bands = [];
		var k;

		analyser.getByteFrequencyData(data);

		function frequency (at) {
			return linear ? low + (high - low) * at : low * Math.pow(high / low, at);
		}

		for (k = 0; k < total; k++) {
			var from = Math.max(0, Math.floor(frequency(k / total) / (rate / 2) * bins));
			/* Each bin in one band (a narrow band of the lows shares the bin it falls in). */
			var to = Math.min(bins - 1, Math.max(from, Math.floor(frequency((k + 1) / total) / (rate / 2) * bins) - 1));
			var peak = 0;
			var i;

			/* A band is as loud as its loudest bin: a tone in it shows whole. */
			for (i = from; i <= to; i++) peak = Math.max(peak, data[i]);

			bands.push(peak / 255);
		}

		return bands;
	},

	Curve: function (analyser, count, options) {
		var settings = options || {};
		var bins = analyser.frequencyBinCount;
		var data = new Float32Array(bins);
		var rate = analyser.context.sampleRate;
		var hertz = rate / 2 / bins;
		var low = Math.max(1, Number(settings.MinFrequency) || 20);
		var high = Math.min(Number(settings.MaxFrequency) || 20000, rate / 2);
		var linear = settings.Scale === 'linear';
		var total = Math.max(2, Math.round(Number(count) || 2));
		var tilt = Number(settings.Tilt) || 0;
		var min = analyser.minDecibels;
		var max = analyser.maxDecibels;
		var points = [];
		var k;

		analyser.getFloatFrequencyData(data);

		function frequency (at) {
			return linear ? low + (high - low) * at : low * Math.pow(high / low, at);
		}

		/* The level of a bin in dB; a silent one (-Infinity) is the floor. */
		function level (bin) {
			var value = data[Math.max(0, Math.min(bins - 1, bin))];

			return isFinite(value) ? value : min;
		}

		for (k = 0; k < total; k++) {
			var at = frequency(k / (total - 1));
			var from = Math.ceil(frequency(Math.max(0, k - 0.5) / (total - 1)) / hertz);
			var to = Math.floor(frequency(Math.min(total - 1, k + 0.5) / (total - 1)) / hertz);
			var place = at / hertz;
			var value;
			var i;

			if (to > from) {
				value = -Infinity;

				for (i = from; i <= to; i++) value = Math.max(value, level(i));
			}
			else {
				value = level(Math.floor(place)) + (level(Math.floor(place) + 1) - level(Math.floor(place))) * (place - Math.floor(place));
			}

			value += tilt * Math.log(at / 1000) / Math.LN2;

			points.push(Math.max(0, Math.min(1, (value - min) / (max - min))));
		}

		return points;
	},

	Levels: function (analyser) {
		var data = new Float32Array(analyser.fftSize);
		var sum = 0;
		var peak = 0;
		var i;

		analyser.getFloatTimeDomainData(data);

		for (i = 0; i < data.length; i++) {
			sum += data[i] * data[i];
			peak = Math.max(peak, Math.abs(data[i]));
		}

		return {Rms: Math.min(1, Math.sqrt(sum / data.length)), Peak: Math.min(1, peak)};
	},

	Decode: function (source, callback) {
		var context;

		function decode (data) {
			var done = false;
			var result;

			function finish (error, buffer) {
				if (done) return;

				done = true;

				callback(error, buffer);
			}

			try {
				result = context.decodeAudioData(data, function (buffer) {
					finish(null, buffer);
				}, function (error) {
					finish(error || new Error('Elemenx Audio cannot read this sound'));
				});

				/* The browsers of today return a promise too; its failure is the one above. */
				if (result && typeof result.then === 'function')
					result.then(null, function () {});
			}
			catch (error) {
				finish(error);
			}
		}

		try {
			context = this.Context();
		}
		catch (error) {
			callback(error);

			return;
		}

		if (typeof AudioBuffer === 'function' && source instanceof AudioBuffer) {
			callback(null, source);

			return;
		}

		if (source instanceof ArrayBuffer) {
			decode(source.slice(0));

			return;
		}

		if (typeof Blob === 'function' && source instanceof Blob) {
			var reader = new FileReader();

			reader.onload = function () {
				decode(reader.result);
			};

			reader.onerror = function () {
				callback(reader.error || new Error('Elemenx Audio cannot read the file'));
			};

			reader.readAsArrayBuffer(source);

			return;
		}

		if (typeof source !== 'string' || !source) {
			callback(new Error('Elemenx Audio.Decode expects a URL, a Blob, an ArrayBuffer or an AudioBuffer'));

			return;
		}

		var request = new XMLHttpRequest();

		request.open('GET', source);

		request.responseType = 'arraybuffer';

		request.onload = function () {
			if (request.status >= 400) {
				callback(new Error('Elemenx Audio cannot load ' + source + ': ' + request.status));

				return;
			}

			decode(request.response);
		};

		request.onerror = function () {
			callback(new Error('Elemenx Audio cannot load ' + source));
		};

		request.send();
	},

	Peaks: function (buffer, count, from, to) {
		var total = Math.max(1, Math.round(Number(count) || 1));
		var rate = buffer.sampleRate;
		var length = buffer.length;
		var first = Math.max(0, Math.floor((Number(from) || 0) * rate));
		var last = Math.min(length, to === undefined || to === null ? length : Math.ceil(Number(to) * rate));
		var channels = [];
		var peaks = [];
		var c;
		var k;

		for (c = 0; c < buffer.numberOfChannels; c++) channels.push(buffer.getChannelData(c));

		for (k = 0; k < total; k++) {
			var start = first + Math.floor((last - first) * k / total);
			var end = Math.max(start + 1, first + Math.floor((last - first) * (k + 1) / total));
			var min = 0;
			var max = 0;
			var i;

			/* A long column reads about four thousand samples: the shape of minutes of sound is drawn at once. */
			var step = Math.max(1, Math.floor((end - start) / 4000));

			for (i = start; i < end && i < length; i += step) {
				var value = 0;

				for (c = 0; c < channels.length; c++) value += channels[c][i];

				value /= channels.length || 1;
				min = Math.min(min, value);
				max = Math.max(max, value);
			}

			peaks.push({Min: min, Max: max});
		}

		return peaks;
	},

	Midi: function (note) {
		var match;
		var index;

		if (typeof note === 'number' && isFinite(note)) return note;

		match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(String(note).trim());

		if (!match)
			throw new Error('Elemenx Audio: ' + note + ' is not a note (C4, F#3, Bb2 or a MIDI number)');

		index = this.Names.indexOf(match[1].toUpperCase());

		return (Number(match[3]) + 1) * 12 + index + (match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0);
	},

	NoteName: function (midi) {
		var value = Math.round(Number(midi));

		return this.Names[(value % 12 + 12) % 12] + (Math.floor(value / 12) - 1);
	},

	Frequency: function (note) {
		return 440 * Math.pow(2, (this.Midi(note) - 69) / 12);
	},

	Instrument: function (options) {
		var self = this;
		var settings = options || {};
		var context = this.Context();
		var envelope = settings.Envelope || {};
		var attack = envelope.Attack === undefined ? 0.005 : Math.max(0, Number(envelope.Attack));
		var decay = envelope.Decay === undefined ? 0.1 : Math.max(0, Number(envelope.Decay));
		var sustain = envelope.Sustain === undefined ? 0.7 : Math.max(0, Math.min(1, Number(envelope.Sustain)));
		var release = envelope.Release === undefined ? 0.2 : Math.max(0.005, Number(envelope.Release));
		var output = context.createGain();
		var samples = settings.Samples || null;
		var buffers = [];
		var voices = [];
		var instrument;

		output.gain.value = settings.Gain === undefined ? 0.5 : Number(settings.Gain);

		output.connect(settings.Destination || context.destination);

		/* The sample nearest a note, and how much faster it plays to sound it. */
		function nearest (midi) {
			var best = null;

			buffers.forEach(function (entry) {
				if (!best || Math.abs(entry.Midi - midi) < Math.abs(best.Midi - midi))
					best = entry;
			});

			return best;
		}

		/* A voice ends: its release from where its envelope is, then its nodes go. */
		function end (voice, time) {
			var at = Math.max(time, voice.Start);

			if (voice.Released) return;

			voice.Released = true;

			voice.Gain.gain.cancelScheduledValues(at);
			voice.Gain.gain.setValueAtTime(voice.Gain.gain.value, at);
			voice.Gain.gain.linearRampToValueAtTime(0, at + release);

			try {
				voice.Source.stop(at + release + 0.01);
			}
			catch (error) {
				/* Stopped already. */
			}
		}

		instrument = {
			Kind: samples ? 'sampler' : 'synth',
			Loaded: !samples,
			Output: output,

			Load: function (callback) {
				var done = callback || function () {};
				var names = Object.keys(samples || {});
				var left = names.length;
				var failed = null;

				if (!left) {
					instrument.Loaded = true;

					done(null);

					return;
				}

				buffers = [];

				names.forEach(function (name) {
					self.Decode(samples[name], function (error, buffer) {
						if (error) failed = failed || error;
						else buffers.push({Midi: self.Midi(name), Buffer: buffer});

						left--;

						if (left) return;

						instrument.Loaded = !failed;

						done(failed);
					});
				});
			},

			Play: function (note, play) {
				var given = play || {};
				var midi = self.Midi(note);
				var time = given.Time === undefined ? context.currentTime : Math.max(context.currentTime, Number(given.Time));
				var velocity = given.Velocity === undefined ? 0.8 : Math.max(0, Math.min(1, Number(given.Velocity)));
				var gain = context.createGain();
				var source;
				var sample;
				var voice;

				if (samples) {
					sample = nearest(midi);

					if (!sample)
						return null;

					source = context.createBufferSource();
					source.buffer = sample.Buffer;
					source.playbackRate.value = Math.pow(2, (midi - sample.Midi) / 12);
				}
				else {
					source = context.createOscillator();
					source.type = settings.Wave || 'triangle';
					source.frequency.value = self.Frequency(midi);
				}

				/* The envelope: up in Attack, down to Sustain in Decay; Release later. */
				gain.gain.setValueAtTime(0, time);
				gain.gain.linearRampToValueAtTime(velocity, time + attack);
				gain.gain.linearRampToValueAtTime(velocity * sustain, time + attack + decay);

				source.connect(gain);
				gain.connect(output);

				source.start(time);

				voice = {Midi: midi, Source: source, Gain: gain, Start: time, Released: false};

				source.onended = function () {
					var index = voices.indexOf(voice);
					if (index !== -1)
						voices.splice(index, 1);

					gain.disconnect();
				};

				voices.push(voice);

				if (given.Duration !== undefined && given.Duration !== null)
					end(voice, time + Math.max(0, Number(given.Duration)));

				return voice;
			},

			Release: function (note, time) {
				var midi = self.Midi(note);
				var at = time === undefined ? context.currentTime : Number(time);

				voices.slice().forEach(function (voice) {
					if (voice.Midi === midi)
						end(voice, at);
				});
			},

			/* Every voice, now, quickly. */
			Stop: function () {
				voices.slice().forEach(function (voice) {
					voice.Released = false;

					end(voice, context.currentTime);
				});
			},

			Voices: function () {
				return voices.length;
			},

			Destroy: function () {
				instrument.Stop();

				output.disconnect();
			}
		};

		return instrument;
	},

	Transport: function (options) {
		var context = this.Context();
		var settings = {Bpm: 120, Beats: 4, Notes: [], Instrument: null, Metronome: false, Loop: null};
		var listeners = {beat: [], note: [], end: []};
		var timer = null;
		var timeouts = [];
		/* Where the clock of the context and the beats meet: beat Origin.Beat at time Origin.Time. */
		var origin = {Beat: 0, Time: 0};
		/* The meeting before a round of the loop: it holds until the time of the next one comes. */
		var previous = null;
		/* The beat scheduled up to (the notes and the clicks before it are on their way). */
		var cursor = 0;
		var paused = 0;
		/* The end on its way (its timer): the last note was scheduled, end comes after it. */
		var ending = null;
		var transport;

		/*
		 * An event at a time of the clock of the context, now the clock as the tick read it: the events of one tick wait
		 * from the same moment, so the ones of the same time come in the order they were scheduled.
		 */
		function emit (name, value, time, now) {
			var delay = Math.max(0, (time - now) * 1000);

			timeouts.push(setTimeout(function () {
				listeners[name].slice().forEach(function (callback) {
					callback(value);
				});
			}, delay));
		}

		function seconds (beats) {
			return beats * 60 / Math.max(1, Number(settings.Bpm) || 120);
		}

		function last () {
			return settings.Notes.reduce(function (end, note) {
				return Math.max(end, Number(note.Start) + Number(note.Length || 0));
			}, 0);
		}

		/* The click of the metronome: short, higher on the first beat of a bar. */
		function click (time, accent) {
			var oscillator = context.createOscillator();
			var gain = context.createGain();

			oscillator.frequency.value = accent ? 1760 : 1320;

			gain.gain.setValueAtTime(0.0001, time);
			gain.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.3, time + 0.002);
			gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

			oscillator.connect(gain);
			gain.connect(context.destination);

			oscillator.start(time);
			oscillator.stop(time + 0.06);
		}

		/* The notes and the beats in [from, to) of the beats, at their times from base (the time of the beat from). */
		function schedule (from, to, base, now) {
			var events = [];
			var beat;

			settings.Notes.forEach(function (note) {
				var start = Number(note.Start);
				var time;

				if (start < from || start >= to) return;

				time = base + seconds(start - from);

				if (settings.Instrument)
					settings.Instrument.Play(note.Note, {Time: time, Duration: seconds(Number(note.Length) || 0.25), Velocity: note.Velocity});

				events.push({Name: 'note', Value: note, Time: time, Order: events.length});
			});

			for (beat = Math.ceil(from - 1e-9) || 0; beat < to; beat++) {
				var time = base + seconds(beat - from);
				var beats = Math.max(1, Number(settings.Beats) || 4);
				var accent = beat % beats === 0;

				if (settings.Metronome)
					click(time, accent);

				events.push({Name: 'beat', Value: {Beat: beat, Bar: Math.floor(beat / beats), Accent: accent}, Time: time, Order: events.length});
			}

			/*
			 * The events in the order of their times (a note before the beat of its time): a page that comes late gives
			 * them all at once, in the order they are given.
			 */
			events.sort(function (a, b) {
				return a.Time - b.Time || a.Order - b.Order;
			}).forEach(function (event) {
				emit(event.Name, event.Value, event.Time, now);
			});
		}

		/* A tick: what comes in the next tenth of a second goes to the clock of the context. */
		function tick () {
			var now = context.currentTime;
			var ahead = now + 0.12;
			var horizon = origin.Beat + (ahead - origin.Time) / seconds(1);
			var loop = settings.Loop;
			var end;

			/* Without a loop it plays to the end of its last note. */
			if (!loop)
				horizon = Math.min(horizon, last());

			while (cursor < horizon) {
				end = horizon;

				if (loop && Number(loop.End) > Number(loop.Start) && end >= Number(loop.End)) {
					end = Number(loop.End);
				}

				schedule(cursor, end, origin.Time + seconds(cursor - origin.Beat), now);

				if (loop && Number(loop.End) > Number(loop.Start) && end >= Number(loop.End)) {
					/* Round the loop: its start goes on at the time its end comes. */
					previous = origin;
					origin = {Beat: Number(loop.Start), Time: origin.Time + seconds(Number(loop.End) - origin.Beat)};
					cursor = Number(loop.Start);
					horizon = origin.Beat + (ahead - origin.Time) / seconds(1);

					continue;
				}

				cursor = end;
			}

			/*
			 * Without a loop, the end is an event of the time of the end of the last note, after its events: a page late
			 * on its timers still hears every note before it, and the end stops nothing that was to come.
			 */
			if (!loop && cursor >= last() && !ending) {
				ending = setTimeout(function () {
					ending = null;

					transport.Pause();

					paused = 0;

					listeners.end.slice().forEach(function (callback) {
						callback();
					});
				}, Math.max(0, (origin.Time + seconds(last() - origin.Beat) - now) * 1000));

				timeouts.push(ending);
			}
		}

		transport = {
			Playing: false,

			Set: function (changes) {
				var position = transport.Position();

				Object.keys(changes || {}).forEach(function (key) {
					if (Object.prototype.hasOwnProperty.call(settings, key))
						settings[key] = changes[key];
				});

				settings.Notes = (settings.Notes || []).slice();

				/* A new tempo from where it is now; what was on its way at the old one plays out. */
				if (transport.Playing) {
					clearTimeout(ending);

					ending = null;
					previous = null;
					origin = {Beat: position, Time: context.currentTime};
					cursor = Math.max(cursor, position);
				}

				return transport;
			},

			Play: function () {
				if (transport.Playing) return transport;

				if (context.state === 'suspended')
					context.resume();

				transport.Playing = true;
				ending = null;
				previous = null;
				origin = {Beat: paused, Time: context.currentTime + 0.05};
				cursor = paused;
				timer = setInterval(tick, 25);

				tick();

				return transport;
			},

			Pause: function () {
				if (!transport.Playing) return transport;

				paused = transport.Position();
				transport.Playing = false;

				clearInterval(timer);

				timeouts.forEach(clearTimeout);

				timeouts = [];
				timer = null;
				ending = null;

				if (settings.Instrument)
					settings.Instrument.Stop();

				return transport;
			},

			Stop: function () {
				transport.Pause();

				paused = settings.Loop ? Number(settings.Loop.Start) || 0 : 0;

				return transport;
			},

			Seek: function (beat) {
				var playing = transport.Playing;

				transport.Pause();

				paused = Math.max(0, Number(beat) || 0);

				if (playing)
					transport.Play();

				return transport;
			},

			Position: function () {
				var now = context.currentTime;
				var meeting = previous && now < origin.Time ? previous : origin;

				if (!transport.Playing) return paused;

				return Math.max(0, meeting.Beat + (now - meeting.Time) / seconds(1));
			},

			Seconds: seconds,

			On: function (name, callback) {
				if (!listeners[name])
					throw new Error('Elemenx Audio.Transport has no event ' + name + ' (beat, note, end)');

				listeners[name].push(callback);

				return transport;
			},

			Off: function (name, callback) {
				var list = listeners[name] || [];
				var index = list.indexOf(callback);
				if (index !== -1)
					list.splice(index, 1);

				return transport;
			},

			Destroy: function () {
				transport.Pause();

				listeners = {beat: [], note: [], end: []};
			}
		};

		transport.Set(options);

		return transport;
	}
});
