Elemenx.Component('RemoteNestedTemplate',{
	TemplateID:'RemoteNestedTemplateID',
	Count:0,
	Increment:function () {
		this.Count++;
		this.Emit('change',this.Count);
	}
});