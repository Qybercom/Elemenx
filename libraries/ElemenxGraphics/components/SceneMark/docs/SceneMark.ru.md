SceneMark: то, что внутри (любые компоненты ElemenxUI: карточка, полоска, график Chart или Sparkline, Meter), над местом сцены, в которой он объявлен, в её слоте hud:

```html
<Scene>
	<SceneMark slot="hud" For="earth" Line="true">
		<Card Title="Земля"><Sparkline [values]="Temperatures" /></Card>
	</SceneMark>
</Scene>
```

На каждом кадре сцена раскладывает его вместе с другими метками (SceneMarks, подписи объектов тоже среди них). For — объект (Part — гнездо его модели, Up — сколько его размеров над серединой) или Point [x, y, z] мира; Offset [x, y, z], Shift [x, y] пикселей, Align (bottom, top, center, left, right); Line (true, auto, false), Occlude (прятать за телами и рельефом), Edge (у края вида со стрелкой, когда место вне вида), Declutter (сдвигать с других меток), Cluster и ClusterRadius (близкие метки одного кластера — одна с бейджем +N), Near и Far (метры: гаснет с расстоянием), Priority. Key — его имя среди меток (иначе своё).

В демо Space (/graphics) переключатель Marks показывает карточки с графиками над Землёй и Марсом, шкалу над станцией, луны Юпитера кластером и Нептун у края со стрелкой.
