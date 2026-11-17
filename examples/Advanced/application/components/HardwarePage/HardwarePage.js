/*
 * HardwarePage (/hardware): a board of the ESP32 family flashed through Web Serial (Elemenx.Hardware, its $Hardware here:
 * the port closed when the page goes). The files of a build of arduino-cli at their offsets (Firmware.Parts) or a
 * manifest of ESP Web Tools (Firmware.Manifest); the map of its memory: a table of partitions of Arduino, read from the
 * board or from a file, edited, checked, written with the firmware; flashed with its progress, cancelled; its output
 * after it starts in a terminal.
 */
Elemenx.Component('HardwarePage', {
	$TemplateURL: 'HardwarePage.html',
	$StyleURL: 'HardwarePage.css',
	Supported: false,
	HasPort: false,
	PortText: 'no port',
	ChipText: '',
	Chip: 'ESP32',
	ChipOptions: [{Value: 'ESP32', Label: 'ESP32'}, {Value: 'ESP32-S3', Label: 'ESP32-S3'}, {Value: 'ESP32-C3', Label: 'ESP32-C3'}],
	/* The files of the firmware: [{ID, Name, Offset (text), Size}]; their bytes are kept apart (Own). */
	Parts: [],
	/* The table of partitions as the page edits it: [{ID, Name, Type, SubType, Offset (text), Size (text)}]. */
	Table: [],
	Preset: 'default',
	PresetOptions: [{Value: 'default', Label: 'Arduino: default'}, {Value: 'huge_app', Label: 'Arduino: huge app'}, {Value: 'min_spiffs', Label: 'Arduino: minimal SPIFFS'}, {Value: 'no_ota', Label: 'Arduino: no OTA'}],
	FlashSize: '4MB',
	SizeOptions: [{Value: '2MB', Label: '2 MB'}, {Value: '4MB', Label: '4 MB'}, {Value: '8MB', Label: '8 MB'}, {Value: '16MB', Label: '16 MB'}],
	TypeOptions: [{Value: 'app', Label: 'app'}, {Value: 'data', Label: 'data'}],
	UseTable: false,
	Problems: [],
	MapNote: '',
	Baud: '460800',
	BaudOptions: [{Value: '115200', Label: '115200'}, {Value: '460800', Label: '460800'}, {Value: '921600', Label: '921600'}],
	Mode: 'keep',
	ModeOptions: [{Value: 'keep', Label: 'as built'}, {Value: 'qio', Label: 'QIO'}, {Value: 'qout', Label: 'QOUT'}, {Value: 'dio', Label: 'DIO'}, {Value: 'dout', Label: 'DOUT'}],
	Frequency: 'keep',
	FrequencyOptions: [{Value: 'keep', Label: 'as built'}, {Value: '80m', Label: '80 MHz'}, {Value: '40m', Label: '40 MHz'}, {Value: '26m', Label: '26 MHz'}, {Value: '20m', Label: '20 MHz'}],
	Erase: false,
	Verify: true,
	Busy: false,
	Failed: false,
	Done: 0,
	Total: 0,
	Status: '',
	Lines: [],
	Monitoring: false,
	MonitorBaud: '115200',
	MonitorOptions: [{Value: '9600', Label: '9600'}, {Value: '115200', Label: '115200'}, {Value: '230400', Label: '230400'}],
	Version: 0,

	$OnCreate: function () {
		var own = {Port: null, Bytes: {}, Job: null, Next: 1};

		this.Own = function () {
			return own;
		};

		this.Supported = this.$Hardware.Serial.Supported();

		this.PresetChosen('default');
	},

	Id: function () {
		return 'n' + this.Own().Next++;
	},

	Hex: function (value) {
		return '0x' + Number(value).toString(16);
	},

	Parse: function (text) {
		var value = String(text || '').trim();

		return /^0x/i.test(value) ? parseInt(value, 16) : Number(value);
	},

	/* The part written, in percent; null before it knows its end. */
	Percent: function (done, total) {
		return total ? Math.round(done / total * 100) : null;
	},

	Say: function (error, text) {
		this.Failed = !!error;
		this.Status = error ? error.name + ': ' + error.message : text;
	},

	/* The port: the user picks it (a press); its handle is the page's own, closed with it. */
	Pick: function () {
		var self = this;

		this.$Hardware.Serial.Request({}, function (error, port) {
			if (error) {
				self.Say(error);

				return;
			}

			self.Own().Port = port;
			self.HasPort = true;
			self.PortText = 'USB ' + (port.Info.VendorID === null ? '?' : self.Hex(port.Info.VendorID)) + ':' + (port.Info.ProductID === null ? '?' : self.Hex(port.Info.ProductID));

			self.Say(null, 'A port picked.');

			port.On('line', function (line) {
				self.Lines = self.Lines.concat([{ID: self.Id(), Kind: 'output', Text: line}]).slice(-500);
			});
			port.On('close', function () {
				self.Monitoring = false;
			});
		});
	},

	Detect: function () {
		var self = this;

		this.Busy = true;

		this.Say(null, 'Into its loader...');

		this.$Hardware.Firmware.Detect(this.Own().Port, {}, function (error, chip) {
			self.Busy = false;

			if (error) {
				self.Say(error);

				return;
			}

			self.Chip = chip.Chip;
			self.ChipText = chip.Chip + ' (its bootloader at ' + self.Hex(chip.Bootloader) + ')';

			self.Say(null, 'It is an ' + chip.Chip + '.');
			self.ChipChanged(chip.Chip);
		});
	},

	/* Another chip: the files laid again at its offsets (its bootloader moves). */
	ChipChanged: function (chip) {
		var own = this.Own();
		var self = this;
		var files = this.Parts.map(function (part) {
			return {Name: part.Name, Bytes: own.Bytes[part.ID]};
		});

		this.Chip = chip;

		if (files.length)
			this.Laid(this.$Hardware.Firmware.Parts(files, chip));

		self.Version++;
	},

	/* Parts with their bytes kept apart, shown with their offsets. */
	Laid: function (parts) {
		var own = this.Own();
		var self = this;

		own.Bytes = {};

		this.Parts = parts.map(function (part) {
			var id = self.Id();

			own.Bytes[id] = part.Bytes;

			return {ID: id, Name: part.Name, Offset: self.Hex(part.Offset), Size: part.Bytes.length};
		});
	},

	/* Files picked: a manifest of ESP Web Tools (its parts read from the files picked with it), else .bin files of a build. */
	FilesPicked: function (files) {
		var self = this;
		var list = Array.prototype.slice.call(files || []);
		var read = {};
		var left = list.length;
		if (!left) return;

		list.forEach(function (file) {
			var reader = new FileReader();

			reader.onload = function () {
				read[file.name] = new Uint8Array(reader.result);

				if (--left) return;

				self.FilesRead(read);
			};

			reader.readAsArrayBuffer(file);
		});
	},

	FilesRead: function (read) {
		var self = this;
		var names = Object.keys(read);
		var manifest = names.filter(function (name) {
			return /\.json$/i.test(name);
		})[0];

		if (!manifest) {
			this.Laid(this.$Hardware.Firmware.Parts(names.map(function (name) {
				return {Name: name, Bytes: read[name]};
			}), this.Chip));
			this.Say(null, names.length + ' files laid.');

			return;
		}

		this.$Hardware.Firmware.Manifest(JSON.parse(new TextDecoder().decode(read[manifest])), this.Chip, function (path, callback) {
			var name = String(path).split('/').pop();

			if (read[name]) callback(null, read[name]);
			else callback(new Error('pick ' + name + ' with the manifest'));
		}, function (error, parts) {
			if (error) self.Say(error);
			else self.Laid(parts);
		});
	},

	PartOffset: function (id, text) {
		var value = this.Parse(text);

		this.Parts = this.Parts.map(function (part) {
			return part.ID === id && !isNaN(value) ? Object.assign({}, part, {Offset: '0x' + value.toString(16)}) : part;
		});
	},

	PartRemoved: function (id) {
		delete this.Own().Bytes[id];

		this.Parts = this.Parts.filter(function (part) {
			return part.ID !== id;
		});
	},

	/* The table of partitions. */
	Rows: function (list) {
		var self = this;

		this.Table = list.map(function (one) {
			return {ID: self.Id(), Name: one.Name, Type: one.Type, SubType: String(one.SubType), Offset: self.Hex(one.Offset), Size: self.Hex(one.Size)};
		});

		this.Checked();
	},

	List: function () {
		var self = this;

		return this.Table.map(function (row) {
			return {Name: row.Name, Type: row.Type, SubType: /^\d|^0x/i.test(row.SubType) ? self.Parse(row.SubType) : row.SubType, Offset: self.Parse(row.Offset), Size: self.Parse(row.Size), Flags: []};
		});
	},

	Checked: function () {
		var list = this.List();
		var size = parseInt(this.FlashSize, 10) * 1024 * 1024;

		this.Problems = this.$Hardware.Firmware.Partitions.Check(list, size).map(function (problem) {
			return (problem.Partition >= 0 ? list[problem.Partition].Name + ': ' : '') + problem.Text;
		});
		this.MapNote = this.Problems.length ? this.Problems.length + ' to put right' : 'it holds together';
		this.Version++;
	},

	PresetChosen: function (name) {
		this.Preset = name;

		this.Rows(this.$Hardware.Firmware.Partitions.Preset(name));
	},

	RowChanged: function (id, key, value) {
		this.Table = this.Table.map(function (row) {
			var made = Object.assign({}, row);

			if (row.ID === id)
				made[key] = value;

			return made;
		});

		this.Checked();
	},

	RowRemoved: function (id) {
		this.Table = this.Table.filter(function (row) {
			return row.ID !== id;
		});

		this.Checked();
	},

	/* A partition after the last one: data of 64 KB. */
	RowAdded: function () {
		var list = this.List();
		var end = list.reduce(function (most, one) {
			return Math.max(most, one.Offset + one.Size);
		}, 0x9000);

		this.Table = this.Table.concat([{ID: this.Id(), Name: 'part' + this.Table.length, Type: 'data', SubType: 'spiffs', Offset: this.Hex(Math.ceil(end / 0x1000) * 0x1000), Size: '0x10000'}]);

		this.Checked();
	},

	ReadTable: function () {
		var self = this;
		var partitions = this.$Hardware.Firmware.Partitions;

		this.Busy = true;

		this.Say(null, 'Reading its table...');

		this.$Hardware.Firmware.Read(this.Own().Port, partitions.Offset, 0xC00, {}, function (error, bytes) {
			var list;

			self.Busy = false;

			if (error) {
				self.Say(error);

				return;
			}

			list = partitions.Parse(bytes);

			self.Rows(list);
			self.Say(null, list.length ? 'Its table read: ' + list.length + ' partitions.' : 'It has no table at 0x8000.');
		});
	},

	TablePicked: function (files) {
		var self = this;
		var file = files && files[0];
		var reader;

		if (!file) return;

		reader = new FileReader();
		reader.onload = function () {
			var bytes = new Uint8Array(reader.result);

			self.Rows(self.$Hardware.Firmware.Partitions.Parse(/\.csv$/i.test(file.name) ? new TextDecoder().decode(bytes) : bytes));
		};

		reader.readAsArrayBuffer(file);
	},

	SaveTable: function (kind) {
		var partitions = this.$Hardware.Firmware.Partitions;
		var data = kind === 'csv' ? partitions.CSV(this.List()) : partitions.Make(this.List());
		var link = document.createElement('a');

		link.href = URL.createObjectURL(new Blob([data], {type: kind === 'csv' ? 'text/csv' : 'application/octet-stream'}));
		link.download = 'partitions.' + kind;

		link.click();

		setTimeout(function () {
			URL.revokeObjectURL(link.href);
		}, 1000);
	},

	/* The map of the flash: what comes before the table (the bootloader), the table, each partition, as parts of the whole. */
	MapOf: function (table, size) {
		var total = parseInt(size, 10) * 1024 * 1024;
		var list = this.List();
		var pieces = [{Key: 'boot', Name: 'boot', Kind: 'boot', Start: 0, Size: 0x8000}, {Key: 'table', Name: 'table', Kind: 'table', Start: 0x8000, Size: 0x1000}];

		list.forEach(function (one, index) {
			pieces.push({Key: 'p' + index, Name: one.Name, Kind: one.Type === 'app' ? 'app' : 'data', Start: one.Offset, Size: one.Size});
		});

		return pieces.filter(function (piece) {
			return piece.Size > 0 && !isNaN(piece.Start);
		}).map(function (piece) {
			return {Key: piece.Key, Name: piece.Name, Kind: piece.Kind, Left: Math.min(100, piece.Start / total * 100), Width: Math.max(0.4, Math.min(100, piece.Size / total * 100)), Title: piece.Name + ': 0x' + piece.Start.toString(16) + ', ' + Math.round(piece.Size / 1024) + ' KB'};
		});
	},

	Flash: function () {
		var self = this;
		var own = this.Own();
		var parts = this.Parts.map(function (part) {
			return {Offset: self.Parse(part.Offset), Bytes: own.Bytes[part.ID], Name: part.Name};
		});
		var flash = {Size: this.FlashSize};

		/* The table of the page in place of the one of the build. */
		if (this.UseTable) {
			parts = parts.filter(function (part) {
				return part.Offset !== self.$Hardware.Firmware.Partitions.Offset;
			}).concat([{Offset: this.$Hardware.Firmware.Partitions.Offset, Bytes: this.$Hardware.Firmware.Partitions.Make(this.List()), Name: 'partitions (the map)'}]);
		}

		if (this.Mode !== 'keep')
			flash.Mode = this.Mode;

		if (this.Frequency !== 'keep')
			flash.Frequency = this.Frequency;

		this.Busy = true;
		this.Done = 0;
		this.Total = 0;

		this.Say(null, 'Into its loader...');

		own.Job = this.$Hardware.Firmware.Flash(own.Port, parts, {Baud: Number(this.Baud), Erase: this.Erase, Verify: this.Verify, Flash: flash, Partitions: this.UseTable ? this.List() : null, Progress: function (progress) {
			self.Done = progress.Done;
			self.Total = progress.Total;
			self.Status = {connect: 'Connected.', erase: 'Erasing...', write: 'Writing...', verify: 'Checking...', done: 'Written.'}[progress.Stage] || progress.Stage;
		}}, function (error, result) {
			self.Busy = false;
			own.Job = null;

			if (error) self.Say(error);
			else self.Say(null, result.Chip + ': ' + result.Written + ' bytes written' + (self.Verify ? ' and checked' : '') + ', the board started again.');
		});
	},

	Cancel: function () {
		if (this.Own().Job)
			this.Own().Job.Cancel();
	},

	/* The port opened to hear the board (lines of text), or closed. */
	Monitor: function () {
		var self = this;
		var port = this.Own().Port;

		if (this.Monitoring) {
			port.Close(function () {
				self.Monitoring = false;
			});

			return;
		}

		port.Open({BaudRate: Number(this.MonitorBaud), Text: true}, function (error) {
			if (error) self.Say(error);
			else self.Monitoring = true;
		});
	},

	Send: function (text) {
		var self = this;

		this.Lines = this.Lines.concat([{ID: this.Id(), Kind: 'input', Text: text}]);

		this.Own().Port.Write(text + '\n', function (error) {
			if (error)
				self.Lines = self.Lines.concat([{ID: self.Id(), Kind: 'error', Text: error.message}]);
		});
	}
});
