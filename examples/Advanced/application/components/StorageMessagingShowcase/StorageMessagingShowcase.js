Elemenx.Component('StorageMessagingShowcase', {
	TemplateURL: 'StorageMessagingShowcase.html',
	LocalValue: 'not set',
	SessionValue: 'not set',
	CookieValue: 'not set',
	IndexedDBValue: 'not loaded',
	IndexedDBCount: 0,
	MessageValue: 'nothing received',
	MessageChannels: 'not connected',
	MessageCount: 0,
	StorageHandler: 'attached',
	StorageHandlerAction: 'Detach',
	_MessageSender: null,
	_MessageReceiver: null,
	_MessageHandler: null,

	ElemenxOnCreate: function () {
		var app = this.Application();

		app.Storage('AdvancedStorageBase', {
			Namespace: 'AdvancedExample'
		});
		app.Storage('AdvancedStorageShowcase', {
			Contexts: 'AdvancedStorageBase',
			Namespace: 'StorageMessaging',
			IndexedDB: {
				Name: 'ElemenxAdvancedShowcase',
				Version: 1,
				Stores: {
					Records: {
						Indexes: {
							Kind: {KeyPath: 'kind'}
						}
					}
				}
			}
		});

		app.Messaging('AdvancedMessagingBase', {
			Channels: ['advanced:events']
		});
		app.Messaging('AdvancedMessagingShowcase', {
			Contexts: 'AdvancedMessagingBase',
			Channels: ['advanced:storage']
		});

		this.RefreshStorage();
		this.ConnectMessaging();
	},

	StorageFacade: function () {
		return this.Storage('AdvancedStorageShowcase');
	},

	RefreshStorage: function () {
		var storage = this.StorageFacade();

		this.LocalValue = storage.Local.Has('value') ? storage.Local.Get('value') : 'not set';
		this.SessionValue = storage.Session.Has('value') ? storage.Session.Get('value') : 'not set';
		this.CookieValue = storage.Cookie.Has('value') ? storage.Cookie.Get('value') : 'not set';
	},

	WriteStorage: function () {
		var storage = this.StorageFacade();

		storage.Local.Set('value', 'local value');
		storage.Session.Set('value', 'session value');
		storage.Cookie.Set('value', 'cookie value', {Path: '/'});
		this.RefreshStorage();
	},

	RemoveStorage: function () {
		var storage = this.StorageFacade();

		storage.Local.Remove('value');
		storage.Session.Remove('value');
		storage.Cookie.Remove('value', {Path: '/'});
		this.RefreshStorage();
	},

	ClearStorage: function () {
		var storage = this.StorageFacade();

		storage.Local.Clear();
		storage.Session.Clear();
		storage.Cookie.Clear({Path: '/'});
		this.RefreshStorage();
	},

	RunIndexedDB: function () {
		var self = this;
		var database = this.StorageFacade().IndexedDB();
		var records = database.Store('Records');
		var record = {kind: 'showcase', value: 'IndexedDB roundtrip'};

		records.Put('primary', record)
			.On('Success', function () {
				records.Index('Kind').GetAll('showcase')
					.On('Success', function (event) {
						self.IndexedDBCount = event.Data.length;
						database.Transaction('Records', 'readwrite', function (transaction) {
							transaction.Store('Records').Put('transaction', {kind: 'transaction', value: 'Transaction committed'});
						}).On('Success', function () {
							records.Get('transaction').On('Success', function (result) {
								self.IndexedDBValue = result.Data.value;
							}).Execute();
						}).Execute();
					})
					.On('Error', function (event) {
						self.IndexedDBValue = 'Error: ' + event.Data;
					})
					.Execute();
			})
			.On('Error', function (event) {
				self.IndexedDBValue = 'Error: ' + event.Data;
			})
			.Execute();
	},

	ConnectMessaging: function () {
		var self = this;

		this._MessageSender = this.Messaging();
		this._MessageReceiver = this.Messaging('AdvancedMessagingShowcase').ID('advanced:receiver');
		this._MessageHandler = function (event) {
			self.MessageCount++;
			self.MessageValue = event.Channel + ': ' + event.Data;
		};

		this._MessageReceiver.On('advanced:events', this._MessageHandler);
		this._MessageReceiver.On('advanced:storage', this._MessageHandler);
		this._MessageReceiver.On(this._MessageHandler);
		this.MessageChannels = this._MessageReceiver.Channels().join(', ');
	},

	SendContextMessage: function () {
		this._MessageSender.Send('advanced:events', 'context message');
	},

	SendStorageMessage: function () {
		this._MessageSender.Send('advanced:storage', 'storage message');
	},

	SendDirectMessage: function () {
		this._MessageSender.Send('advanced:receiver', 'direct message');
	},

	ToggleStorageHandler: function () {
		if (this.StorageHandler === 'attached') {
			this._MessageReceiver.Off('advanced:storage', this._MessageHandler);
			this.StorageHandler = 'detached';
			this.StorageHandlerAction = 'Attach';
		}
		else {
			this._MessageReceiver.On('advanced:storage', this._MessageHandler);
			this.StorageHandler = 'attached';
			this.StorageHandlerAction = 'Detach';
		}

		this.MessageChannels = this._MessageReceiver.Channels().join(', ');
	}
});