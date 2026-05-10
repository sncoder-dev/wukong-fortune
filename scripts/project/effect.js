
// Import any other script files here, e.g.:
// import * as myModule from "./mymodule.js";

const cloudState = new WeakMap();

runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime)
{
	runtime.addEventListener("tick", () => Tick(runtime));
}

function Tick(runtime)
{
	const dt = runtime.dt;
	const layout = runtime.layout;
	const centerX = layout.width  / 2;
	const centerY = layout.height / 2;

	for (const cloud of runtime.objects.gui_cloud.instances())
	{
		const s = cloudState.get(cloud);
		if (!s) continue;

		if (s.phase === "in")
		{
			const tx = centerX + s.offsetX;
			const ty = centerY + s.offsetY;
			cloud.x += (tx - cloud.x) * s.speed * dt;
			cloud.y += (ty - cloud.y) * s.speed * dt;

			if (Math.hypot(cloud.x - tx, cloud.y - ty) < 2)
			{
				s.phase = "wait";
				s.waitTimer = s.waitTime;
			}
		}
		else if (s.phase === "wait")
		{
			s.waitTimer -= dt;
			if (s.waitTimer <= 0)
				s.phase = "out";
		}
		else if (s.phase === "out")
		{
			cloud.x += (s.startX - cloud.x) * s.speed * dt;
			cloud.y += (s.startY - cloud.y) * s.speed * dt;

			if (Math.hypot(cloud.x - s.startX, cloud.y - s.startY) < 2)
			{
				cloudState.delete(cloud);
				cloud.destroy();
			}
		}
	}
}

/**
 * Spawn N gui_cloud objects evenly around the screen, fly inward to a ring
 * around the center, wait, fly back, destroy.
 * options:
 *   count        : how many clouds (default 4 = 4 corners)
 *   scaleMin     : minimum scale (default 0.5)
 *   scaleMax     : maximum scale (default 1.5)
 *   waitTime     : seconds to stay at center before flying back (default 2)
 *   speed        : easing speed factor (default 3)
 *   targetOffset : distance from center for resting position (default 200)
 *   margin       : distance outside screen edge to spawn (default 2000)
 *   layer        : layer name to spawn on (default "Game")
 *   startAngle   : starting angle in degrees (default 45 = top-right corner first)
 */
globalThis.SpawnGuiClouds = function (runtime, options = {})
{
	const count        = options.count        ?? 4;
	const scaleMin     = options.scaleMin     ?? 0.5;
	const scaleMax     = options.scaleMax     ?? 1.5;
	const waitTime     = options.waitTime     ?? 2;
	const speed        = options.speed        ?? 3;
	const targetOffset = options.targetOffset ?? 200;
	const margin       = options.margin       ?? 2000;
	const layer        = options.layer        ?? "Game";
	const startAngle   = options.startAngle   ?? 45;

	const layout  = runtime.layout;
	const W       = layout.width;
	const H       = layout.height;
	const centerX = W / 2;
	const centerY = H / 2;
	const halfW   = W / 2;
	const halfH   = H / 2;
	const EPS     = 0.05; // treat |cos| or |sin| under this as "on the axis"

	for (let i = 0; i < count; i++)
	{
		// Distribute evenly around 360°. With count=4 + startAngle=45 → 4 corners.
		const angleDeg = startAngle + (360 / count) * i;
		const angle    = angleDeg * Math.PI / 180;
		const cos      = Math.cos(angle);
		const sin      = Math.sin(angle);

		// Distance from center to screen edge along this angle
		let edgeDist;
		if      (Math.abs(cos) < EPS) edgeDist = halfH;
		else if (Math.abs(sin) < EPS) edgeDist = halfW;
		else                          edgeDist = Math.min(halfW / Math.abs(cos),
		                                                  halfH / Math.abs(sin));

		const dist = edgeDist + margin;
		const sx   = centerX + cos * dist;
		const sy   = centerY + sin * dist;

		// Resting offset: only apply on axes that are not centered
		const dx = Math.abs(cos) < EPS ? 0 : Math.sign(cos) * targetOffset;
		const dy = Math.abs(sin) < EPS ? 0 : Math.sign(sin) * targetOffset;

		const cloud = runtime.objects.gui_cloud.createInstance(layer, sx, sy);

		// Random animation frame 0..5
		try { cloud.animationFrame = Math.floor(Math.random() * 6); } catch (e) {}

		// Random scale
		const scl = scaleMin + Math.random() * (scaleMax - scaleMin);
		cloud.width  *= scl;
		cloud.height *= scl;

		cloudState.set(cloud, {
			phase:     "in",
			startX:    sx,
			startY:    sy,
			offsetX:   dx,
			offsetY:   dy,
			waitTime:  waitTime,
			waitTimer: 0,
			speed:     speed
		});
	}
};
