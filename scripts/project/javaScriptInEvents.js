

const scriptsInEvents = {

	async Game_Event1_Act2(runtime, localVars)
	{
		//rows, cols, spacingX, spacingY, startX, startY
		globalThis.createSymbolsGrid(5, 6, 130, 105, 315, 110);
	},

	async Game_Event1_Act3(runtime, localVars)
	{

	},

	async Game_Event1_Act4(runtime, localVars)
	{

	},

	async Game_Event1_Act5(runtime, localVars)
	{

	},

	async Game_Event13_Act2(runtime, localVars)
	{

	},

	async Game_Event16_Act2(runtime, localVars)
	{

	},

	async Game_Event17_Act5(runtime, localVars)
	{

	},

	async Game_Event28_Act2(runtime, localVars)
	{
		SpawnGuiClouds(runtime, {
		    count:        8,        // 4 → 4 góc; 8 → 4 góc + 4 cạnh
		    scaleMin:     3.2,
		    scaleMax:     4.6,
		    waitTime:     0.5,
		    speed:        3,
		    targetOffset: 350,      // khoảng cách từ giữa màn hình đến vị trí dừng
		    margin:       2000,     // khoảng cách spawn ngoài màn hình
		    layer:        "transition",
		    startAngle:   45        // 45 = bắt đầu từ góc; 0 = bắt đầu từ cạnh phải
		});
		
	}
};

globalThis.C3.JavaScriptInEvents = scriptsInEvents;
