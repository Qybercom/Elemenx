Elemenx.Component('StorageShowcase', {
	$TemplateURL: 'StorageShowcase.html',
	LocalValue: 'not set',
	SessionValue: 'not set',
	CookieValue: 'not set',
	IndexedDBValue: 'not loaded',
	IndexedDBCount: 0,

	$OnCreate: function () {
		var app = this.$Application();
		app.$Storage('AdvancedStorageBase', {Namespace: 'AdvancedExample'});
		app.$Storage('AdvancedStorageShowcase', {
			Contexts: 'AdvancedStorageBase',
			Namespace: 'Storage',
			IndexedDB: {
				Name: 'ElemenxAdvancedShowcase',
				Version: 1,
				Stores: {Records: {Indexes: {Kind: {KeyPath: 'kind'}}}}
			}
		});
		this.RefreshStorage();
	},

	StorageFacade: function () { return this.$Storage('AdvancedStorageShowcase'); },
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
		records.Put('primary', {kind: 'showcase', value: 'IndexedDB roundtrip'}).On('Success', function () {
			records.Index('Kind').GetAll('showcase').On('Success', function (event) {
				self.IndexedDBCount = event.Data.length;
				database.Transaction('Records', 'readwrite', function (transaction) {
					transaction.Store('Records').Put('transaction', {kind: 'transaction', value: 'Transaction committed'});
				}).On('Success', function () {
					records.Get('transaction').On('Success', function (result) { self.IndexedDBValue = result.Data.value; }).Execute();
				}).Execute();
			}).On('Error', function (event) { self.IndexedDBValue = 'Error: ' + event.Data; }).Execute();
		}).On('Error', function (event) { self.IndexedDBValue = 'Error: ' + event.Data; }).Execute();
	}
});