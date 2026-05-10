import "./effect.js"
const WIN_CHANCE = 0.8; // Normal Win Rate: controls normal symbol-win outcome chance
const WIN_FREESPINS = 0.1; // FreeSpin Win Rate: controls chance to activate Free Spins (4+ Scatter)
const FREE_SPINS_START_COUNT = 15; // number of free spins granted on initial trigger
const FREE_SPINS_RETRIGGER_SCATTERS = 3; // minimum scatters required to retrigger free spins
const FREE_SPINS_RETRIGGER_COUNT = 5; // number of free spins granted on each retrigger
const FREE_SPINS_TRIGGER_SCATTERS = 4; // minimum scatters required to start free spins
const INITIAL_GUI_CREDIT = 100000; // starting credit shown in the bottom GUI
const MIN_MATCH_TO_WIN = 8; // minimum count of same symbol needed to form a normal win
const PAYOUT_TABLE = { // payout multipliers by symbol and match-count bands
	S1: [{ min: 12, max: 30, payout: 50 }, { min: 10, max: 11, payout: 25 }, { min: 8, max: 9, payout: 10 }],
	S2: [{ min: 12, max: 30, payout: 25 }, { min: 10, max: 11, payout: 10 }, { min: 8, max: 9, payout: 2.5 }],
	S3: [{ min: 12, max: 30, payout: 15 }, { min: 10, max: 11, payout: 5 }, { min: 8, max: 9, payout: 2 }],
	S4: [{ min: 12, max: 30, payout: 12 }, { min: 10, max: 11, payout: 2 }, { min: 8, max: 9, payout: 1.5 }],
	S5: [{ min: 12, max: 30, payout: 10 }, { min: 10, max: 11, payout: 1.5 }, { min: 8, max: 9, payout: 1 }],
	S6: [{ min: 12, max: 30, payout: 8 }, { min: 10, max: 11, payout: 1.2 }, { min: 8, max: 9, payout: 0.8 }],
	S7: [{ min: 12, max: 30, payout: 5 }, { min: 10, max: 11, payout: 1 }, { min: 8, max: 9, payout: 0.5 }],
	S8: [{ min: 12, max: 30, payout: 4 }, { min: 10, max: 11, payout: 0.9 }, { min: 8, max: 9, payout: 0.4 }],
	Scatter: [{ min: 6, max: 30, payout: 100 }, { min: 5, max: 5, payout: 5 }, { min: 4, max: 4, payout: 3 }]
};


const NORMAL_SYMBOL_ANIMATIONS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];
const MULTIPLIER_SYMBOL_ANIMATIONS = ["M1", "M2", "M3", "M4"];
const SPECIAL_SYMBOL_ANIMATIONS = ["Scatter"];
const ALL_SYMBOL_ANIMATIONS = [
	...NORMAL_SYMBOL_ANIMATIONS,
	...MULTIPLIER_SYMBOL_ANIMATIONS,
	...SPECIAL_SYMBOL_ANIMATIONS
];
const ALLOWED_MULTIPLIERS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 50, 100, 250, 500];
const MULTIPLIER_WEIGHTS = [100, 20, 15, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0.5, 0.1];
const BET_AMOUNT = 1;
const DEMO_WIN = false; // keep false for real gameplay cascade behavior
const MULTIPLIER_ANIM_WEIGHT = 0.12; // low weight so M symbols appear less often
const SCATTER_ANIM_WEIGHT = 0.2;
const SCATTER_ANIM_WEIGHT_FREESPIN = 0.02;
const SCATTER_APPEAR_CHANCE_FREESPIN = 0.01; // 10% chance to spawn Scatter per symbol roll during Free Spins
const NORMAL_ANIM_WEIGHT = 1;
const SCATTER_MAX_ON_SCREEN_NORMAL = 5;
const SCATTER_MAX_ON_SCREEN_FREESPIN = 3;
const WIN_DESTROY_DELAY_SECONDS = 0.5; // wait after symbolWin before destroying winning symbols
const DROP_DELAY_SECONDS = 0.5; // tween duration for cascade drop/refill
const AUTO_FREE_SPIN_DELAY_SECONDS = 1.0; // pause between auto free spins
const FREE_SPINS_START_ACK_TO_AUTO_DELAY_SECONDS = 1.2; // wait after START popup confirm before entering auto free spin loop
const AUTO_SPIN_DELAY_SECONDS = 0.2; // pause between normal auto spins
const FREE_SPINS_BUY_COST_MULTIPLIER = 100;
const BOUGHT_FREESPINS_SCATTER_4_WEIGHT = 94;
const BOUGHT_FREESPINS_SCATTER_5_WEIGHT = 5;
const BOUGHT_FREESPINS_SCATTER_6_WEIGHT = 1;


let g_runtime = null;
const createdSymbolInstances = [];
const createdMultiplierTextInstances = [];
const symbolMultiplierMap = new Map();
const symbolMultiplierValueMap = new Map();
const symbolAnimationMap = new Map();
let isSpinning = false;
let spinToken = 0;
let currentGridConfig = null;
let activeMultiplierCap = 2;
let isFreeSpinMode = false;
let freeSpinsRemaining = 0;
let freeSpinTotalMultiplier = 0;
let freeSpinsSessionTotalWin = 0;
let currentSpinStats = null;
let pendingAutoFreeSpins = false;
let isAutoFreeSpinsRunning = false;
let currentTotalBet = BET_AMOUNT;
let pendingBoughtFreeSpinsTrigger = false;
let lastFreeSpinRetriggerScatterSignature = "";
let currentSpinAllowsFreeSpinTrigger = false;
const FULLSCREEN_BG_PATH = "BackGround.png";
const FULLSCREEN_BG_FALLBACK_PATHS = ["files/BackGround.png", "./BackGround.png", "./files/BackGround.png"];
const SYMBOLS_LAYER_NAME = "symbols";
const BET_OPTION_ID = "bet-option-layer";
const BET_OPTION_STYLE_ID = "bet-option-style";
const BOTTOM_GUI_ID = "bottom-gui-layer";
const BOTTOM_GUI_STYLE_ID = "bottom-gui-style";
const FREESPIN_POPUP_ID = "freespin-popup-layer";
const FREESPIN_POPUP_STYLE_ID = "freespin-popup-style";
const SYMBOL_WIN_BANNER_ID = "symbol-win-banner-layer";
const SYMBOL_WIN_BANNER_STYLE_ID = "symbol-win-banner-style";
const SYMBOL_WIN_BANNER_SHOW_MS = 2000;
const TUMBLE_WIN_BANNER_ID = "tumble-win-banner-layer";
const TUMBLE_WIN_BANNER_STYLE_ID = "tumble-win-banner-style";
const TURBO_POPUP_ID = "turbo-popup-layer";
const TURBO_POPUP_STYLE_ID = "turbo-popup-style";
const TURBO_POPUP_SHOW_MS = 1200;
const INFO_PANEL_ID = "info-panel-layer";
const INFO_PANEL_STYLE_ID = "info-panel-style";
const AUTOSPIN_PANEL_ID = "autospin-panel-layer";
const AUTOSPIN_PANEL_STYLE_ID = "autospin-panel-style";
const AUTOSPIN_OPTIONS = [10, 20, 30, 50, 100, 200, 500, 1000];
const BOTTOM_GUI_GLOBAL_SCALE = 1;
const BOTTOM_GUI_SAFE_BOTTOM = 5;
const BOTTOM_GUI_CARD_HEIGHT = 48;
const MOBILE_MAX_WIDTH = 480;
const TABLET_MAX_WIDTH = 700;
const BET_OPTION_MULTIPLIER = 20;
const BET_OPTION_BET_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const BET_OPTION_COIN_VALUES = [0.01, 0.02, 0.05, 0.10, 0.20, 0.50];
const INFO_SYMBOL_ORDER = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];
const INFO_SYMBOL_IMAGE_BASE_CANDIDATES = ["symbols", "./symbols"];
let resolvedFullscreenBgPath = "";
let isResolvingFullscreenBgPath = false;
let betOptionState = {
	betIndex: 0,
	coinIndex: 0,
	ready: false
};
const bottomGuiState = {
	ready: false,
	soundOn: true,
	autoplayOn: false,
	turboOn: false,
	credit: INITIAL_GUI_CREDIT,
	lastWin: 0
};
let bottomGuiScaleRafId = 0;
let lastResponsiveMode = "";
let isAutoSpinsRunning = false;
let autoSpinsRemaining = 0;
let autoSpinsAbort = false;
const infoSymbolResolvedUrlMap = new Map();
let infoSymbolPreloadPromise = null;
const autoSpinPanelState = {
	selectedCount: AUTOSPIN_OPTIONS[0],
	ready: false
};
const freeSpinSignalWaiters = {
	freeSpinsStart: [],
	freeSpinsRetrigger: [],
	freeSpinsEnd: []
};
const freeSpinsPopupState = {
	visibleSignal: ""
};
let tumbleSnapDebugLastLogTs = 0;
let turboPopupHideTimer = 0;
let forcedScatterAssignmentsRemaining = 0;

// Demo session state � tracks how many S1 slots remain to be placed via reservoir sampling
let _demoS1Remaining = 0;
let _demoSlotsRemaining = 0;

runOnStartup(async runtime =>
{
	// Code to run on the loading screen.
	// Note layouts, objects etc. are not yet available.

	g_runtime = runtime;
	infoSymbolPreloadPromise = preloadInfoSymbolImages();
	await infoSymbolPreloadPromise;
	initializeSoundStateAtStartup();
	bootstrapFullscreenBackground();
	globalThis.createSymbolsGrid = createSymbolsGrid;
	globalThis.spinSymbols = spinSymbols;
	globalThis.checkWinsAndCascade = checkWinsAndCascade;
	globalThis.buyFreeSpins = buyFreeSpins;
	globalThis.setCurrentTotalBet = setCurrentTotalBet;
	globalThis.getCurrentTotalBet = getCurrentTotalBet;
	globalThis.getFreeSpinBuyCost = getFreeSpinBuyCost;
	globalThis.ackFreeSpinsStart = ackFreeSpinsStart;
	globalThis.ackFreeSpinsRetrigger = ackFreeSpinsRetrigger;
	globalThis.ackFreeSpinsEnd = ackFreeSpinsEnd;
	globalThis.ackFreeSpinsSignal = ackFreeSpinsSignal;
	globalThis.showBetOption = showBetOption;
	globalThis.hideBetOption = hideBetOption;
	globalThis.getBetOptionTotalBet = getBetOptionTotalBet;
	globalThis.setGuiCredit = setGuiCredit;

	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

function initializeSoundStateAtStartup()
{
	hydrateSoundStateFromGlobals();
	syncGlobalSoundState();
}

function bootstrapFullscreenBackground()
{
	if (ensureFullscreenBackground(FULLSCREEN_BG_PATH))
		return;

	let attempts = 0;
	const maxAttempts = 120;
	const retry = () =>
	{
		if (ensureFullscreenBackground(FULLSCREEN_BG_PATH))
			return;

		attempts++;
		if (attempts < maxAttempts)
			requestAnimationFrame(retry);
	};

	requestAnimationFrame(retry);
}

function ensureFullscreenBackground(imagePath)
{
	if (typeof document === "undefined")
		return false;

	const containerId = "game-fullscreen-bg";
	if (!document.body)
		return false;

	let bg = document.getElementById(containerId);
	if (!bg)
	{
		bg = document.createElement("img");
		bg.id = containerId;
		bg.alt = "";
		bg.loading = "eager";
		bg.decoding = "async";
		bg.setAttribute("aria-hidden", "true");
		document.body.prepend(bg);
	}

	Object.assign(bg.style, {
		position: "fixed",
		inset: "0",
		width: "100vw",
		height: "100vh",
		objectFit: "cover",
		objectPosition: "center",
		pointerEvents: "none",
		userSelect: "none",
		zIndex: "0"
	});

	const allCanvases = document.querySelectorAll("canvas");
	for (const canvas of allCanvases)
	{
		canvas.style.position = canvas.style.position || "relative";
		canvas.style.zIndex = canvas.style.zIndex || "1";
	}

	resolveFullscreenBackgroundPath(bg, imagePath);

	return true;
}

function resolveFullscreenBackgroundPath(bgElement, preferredPath)
{
	if (!bgElement)
		return;

	if (resolvedFullscreenBgPath)
	{
		if (bgElement.getAttribute("src") !== resolvedFullscreenBgPath)
			bgElement.src = resolvedFullscreenBgPath;
		return;
	}

	if (isResolvingFullscreenBgPath)
		return;

	const candidates = [];
	const seen = new Set();
	const addCandidate = pathValue =>
	{
		const path = String(pathValue || "").trim();
		if (!path || seen.has(path))
			return;
		seen.add(path);
		candidates.push(path);
	};

	addCandidate(preferredPath);
	for (const fallbackPath of FULLSCREEN_BG_FALLBACK_PATHS)
		addCandidate(fallbackPath);

	isResolvingFullscreenBgPath = true;
	tryResolveFullscreenBackgroundCandidate(bgElement, candidates, 0);
}

function tryResolveFullscreenBackgroundCandidate(bgElement, candidates, index)
{
	if (!bgElement || !Array.isArray(candidates) || index >= candidates.length)
	{
		isResolvingFullscreenBgPath = false;
		console.warn("Fullscreen background image could not be loaded from known paths.");
		return;
	}

	const candidate = candidates[index];
	let onLoad = null;
	let onError = null;
	const cleanup = () =>
	{
		bgElement.removeEventListener("load", onLoad);
		bgElement.removeEventListener("error", onError);
	};
	onLoad = () =>
	{
		cleanup();
		resolvedFullscreenBgPath = candidate;
		isResolvingFullscreenBgPath = false;
	};
	onError = () =>
	{
		cleanup();
		tryResolveFullscreenBackgroundCandidate(bgElement, candidates, index + 1);
	};

	bgElement.addEventListener("load", onLoad, { once: true });
	bgElement.addEventListener("error", onError, { once: true });
	bgElement.src = candidate;
}

async function OnBeforeProjectStart(runtime)
{
	// Code to run just before 'On start of layout' on
	// the first layout. Loading has finished and initial
	// instances are created and available to use here.
	bootstrapFullscreenBackground();
	ensureBetOptionLayer();
	ensureBottomGuiLayer();
	ensureFreeSpinsPopupLayer();
	ensureAutoSpinPanelLayer();
	ensureTurboPopupLayer();
	ensureInfoPanelLayer();
	ensureSymbolWinBannerLayer();
	ensureTumbleWinBannerLayer();
	updateBetAmountTextObject();

	runtime.addEventListener("tick", () => Tick(runtime));
}

function ensureBottomGuiLayer()
{
	if (typeof document === "undefined" || !document.body)
		return false;

	ensureBottomGuiStyle();

	let layer = document.getElementById(BOTTOM_GUI_ID);
	if (!layer)
	{
		layer = document.createElement("div");
		layer.id = BOTTOM_GUI_ID;
		layer.innerHTML = `
			<div class="bg-main">
				<div class="bg-top-row">
					<div class="bg-spin-cluster">
						<button class="bg-spin-side-btn bg-spin-subbet" type="button" data-action="subbet" aria-label="Sub bet">-</button>
						<button class="bg-spin-btn" type="button" data-action="spin" aria-label="Spin">
							<span class="bg-spin-icon" aria-hidden="true">
								<svg viewBox="0 0 100 100" role="img">
									<path fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" d="M26 56a25 25 0 1 0 13-30"/>
									<path fill="currentColor" d="M32 20L19 42L43 39Z"/>
								</svg>
							</span>
							<span class="bg-spin-fs" aria-hidden="true">
								<span class="bg-spin-fs-label">FreeSpins:</span>
								<span class="bg-spin-fs-count" data-field="freespins-count">0</span>
							</span>
						</button>
						<button class="bg-spin-side-btn bg-spin-addbet" type="button" data-action="addbet" aria-label="Add bet">+</button>
					</div>
				</div>
				<div class="bg-bottom-row">
					<div class="bg-left-btns">
						<button class="bg-menu-btn" type="button" data-action="menu" aria-label="Menu">☰</button>
						<div class="bg-menu-panel" data-role="menu-panel">
							<button class="bg-info-btn" type="button" data-action="info" aria-label="Info">
								<span class="bg-info-icon" aria-hidden="true">i</span>
							</button>
							<button class="bg-sound-btn" type="button" data-action="sound" aria-label="Sound">
								<span class="bg-sound-icon" aria-hidden="true"></span>
							</button>
							<button class="bg-autospin-btn" type="button" data-action="autoplay" aria-label="Autoplay">
								<span class="bg-autospin-icon" aria-hidden="true">
									<svg viewBox="0 0 100 100" role="img">
										<path fill="currentColor" d="M34 26L34 74L72 50Z"/>
									</svg>
								</span>
							</button>
							<button class="bg-turbo-btn" type="button" data-action="turbo" aria-label="Turbo">
								<span class="bg-turbo-icon" aria-hidden="true">
									<svg viewBox="0 0 100 100" role="img">
										<path fill="currentColor" d="M56 8L20 58H44L34 92L80 40H54L56 8Z"/>
									</svg>
								</span>
							</button>
						</div>
					</div>
					<div class="bg-card">
						<div class="bg-label">CREDIT</div>
						<div class="bg-value" data-field="credit">100000.00</div>
					</div>
					<div class="bg-card bg-bet-card" data-action="showbetoption">
						<div class="bg-label">BET</div>
						<div class="bg-value" data-field="bet">1.00</div>
					</div>
					<div class="bg-card">
						<div class="bg-label">WIN</div>
						<div class="bg-value bg-win" data-field="win">0.00</div>
					</div>
				</div>
			</div>
		`;
		document.body.appendChild(layer);
		layer.addEventListener("click", onBottomGuiClick);
	}

	const menuBtn = layer.querySelector(".bg-menu-btn");
	if (menuBtn instanceof HTMLElement && menuBtn.textContent !== "☰")
		menuBtn.textContent = "☰";

	hydrateSoundStateFromGlobals();
	updateBottomGuiView();
	syncGlobalSoundState();
	bottomGuiState.ready = true;
	scheduleBottomGuiAdaptiveScale();
	syncResponsiveModeToC3(true);
	if (typeof window !== "undefined")
	{
		window.addEventListener("resize", scheduleBottomGuiAdaptiveScale);
		window.addEventListener("resize", snapTumbleBannerToTumbleLayer);
	}
	return true;
}

function ensureBottomGuiStyle()
{
	if (typeof document === "undefined")
		return;

	if (document.getElementById(BOTTOM_GUI_STYLE_ID))
		return;

	const style = document.createElement("style");
	style.id = BOTTOM_GUI_STYLE_ID;
	style.textContent = `
		#${BOTTOM_GUI_ID} {
			position: fixed;
			left: 0;
			right: 0;
			bottom: calc(max(${BOTTOM_GUI_SAFE_BOTTOM}px, env(safe-area-inset-bottom)) + 20px);
			transform: none;
			z-index: 25;
			pointer-events: auto;
			width: 100%;
			display: flex;
			justify-content: center;
		}
		#${BOTTOM_GUI_ID}.is-locked {
			pointer-events: none;
		}
		#${BOTTOM_GUI_ID} .bg-main {
			position: relative;
			display: flex;
			gap: 10px;
			align-items: center;
			justify-content: center;
			padding: 0 20px;
			height: 98px;
			overflow: visible;
			border-radius: 12px;
			background: linear-gradient(90deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5));
			font-family: "Arial Black", "Impact", sans-serif;
			width: max-content;
			max-width: none;
			margin: 0 auto;
		}
		#${BOTTOM_GUI_ID} .bg-top-row,
		#${BOTTOM_GUI_ID} .bg-bottom-row {
			display: flex;
			align-items: center;
		}
		#${BOTTOM_GUI_ID} .bg-top-row {
			order: 2;
		}
		#${BOTTOM_GUI_ID} .bg-bottom-row {
			order: 1;
			gap: 10px;
		}
		#${BOTTOM_GUI_ID}.is-compact-portrait .bg-main {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			height: auto;
			padding: 12px 16px;
			gap: 14px;
			background: transparent;
			border: 0;
			box-shadow: none;
		}
		#${BOTTOM_GUI_ID}.is-compact-portrait .bg-top-row,
		#${BOTTOM_GUI_ID}.is-compact-portrait .bg-bottom-row {
			display: flex;
			order: initial;
			width: 100%;
			justify-content: center;
			align-items: center;
		}
		#${BOTTOM_GUI_ID}.is-compact-portrait .bg-bottom-row {
			gap: 8px;
			padding: 8px 12px;
			border-radius: 12px;
			background: linear-gradient(90deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5));
			border: 1px solid rgba(255, 255, 255, 0.12);
			box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
		}
		#${BOTTOM_GUI_ID} .bg-info-btn {
			width: 70px;
			height: 70px;
			border-radius: 8px;
			border: 1px solid #fff;			background: rgba(0, 0, 0, 0.6);
			color: #fff;
			font-size: 26px;
			cursor: pointer;
		}
		#${BOTTOM_GUI_ID} .bg-left-btns {
			display: flex;
			flex-direction: column;
			justify-content: center;
			position: relative;
		}
		#${BOTTOM_GUI_ID} .bg-menu-btn {
			width: 54px;
			height: 54px;
			border-radius: 8px;
			border: 1px solid #fff;
			background: rgba(0, 0, 0, 0.6);
			color: #fff;
			font-size: 26px;
			cursor: pointer;
		}
		#${BOTTOM_GUI_ID} .bg-menu-panel {
			position: absolute;
			left: 50%;
			bottom: calc(100% + 30px);
			transform: translateX(-50%);
			display: none;
			flex-direction: column;
			gap: 10px;
			padding: 10px;
			border-radius: 10px;
			border: 1px solid rgba(255, 255, 255, 0.25);
			background: rgba(0, 0, 0, 0.6);
			z-index: 50;
			pointer-events: auto;
		}
		#${BOTTOM_GUI_ID} .bg-menu-panel.is-open {
			display: flex;
		}
		#${BOTTOM_GUI_ID} .bg-menu-panel .bg-info-icon,
		#${BOTTOM_GUI_ID} .bg-menu-panel .bg-sound-icon,
		#${BOTTOM_GUI_ID} .bg-menu-panel .bg-autospin-icon,
		#${BOTTOM_GUI_ID} .bg-menu-panel .bg-turbo-icon,
		#${BOTTOM_GUI_ID} .bg-menu-panel .bg-autospin-icon svg,
		#${BOTTOM_GUI_ID} .bg-menu-panel .bg-turbo-icon svg {
			pointer-events: none;
		}
		#${BOTTOM_GUI_ID} .bg-sound-btn {
			width: 70px;
			height: 70px;
			border-radius: 8px;
			border: 1px solid #fff;			background: rgba(0, 0, 0, 0.6);
			color: #fff;
			font-size: 26px;
			cursor: pointer;
		}
		#${BOTTOM_GUI_ID} .bg-info-icon {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 38px;
			height: 38px;
			font-size: 46px;
			line-height: 1;
			font-weight: 900;
			color: #fff;
			transform: translateY(-2px);
		}
		#${BOTTOM_GUI_ID} .bg-sound-icon {
			width: 38px;
			height: 38px;
			display: inline-flex;
		}
		#${BOTTOM_GUI_ID} .bg-sound-icon svg {
			width: 100%;
			height: 100%;
			display: block;
			fill: #fff;
		}
		#${BOTTOM_GUI_ID} .bg-card {
			height: ${BOTTOM_GUI_CARD_HEIGHT}px;
			min-width: 150px;
			border-radius: 8px;
			background: rgba(0, 0, 0, 0.8);
			border: 1px solid #fff;
			display: grid;
			grid-template-columns: 1fr;
			grid-template-rows: auto auto;
			row-gap: 3px;
			padding: 5px 10px;
			justify-items: center;
			text-align: center;
		}
		#${BOTTOM_GUI_ID} .bg-bet-card { grid-template-columns: 1fr; }
		#${BOTTOM_GUI_ID} .bg-label {
			font-size: 12px;
			color: #ffc52f;
			letter-spacing: 0.4px;
			line-height: 1;
			align-self: center;
			justify-self: center;
		}
		#${BOTTOM_GUI_ID} .bg-value {
			font-size: 25px;
			line-height: 1;
			color: #fff;
			align-self: center;
			justify-self: center;
		}
		#${BOTTOM_GUI_ID} .bg-bet-card .bg-value {
			color: #d9a300;
		}
		#${BOTTOM_GUI_ID} .bg-win {
			color: #00ff40;
		}
		#${BOTTOM_GUI_ID} .bg-spin-cluster {
			display: flex;
			align-items: center;
			gap: 10px;
		}
		#${BOTTOM_GUI_ID} .bg-spin-btn {
			position: static;
			transform: none;
			width: 138px;
			height: 138px;
			border-radius: 999px;
			border: 4px solid #000;
			background: rgba(255, 255, 255, 0.9);
			color: #1a1a1a;
			font-size: 64px;
			font-weight: 900;
			line-height: 1;
			cursor: pointer;
			box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
			transition: transform 0.14s ease, filter 0.14s ease, box-shadow 0.14s ease;
		}
		#${BOTTOM_GUI_ID} .bg-spin-icon {
			display: inline-flex;
			width: 98px;
			height: 98px;
			align-items: center;
			justify-content: center;
			line-height: 0;
			pointer-events: none;
		}
		#${BOTTOM_GUI_ID} .bg-spin-icon svg {
			width: 100%;
			height: 100%;
			display: block;
		}
		#${BOTTOM_GUI_ID} .bg-spin-fs {
			display: none;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			line-height: 1.1;
			pointer-events: none;
			transform: translateY(-18px);
		}
		#${BOTTOM_GUI_ID} .bg-spin-fs-label {
			font-size: 16px;
			font-weight: 900;
			letter-spacing: 0.6px;
		}
		#${BOTTOM_GUI_ID} .bg-spin-fs-count {
			margin-top: 4px;
			font-size: 40px;
			font-weight: 900;
		}
		#${BOTTOM_GUI_ID} .bg-spin-btn.is-freespin .bg-spin-icon {
			display: none;
		}
		#${BOTTOM_GUI_ID} .bg-spin-btn.is-freespin .bg-spin-fs {
			display: inline-flex;
		}
		#${BOTTOM_GUI_ID} .bg-spin-btn:hover {
			background: rgba(255, 255, 255, 1.0);
			filter: brightness(1.0);
			box-shadow: 0 14px 28px rgba(0, 0, 0, 0.45);
		}
		#${BOTTOM_GUI_ID} .bg-spin-btn:active {
			transform: scale(0.97);
			filter: brightness(0.95);
		}
		#${BOTTOM_GUI_ID} .bg-spin-side-btn {
			position: static;
			width: 54px;
			height: 54px;
			border-radius: 8px;
			border: 1px solid #fff;			
			background: rgba(0, 0, 0, 0.6);
			color: #fff;
			font-size: 36px;
			font-weight: 900;
			cursor: pointer;
			transform: none;
		}
		#${BOTTOM_GUI_ID} .bg-autospin-btn {
			width: 70px;
			height: 70px;
			border-radius: 8px;
			border: 1px solid #fff;			
			background: rgba(0, 0, 0, 0.6);
			color: #fff;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			box-shadow: none;
			transition: transform 0.14s ease, filter 0.14s ease;
		}
		#${BOTTOM_GUI_ID} .bg-autospin-icon {
			width: 36px;
			height: 36px;
			display: inline-flex;
		}
		#${BOTTOM_GUI_ID} .bg-autospin-icon svg {
			width: 100%;
			height: 100%;
			display: block;
		}
		#${BOTTOM_GUI_ID} .bg-autospin-btn:active {
			transform: scale(0.96);
		}
		#${BOTTOM_GUI_ID} .bg-turbo-btn {
			border: 1px solid #fff;
			border-radius: 8px;
			width: 70px;
			height: 70px;
			padding: 0;
			background: rgba(0, 0, 0, 0.6);
			color: #fff;
			cursor: pointer;
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}
		#${BOTTOM_GUI_ID} .bg-turbo-icon {
			width: 36px;
			height: 36px;
			display: inline-flex;
		}
		#${BOTTOM_GUI_ID} .bg-turbo-icon svg {
			width: 100%;
			height: 100%;
			display: block;
		}
		#${BOTTOM_GUI_ID} .bg-info-btn,
		#${BOTTOM_GUI_ID} .bg-sound-btn,
		#${BOTTOM_GUI_ID} .bg-autospin-btn,
		#${BOTTOM_GUI_ID} .bg-turbo-btn,
		#${BOTTOM_GUI_ID} .bg-spin-side-btn {
			background: rgba(0, 0, 0, 0.6);
		}
		#${BOTTOM_GUI_ID} .bg-info-btn:hover,
		#${BOTTOM_GUI_ID} .bg-menu-btn:hover,
		#${BOTTOM_GUI_ID} .bg-sound-btn:hover,
		#${BOTTOM_GUI_ID} .bg-autospin-btn:hover,
		#${BOTTOM_GUI_ID} .bg-turbo-btn:hover,
		#${BOTTOM_GUI_ID} .bg-spin-side-btn:hover {
			background: rgba(0, 0, 0, 0.3);
		}
		#${BOTTOM_GUI_ID} button.is-active {
			background: #5a5a5a;
			color: #fff;
		}
		#${BOTTOM_GUI_ID} .bg-sound-btn.is-active {
			background: rgba(0, 0, 0, 0.6);
			color: #fff;
		}
		#${BOTTOM_GUI_ID} .bg-sound-btn.is-active:hover {
			background: rgba(0, 0, 0, 0.3);
		}
		#${BOTTOM_GUI_ID} .bg-turbo-btn.is-active {
			background: #ffc52f;
			color: #111;
			border-color: #ffc52f;
		}
		#${BOTTOM_GUI_ID} .bg-turbo-btn.is-active:hover {
			background: #ffcf45;
		}
		@media (max-width: ${MOBILE_MAX_WIDTH}px) {
			#${BOTTOM_GUI_ID} .bg-spin-cluster {
				gap: 12px;
			}
			#${BOTTOM_GUI_ID} .bg-spin-btn {
				width: 180px;
				height: 180px;
			}
			#${BOTTOM_GUI_ID} .bg-spin-icon {
				width: 130px;
				height: 130px;
			}
			#${BOTTOM_GUI_ID} .bg-spin-side-btn {
				width: 70px;
				height: 70px;
				font-size: 45px;
			}
		}
	`;
	document.head.appendChild(style);
}

function onBottomGuiClick(event)
{
	if (isBottomGuiInteractionLocked())
		return;

	const target = event.target;
	if (!(target instanceof HTMLElement))
		return;

	const actionElement = target.closest("[data-action]");
	if (!(actionElement instanceof HTMLElement))
		return;

	const action = actionElement.dataset.action;
	if (!action)
		return;

	if (action !== "spin")
		callC3Function("btnTouch");

	if (action === "menu")
	{
		toggleBottomMenuPanel();
		return;
	}
	else if (action === "info")
	{
		showInfoPanel();
		closeBottomMenuPanel();
	}
	else if (action === "spin")
	{
		if (isAutoSpinsRunning || bottomGuiState.autoplayOn)
		{
			stopAutoSpins();
			return;
		}

		if (canPlaySpinFromBottomGui())
			callC3Function("spinTouch");

		void spinSymbols(bottomGuiState.turboOn ? "turbo" : "normal");
	}
	else if (action === "sound")
	{
		bottomGuiState.soundOn = !bottomGuiState.soundOn;
		syncGlobalSoundState();
		closeBottomMenuPanel();
	}
	else if (action === "autoplay")
	{
		if (isAutoSpinsRunning || bottomGuiState.autoplayOn)
		{
			stopAutoSpins();
			hideAutoSpinPanel();
		}
		else
		{
			showAutoSpinPanel();
		}
		closeBottomMenuPanel();
	}
	else if (action === "turbo")
	{
		bottomGuiState.turboOn = !bottomGuiState.turboOn;
		showTurboPopup(bottomGuiState.turboOn ? "TURBO ON" : "TURBO OFF");
		closeBottomMenuPanel();
	}
	else if (action === "subbet")
	{
		showBetOption();
	}
	else if (action === "addbet")
	{
		showBetOption();
	}
	else if (action === "showbetoption")
	{
		showBetOption();
	}

	updateBottomGuiView();
}

function syncGlobalSoundState()
{
	const soundValue = !!bottomGuiState.soundOn;
	globalThis.sound = soundValue;

	// Mirror to Construct global variable when available.
	try
	{
		if (g_runtime && g_runtime.globalVars && Object.prototype.hasOwnProperty.call(g_runtime.globalVars, "sound"))
			g_runtime.globalVars.sound = soundValue;
	}
	catch (_err)
	{
		// Keep UI flow resilient even if runtime global var binding is unavailable.
	}

	return soundValue;
}

function hydrateSoundStateFromGlobals()
{
	try
	{
		if (g_runtime && g_runtime.globalVars && Object.prototype.hasOwnProperty.call(g_runtime.globalVars, "sound"))
		{
			bottomGuiState.soundOn = !!g_runtime.globalVars.sound;
			return bottomGuiState.soundOn;
		}
	}
	catch (_err)
	{
		// Fallback to current local state
	}

	if (typeof globalThis.sound === "boolean")
		bottomGuiState.soundOn = globalThis.sound;

	return bottomGuiState.soundOn;
}

function toggleBottomMenuPanel()
{
	const layer = document.getElementById(BOTTOM_GUI_ID);
	if (!layer)
		return false;

	const panel = layer.querySelector("[data-role='menu-panel']");
	if (!(panel instanceof HTMLElement))
		return false;

	panel.classList.toggle("is-open");
	return true;
}

function closeBottomMenuPanel()
{
	const layer = document.getElementById(BOTTOM_GUI_ID);
	if (!layer)
		return false;

	const panel = layer.querySelector("[data-role='menu-panel']");
	if (!(panel instanceof HTMLElement))
		return false;

	panel.classList.remove("is-open");
	return true;
}

function updateBottomGuiView()
{
	const layer = document.getElementById(BOTTOM_GUI_ID);
	if (!layer)
		return false;

	const creditField = layer.querySelector("[data-field='credit']");
	const betField = layer.querySelector("[data-field='bet']");
	const winField = layer.querySelector("[data-field='win']");
	const soundBtn = layer.querySelector("[data-action='sound']");
	const autoplayBtn = layer.querySelector("[data-action='autoplay']");
	const turboBtn = layer.querySelector("[data-action='turbo']");
	const spinBtn = layer.querySelector("[data-action='spin']");
	const freeSpinsLabelField = layer.querySelector(".bg-spin-fs-label");
	const freeSpinsCountField = layer.querySelector("[data-field='freespins-count']");

	if (creditField)
		creditField.textContent = formatCurrencyGrouped(bottomGuiState.credit);
	if (betField)
		betField.textContent = formatCurrencyGrouped(currentTotalBet);
	if (winField)
		winField.textContent = formatCurrencyGrouped(bottomGuiState.lastWin);
	if (freeSpinsCountField)
	{
		if (isFreeSpinMode && freeSpinsRemaining > 0)
			freeSpinsCountField.textContent = String(Math.max(0, Math.floor(Number(freeSpinsRemaining) || 0)));
		else if (isAutoSpinsRunning)
			freeSpinsCountField.textContent = String(Math.max(0, Math.floor(Number(autoSpinsRemaining) || 0)));
		else
			freeSpinsCountField.textContent = "0";
	}
	if (freeSpinsLabelField instanceof HTMLElement)
	{
		if (isFreeSpinMode && freeSpinsRemaining > 0)
			freeSpinsLabelField.textContent = "FreeSpins:";
		else if (isAutoSpinsRunning)
			freeSpinsLabelField.textContent = "Auto:";
		else
			freeSpinsLabelField.textContent = "FreeSpins:";
	}
	if (spinBtn instanceof HTMLButtonElement)
	{
		const inFreeSpinDisplay = !!(isFreeSpinMode && freeSpinsRemaining > 0);
		const inAutoDisplay = !!isAutoSpinsRunning;
		const showCounterDisplay = inFreeSpinDisplay || inAutoDisplay;
		spinBtn.classList.toggle("is-freespin", showCounterDisplay);
		spinBtn.setAttribute("aria-label", inFreeSpinDisplay ? "Free spins" : (inAutoDisplay ? "Auto spins" : "Spin"));
	}
	if (soundBtn)
	{
		const iconHost = soundBtn.querySelector(".bg-sound-icon");
		if (iconHost)
		{
			iconHost.innerHTML = bottomGuiState.soundOn
				? `<svg viewBox="0 0 24 24" role="img"><path d="M4 9v6h4l5 4V5L8 9H4zm10.5 3c0-1.6-.9-3-2.2-3.7v7.4c1.3-.7 2.2-2.1 2.2-3.7zm2.3 0c0 2.6-1.4 4.8-3.5 6v-2.2c1-.9 1.7-2.2 1.7-3.8s-.7-2.9-1.7-3.8V6c2.1 1.2 3.5 3.4 3.5 6z"/></svg>`
				: `<svg viewBox="0 0 24 24" role="img" aria-label="Sound off">
					<path d="M3 9v6h4l5 4V5L7 9H3z"></path>
					<path d="M15.2 9.4L20 14.2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"></path>
					<path d="M20 9.4L15.2 14.2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"></path>
				</svg>`;
		}
	}
	if (soundBtn)
		soundBtn.classList.toggle("is-active", !!bottomGuiState.soundOn);
	syncGlobalSoundState();
	if (autoplayBtn)
		autoplayBtn.classList.toggle("is-active", !!bottomGuiState.autoplayOn);
	if (turboBtn)
		turboBtn.classList.toggle("is-active", !!bottomGuiState.turboOn);
	updateBottomGuiInteractivity();
	scheduleBottomGuiAdaptiveScale();

	return true;
}

function isBottomGuiInteractionLocked()
{
	return !!(isSpinning || isFreeSpinMode || pendingAutoFreeSpins || isAutoFreeSpinsRunning);
}

function canPlaySpinFromBottomGui()
{
	if (isSpinning || isAutoFreeSpinsRunning || isAutoSpinsRunning || bottomGuiState.autoplayOn)
		return false;

	if (!g_runtime || !createdSymbolInstances.length || !currentGridConfig)
		return false;

	const firstAliveSymbol = createdSymbolInstances.find(inst => isInstanceAlive(inst));
	if (!firstAliveSymbol || !getTweenBehavior(firstAliveSymbol))
		return false;

	const consumesFreeSpin = isFreeSpinMode && freeSpinsRemaining > 0;
	if (!consumesFreeSpin && Number(bottomGuiState.credit) < Number(currentTotalBet))
		return false;

	return true;
}

function updateBottomGuiInteractivity()
{
	const layer = document.getElementById(BOTTOM_GUI_ID);
	if (!(layer instanceof HTMLElement))
		return false;

	const locked = isBottomGuiInteractionLocked();
	layer.classList.toggle("is-locked", locked);
	layer.style.pointerEvents = locked ? "none" : "auto";
	return true;
}

function scheduleBottomGuiAdaptiveScale()
{
	if (typeof requestAnimationFrame !== "function")
		return;

	if (bottomGuiScaleRafId)
		cancelAnimationFrame(bottomGuiScaleRafId);

	bottomGuiScaleRafId = requestAnimationFrame(() =>
	{
		bottomGuiScaleRafId = 0;
		applyBottomGuiAdaptiveScale();
	});
}

function applyBottomGuiAdaptiveScale()
{
	if (typeof window === "undefined")
		return false;

	const layer = document.getElementById(BOTTOM_GUI_ID);
	if (!layer)
		return false;

	const main = layer.querySelector(".bg-main");
	if (!(main instanceof HTMLElement))
		return false;

	const userScale = Math.max(0.5, Math.min(1.5, Number(BOTTOM_GUI_GLOBAL_SCALE) || 1));
	const viewportWidth = window.innerWidth || 0;
	const viewportHeight = window.innerHeight || 0;
	syncResponsiveModeToC3();
	const isCompactPortrait = isCompactPortraitLayout();
	layer.classList.toggle("is-compact-portrait", isCompactPortrait);
	const safePadding = 12;
	const availableWidth = Math.max(0, viewportWidth - (safePadding * 2));
	// Measure unscaled width (offsetWidth is not affected by CSS transform),
	// so scale calculation is stable and does not oscillate while resizing.
	main.style.transform = "none";
	const naturalWidth = main.offsetWidth;
	if (availableWidth <= 0 || naturalWidth <= 0)
		return false;

	// Canvas-like behavior: keep fixed user scale as ceiling, only shrink when needed.
	const fitScale = availableWidth / naturalWidth;
	const finalScale = Math.max(0.5, Math.min(userScale, fitScale, 1));

	layer.style.transform = "none";
	layer.style.zoom = "1";
	main.style.transformOrigin = "center bottom";
	main.style.transform = `scale(${finalScale})`;
	applyWinBannersScale(finalScale);
	applyAutoSpinPanelScale(finalScale);
	return true;
}

function isCompactPortraitLayout()
{
	if (typeof window === "undefined")
		return false;

	const viewportWidth = window.innerWidth || 0;
	const viewportHeight = window.innerHeight || 0;
	return viewportWidth <= TABLET_MAX_WIDTH && viewportHeight > viewportWidth;
}

function getResponsiveMode()
{
	if (!isCompactPortraitLayout())
		return "1row";

	const viewportWidth = (typeof window !== "undefined") ? (window.innerWidth || 0) : 0;
	if (viewportWidth <= MOBILE_MAX_WIDTH)
		return "2rowscale";

	return "2row";
}

function syncResponsiveModeToC3(force = false)
{
	const mode = getResponsiveMode();
	if (!force && mode === lastResponsiveMode)
		return false;

	lastResponsiveMode = mode;
	callC3Function("respoinsive", mode);
	return true;
}

function applyWinBannersScale(scaleValue)
{
	const parsed = Number(scaleValue);
	const safeScale = (Number.isFinite(parsed) && parsed > 0) ? parsed : 1;

	const symbolBanner = document.getElementById(SYMBOL_WIN_BANNER_ID);
	if (symbolBanner instanceof HTMLElement)
	{
		symbolBanner.style.transformOrigin = "center center";
		symbolBanner.style.transform = `translateX(-50%) scale(${safeScale})`;
	}

	const tumbleBanner = document.getElementById(TUMBLE_WIN_BANNER_ID);
	if (tumbleBanner instanceof HTMLElement)
	{
		tumbleBanner.style.transformOrigin = "center center";
		tumbleBanner.style.transform = `translateX(-50%) scale(${safeScale})`;
	}
}

function getFirstTumbleInstance()
{
	const tumbleObject = g_runtime?.objects?.tumble;
	if (!tumbleObject)
		return null;

	const isOnGuiLayer = inst =>
	{
		const layerName = String(inst?.layer?.name || "").toLowerCase();
		return layerName === "gui";
	};

	const aliveGui = [];
	const aliveAny = [];
	const pushCandidate = inst =>
	{
		if (!isInstanceAlive(inst))
			return;
		aliveAny.push(inst);
		if (isOnGuiLayer(inst))
			aliveGui.push(inst);
	};

	if (typeof tumbleObject.getAllInstances === "function")
	{
		const all = tumbleObject.getAllInstances();
		if (Array.isArray(all))
		{
			for (const inst of all)
				pushCandidate(inst);
		}
	}

	if (!aliveAny.length && Array.isArray(tumbleObject.instances))
	{
		for (const inst of tumbleObject.instances)
			pushCandidate(inst);
	}

	if (!aliveAny.length && typeof tumbleObject.getFirstInstance === "function")
		pushCandidate(tumbleObject.getFirstInstance());

	const pickBest = list =>
	{
		if (!list.length)
			return null;
		const guiLayer = (() =>
		{
			try
			{
				if (typeof g_runtime?.layout?.getLayer === "function")
					return g_runtime.layout.getLayer("gui");
			}
			catch (_err) {}
			return null;
		})();

		const layerForCss = guiLayer || list[0]?.layer;
		if (layerForCss && typeof layerForCss.layerToCssPx === "function")
		{
			let best = list[0];
			let bestCssY = -Infinity;
			for (const inst of list)
			{
				try
				{
					const cssPos = layerForCss.layerToCssPx(inst.x, inst.y);
					const cssY = Array.isArray(cssPos) ? Number(cssPos[1]) : NaN;
					if (isFinite(cssY) && cssY > bestCssY)
					{
						best = inst;
						bestCssY = cssY;
					}
				}
				catch (_err) {}
			}
			return best;
		}

		// Fallback: prefer larger layout Y.
		return list.reduce((best, inst) =>
		{
			const yBest = Number(best?.y);
			const yInst = Number(inst?.y);
			if (!isFinite(yBest))
				return inst;
			if (!isFinite(yInst))
				return best;
			return yInst > yBest ? inst : best;
		}, list[0]);
	};

	return pickBest(aliveGui) ?? pickBest(aliveAny);
}

function snapTumbleBannerToTumbleLayer()
{
	if (typeof document === "undefined")
	{
		return false;
	}

	const banner = document.getElementById(TUMBLE_WIN_BANNER_ID);
	if (!(banner instanceof HTMLElement))
	{
		return false;
	}

	const tumbleInst = getFirstTumbleInstance();
	if (!isInstanceAlive(tumbleInst) || !tumbleInst.layer)
	{
		return false;
	}

	let layer = tumbleInst.layer;
	const guiLayerFromLayout = (() =>
	{
		try
		{
			if (typeof g_runtime?.layout?.getLayer === "function")
				return g_runtime.layout.getLayer("gui");
		}
		catch (_err)
		{
			// ignore and fallback
		}
		return null;
	})();
	if (guiLayerFromLayout)
		layer = guiLayerFromLayout;

	const canvas = document.querySelector("canvas");
	if (!(canvas instanceof HTMLCanvasElement))
	{
		return false;
	}

	const rect = canvas.getBoundingClientRect();
	let clientX = NaN;
	let clientY = NaN;
	let usedApi = "";

	if (typeof layer.layerToCssPx === "function")
	{
		const cssPos = layer.layerToCssPx(tumbleInst.x, tumbleInst.y);
		if (Array.isArray(cssPos) && cssPos.length >= 2)
		{
			clientX = cssPos[0];
			clientY = cssPos[1];
			usedApi = "layerToCssPx";
		}
	}
	else if (typeof layer.layerToCanvasX === "function" && typeof layer.layerToCanvasY === "function")
	{
		const canvasX = layer.layerToCanvasX(tumbleInst.x, tumbleInst.y, true);
		const canvasY = layer.layerToCanvasY(tumbleInst.x, tumbleInst.y, true);
		const scaleX = rect.width / (canvas.width || rect.width || 1);
		const scaleY = rect.height / (canvas.height || rect.height || 1);
		clientX = rect.left + (canvasX * scaleX);
		clientY = rect.top + (canvasY * scaleY);
		usedApi = "layerToCanvasXY";
	}
	else if (typeof layer.layerToScreenX === "function" && typeof layer.layerToScreenY === "function")
	{
		clientX = layer.layerToScreenX(tumbleInst.x, tumbleInst.y, true);
		clientY = layer.layerToScreenY(tumbleInst.x, tumbleInst.y, true);
		usedApi = "layerToScreenXY";
	}
	else if (typeof layer.layerToCanvas === "function")
	{
		const canvasX = layer.layerToCanvas(tumbleInst.x, tumbleInst.y, true);
		const canvasY = layer.layerToCanvas(tumbleInst.x, tumbleInst.y, false);
		const scaleX = rect.width / (canvas.width || rect.width || 1);
		const scaleY = rect.height / (canvas.height || rect.height || 1);
		clientX = rect.left + (canvasX * scaleX);
		clientY = rect.top + (canvasY * scaleY);
		usedApi = "layerToCanvas";
	}
	else if (typeof layer.layerToScreen === "function")
	{
		clientX = layer.layerToScreen(tumbleInst.x, tumbleInst.y, true);
		clientY = layer.layerToScreen(tumbleInst.x, tumbleInst.y, false);
		usedApi = "layerToScreen";
	}
	else
	{
		const layoutW = Number(g_runtime?.layout?.width) || 1280;
		const layoutH = Number(g_runtime?.layout?.height) || 720;
		const sx = rect.width / layoutW;
		const sy = rect.height / layoutH;
		const scale = Math.max(sx, sy); // fullscreen scale-outer
		const viewW = rect.width / scale;
		const viewH = rect.height / scale;
		const scrollX = Number(g_runtime?.layout?.scrollX);
		const scrollY = Number(g_runtime?.layout?.scrollY);
		const safeScrollX = isFinite(scrollX) ? scrollX : (layoutW * 0.5);
		const safeScrollY = isFinite(scrollY) ? scrollY : (layoutH * 0.5);
		const viewLeft = safeScrollX - (viewW * 0.5);
		const viewTop = safeScrollY - (viewH * 0.5);

		clientX = rect.left + ((Number(tumbleInst.x) - viewLeft) * scale);
		clientY = rect.top + ((Number(tumbleInst.y) - viewTop) * scale);
		usedApi = "scaleOuterFallback";
	}

	if (!isFinite(clientX) || !isFinite(clientY))
	{
		return false;
	}

	const now = Date.now();
	if (now - tumbleSnapDebugLastLogTs >= 250)
	{
		tumbleSnapDebugLastLogTs = now;
	}

	banner.style.left = `${Math.round(clientX)}px`;
	banner.style.top = `${Math.round(clientY)}px`;
	banner.style.bottom = "auto";
	return true;
}

function setGuiCredit(value)
{
	const parsed = Number(value);
	if (!Number.isFinite(parsed))
		return false;

	bottomGuiState.credit = Math.max(0, parsed);
	updateBottomGuiView();
	return true;
}

function applyGuiCreditDelta(delta)
{
	const parsed = Number(delta);
	if (!Number.isFinite(parsed) || parsed === 0)
		return bottomGuiState.credit;

	bottomGuiState.credit = Math.max(0, Number((bottomGuiState.credit + parsed).toFixed(2)));
	updateBottomGuiView();
	return bottomGuiState.credit;
}

function ensureBetOptionLayer()
{
	if (typeof document === "undefined" || !document.body)
		return false;

	ensureBetOptionStyle();

	let layer = document.getElementById(BET_OPTION_ID);
	if (!layer)
	{
		layer = document.createElement("div");
		layer.id = BET_OPTION_ID;
		layer.innerHTML = `
			<div class="bo-panel">
				<button class="bo-close" data-role="close" type="button" aria-label="Close">x</button>
				<div class="bo-title">BET MULTIPLIER ${BET_OPTION_MULTIPLIER}x</div>
				<div class="bo-row-title">LEVEL</div>
				<div class="bo-row bo-editable" data-target="bet">
					<button class="bo-btn bo-minus" type="button" data-target="bet" data-delta="-1">-</button>
					<div class="bo-value" data-field="bet">1</div>
					<button class="bo-btn bo-plus" type="button" data-target="bet" data-delta="1">+</button>
				</div>
				<div class="bo-row-title">SIZE</div>
				<div class="bo-row bo-editable" data-target="coin">
					<button class="bo-btn bo-minus" type="button" data-target="coin" data-delta="-1">-</button>
					<div class="bo-value" data-field="coin">0.01</div>
					<button class="bo-btn bo-plus" type="button" data-target="coin" data-delta="1">+</button>
				</div>
				<div class="bo-row-title">TOTAL BET</div>
				<div class="bo-row">
					<div class="bo-spacer"></div>
					<div class="bo-value" data-field="total">0.20</div>
					<div class="bo-spacer"></div>
				</div>
				<button class="bo-max-btn" data-role="maxbet" type="button">BET MAX</button>
			</div>
		`;
		document.body.appendChild(layer);
		layer.addEventListener("click", onBetOptionLayerClick);
	}

	updateBetOptionView();
	hideBetOption();
	betOptionState.ready = true;
	return true;
}

function ensureBetOptionStyle()
{
	if (typeof document === "undefined")
		return;

	if (document.getElementById(BET_OPTION_STYLE_ID))
		return;

	const style = document.createElement("style");
	style.id = BET_OPTION_STYLE_ID;
	style.textContent = `
		#${BET_OPTION_ID} {
			position: fixed;
			inset: 0;
			display: none;
			align-items: center;
			justify-content: center;
			background: rgba(0, 0, 0, 0.6);
			z-index: 30;
			pointer-events: auto;
			font-family: "Arial Black", "Impact", sans-serif;
		}
		#${BET_OPTION_ID}.is-visible {
			display: flex;
		}
		#${BET_OPTION_ID} .bo-panel {
			width: min(88vw, 340px);
			padding: 20px 18px 22px;
			border-radius: 12px;
			background: rgba(0, 0, 0, 0.9);
			border: 2px solid rgba(255, 255, 255, 0.08);
			color: #fff;
			box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
			position: relative;
		}
		#${BET_OPTION_ID} .bo-title {
			text-align: center;
			font-size: 20px;
			line-height: 1;
			color: #ffc52f;
			margin-bottom: 14px;
		}
		#${BET_OPTION_ID} .bo-close {
			position: absolute;
			top: 10px;
			right: 12px;
			width: 36px;
			height: 36px;
			border-radius: 8px;
			border: 0;
			background: rgba(255, 255, 255, 0.08);
			color: #d3d3d3;
			font-size: 22px;
			cursor: pointer;
		}
		#${BET_OPTION_ID} .bo-row-title {
			text-align: center;
			font-size: 15px;
			letter-spacing: 0.5px;
			margin: 10px 0 7px;
		}
		#${BET_OPTION_ID} .bo-row {
			display: grid;
			grid-template-columns: 56px 1fr 56px;
			align-items: center;
			gap: 12px;
		}
		#${BET_OPTION_ID} .bo-btn {
			width: 56px;
			height: 56px;
			border: 0;
			border-radius: 10px;
			font-size: 42px;
			line-height: 1;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0;
			transition: filter 0.15s ease, opacity 0.15s ease;
		}
		#${BET_OPTION_ID} .bo-minus {
			background: #f1f1f1;
			color: #111;
			font-size: 50px;
			transform: translateY(-2px);
		}
		#${BET_OPTION_ID} .bo-plus {
			background: #ffc52f;
			color: #fff;
		}
		#${BET_OPTION_ID} .bo-btn:disabled {
			background: #5b5b5b;
			color: #242424;
			cursor: not-allowed;
			opacity: 0.9;
			filter: grayscale(0.35);
		}
		#${BET_OPTION_ID} .bo-value {
			height: 48px;
			border-radius: 10px;
			border: 2px solid rgba(255, 255, 255, 0.14);
			background: #1a1c21;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 36px;
			line-height: 1;
		}
		#${BET_OPTION_ID} .bo-spacer {
			width: 56px;
			height: 56px;
		}
		#${BET_OPTION_ID} .bo-max-btn {
			margin: 18px auto 0;
			display: block;
			width: 170px;
			height: 56px;
			border: 0;
			border-radius: 8px;
			background: #ffc52f;
			color: #fff;
			font-size: 20px;
			line-height: 1;
			cursor: pointer;
			font-family: inherit;
		}
		#${BET_OPTION_ID} .bo-max-btn:active {
			filter: brightness(0.95);
		}
		@media (max-width: 480px) {
			#${BET_OPTION_ID} .bo-title { font-size: 24px; }
			#${BET_OPTION_ID} .bo-value { font-size: 20px; }
			#${BET_OPTION_ID} .bo-btn { font-size: 38px; }
			#${BET_OPTION_ID} .bo-max-btn { font-size: 26px; }
		}
	`;
	document.head.appendChild(style);
}

function onBetOptionLayerClick(event)
{
	const target = event.target;
	if (!(target instanceof HTMLElement))
		return;

	const clickedButton = target.closest("button");
	if (clickedButton instanceof HTMLButtonElement)
		callC3Function("btnTouch");

	// Close when clicking outside the bet-option panel.
	const panel = target.closest(".bo-panel");
	if (!panel)
	{
		hideBetOption();
		return;
	}

	if (target.dataset.role === "close")
	{
		hideBetOption();
		return;
	}
	if (target.dataset.role === "maxbet")
	{
		betOptionState.betIndex = BET_OPTION_BET_VALUES.length - 1;
		betOptionState.coinIndex = BET_OPTION_COIN_VALUES.length - 1;
		updateBetOptionView();
		return;
	}

	const delta = Number(target.dataset.delta);
	const key = target.dataset.target;
	if (!Number.isFinite(delta) || !key)
		return;

	if (key === "bet")
		betOptionState.betIndex = clampIndex(betOptionState.betIndex + delta, BET_OPTION_BET_VALUES.length);
	else if (key === "coin")
		betOptionState.coinIndex = clampIndex(betOptionState.coinIndex + delta, BET_OPTION_COIN_VALUES.length);
	else
		return;

	updateBetOptionView();
}

function clampIndex(value, length)
{
	if (length <= 0)
		return 0;
	return Math.min(length - 1, Math.max(0, value));
}

function updateBetOptionView()
{
	const layer = document.getElementById(BET_OPTION_ID);
	if (!layer)
		return;

	const bet = BET_OPTION_BET_VALUES[betOptionState.betIndex] ?? BET_OPTION_BET_VALUES[0];
	const coin = BET_OPTION_COIN_VALUES[betOptionState.coinIndex] ?? BET_OPTION_COIN_VALUES[0];
	const total = BET_OPTION_MULTIPLIER * bet * coin;

	const betField = layer.querySelector("[data-field='bet']");
	const coinField = layer.querySelector("[data-field='coin']");
	const totalField = layer.querySelector("[data-field='total']");
	const betMinusBtn = layer.querySelector("[data-target='bet'][data-delta='-1']");
	const betPlusBtn = layer.querySelector("[data-target='bet'][data-delta='1']");
	const coinMinusBtn = layer.querySelector("[data-target='coin'][data-delta='-1']");
	const coinPlusBtn = layer.querySelector("[data-target='coin'][data-delta='1']");

	if (betField)
		betField.textContent = String(bet);
	if (coinField)
		coinField.textContent = formatCurrency(coin);
	if (totalField)
		totalField.textContent = formatCurrency(total);
	if (betMinusBtn)
		betMinusBtn.disabled = betOptionState.betIndex <= 0;
	if (betPlusBtn)
		betPlusBtn.disabled = betOptionState.betIndex >= BET_OPTION_BET_VALUES.length - 1;
	if (coinMinusBtn)
		coinMinusBtn.disabled = betOptionState.coinIndex <= 0;
	if (coinPlusBtn)
		coinPlusBtn.disabled = betOptionState.coinIndex >= BET_OPTION_COIN_VALUES.length - 1;

	setCurrentTotalBet(total);
}

function formatCurrency(value)
{
	const n = Number(value);
	if (!Number.isFinite(n))
		return "0.00";
	return n.toFixed(2);
}

function formatCurrencyGrouped(value)
{
	const n = Number(value);
	if (!Number.isFinite(n))
		return "0.00";

	return n.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
}

function showBetOption()
{
	if (!betOptionState.ready)
		ensureBetOptionLayer();

	const layer = document.getElementById(BET_OPTION_ID);
	if (!layer)
		return false;

	updateBetOptionView();
	layer.classList.add("is-visible");
	return true;
}

function hideBetOption()
{
	const layer = document.getElementById(BET_OPTION_ID);
	if (!layer)
		return false;

	layer.classList.remove("is-visible");
	return true;
}

function getBetOptionTotalBet()
{
	const bet = BET_OPTION_BET_VALUES[betOptionState.betIndex] ?? BET_OPTION_BET_VALUES[0];
	const coin = BET_OPTION_COIN_VALUES[betOptionState.coinIndex] ?? BET_OPTION_COIN_VALUES[0];
	return BET_OPTION_MULTIPLIER * bet * coin;
}

function Tick(runtime)
{
	// Code to run every tick
	syncAllMultiplierPositions();
	const tumbleBanner = document.getElementById(TUMBLE_WIN_BANNER_ID);
	if (tumbleBanner instanceof HTMLElement && tumbleBanner.classList.contains("is-visible"))
		snapTumbleBannerToTumbleLayer();
}

function createSymbolsGrid(rows, cols, spacingX, spacingY, startX, startY)
{
	if (!g_runtime)
	{
		console.warn("Runtime is not ready yet.");
		return;
	}

	const parsedRows = Math.max(0, Math.floor(Number(rows)));
	const parsedCols = Math.max(0, Math.floor(Number(cols)));
	const parsedSpacingX = Number(spacingX);
	const parsedSpacingY = Number(spacingY);
	const parsedStartX = Number(startX);
	const parsedStartY = Number(startY);

	if (!Number.isFinite(parsedRows) || !Number.isFinite(parsedCols))
	{
		console.warn("createSymbolsGrid: rows/cols must be valid numbers.");
		return;
	}

	if (!Number.isFinite(parsedSpacingX) || !Number.isFinite(parsedSpacingY))
	{
		console.warn("createSymbolsGrid: spacingX/spacingY must be valid numbers.");
		return;
	}

	if (!Number.isFinite(parsedStartX) || !Number.isFinite(parsedStartY))
	{
		console.warn("createSymbolsGrid: startX/startY must be valid numbers.");
		return;
	}

	const symbolsObject = g_runtime.objects.symbols;
	if (!symbolsObject)
	{
		console.warn("Object 'symbols' was not found.");
		return;
	}
	const availableAnimations = getAvailableSymbolAnimations(symbolsObject);
	if (!availableAnimations.length)
	{
		console.warn("No matching symbol animations were found on object 'symbols'.");
		return;
	}

	const mainLayer = SYMBOLS_LAYER_NAME;
	const gridColumns = Array.from({ length: parsedCols }, () => []);

	clearCreatedGridInstances();
	activeMultiplierCap = chooseMultiplierCap();

	if (DEMO_WIN)
		initDemoSession(parsedRows * parsedCols, 8);

	for (let row = 0; row < parsedRows; row++)
	{
		for (let col = 0; col < parsedCols; col++)
		{
			const x = parsedStartX + col * parsedSpacingX;
			const y = parsedStartY + row * parsedSpacingY;
			const symbolInstance = symbolsObject.createInstance(mainLayer, x, y);
			createdSymbolInstances.push(symbolInstance);
			gridColumns[col].push(symbolInstance);

			assignRandomAnimationToSymbol(symbolInstance, availableAnimations);
		}
	}

	currentGridConfig = {
		rows: parsedRows,
		cols: parsedCols,
		spacingX: parsedSpacingX,
		spacingY: parsedSpacingY,
		startX: parsedStartX,
		startY: parsedStartY,
		columns: gridColumns
	};
}

function clearCreatedGridInstances()
{
	spinToken++;
	isSpinning = false;

	for (const instance of createdSymbolInstances)
	{
		if (!instance.isDestroyed)
			instance.destroy();
	}
	createdSymbolInstances.length = 0;

	for (const instance of createdMultiplierTextInstances)
	{
		if (!instance.isDestroyed)
			instance.destroy();
	}
	createdMultiplierTextInstances.length = 0;
	symbolMultiplierMap.clear();
	symbolMultiplierValueMap.clear();
	symbolAnimationMap.clear();
	currentGridConfig = null;
}

function isMultiplierAnimation(animationName)
{
	return MULTIPLIER_SYMBOL_ANIMATIONS.includes(animationName);
}

function getAvailableSymbolAnimations(symbolsObject)
{
	return ALL_SYMBOL_ANIMATIONS.filter(name => !!symbolsObject.getAnimation(name));
}

function pickRandom(arr)
{
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max)
{
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizeWinRate(rateValue)
{
	const raw = Number(rateValue);
	if (!Number.isFinite(raw) || raw <= 0)
		return 0;

	// Accept both [0..1] and [0..100] inputs.
	const normalized = raw > 1 ? (raw / 100) : raw;
	return Math.max(0, Math.min(1, normalized));
}

function pickWeightedMultiplier()
{
	const totalWeight = MULTIPLIER_WEIGHTS.reduce((sum, w) => sum + w, 0);
	let roll = randomInt(1, totalWeight);

	for (let i = 0; i < ALLOWED_MULTIPLIERS.length; i++)
	{
		roll -= MULTIPLIER_WEIGHTS[i];
		if (roll <= 0)
			return ALLOWED_MULTIPLIERS[i];
	}

	return ALLOWED_MULTIPLIERS[0];
}

async function spinSymbols(mode = "normal", isAutoTrigger = false)
{
	if (isAutoFreeSpinsRunning && !isAutoTrigger)
		return;

	if (isSpinning)
		return;

	if (!g_runtime || !createdSymbolInstances.length || !currentGridConfig)
	{
		console.warn("spinSymbols: no symbols grid to spin. Call createSymbolsGrid first.");
		return;
	}
	if (!getTweenBehavior(createdSymbolInstances[0]))
	{
		console.warn("spinSymbols: object 'symbols' must have Tween behavior.");
		return;
	}

	const spinProfile = resolveSpinProfile(mode);
	const modeText = String(mode || "").toLowerCase().trim();
	const isTurboSpin = modeText === "turbo" || modeText === "true" || modeText === "1";
	const currentSpinToken = ++spinToken;
	isSpinning = true;
	updateBottomGuiInteractivity();
	const consumedFreeSpin = isFreeSpinMode && freeSpinsRemaining > 0;
	const isPaidSpin = !consumedFreeSpin;
		if (isPaidSpin)
		{
			if (bottomGuiState.credit < currentTotalBet)
			{
				isSpinning = false;
				updateBottomGuiInteractivity();
				return;
			}

		applyGuiCreditDelta(-currentTotalBet);
	}
	if (consumedFreeSpin)
	{
		freeSpinsRemaining--;
	}

	hideTumbleWinBanner();
	bottomGuiState.lastWin = 0;
	updateBottomGuiView();

	currentSpinStats = {
		multiplierValuesAppeared: [],
		startMultiplierSymbolUids: captureMultiplierSymbolUidSet(),
		seenMultiplierSymbolUids: captureMultiplierSymbolUidSet(),
		startMultiplierValuesByUid: captureVisibleMultiplierValueMap(),
		multiplierAppearedInSpin: false
	};
	activeMultiplierCap = chooseMultiplierCap();
	cleanupInvalidMultiplierLinks();

	try
	{
		const normalWinRate = normalizeWinRate(WIN_CHANCE);
		const freeSpinWinRate = normalizeWinRate(WIN_FREESPINS);
		const allowNormalWinThisSpin = Math.random() < normalWinRate;
		const allowFreeSpinTriggerThisSpin = !consumedFreeSpin && (Math.random() < freeSpinWinRate);
		const isBoughtFreeSpinsTriggerSpin = pendingBoughtFreeSpinsTrigger;
		let forceStartFromBoughtSpin = false;

		// Decide scatter-forcing before roll starts so symbols are assigned while moving,
		// avoiding any post-drop animation swap.
		if (isBoughtFreeSpinsTriggerSpin)
		{
			pendingBoughtFreeSpinsTrigger = false;
			forcedScatterAssignmentsRemaining = Math.max(
				FREE_SPINS_TRIGGER_SCATTERS,
				Math.min(pickBoughtFreeSpinsScatterCount(), SCATTER_MAX_ON_SCREEN_NORMAL - 1)
			);
			forceStartFromBoughtSpin = true;
		}
		else if (allowFreeSpinTriggerThisSpin)
		{
			forcedScatterAssignmentsRemaining = Math.max(0, FREE_SPINS_TRIGGER_SCATTERS);
		}

		let turboDropCallDone = false;
		const onColumnDropComplete = () =>
		{
			if (isTurboSpin)
			{
				if (turboDropCallDone)
					return;
				turboDropCallDone = true;
				callC3Function("symbolDrop");
				return;
			}

			callC3Function("symbolDrop");
		};

		for (let i = 0; i < spinProfile.cycles; i++)
		{
			if (currentSpinToken !== spinToken)
				return;
			await runOneRollStep(currentSpinToken, spinProfile, { onColumnDropComplete });
		}

		if (currentSpinToken !== spinToken)
			return;

		currentSpinAllowsFreeSpinTrigger = forceStartFromBoughtSpin || allowFreeSpinTriggerThisSpin;

		const spinResult = await runWinCascadeLoop(
			spinProfile,
			currentSpinToken,
			{
				skipEnsureWinningBoard: isBoughtFreeSpinsTriggerSpin,
				allowNormalWinThisSpin,
				forceGuaranteedNormalWin: normalWinRate >= 1 && !currentSpinAllowsFreeSpinTrigger,
				allowScatterWinThisSpin: consumedFreeSpin || currentSpinAllowsFreeSpinTrigger || forceStartFromBoughtSpin
			}
		);
		const resolvedWin = (spinResult && typeof spinResult.totalWin === "number" && isFinite(spinResult.totalWin))
			? spinResult.totalWin
			: 0;
		bottomGuiState.lastWin = resolvedWin;
		updateBottomGuiView();
		if (resolvedWin > 0)
			applyGuiCreditDelta(resolvedWin);
		if (consumedFreeSpin)
		{
			const currentTotalMultiplier = freeSpinTotalMultiplier > 0 ? freeSpinTotalMultiplier : 1;
		}
		if (consumedFreeSpin && spinResult && typeof spinResult.totalWin === "number" && isFinite(spinResult.totalWin))
			freeSpinsSessionTotalWin += spinResult.totalWin;
		await processFreeSpinAfterSpin(spinResult, consumedFreeSpin, {
			forceStartFromBoughtSpin,
			allowFreeSpinTriggerThisSpin: currentSpinAllowsFreeSpinTrigger
		});
		return spinResult;
	}
	finally
	{
		forcedScatterAssignmentsRemaining = 0;
		currentSpinAllowsFreeSpinTrigger = false;
		currentSpinStats = null;
		if (currentSpinToken === spinToken)
			isSpinning = false;
		updateBottomGuiInteractivity();

		if (pendingAutoFreeSpins && !isAutoFreeSpinsRunning && isFreeSpinMode && freeSpinsRemaining > 0)
		{
			pendingAutoFreeSpins = false;
			void (async () =>
			{
				await delay(FREE_SPINS_START_ACK_TO_AUTO_DELAY_SECONDS * 1000);
				if (!isAutoFreeSpinsRunning && isFreeSpinMode && freeSpinsRemaining > 0)
					await runAutoFreeSpins(mode);
			})();
		}
	}
}

async function checkWinsAndCascade(mode = "normal")
{
	if (isSpinning)
		return;

	if (!g_runtime || !createdSymbolInstances.length || !currentGridConfig)
	{
		return;
	}

	const spinProfile = resolveSpinProfile(mode);
	const currentSpinToken = ++spinToken;
	isSpinning = true;
	updateBottomGuiInteractivity();
	currentSpinStats = {
		multiplierValuesAppeared: [],
		startMultiplierSymbolUids: captureMultiplierSymbolUidSet(),
		seenMultiplierSymbolUids: captureMultiplierSymbolUidSet(),
		startMultiplierValuesByUid: captureVisibleMultiplierValueMap(),
		multiplierAppearedInSpin: false
	};
	activeMultiplierCap = chooseMultiplierCap();
	cleanupInvalidMultiplierLinks();

	try
	{
		return await runWinCascadeLoop(spinProfile, currentSpinToken);
	}
	finally
	{
		currentSpinStats = null;
		if (currentSpinToken === spinToken)
			isSpinning = false;
		updateBottomGuiInteractivity();
	}
}

function resolveSpinProfile(mode)
{
	const modeText = String(mode).toLowerCase().trim();
	if (modeText === "turbo" || modeText === "true" || modeText === "1")
	{
		return {
			cycles: 1,
			moveTimeSeconds: 0.15,
			columnStaggerSeconds: 0,
			ease: "linear",
			cascadeDropTimeSeconds: DROP_DELAY_SECONDS,
			cascadePauseSeconds: 0.02
		};
	}

	return {
		cycles: 1,
		moveTimeSeconds: 0.2,
		columnStaggerSeconds: 0.035,
		ease: "in-out-sine",
		cascadeDropTimeSeconds: DROP_DELAY_SECONDS,
		cascadePauseSeconds: 0.05
	};
}

async function runOneRollStep(spinStateToken, spinProfile, options = {})
{
	const columnJobs = [];
	for (let col = 0; col < currentGridConfig.cols; col++)
	{
		const job = rollOneColumnStep(col, spinStateToken, spinProfile, options);
		columnJobs.push(job);
	}

	await Promise.all(columnJobs);
}

async function runWinCascadeLoop(spinProfile, spinStateToken, options = {})
{
	let baseTotalWin = 0;
	let scatterWin = 0;
	let cascadeCount = 0;
	let tumbleMultiplierGain = 0;
	const seenMultiplierUidsInTumble = isFreeSpinMode ? new Set() : null;
	const allowWinThisRound = options.allowNormalWinThisSpin !== undefined
		? !!options.allowNormalWinThisSpin
		: (Math.random() < normalizeWinRate(WIN_CHANCE));
	const allowScatterWinThisRound = options.allowScatterWinThisSpin !== undefined
		? !!options.allowScatterWinThisSpin
		: true;
	const forceGuaranteedNormalWin = !!options.forceGuaranteedNormalWin;

	if (!allowWinThisRound)
	{
		scatterWin = allowScatterWinThisRound ? calculateScatterWinOnScreen() : 0;
		if (scatterWin > 0)
		{
			void showSymbolWinBanner("Scatter", countSymbolsOnScreen("Scatter"), scatterWin);
			triggerSymbolWinFunction("Scatter", scatterWin);
		}
		const currentTotalMultiplier = (isFreeSpinMode && freeSpinTotalMultiplier > 0) ? freeSpinTotalMultiplier : 1;
		triggerTumbleEndFunction(0, currentTotalMultiplier, scatterWin);
		return {
			totalWin: scatterWin,
			cascadeCount: 0,
			finalMultiplier: currentTotalMultiplier,
			baseTotalWin: 0
		};
	}

	if (allowWinThisRound || forceGuaranteedNormalWin)
		ensureWinningBoardIfNeeded();

	if (seenMultiplierUidsInTumble)
		tumbleMultiplierGain += collectNewVisibleMultiplierGain(seenMultiplierUidsInTumble);

	while (spinStateToken === spinToken)
	{
		const winResult = evaluateWins();
		if (!winResult.hasWin)
			break;

		cascadeCount++;
		baseTotalWin += winResult.winAmount;

		for (const event of winResult.winEvents)
		{
			void showSymbolWinBanner(event.symbolName, event.symbolCount, event.winAmount);
			triggerSymbolWinFunction(event.symbolName, event.winAmount);
		}

		await delay(WIN_DESTROY_DELAY_SECONDS * 1000);
		if (spinStateToken !== spinToken)
			break;

		destroyWinningSymbols(winResult.winningInstances);

		if (spinStateToken !== spinToken)
			break;

		await collapseAndRefillGrid(spinProfile, spinStateToken);
		if (spinStateToken !== spinToken)
			break;

		callC3Function("symbolDrop");

		if (seenMultiplierUidsInTumble)
			tumbleMultiplierGain += collectNewVisibleMultiplierGain(seenMultiplierUidsInTumble);

		await delay(spinProfile.cascadePauseSeconds * 1000);
	}

	let finalMultiplier = 1;
	let tumbleAppliedMultiplier = 1;
	let totalWin = 0;
	scatterWin = allowScatterWinThisRound ? calculateScatterWinOnScreen() : 0;
	const spinHasAnyWin = (baseTotalWin + scatterWin) > 0;

	if (isFreeSpinMode && spinHasAnyWin)
	{
		const spinMultiplierGain = tumbleMultiplierGain;
		const beforeTotalMultiplier = freeSpinTotalMultiplier > 0 ? freeSpinTotalMultiplier : 0;
		if (spinMultiplierGain > 0)
			freeSpinTotalMultiplier += spinMultiplierGain;
	}

	if (isFreeSpinMode && freeSpinTotalMultiplier > 0)
	{
		// Even on non-winning free spins, UI callback should display
		// the current accumulated total multiplier.
		tumbleAppliedMultiplier = freeSpinTotalMultiplier;
		finalMultiplier = freeSpinTotalMultiplier;
	}
	if (scatterWin > 0)
	{
		void showSymbolWinBanner("Scatter", countSymbolsOnScreen("Scatter"), scatterWin);
		triggerSymbolWinFunction("Scatter", scatterWin);
	}

	if (baseTotalWin > 0)
	{
		if (isFreeSpinMode)
		{
			// In Free Spins, always multiply by accumulated total multiplier.
			const accumulatedTotalMultiplier = freeSpinTotalMultiplier > 0 ? freeSpinTotalMultiplier : 1;
			tumbleAppliedMultiplier = accumulatedTotalMultiplier;
		}
		else
		{
			const summedMultiplier = getScreenMultiplierSum();
			tumbleAppliedMultiplier = summedMultiplier > 0 ? summedMultiplier : 1;
		}

		finalMultiplier = tumbleAppliedMultiplier;
		totalWin = (baseTotalWin * tumbleAppliedMultiplier) + scatterWin;
	}
	else
	{
		totalWin = scatterWin;
	}
	triggerTumbleEndFunction(baseTotalWin, tumbleAppliedMultiplier, totalWin);

	return {
		totalWin,
		cascadeCount,
		finalMultiplier,
		baseTotalWin
	};
}

function ensureWinningBoardIfNeeded()
{
	const current = evaluateWins();
	if (current.hasWin)
		return;

	const allSymbols = [];
	for (const column of currentGridConfig?.columns ?? [])
	{
		for (const symbolInstance of column)
		{
			if (isInstanceAlive(symbolInstance))
				allSymbols.push(symbolInstance);
		}
	}

	if (allSymbols.length < MIN_MATCH_TO_WIN)
		return;

	const symbolsObject = g_runtime?.objects?.symbols;
	if (!symbolsObject)
		return;

	const payableAnimations = Object.keys(PAYOUT_TABLE).filter(name =>
		!isMultiplierAnimation(name) && name !== "Scatter" && !!symbolsObject.getAnimation(name)
	);
	if (!payableAnimations.length)
		return;

	shuffleInPlace(allSymbols);
	const forcedAnimation = pickRandom(payableAnimations);
	for (let i = 0; i < MIN_MATCH_TO_WIN; i++)
	{
		const inst = allSymbols[i];
		const previousAnimationName = getCurrentAnimationName(inst);
		inst.setAnimation(forcedAnimation, "beginning");
		symbolAnimationMap.set(inst.uid, forcedAnimation);
		syncMultiplierForSymbol(inst, forcedAnimation, previousAnimationName);
	}
}

function evaluateWins()
{
	const symbolBuckets = new Map();

	for (const column of currentGridConfig.columns)
	{
		for (const symbolInstance of column)
		{
			if (!symbolInstance || symbolInstance.isDestroyed)
				continue;

			const animationName = getCurrentAnimationName(symbolInstance);

			// Multiplier and Scatter are handled outside normal tumble wins.
			if (isMultiplierAnimation(animationName))
				continue;
			if (animationName === "Scatter")
				continue;

			if (!PAYOUT_TABLE[animationName])
				continue;

			if (!symbolBuckets.has(animationName))
				symbolBuckets.set(animationName, []);
			symbolBuckets.get(animationName).push(symbolInstance);
		}
	}

	const winningInstances = new Set();
	let winAmount = 0;
	const winEvents = [];

	for (const [animationName, instances] of symbolBuckets.entries())
	{
		const payoutMultiplier = getPayoutMultiplier(animationName, instances.length);
		if (payoutMultiplier <= 0)
			continue;

		for (const inst of instances)
			winningInstances.add(inst);

		const symbolWinAmount = payoutMultiplier * currentTotalBet;
		winAmount += symbolWinAmount;
		winEvents.push({
			symbolName: animationName,
			symbolCount: instances.length,
			winAmount: symbolWinAmount
		});
	}

	return {
		hasWin: winningInstances.size > 0,
		winningInstances,
		winAmount,
		winEvents
	};
}
function getPayoutMultiplier(animationName, count)
{
	const payoutBands = PAYOUT_TABLE[animationName];
	if (!payoutBands)
		return 0;

	for (const band of payoutBands)
	{
		if (count >= band.min && count <= band.max)
			return band.payout;
	}

	return 0;
}

function calculateScatterWinOnScreen()
{
	const scatterCount = countSymbolsOnScreen("Scatter");
	const scatterPayoutMultiplier = getPayoutMultiplier("Scatter", scatterCount);
	if (scatterPayoutMultiplier <= 0)
		return 0;
	return scatterPayoutMultiplier * currentTotalBet;
}

function destroyWinningSymbols(winningInstances)
{
	for (const symbolInstance of winningInstances)
	{
		if (!isInstanceAlive(symbolInstance))
			continue;

		// Scatter stays on screen and is not destroyed in tumble.
		if (getCurrentAnimationName(symbolInstance) === "Scatter")
			continue;

		destroyMultiplierForSymbol(symbolInstance.uid);
		symbolAnimationMap.delete(symbolInstance.uid);
		symbolInstance.destroy();
	}

	for (let i = createdSymbolInstances.length - 1; i >= 0; i--)
	{
		if (!isInstanceAlive(createdSymbolInstances[i]))
			createdSymbolInstances.splice(i, 1);
	}

	for (let col = 0; col < currentGridConfig.cols; col++)
	{
		currentGridConfig.columns[col] = currentGridConfig.columns[col].filter(inst => isInstanceAlive(inst));
	}
}
async function collapseAndRefillGrid(spinProfile, spinStateToken)
{
	const symbolsObject = g_runtime.objects.symbols;
	if (!symbolsObject)
		return;

	const availableAnimations = getAvailableSymbolAnimations(symbolsObject);
	if (!availableAnimations.length)
		return;

	if (DEMO_WIN)
	{
		let totalNew = 0;
		let existingS1 = 0;
		for (let col = 0; col < currentGridConfig.cols; col++)
		{
			const surviving = currentGridConfig.columns[col].filter(inst => isInstanceAlive(inst));
			totalNew += currentGridConfig.rows - surviving.length;
			for (const inst of surviving)
			{
				if (getCurrentAnimationName(inst) === "S1")
					existingS1++;
			}
		}
		initDemoSession(totalNew, Math.max(0, 8 - existingS1));
	}

	// Pass 1 � create missing symbols and record every (instance, targetY) pair.
	// No tweens are started yet; newly created instances need at least one JS tick
	// before their C3 Tween behavior is ready to accept startTween() calls.
	const dropTargets = [];

	for (let col = 0; col < currentGridConfig.cols; col++)
	{
		if (spinStateToken !== spinToken)
			return;

		const x = currentGridConfig.startX + col * currentGridConfig.spacingX;
		const existing = currentGridConfig.columns[col].filter(inst => isInstanceAlive(inst));
		const missing = currentGridConfig.rows - existing.length;
		const newSymbols = [];

		for (let i = 0; i < missing; i++)
		{
			const yAbove = currentGridConfig.startY - (missing - i) * currentGridConfig.spacingY;
			const newInst = symbolsObject.createInstance(SYMBOLS_LAYER_NAME, x, yAbove);
			createdSymbolInstances.push(newInst);
			assignRandomAnimationToSymbol(newInst, availableAnimations);
			newSymbols.push(newInst);
		}

		const nextColumn = [...newSymbols, ...existing];
		while (nextColumn.length < currentGridConfig.rows)
		{
			const fallbackInst = symbolsObject.createInstance(SYMBOLS_LAYER_NAME, x, currentGridConfig.startY - currentGridConfig.spacingY);
			createdSymbolInstances.push(fallbackInst);
			assignRandomAnimationToSymbol(fallbackInst, availableAnimations);
			nextColumn.unshift(fallbackInst);
		}
		currentGridConfig.columns[col] = nextColumn;

		for (let row = 0; row < nextColumn.length; row++)
		{
			nextColumn[row].x = x;
			dropTargets.push({
				inst: nextColumn[row],
				targetY: currentGridConfig.startY + row * currentGridConfig.spacingY
			});
		}
	}

	if (spinStateToken !== spinToken)
		return;

	// Yield one JS event-loop tick so C3 finishes registering the new instances
	// and their Tween behaviors are fully ready before we call startTween().
	await delay(0);

	if (spinStateToken !== spinToken)
		return;

	// Pass 2 � start all drop tweens now that every instance is initialized.
	const tweenPromises = [];
	for (const { inst, targetY } of dropTargets)
	{
		if (!isInstanceAlive(inst))
			continue;
		queueTweenY(inst, targetY, spinProfile.cascadeDropTimeSeconds, spinProfile.ease, tweenPromises);
	}

	if (tweenPromises.length)
		await Promise.all(tweenPromises);
	else
		await delay(spinProfile.cascadeDropTimeSeconds * 1000);

	// Safety: always snap to exact grid after tween so the board is guaranteed full.
	forceSnapColumnsToGrid();
}

async function rollOneColumnStep(colIndex, spinStateToken, spinProfile, options = {})
{
	if (spinStateToken !== spinToken)
		return;

	await delay(spinProfile.columnStaggerSeconds * colIndex * 1000);
	if (spinStateToken !== spinToken)
		return;

	const column = currentGridConfig.columns[colIndex];
	if (!column || !column.length)
		return;

	const outDistance = getRollOutDistance();
	await tweenColumnByDistance(column, outDistance, spinProfile.moveTimeSeconds, spinProfile.ease);
	if (spinStateToken !== spinToken)
		return;

	await resetAndDropColumnFromTop(column, colIndex, spinStateToken, spinProfile);
	if (typeof options.onColumnDropComplete === "function")
		options.onColumnDropComplete(colIndex);
}

function syncMultiplierForSymbol(symbolInstance, currentAnimationName, previousAnimationName = "")
{
	const multiplierTextObject = g_runtime.objects.multiplierSymbol;
	const existingMultiplierInstance = symbolMultiplierMap.get(symbolInstance.uid);

	if (isMultiplierAnimation(currentAnimationName) && multiplierTextObject)
	{
		const multiplierValue = pickWeightedMultiplier();
		symbolMultiplierValueMap.set(symbolInstance.uid, multiplierValue);
		if (existingMultiplierInstance && !existingMultiplierInstance.isDestroyed)
		{
			existingMultiplierInstance.x = symbolInstance.x;
			existingMultiplierInstance.y = symbolInstance.y;
			existingMultiplierInstance.text = `${multiplierValue}x`;
			recordMultiplierAppeared(symbolInstance.uid, multiplierValue);
			return;
		}

		createOrUpdateMultiplierForSymbol(symbolInstance, multiplierValue);
		recordMultiplierAppeared(symbolInstance.uid, multiplierValue);
		return;
	}

	destroyMultiplierForSymbol(symbolInstance.uid);
}

async function resetAndDropColumnFromTop(column, colIndex, spinStateToken, spinProfile)
{
	const nextOrder = [column[column.length - 1], ...column.slice(0, column.length - 1)];
	column.length = 0;
	column.push(...nextOrder);

	for (let row = 0; row < column.length; row++)
	{
		const symbolInstance = column[row];
		const x = currentGridConfig.startX + colIndex * currentGridConfig.spacingX;
		const y = currentGridConfig.startY - (currentGridConfig.rows - row) * currentGridConfig.spacingY;
		symbolInstance.x = x;
		symbolInstance.y = y;

		const multiplierInstance = symbolMultiplierMap.get(symbolInstance.uid);
		if (multiplierInstance && !multiplierInstance.isDestroyed)
		{
			multiplierInstance.x = x;
			multiplierInstance.y = y;
		}
	}

	for (const symbolInstance of column)
		rollSingleWrappedSymbol(symbolInstance);
	if (spinStateToken !== spinToken)
		return;

	await tweenColumnToGrid(column, spinProfile.moveTimeSeconds, spinProfile.ease);
}

async function tweenColumnByDistance(column, distance, moveTimeSeconds, ease)
{
	const tweenPromises = [];
	for (const symbolInstance of column)
	{
		const targetY = symbolInstance.y + distance;
		queueTweenY(symbolInstance, targetY, moveTimeSeconds, ease, tweenPromises);
	}

	if (tweenPromises.length)
		await Promise.all(tweenPromises);
}

async function tweenColumnToGrid(column, moveTimeSeconds, ease)
{
	const tweenPromises = [];
	for (let row = 0; row < column.length; row++)
	{
		const symbolInstance = column[row];
		const targetY = currentGridConfig.startY + row * currentGridConfig.spacingY;
		queueTweenY(symbolInstance, targetY, moveTimeSeconds, ease, tweenPromises);
	}

	if (tweenPromises.length)
		await Promise.all(tweenPromises);
}

function queueTweenY(inst, targetY, moveTimeSeconds, ease, tweenPromises)
{
	const tweenBehavior = getTweenBehavior(inst);
	if (!tweenBehavior)
	{
		inst.y = targetY;
		return;
	}

	const tween = tweenBehavior.startTween("y", targetY, moveTimeSeconds, ease);
	if (tween?.finished)
		tweenPromises.push(tween.finished);
	else if (tween === false || tween == null)
		inst.y = targetY;
}

function getRollOutDistance()
{
	const topY = currentGridConfig.startY;
	const offscreenBottomY = g_runtime.layout.height + currentGridConfig.spacingY;
	return Math.max(currentGridConfig.spacingY, offscreenBottomY - topY);
}

function rollSingleWrappedSymbol(symbolInstance)
{
	if (!symbolInstance || symbolInstance.isDestroyed)
		return;

	const availableAnimations = getAvailableSymbolAnimations(symbolInstance.objectType);
	if (!availableAnimations.length)
		return;

	assignRandomAnimationToSymbol(symbolInstance, availableAnimations);
}

function initDemoSession(totalSlots, s1Count)
{
	_demoSlotsRemaining = totalSlots;
	_demoS1Remaining = Math.min(s1Count, totalSlots);
}

function assignRandomAnimationToSymbol(symbolInstance, availableAnimations)
{
	const previousAnimationName = getCurrentAnimationName(symbolInstance);
	let animation;
	if (DEMO_WIN && _demoSlotsRemaining > 0)
	{
		// Reservoir sampling: at each slot, probability = remaining_needed / remaining_slots
		// guarantees exactly s1Count S1 symbols in uniformly random positions
		if (_demoS1Remaining > 0 && Math.random() < _demoS1Remaining / _demoSlotsRemaining)
		{
			animation = availableAnimations.includes("S1") ? "S1" : pickRandom(availableAnimations);
			_demoS1Remaining--;
		}
		else
		{
			animation = pickRandom(availableAnimations);
		}
		_demoSlotsRemaining--;
	}
	else
	{
		if (isFreeSpinMode && availableAnimations.includes("Scatter"))
		{
			const scatterCapReached = countActiveScatterSymbols() >= getScatterCapForCurrentMode();
			if (!scatterCapReached && Math.random() < SCATTER_APPEAR_CHANCE_FREESPIN)
				animation = "Scatter";
		}

		if (!animation)
		animation = pickControlledAnimation(availableAnimations);
	}

	if (
		!isFreeSpinMode &&
		forcedScatterAssignmentsRemaining > 0 &&
		availableAnimations.includes("Scatter")
	)
	{
		animation = "Scatter";
		forcedScatterAssignmentsRemaining--;
	}

	if (isMultiplierAnimation(animation) && countActiveMultiplierSymbols() >= activeMultiplierCap)
		animation = pickNonMultiplierAnimation(availableAnimations);
	if (animation === "Scatter" && countActiveScatterSymbols() >= getScatterCapForCurrentMode())
		animation = pickAnimationWithoutScatter(availableAnimations);
	if (isMultiplierAnimation(animation) && currentSpinStats)
		currentSpinStats.multiplierAppearedInSpin = true;

	symbolInstance.setAnimation(animation, "beginning");
	symbolAnimationMap.set(symbolInstance.uid, animation);
	syncMultiplierForSymbol(symbolInstance, animation, previousAnimationName);
}

function chooseMultiplierCap()
{
	const roll = Math.random();
	if (roll < 0.45)
		return 1;
	if (roll < 0.93)
		return 2;
	if (roll < 0.99)
		return 3;
	return 4;
}

function countActiveMultiplierSymbols()
{
	let count = 0;
	for (const column of currentGridConfig?.columns ?? [])
	{
		for (const symbolInstance of column)
		{
			if (!symbolInstance || symbolInstance.isDestroyed)
				continue;

			if (isMultiplierAnimation(getCurrentAnimationName(symbolInstance)))
				count++;
		}
	}
	return count;
}

function pickControlledAnimation(availableAnimations)
{
	const weighted = [];
	for (const anim of availableAnimations)
	{
		let weight = NORMAL_ANIM_WEIGHT;
		if (isMultiplierAnimation(anim))
			weight = MULTIPLIER_ANIM_WEIGHT;
		else if (anim === "Scatter")
			weight = isFreeSpinMode ? SCATTER_ANIM_WEIGHT_FREESPIN : SCATTER_ANIM_WEIGHT;
		weighted.push({ anim, weight });
	}
	return pickWeightedAnimation(weighted) ?? pickRandom(availableAnimations);
}

function pickWeightedAnimation(weightedAnimations)
{
	let total = 0;
	for (const item of weightedAnimations)
		total += item.weight;
	if (total <= 0)
		return "";

	let roll = Math.random() * total;
	for (const item of weightedAnimations)
	{
		roll -= item.weight;
		if (roll <= 0)
			return item.anim;
	}

	return weightedAnimations[weightedAnimations.length - 1]?.anim ?? "";
}

function pickNonMultiplierAnimation(availableAnimations)
{
	const nonMultiplierAnimations = availableAnimations.filter(anim => !isMultiplierAnimation(anim));
	if (!nonMultiplierAnimations.length)
		return pickRandom(availableAnimations);
	return pickControlledAnimation(nonMultiplierAnimations);
}

function pickAnimationWithoutScatter(availableAnimations)
{
	const withoutScatter = availableAnimations.filter(anim => anim !== "Scatter");
	if (!withoutScatter.length)
		return pickRandom(availableAnimations);

	if (countActiveMultiplierSymbols() >= activeMultiplierCap)
		return pickNonMultiplierAnimation(withoutScatter);

	return pickControlledAnimation(withoutScatter);
}

function getScatterCapForCurrentMode()
{
	if (isFreeSpinMode)
		return SCATTER_MAX_ON_SCREEN_FREESPIN;

	return Math.max(FREE_SPINS_TRIGGER_SCATTERS, SCATTER_MAX_ON_SCREEN_NORMAL);
}

function countActiveScatterSymbols()
{
	let count = 0;
	for (const column of currentGridConfig?.columns ?? [])
	{
		for (const symbolInstance of column)
		{
			if (!isInstanceAlive(symbolInstance))
				continue;

			if (getCurrentAnimationName(symbolInstance) === "Scatter")
				count++;
		}
	}
	return count;
}

function shuffleInPlace(arr)
{
	for (let i = arr.length - 1; i > 0; i--)
	{
		const j = randomInt(0, i);
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
}

function getCurrentAnimationName(symbolInstance)
{
	if (!symbolInstance || symbolInstance.isDestroyed)
		return "";

	const mappedAnimation = symbolAnimationMap.get(symbolInstance.uid);
	if (typeof mappedAnimation === "string" && mappedAnimation.length)
		return mappedAnimation;

	if (typeof symbolInstance.animationName === "string" && symbolInstance.animationName.length)
		return symbolInstance.animationName;

	if (symbolInstance.animation && typeof symbolInstance.animation.name === "string")
		return symbolInstance.animation.name;

	return "";
}

function createOrUpdateMultiplierForSymbol(symbolInstance, multiplierValue)
{
	if (!symbolInstance || symbolInstance.isDestroyed)
		return;

	const multiplierTextObject = g_runtime.objects.multiplierSymbol;
	if (!multiplierTextObject)
		return;

	const existing = symbolMultiplierMap.get(symbolInstance.uid);
	if (existing && !existing.isDestroyed)
	{
		existing.x = symbolInstance.x;
		existing.y = symbolInstance.y;
		existing.text = `${multiplierValue}x`;
		return;
	}

	const created = multiplierTextObject.createInstance(SYMBOLS_LAYER_NAME, symbolInstance.x, symbolInstance.y);
	created.text = `${multiplierValue}x`;
	createdMultiplierTextInstances.push(created);
	symbolMultiplierMap.set(symbolInstance.uid, created);
	tryAttachChild(symbolInstance, created);
}

function recordMultiplierAppeared(symbolUid, multiplierValue)
{
	if (!currentSpinStats || !Array.isArray(currentSpinStats.multiplierValuesAppeared))
		return;

	if (typeof multiplierValue !== "number" || !isFinite(multiplierValue) || multiplierValue <= 0)
		return;

	const seenUids = currentSpinStats.seenMultiplierSymbolUids;
	if (seenUids instanceof Set)
	{
		if (seenUids.has(symbolUid))
			return;
		seenUids.add(symbolUid);
	}

	currentSpinStats.multiplierValuesAppeared.push(multiplierValue);
}

function destroyMultiplierForSymbol(symbolUid)
{
	const existing = symbolMultiplierMap.get(symbolUid);
	if (existing && !existing.isDestroyed)
		existing.destroy();
	symbolMultiplierMap.delete(symbolUid);
	symbolMultiplierValueMap.delete(symbolUid);
}

function cleanupInvalidMultiplierLinks()
{
	for (const [symbolUid, multiplierInst] of symbolMultiplierMap.entries())
	{
		const symbolInst = findSymbolByUid(symbolUid);
		if (!symbolInst || symbolInst.isDestroyed)
		{
			if (multiplierInst && !multiplierInst.isDestroyed)
				multiplierInst.destroy();
			symbolMultiplierMap.delete(symbolUid);
			symbolMultiplierValueMap.delete(symbolUid);
			symbolAnimationMap.delete(symbolUid);
			continue;
		}

		if (!multiplierInst || multiplierInst.isDestroyed)
			symbolMultiplierMap.delete(symbolUid);
	}
}

function findSymbolByUid(uid)
{
	for (const symbolInstance of createdSymbolInstances)
	{
		if (isInstanceAlive(symbolInstance) && symbolInstance.uid === uid)
			return symbolInstance;
	}
	return null;
}

function tryAttachChild(parentInst, childInst)
{
	if (!parentInst || !childInst || typeof parentInst.addChild !== "function")
		return;

	try
	{
		parentInst.addChild(childInst);
	}
	catch (_err)
	{
		// Ignore if this runtime/build does not support addChild in scripts.
	}
}

function getTweenBehavior(inst)
{
	if (!inst || !inst.behaviors)
		return null;

	if (inst.behaviors.Tween && typeof inst.behaviors.Tween.startTween === "function")
		return inst.behaviors.Tween;

	for (const behaviorName of Object.keys(inst.behaviors))
	{
		const behavior = inst.behaviors[behaviorName];
		if (behavior && typeof behavior.startTween === "function")
			return behavior;
	}

	return null;
}

function syncAllMultiplierPositions()
{
	for (const [symbolUid, multiplierInstance] of symbolMultiplierMap.entries())
	{
		if (!isInstanceAlive(multiplierInstance))
		{
			symbolMultiplierMap.delete(symbolUid);
			continue;
		}

		const symbolInstance = findSymbolByUid(symbolUid);
		if (!isInstanceAlive(symbolInstance))
		{
			multiplierInstance.destroy();
			symbolMultiplierMap.delete(symbolUid);
			continue;
		}

		multiplierInstance.x = symbolInstance.x;
		multiplierInstance.y = symbolInstance.y;
	}
}

function delay(ms)
{
	return new Promise(resolve => setTimeout(resolve, ms));
}

function triggerSymbolWinFunction(symbolName, winAmount)
{
	if (!g_runtime)
		return;

	try
	{
		if (typeof g_runtime.callFunction === "function")
		{
			g_runtime.callFunction("symbolWin", symbolName, winAmount);
			return;
		}

		if (g_runtime.functions && typeof g_runtime.functions.call === "function")
			g_runtime.functions.call("symbolWin", symbolName, winAmount);
	}
	catch (err)
	{
		console.warn(`Failed calling function symbolWin: ${err}`);
	}
}

function ensureSymbolWinBannerLayer()
{
	if (typeof document === "undefined" || !document.body)
		return false;

	ensureSymbolWinBannerStyle();

	let layer = document.getElementById(SYMBOL_WIN_BANNER_ID);
	if (!layer)
	{
		layer = document.createElement("div");
		layer.id = SYMBOL_WIN_BANNER_ID;
		layer.innerHTML = `
			<div class="swb-card">
				<div class="swb-left" data-field="count">0X</div>
				<img class="swb-icon" data-field="icon" alt="" />
				<div class="swb-right">PAYS <span data-field="amount">$0.00</span></div>
			</div>
		`;
		document.body.appendChild(layer);
	}

	return true;
}

function ensureSymbolWinBannerStyle()
{
	if (typeof document === "undefined")
		return;
	if (document.getElementById(SYMBOL_WIN_BANNER_STYLE_ID))
		return;

	const style = document.createElement("style");
	style.id = SYMBOL_WIN_BANNER_STYLE_ID;
	style.textContent = `
		#${SYMBOL_WIN_BANNER_ID} {
			position: fixed;
			bottom: calc(max(8px, env(safe-area-inset-bottom)) + 110px);
			left: 50%;
			transform: translateX(-50%);
			z-index: 45;
			display: none;
			pointer-events: none;
			font-family: "Arial Black", "Impact", sans-serif;
		}
		#${SYMBOL_WIN_BANNER_ID}.is-visible {
			display: block;
		}
		#${SYMBOL_WIN_BANNER_ID} .swb-card {
			display: flex;
			align-items: center;
			gap: 14px;
			padding: 10px 16px;
			border-radius: 6px;
			background: linear-gradient(180deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.95));
			border: 1px solid rgb(255, 255, 255);
			box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
			color: #fff;
			white-space: nowrap;
			font-weight: 900;
		}
		#${SYMBOL_WIN_BANNER_ID} .swb-left,
		#${SYMBOL_WIN_BANNER_ID} .swb-right {
			font-size: clamp(24px, 3.4vw, 42px);
			line-height: 1;
			text-transform: uppercase;
			text-shadow:
				2px 2px 0 rgba(0, 0, 0, 0.6),
				0 0 8px rgba(0, 0, 0, 0.45);
		}
		#${SYMBOL_WIN_BANNER_ID} .swb-icon {
			width: clamp(30px, 4vw, 52px);
			height: clamp(30px, 4vw, 52px);
			object-fit: contain;
			filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.55));
		}
		@media (max-width: 1024px) {
			#${SYMBOL_WIN_BANNER_ID} {
				bottom: calc(max(8px, env(safe-area-inset-bottom)) + 200px);
			}
		}
	`;
	document.head.appendChild(style);
}

function getSymbolWinBannerIconCandidates(symbolName)
{
	const normalized = String(symbolName || "").trim();
	if (!normalized)
		return [];

	const variants = [];
	const addVariant = value =>
	{
		const v = String(value || "").trim();
		if (v && !variants.includes(v))
			variants.push(v);
	};

	addVariant(normalized);
	addVariant(normalized.toUpperCase());
	addVariant(normalized.toLowerCase());
	if (normalized.toLowerCase() === "scatter")
		addVariant("Scatter");

	const candidates = [];
	const seen = new Set();
	const addCandidate = path =>
	{
		if (typeof path !== "string")
			return;
		const p = path.trim();
		if (!p || seen.has(p))
			return;
		seen.add(p);
		candidates.push(p);
	};

	for (const name of variants)
	{
		addCandidate(`symbols/${name}.png`);
		addCandidate(`./symbols/${name}.png`);
		addCandidate(`files/symbols/${name}.png`);
		addCandidate(`./files/symbols/${name}.png`);
		addCandidate(`symbols/${encodeURIComponent(name)}.png`);
		addCandidate(`./symbols/${encodeURIComponent(name)}.png`);
		addCandidate(`files/symbols/${encodeURIComponent(name)}.png`);
		addCandidate(`./files/symbols/${encodeURIComponent(name)}.png`);
	}

	// Construct runtime may provide a resolver for project files in "Files" folder.
	// Try these canonical names through runtime resolver when available.
	if (g_runtime && g_runtime.assets && typeof g_runtime.assets.getProjectFileUrl === "function")
	{
		for (const name of variants)
		{
			try
			{
				addCandidate(g_runtime.assets.getProjectFileUrl(`symbols/${name}.png`));
			}
			catch (_err)
			{
				// Ignore and continue with other path candidates.
			}
		}
	}

	return candidates;
}

function resolveSymbolWinBannerIcon(iconElement, symbolName)
{
	if (!(iconElement instanceof HTMLImageElement))
		return;

	const candidates = getSymbolWinBannerIconCandidates(symbolName);
	if (!candidates.length)
	{
		iconElement.style.display = "none";
		return;
	}

	let index = 0;
	const tryNext = () =>
	{
		if (index >= candidates.length)
		{
			iconElement.style.display = "none";
			return;
		}

		const candidate = candidates[index++];
		iconElement.style.display = "";
		iconElement.src = candidate;
	};

	iconElement.onerror = () => tryNext();
	iconElement.onload = () =>
	{
		iconElement.onerror = null;
		iconElement.onload = null;
		iconElement.style.display = "";
	};

	tryNext();
}

async function showSymbolWinBanner(symbolName, symbolCount, winAmount)
{
	if (!ensureSymbolWinBannerLayer())
		return;

	const layer = document.getElementById(SYMBOL_WIN_BANNER_ID);
	if (!(layer instanceof HTMLElement))
		return;

	const countField = layer.querySelector("[data-field='count']");
	const iconField = layer.querySelector("[data-field='icon']");
	const amountField = layer.querySelector("[data-field='amount']");
	if (!(countField instanceof HTMLElement) || !(iconField instanceof HTMLImageElement) || !(amountField instanceof HTMLElement))
		return;

	const count = Math.max(0, Math.floor(Number(symbolCount) || 0));
	const amount = Number(winAmount);
	const safeAmount = isFinite(amount) ? amount : 0;

	countField.textContent = `${count}X`;
	amountField.textContent = `${safeAmount.toFixed(2)}`;
	resolveSymbolWinBannerIcon(iconField, symbolName);

	layer.classList.add("is-visible");
	await delay(SYMBOL_WIN_BANNER_SHOW_MS);
	layer.classList.remove("is-visible");
}

function triggerTumbleEndFunction(baseWinAmount, totalMultiplier, finalWinAmount)
{
	showTumbleWinBanner(baseWinAmount, totalMultiplier, finalWinAmount);

	if (!g_runtime)
		return;

	try
	{
		if (typeof g_runtime.callFunction === "function")
		{
			g_runtime.callFunction("tumbleEnd", baseWinAmount, totalMultiplier, finalWinAmount);
			return;
		}

		if (g_runtime.functions && typeof g_runtime.functions.call === "function")
			g_runtime.functions.call("tumbleEnd", baseWinAmount, totalMultiplier, finalWinAmount);
	}
	catch (err)
	{
		console.warn(`Failed calling function tumbleEnd: ${err}`);
	}
}

function ensureTumbleWinBannerLayer()
{
	if (typeof document === "undefined" || !document.body)
		return false;

	ensureTumbleWinBannerStyle();

	let layer = document.getElementById(TUMBLE_WIN_BANNER_ID);
	if (!layer)
	{
		layer = document.createElement("div");
		layer.id = TUMBLE_WIN_BANNER_ID;
		layer.innerHTML = `
			<div class="twb-card">
				<div class="twb-title">TUMBLE WIN</div>
				<div class="twb-value" data-field="value">0.00 x 1 = 0.00</div>
			</div>
		`;
		document.body.appendChild(layer);
	}

	return true;
}

function ensureTumbleWinBannerStyle()
{
	if (typeof document === "undefined")
		return;
	if (document.getElementById(TUMBLE_WIN_BANNER_STYLE_ID))
		return;

	const style = document.createElement("style");
	style.id = TUMBLE_WIN_BANNER_STYLE_ID;
	style.textContent = `
		#${TUMBLE_WIN_BANNER_ID} {
			position: fixed;
			left: 50%;
			top: max(2px, env(safe-area-inset-top));
			transform: translateX(-50%);
			z-index: 46;
			display: none;
			pointer-events: none;
			font-family: "Arial Black", "Impact", sans-serif;
		}
		#${TUMBLE_WIN_BANNER_ID}.is-visible {
			display: block;
		}
		#${TUMBLE_WIN_BANNER_ID} .twb-card {
			min-width: min(86vw, 520px);
			padding: 8px 18px 10px;
			border-radius: 10px;
			border: 1px solid rgb(255, 255, 255);
			background: linear-gradient(180deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.95));
			box-shadow: 0 12px 26px rgba(0, 0, 0, 0.5);
			text-align: center;
		}
		#${TUMBLE_WIN_BANNER_ID} .twb-title {
			font-size: clamp(14px, 2.0vw, 26px);
			line-height: 1;
			color: #ffd100;
			text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.65);
			margin-bottom: 4px;
		}
		#${TUMBLE_WIN_BANNER_ID} .twb-value {
			font-size: clamp(16px, 2.5vw, 48px);
			line-height: 1.02;
			color: #00ff2f;
			text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.7);
			white-space: nowrap;
		}
		@media (max-width: 1024px) {
			#${TUMBLE_WIN_BANNER_ID} {
				top: max(56px, calc(env(safe-area-inset-top) + 40px));
			}
		}
	`;
	document.head.appendChild(style);
}

function formatTumbleValue(value)
{
	const numberValue = Number(value);
	if (!isFinite(numberValue))
		return "0.00";
	return numberValue.toFixed(2);
}

function formatTumbleMultiplier(value)
{
	const numberValue = Number(value);
	if (!isFinite(numberValue) || numberValue <= 0)
		return "1";
	const rounded = Math.round(numberValue * 100) / 100;
	return String(rounded);
}

function showTumbleWinBanner(baseWinAmount, totalMultiplier, finalWinAmount)
{
	const base = Number(baseWinAmount);
	if (!isFinite(base) || base <= 0)
		return;

	if (!ensureTumbleWinBannerLayer())
		return;

	const layer = document.getElementById(TUMBLE_WIN_BANNER_ID);
	if (!(layer instanceof HTMLElement))
		return;

	const valueField = layer.querySelector("[data-field='value']");
	if (!(valueField instanceof HTMLElement))
		return;

	const multi = Number(totalMultiplier);
	const safeMulti = (isFinite(multi) && multi > 0) ? multi : 1;
	const multipliedResult = base * safeMulti;
	const fallbackFinal = Number(finalWinAmount);
	const safeResult = isFinite(multipliedResult) ? multipliedResult : (isFinite(fallbackFinal) ? fallbackFinal : 0);
	valueField.textContent = `${formatTumbleValue(base)} x ${formatTumbleMultiplier(safeMulti)} = ${formatTumbleValue(safeResult)}`;
	snapTumbleBannerToTumbleLayer();
	layer.classList.add("is-visible");
	callC3Function("tumbleShow");
}

function hideTumbleWinBanner()
{
	const layer = document.getElementById(TUMBLE_WIN_BANNER_ID);
	if (!(layer instanceof HTMLElement))
		return;
	layer.classList.remove("is-visible");
}

function ensureTurboPopupLayer()
{
	if (typeof document === "undefined" || !document.body)
		return false;

	ensureTurboPopupStyle();

	let layer = document.getElementById(TURBO_POPUP_ID);
	if (!layer)
	{
		layer = document.createElement("div");
		layer.id = TURBO_POPUP_ID;
		layer.innerHTML = `<div class="tp-card" data-field="text">TURBO ON</div>`;
		document.body.appendChild(layer);
	}

	return true;
}

function ensureTurboPopupStyle()
{
	if (typeof document === "undefined")
		return;
	if (document.getElementById(TURBO_POPUP_STYLE_ID))
		return;

	const style = document.createElement("style");
	style.id = TURBO_POPUP_STYLE_ID;
	style.textContent = `
		#${TURBO_POPUP_ID} {
			position: fixed;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
			z-index: 55;
			display: none;
			pointer-events: none;
			font-family: "Arial Black", "Impact", sans-serif;
		}
		#${TURBO_POPUP_ID}.is-visible {
			display: block;
		}
		#${TURBO_POPUP_ID} .tp-card {
			padding: 10px 18px;
			border-radius: 10px;
			border: 1px solid rgba(255, 214, 51, 0.8);
			background: rgba(0, 0, 0, 0.88);
			color: #ffd633;
			font-size: clamp(18px, 2.2vw, 28px);
			line-height: 1;
			text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.6);
			white-space: nowrap;
		}
	`;
	document.head.appendChild(style);
}

function showTurboPopup(text = "TURBO ON")
{
	if (!ensureTurboPopupLayer())
		return;

	const layer = document.getElementById(TURBO_POPUP_ID);
	if (!(layer instanceof HTMLElement))
		return;

	const textField = layer.querySelector("[data-field='text']");
	if (textField instanceof HTMLElement)
		textField.textContent = String(text || "TURBO ON");

	layer.classList.add("is-visible");
	if (turboPopupHideTimer)
		clearTimeout(turboPopupHideTimer);
	turboPopupHideTimer = setTimeout(() =>
	{
		layer.classList.remove("is-visible");
		turboPopupHideTimer = 0;
	}, TURBO_POPUP_SHOW_MS);
}

function ensureAutoSpinPanelLayer()
{
	if (typeof document === "undefined" || !document.body)
		return false;

	ensureAutoSpinPanelStyle();

	let layer = document.getElementById(AUTOSPIN_PANEL_ID);
	if (!layer)
	{
		layer = document.createElement("div");
		layer.id = AUTOSPIN_PANEL_ID;
		layer.innerHTML = `
			<div class="asp-card">
				<div class="asp-title">AUTO SPINS</div>
				<div class="asp-current" data-field="selected-count">${AUTOSPIN_OPTIONS[0]}</div>
				<div class="asp-slider-wrap">
					<div class="asp-track-labels asp-track-top">
						${AUTOSPIN_OPTIONS.map((v, i) => `<span class="asp-track-label">${i % 2 === 0 ? v : ""}</span>`).join("")}
					</div>
					<input
						type="range"
						class="asp-slider"
						data-field="slider"
						min="0"
						max="${AUTOSPIN_OPTIONS.length - 1}"
						step="1"
						value="0"
						aria-label="Auto spin count"
					/>
					<div class="asp-track-labels asp-track-bottom">
						${AUTOSPIN_OPTIONS.map((v, i) => `<span class="asp-track-label">${i % 2 === 1 ? v : ""}</span>`).join("")}
					</div>
				</div>
				<button type="button" class="asp-start" data-action="start-autospin">START</button>
			</div>
		`;
		document.body.appendChild(layer);
		layer.addEventListener("click", onAutoSpinPanelClick);
		const slider = layer.querySelector("[data-field='slider']");
		if (slider instanceof HTMLInputElement)
			slider.addEventListener("input", onAutoSpinSliderInput);
	}

	updateAutoSpinPanelView();
	autoSpinPanelState.ready = true;
	return true;
}

function ensureAutoSpinPanelStyle()
{
	if (typeof document === "undefined")
		return;
	if (document.getElementById(AUTOSPIN_PANEL_STYLE_ID))
		return;

	const style = document.createElement("style");
	style.id = AUTOSPIN_PANEL_STYLE_ID;
	style.textContent = `
		#${AUTOSPIN_PANEL_ID} {
			position: fixed;
			inset: 0;
			display: none;
			align-items: center;
			justify-content: center;
			padding: 16px;
			background: rgba(0, 0, 0, 0.55);
			z-index: 60;
			font-family: "Arial Black", "Impact", sans-serif;
		}
		#${AUTOSPIN_PANEL_ID}.is-visible {
			display: flex;
		}
		#${AUTOSPIN_PANEL_ID} .asp-card {
			width: min(92vw, 430px);
			border-radius: 12px;
			padding: 16px;
			background: rgba(0, 0, 0, 0.92);
			border: 1px solid rgba(255, 255, 255, 0.18);
			box-shadow: 0 14px 28px rgba(0, 0, 0, 0.45);
		}
		#${AUTOSPIN_PANEL_ID} .asp-title {
			font-size: 26px;
			line-height: 1;
			color: #ffc52f;
			text-align: center;
			margin-bottom: 10px;
		}
		#${AUTOSPIN_PANEL_ID} .asp-current {
			font-size: 52px;
			line-height: 1;
			color: #fff;
			text-align: center;
			margin-bottom: 10px;
			text-shadow:
				0 3px 0 rgba(0, 0, 0, 0.75),
				0 0 14px rgba(255, 255, 255, 0.2);
		}
		#${AUTOSPIN_PANEL_ID} .asp-slider-wrap {
			margin-bottom: 16px;
		}
		#${AUTOSPIN_PANEL_ID} .asp-slider {
			width: 100%;
			margin: 0;
			accent-color: #ffc52f;
			cursor: pointer;
		}
		#${AUTOSPIN_PANEL_ID} .asp-track-labels {
			display: grid;
			grid-template-columns: repeat(${AUTOSPIN_OPTIONS.length}, minmax(0, 1fr));
			gap: 4px;
			padding: 0;
		}
		#${AUTOSPIN_PANEL_ID} .asp-track-top {
			margin-bottom: 6px;
		}
		#${AUTOSPIN_PANEL_ID} .asp-track-bottom {
			margin-top: 6px;
		}
		#${AUTOSPIN_PANEL_ID} .asp-track-label {
			color: rgba(255, 255, 255, 0.9);
			font-size: 16px;
			text-align: center;
			font-family: "Arial Black", "Impact", sans-serif;
			font-weight: 900;
			line-height: 1;
			user-select: none;
			min-height: 16px;
		}
		#${AUTOSPIN_PANEL_ID} .asp-start {
			width: 100%;
			height: 48px;
			border-radius: 10px;
			border: 0;
			background: #ffc52f;
			color: #111;
			font-size: 22px;
			font-weight: 900;
			cursor: pointer;
		}
	`;
	document.head.appendChild(style);
}

function updateAutoSpinPanelView()
{
	const layer = document.getElementById(AUTOSPIN_PANEL_ID);
	if (!(layer instanceof HTMLElement))
		return false;

	const slider = layer.querySelector("[data-field='slider']");
	if (slider instanceof HTMLInputElement)
	{
		const index = Math.max(0, AUTOSPIN_OPTIONS.indexOf(autoSpinPanelState.selectedCount));
		slider.min = "0";
		slider.max = String(Math.max(0, AUTOSPIN_OPTIONS.length - 1));
		slider.step = "1";
		slider.value = String(index);
	}

	const selectedField = layer.querySelector("[data-field='selected-count']");
	if (selectedField instanceof HTMLElement)
		selectedField.textContent = String(autoSpinPanelState.selectedCount);

	return true;
}

function onAutoSpinSliderInput(event)
{
	const target = event.target;
	if (!(target instanceof HTMLInputElement))
		return;
	const index = Math.max(0, Math.min(AUTOSPIN_OPTIONS.length - 1, Math.floor(Number(target.value) || 0)));
	const count = AUTOSPIN_OPTIONS[index];
	if (!count)
		return;
	autoSpinPanelState.selectedCount = count;
	updateAutoSpinPanelView();
}

function showAutoSpinPanel()
{
	if (!ensureAutoSpinPanelLayer())
		return false;
	const layer = document.getElementById(AUTOSPIN_PANEL_ID);
	if (!(layer instanceof HTMLElement))
		return false;
	updateAutoSpinPanelView();
	applyBottomGuiAdaptiveScale();
	layer.classList.add("is-visible");
	return true;
}

function hideAutoSpinPanel()
{
	const layer = document.getElementById(AUTOSPIN_PANEL_ID);
	if (!(layer instanceof HTMLElement))
		return false;
	layer.classList.remove("is-visible");
	return true;
}

function onAutoSpinPanelClick(event)
{
	const target = event.target;
	if (!(target instanceof HTMLElement))
		return;

	const clickedButton = target.closest("button");
	if (clickedButton instanceof HTMLButtonElement)
		callC3Function("btnTouch");

	const actionElement = target.closest("[data-action]");
	if (!(actionElement instanceof HTMLElement))
	{
		const layer = document.getElementById(AUTOSPIN_PANEL_ID);
		if (target === layer)
			hideAutoSpinPanel();
		return;
	}

	const action = actionElement.dataset.action;
	if (action === "start-autospin")
	{
		hideAutoSpinPanel();
		void startAutoSpins(autoSpinPanelState.selectedCount);
	}
}

function applyAutoSpinPanelScale(scaleValue)
{
	const parsed = Number(scaleValue);
	const safeScale = (Number.isFinite(parsed) && parsed > 0) ? parsed : 1;

	const panelLayer = document.getElementById(AUTOSPIN_PANEL_ID);
	if (!(panelLayer instanceof HTMLElement))
		return;

	const card = panelLayer.querySelector(".asp-card");
	if (!(card instanceof HTMLElement))
		return;

	card.style.transformOrigin = "center center";
	card.style.transform = `scale(${safeScale})`;
}

async function startAutoSpins(count)
{
	const total = Math.max(0, Math.floor(Number(count) || 0));
	if (total <= 0)
		return false;
	if (isSpinning || isAutoSpinsRunning || isFreeSpinMode || pendingAutoFreeSpins || isAutoFreeSpinsRunning)
		return false;

	isAutoSpinsRunning = true;
	autoSpinsAbort = false;
	autoSpinsRemaining = total;
	bottomGuiState.autoplayOn = true;
	updateBottomGuiView();
	updateBottomGuiInteractivity();

	try
	{
		while (autoSpinsRemaining > 0 && !autoSpinsAbort)
		{
			// If Free Spins are running, pause paid auto spins and resume afterwards.
			while (!autoSpinsAbort && (isFreeSpinMode || pendingAutoFreeSpins || isAutoFreeSpinsRunning))
				await delay(120);

			if (autoSpinsAbort)
				break;

			if (bottomGuiState.credit < currentTotalBet)
				break;

			await spinSymbols(bottomGuiState.turboOn ? "turbo" : "normal", true);
			autoSpinsRemaining--;
			if (autoSpinsRemaining > 0 && !autoSpinsAbort)
				await delay(AUTO_SPIN_DELAY_SECONDS * 1000);
		}
	}
	finally
	{
		isAutoSpinsRunning = false;
		autoSpinsAbort = false;
		autoSpinsRemaining = 0;
		bottomGuiState.autoplayOn = false;
		updateBottomGuiView();
		updateBottomGuiInteractivity();
	}

	return true;
}

function stopAutoSpins()
{
	autoSpinsAbort = true;
	isAutoSpinsRunning = false;
	autoSpinsRemaining = 0;
	bottomGuiState.autoplayOn = false;
	updateBottomGuiView();
	updateBottomGuiInteractivity();
}

async function processFreeSpinAfterSpin(spinResult, consumedFreeSpin, options = {})
{
	const scatterCount = countSymbolsOnScreen("Scatter");
	const forceStartFromBoughtSpin = !!options.forceStartFromBoughtSpin;
	const allowFreeSpinTriggerThisSpin = !!options.allowFreeSpinTriggerThisSpin;
	const canStartFreeSpinsFromScatter = allowFreeSpinTriggerThisSpin && scatterCount >= FREE_SPINS_TRIGGER_SCATTERS;
	let justStartedFreeSpins = false;

	if (!isFreeSpinMode && (canStartFreeSpinsFromScatter || forceStartFromBoughtSpin))
	{
		isFreeSpinMode = true;
		freeSpinsRemaining = FREE_SPINS_START_COUNT;
		freeSpinTotalMultiplier = 0;
		freeSpinsSessionTotalWin = 0;
		// Mark current trigger scatters as already consumed to avoid instant retrigger.
		lastFreeSpinRetriggerScatterSignature = getScatterSignatureOnScreen();
		pendingAutoFreeSpins = true;
		updateBottomGuiInteractivity();
		justStartedFreeSpins = true;
		const triggerScatterCount = forceStartFromBoughtSpin
			? Math.max(FREE_SPINS_TRIGGER_SCATTERS, scatterCount)
			: scatterCount;
		await triggerFreeSpinsStart(FREE_SPINS_START_COUNT, freeSpinsRemaining, triggerScatterCount);
	}

	if (isFreeSpinMode)
	{
		if (consumedFreeSpin && scatterCount >= FREE_SPINS_RETRIGGER_SCATTERS)
		{
			freeSpinsRemaining += FREE_SPINS_RETRIGGER_COUNT;
			updateBottomGuiView();
			await triggerFreeSpinsRetrigger(FREE_SPINS_RETRIGGER_COUNT, freeSpinsRemaining, scatterCount);
		}

		// Re-emit remaining state after a consumed free spin so UI gets updated
		// accumulated multiplier immediately after this spin result.
		if (consumedFreeSpin && freeSpinsRemaining > 0)
			triggerFreeSpinsRemaining(freeSpinsRemaining);

		if (consumedFreeSpin && freeSpinsRemaining <= 0)
		{
			await triggerFreeSpinsEnd(freeSpinTotalMultiplier || 1, freeSpinsSessionTotalWin);
			isFreeSpinMode = false;
			freeSpinsRemaining = 0;
			freeSpinTotalMultiplier = 0;
			freeSpinsSessionTotalWin = 0;
			lastFreeSpinRetriggerScatterSignature = "";
			pendingAutoFreeSpins = false;
			updateBottomGuiInteractivity();
			updateBottomGuiView();
		}
	}
}

function setCurrentTotalBet(totalBet)
{
	const parsed = Number(totalBet);
	if (!Number.isFinite(parsed) || parsed <= 0)
		return false;

	currentTotalBet = parsed;
	updateBetAmountTextObject();
	renderInfoPanelPaytable();
	return true;
}

function getCurrentTotalBet()
{
	return currentTotalBet;
}

function updateBetAmountTextObject()
{
	if (!g_runtime?.objects)
		return false;

	const betTxtObject = g_runtime.objects.betAmountTxt;
	if (!betTxtObject)
		return false;

	const instances = getObjectTypeInstances(betTxtObject);
	if (!instances.length)
		return false;

	const displayValue = formatCurrency(currentTotalBet);
	for (const inst of instances)
		inst.text = displayValue;
	updateBottomGuiView();

	return true;
}

function getObjectTypeInstances(objectType)
{
	if (!objectType)
		return [];

	if (typeof objectType.getAllInstances === "function")
	{
		const all = objectType.getAllInstances();
		return Array.isArray(all) ? all : [];
	}

	if (typeof objectType.instances === "function")
	{
		const list = objectType.instances();
		return Array.isArray(list) ? list : [];
	}

	if (typeof objectType.getFirstInstance === "function")
	{
		const first = objectType.getFirstInstance();
		return first ? [first] : [];
	}

	return [];
}

function getFreeSpinBuyCost(totalBet = currentTotalBet)
{
	const parsedBet = Number(totalBet);
	if (!Number.isFinite(parsedBet) || parsedBet <= 0)
		return 0;

	return parsedBet * FREE_SPINS_BUY_COST_MULTIPLIER;
}

function buyFreeSpins(totalBet = currentTotalBet, mode = "normal")
{
	if (!g_runtime || !currentGridConfig || !createdSymbolInstances.length)
	{
		return { ok: false, reason: "no_grid" };
	}

	if (isFreeSpinMode || pendingAutoFreeSpins || isAutoFreeSpinsRunning)
	{
		return { ok: false, reason: "already_active" };
	}
	if (isSpinning)
	{
		return { ok: false, reason: "spin_in_progress" };
	}
	const firstAliveSymbol = createdSymbolInstances.find(inst => isInstanceAlive(inst));
	if (!firstAliveSymbol || !getTweenBehavior(firstAliveSymbol))
	{
		console.warn("buyFreeSpins: object 'symbols' must have Tween behavior.");
		return { ok: false, reason: "missing_tween" };
	}
	if (!canGuaranteeBoughtFreeSpinsTrigger())
	{
		return { ok: false, reason: "cannot_guarantee_trigger" };
	}

	const parsedBet = Number(totalBet);
	if (!Number.isFinite(parsedBet) || parsedBet <= 0)
	{
		return { ok: false, reason: "invalid_bet" };
	}

	currentTotalBet = parsedBet;
	const buyCost = getFreeSpinBuyCost(parsedBet);

	isFreeSpinMode = false;
	freeSpinsRemaining = 0;
	freeSpinTotalMultiplier = 0;
	freeSpinsSessionTotalWin = 0;
	lastFreeSpinRetriggerScatterSignature = "";
	pendingAutoFreeSpins = false;
	pendingBoughtFreeSpinsTrigger = true;
	void spinSymbols(mode);

	return {
		ok: true,
		cost: buyCost,
		totalBet: parsedBet,
		awardedSpins: FREE_SPINS_START_COUNT
	};
}

async function runAutoFreeSpins(mode = "normal")
{
	if (isAutoFreeSpinsRunning)
		return;

	isAutoFreeSpinsRunning = true;
	updateBottomGuiInteractivity();
	try
	{
		while (isFreeSpinMode && freeSpinsRemaining > 0)
		{
			await delay(AUTO_FREE_SPIN_DELAY_SECONDS * 1000);
			if (!isFreeSpinMode || freeSpinsRemaining <= 0)
				break;

			await spinSymbols(mode, true);
		}
	}
	finally
	{
		isAutoFreeSpinsRunning = false;
		updateBottomGuiInteractivity();
		updateBottomGuiView();
	}
}

function countSymbolsOnScreen(animationName)
{
	let count = 0;
	for (const column of currentGridConfig?.columns ?? [])
	{
		for (const symbolInstance of column)
		{
			if (!isInstanceAlive(symbolInstance))
				continue;

			if (getCurrentAnimationName(symbolInstance) === animationName)
				count++;
		}
	}
	return count;
}

function getScatterSignatureOnScreen()
{
	const scatterUids = [];
	for (const column of currentGridConfig?.columns ?? [])
	{
		for (const symbolInstance of column)
		{
			if (!isInstanceAlive(symbolInstance))
				continue;

			if (getCurrentAnimationName(symbolInstance) === "Scatter")
				scatterUids.push(symbolInstance.uid);
		}
	}

	scatterUids.sort((a, b) => a - b);
	return scatterUids.join(",");
}

function getCurrentSpinMultiplierGain()
{
	if (!currentSpinStats || !Array.isArray(currentSpinStats.multiplierValuesAppeared))
		return 0;

	let sum = 0;
	for (const val of currentSpinStats.multiplierValuesAppeared)
	{
		if (typeof val === "number" && isFinite(val) && val > 0)
			sum += val;
	}
	return sum;
}

function captureMultiplierSymbolUidSet()
{
	const uids = new Set();
	for (const column of currentGridConfig?.columns ?? [])
	{
		for (const symbolInstance of column)
		{
			if (!isInstanceAlive(symbolInstance))
				continue;

			if (isMultiplierAnimation(getCurrentAnimationName(symbolInstance)))
				uids.add(symbolInstance.uid);
		}
	}
	return uids;
}

function captureVisibleMultiplierValueMap()
{
	const valueMap = new Map();
	for (const column of currentGridConfig?.columns ?? [])
	{
		for (const symbolInstance of column)
		{
			if (!isInstanceAlive(symbolInstance))
				continue;

			if (!isMultiplierAnimation(getCurrentAnimationName(symbolInstance)))
				continue;

			const value = getMultiplierValueBySymbolUid(symbolInstance.uid);
			if (value > 0)
				valueMap.set(symbolInstance.uid, value);
		}
	}
	return valueMap;
}

function didMultiplierSymbolAppearThisSpin()
{
	const startSet = currentSpinStats?.startMultiplierSymbolUids;
	if (!(startSet instanceof Set))
		return false;

	for (const column of currentGridConfig?.columns ?? [])
	{
		for (const symbolInstance of column)
		{
			if (!isInstanceAlive(symbolInstance))
				continue;

			if (!isMultiplierAnimation(getCurrentAnimationName(symbolInstance)))
				continue;

			if (!startSet.has(symbolInstance.uid))
				return true;
		}
	}

	return false;
}

function estimateMultiplierGainFromNewMultiplierSymbols()
{
	const startSet = currentSpinStats?.startMultiplierSymbolUids;
	if (!(startSet instanceof Set))
		return 0;

	let gain = 0;
	for (const column of currentGridConfig?.columns ?? [])
	{
		for (const symbolInstance of column)
		{
			if (!isInstanceAlive(symbolInstance))
				continue;

			if (!isMultiplierAnimation(getCurrentAnimationName(symbolInstance)))
				continue;

			if (startSet.has(symbolInstance.uid))
				continue;

			const value = getMultiplierValueBySymbolUid(symbolInstance.uid);
			if (value > 0)
				gain += value;
		}
	}

	return gain;
}

function calculateNewMultiplierGainThisSpin()
{
	const startValueMap = currentSpinStats?.startMultiplierValuesByUid;
	if (!(startValueMap instanceof Map))
		return 0;

	let gain = 0;
	for (const column of currentGridConfig?.columns ?? [])
	{
		for (const symbolInstance of column)
		{
			if (!isInstanceAlive(symbolInstance))
				continue;

			if (!isMultiplierAnimation(getCurrentAnimationName(symbolInstance)))
				continue;

			const uid = symbolInstance.uid;
			if (startValueMap.has(uid))
				continue;

			const value = getMultiplierValueBySymbolUid(uid);
			if (value > 0)
				gain += value;
		}
	}

	return gain;
}

function getMultiplierValueBySymbolUid(symbolUid)
{
	const mappedValue = symbolMultiplierValueMap.get(symbolUid);
	if (typeof mappedValue === "number" && isFinite(mappedValue) && mappedValue > 0)
		return mappedValue;

	const textInst = symbolMultiplierMap.get(symbolUid);
	if (!isInstanceAlive(textInst))
		return 0;

	const value = parseInt(String(textInst.text).replace("x", ""), 10);
	if (isNaN(value) || value <= 0)
		return 0;
	return value;
}

function getVisibleMultiplierValueSum()
{
	let sum = 0;
	for (const column of currentGridConfig?.columns ?? [])
	{
		for (const symbolInstance of column)
		{
			if (!isInstanceAlive(symbolInstance))
				continue;

			if (!isMultiplierAnimation(getCurrentAnimationName(symbolInstance)))
				continue;

			sum += getMultiplierValueBySymbolUid(symbolInstance.uid);
		}
	}
	return sum;
}

function collectNewVisibleMultiplierGain(seenSymbolUids)
{
	if (!(seenSymbolUids instanceof Set))
		return 0;

	let gain = 0;
	for (const column of currentGridConfig?.columns ?? [])
	{
		for (const symbolInstance of column)
		{
			if (!isInstanceAlive(symbolInstance))
				continue;

			if (!isMultiplierAnimation(getCurrentAnimationName(symbolInstance)))
				continue;

			const uid = symbolInstance.uid;
			if (seenSymbolUids.has(uid))
				continue;

			seenSymbolUids.add(uid);
			const value = getMultiplierValueBySymbolUid(uid);
			if (value > 0)
				gain += value;
		}
	}

	return gain;
}

function ensureInfoPanelLayer()
{
	if (typeof document === "undefined" || !document.body)
		return false;

	ensureInfoPanelStyle();

	let layer = document.getElementById(INFO_PANEL_ID);
	if (!layer)
	{
		layer = document.createElement("div");
		layer.id = INFO_PANEL_ID;
		layer.innerHTML = `
			<div class="ip-backdrop" data-action="close-info"></div>
			<div class="ip-card" role="dialog" aria-modal="true" aria-label="Paytable">
				<div class="ip-title">GAME RULE</div>
				<button class="ip-close" type="button" data-action="close-info" aria-label="Close">×</button>
				<div class="ip-grid" data-role="paytable-grid"></div>
				<div class="ip-scatter-row">
					<div class="ip-scatter-symbol">
						<img data-role="scatter-image" data-symbol="Scatter" alt="Scatter">
						<div class="ip-lines" data-role="scatter-lines"></div>
					</div>
				</div>
				<div class="ip-rule-text">
					<p>Whenever a MULTIPLIER symbol hits, it takes a random multiplier value of 2x, 3x, 4x, 5x, 6x, 8x, 10x, 12x, 15x, 20x, 25x, 50x, 100x, 250x or 500x.</p>
					<p>The FREE SPINS FEATURE is awarded when 4 or more SCATTER symbols hit anywhere on the screen. The round starts with 15 free spins.</p>
					<p>During the FREE SPINS round, whenever a MULTIPLIER symbol hits and the spin results in a win, the MULTIPLIER value gets added to the total multiplier. The total multiplier value is also used to multiply the win.</p>
					<p>Whenever 3 or more SCATTER symbols hit during the FREE SPINS ROUND, 5 additional free spins are awarded.</p>
				</div>
			</div>
		`;
		layer.addEventListener("click", onInfoPanelClick);
		document.body.appendChild(layer);
	}

	renderInfoPanelPaytable();
	return true;
}

function ensureInfoPanelStyle()
{
	if (typeof document === "undefined")
		return;
	if (document.getElementById(INFO_PANEL_STYLE_ID))
		return;

	const style = document.createElement("style");
	style.id = INFO_PANEL_STYLE_ID;
	style.textContent = `
		#${INFO_PANEL_ID} {
			position: fixed;
			inset: 0;
			display: none;
			z-index: 80;
			font-family: "Arial Black", "Impact", sans-serif;
		}
		#${INFO_PANEL_ID}.is-visible {
			display: block;
		}
		#${INFO_PANEL_ID} .ip-backdrop {
			position: absolute;
			inset: 0;
			background: rgba(0, 0, 0, 0.72);
		}
		#${INFO_PANEL_ID} .ip-card {
			position: absolute;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
			width: min(980px, 94vw);
			max-height: 90vh;
			overflow: auto;
			background: rgba(0, 0, 0, 0.95);
			border: 1px solid rgba(255, 255, 255, 0.2);
			border-radius: 12px;
			padding: 18px 20px 16px;
			color: #fff;
		}
		#${INFO_PANEL_ID} .ip-close {
			position: absolute;
			right: 10px;
			top: 6px;
			width: 34px;
			height: 34px;
			border-radius: 50%;
			border: 1px solid rgba(255, 255, 255, 0.45);
			background: rgba(0, 0, 0, 0.6);
			color: #fff;
			font-size: 24px;
			line-height: 1;
			cursor: pointer;
		}
		#${INFO_PANEL_ID} .ip-title {
			text-align: center;
			font-size: 36px;
			line-height: 1;
			color: #ffd34f;
			letter-spacing: 1px;
			margin: 2px 0 10px;
			text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
		}
		#${INFO_PANEL_ID} .ip-grid {
			display: grid;
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 12px 20px;
			padding-top: 8px;
		}
		#${INFO_PANEL_ID} .ip-item {
			text-align: center;
		}
		#${INFO_PANEL_ID} .ip-item img {
			width: 90px;
			height: 90px;
			object-fit: contain;
			display: block;
			margin: 0 auto 4px;
		}
		#${INFO_PANEL_ID} .ip-lines {
			font-family: "Arial", sans-serif;
			font-size: 28px;
			font-weight: 700;
			line-height: 1.12;
			white-space: pre-line;
		}
		#${INFO_PANEL_ID} .ip-scatter-row {
			margin-top: 14px;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0;
			border-top: 1px solid rgba(255, 255, 255, 0.2);
			padding-top: 14px;
		}
		#${INFO_PANEL_ID} .ip-scatter-symbol {
			display: flex;
			flex-direction: row;
			align-items: center;
			gap: 16px;
			padding: 10px 16px;
			border-radius: 12px;
			background: linear-gradient(90deg, rgba(255, 196, 55, 0.18), rgba(255, 170, 0, 0.08));
			border: 1px solid rgba(255, 208, 90, 0.45);
			box-shadow: 0 0 18px rgba(255, 194, 50, 0.25), inset 0 0 12px rgba(255, 213, 110, 0.08);
		}
		#${INFO_PANEL_ID} .ip-scatter-symbol img {
			width: 170px;
			height: 125px;
			object-fit: contain;
			display: block;
		}
		#${INFO_PANEL_ID} .ip-scatter-symbol .ip-lines {
			font-size: 52px;
			line-height: 1.06;
			color: #ffd24a;
			text-shadow: 0 0 10px rgba(255, 195, 60, 0.75), 0 2px 6px rgba(0, 0, 0, 0.7);
		}
		#${INFO_PANEL_ID} .ip-rule-text {
			margin-top: 14px;
			padding-top: 12px;
			border-top: 1px solid rgba(255, 255, 255, 0.2);
			font-family: "Arial", sans-serif;
			font-size: 18px;
			line-height: 1.4;
			font-weight: 700;
			color: #f4f4f4;
		}
		#${INFO_PANEL_ID} .ip-rule-text p {
			margin: 0 0 10px;
		}
		#${INFO_PANEL_ID} .ip-rule-text p:last-child {
			margin-bottom: 0;
		}
		@media (max-width: 860px) {
			#${INFO_PANEL_ID} .ip-title {
				font-size: 26px;
				margin-bottom: 8px;
			}
			#${INFO_PANEL_ID} .ip-grid {
				grid-template-columns: repeat(2, minmax(0, 1fr));
			}
			#${INFO_PANEL_ID} .ip-lines {
				font-size: 18px;
			}
			#${INFO_PANEL_ID} .ip-scatter-row {
				align-items: center;
				flex-direction: row;
			}
			#${INFO_PANEL_ID} .ip-scatter-symbol {
				gap: 10px;
				padding: 8px 10px;
			}
			#${INFO_PANEL_ID} .ip-scatter-symbol img {
				width: 140px;
				height: 105px;
			}
			#${INFO_PANEL_ID} .ip-scatter-symbol .ip-lines {
				font-size: 34px;
				line-height: 1.08;
			}
			#${INFO_PANEL_ID} .ip-rule-text {
				font-size: 15px;
				line-height: 1.35;
			}
		}
	`;
	document.head.appendChild(style);
}

function renderInfoPanelPaytable()
{
	const layer = document.getElementById(INFO_PANEL_ID);
	if (!(layer instanceof HTMLElement))
		return false;

	const grid = layer.querySelector("[data-role='paytable-grid']");
	const scatterLinesHost = layer.querySelector("[data-role='scatter-lines']");
	if (!(grid instanceof HTMLElement) || !(scatterLinesHost instanceof HTMLElement))
		return false;
	const betAmount = Number(currentTotalBet) > 0 ? Number(currentTotalBet) : (Number(BET_AMOUNT) > 0 ? Number(BET_AMOUNT) : 1);

	grid.innerHTML = "";
	for (const symbolName of INFO_SYMBOL_ORDER)
	{
		const payoutBands = Array.isArray(PAYOUT_TABLE[symbolName]) ? PAYOUT_TABLE[symbolName] : [];
		if (!payoutBands.length)
			continue;

		const item = document.createElement("div");
		item.className = "ip-item";
		const lines = payoutBands.map(band =>
		{
			const range = `${band.min} - ${band.max}`;
			const amount = formatInfoCurrency(Number(band.payout) * betAmount);
			return `${range} ${amount}`;
		}).join("\n");
		item.innerHTML = `
			<img data-symbol="${symbolName}" alt="${symbolName}">
			<div class="ip-lines">${lines}</div>
		`;
		grid.appendChild(item);
	}

	const scatterBands = Array.isArray(PAYOUT_TABLE.Scatter) ? PAYOUT_TABLE.Scatter : [];
	scatterLinesHost.textContent = scatterBands.map(band =>
	{
		const range = band.max >= 30 ? `${band.min}` : (band.min === band.max ? `${band.min}` : `${band.min} - ${band.max}`);
		const amount = formatInfoCurrency(Number(band.payout) * betAmount);
		return `${range} ${amount}`;
	}).join("\n");

	const allInfoImages = layer.querySelectorAll("img[data-symbol]");
	for (const imageElement of allInfoImages)
	{
		if (!(imageElement instanceof HTMLImageElement))
			continue;
		bindInfoSymbolImageWithFallback(imageElement);
	}

	return true;
}

function getInfoSymbolImagePathCandidates(symbolName)
{
	const normalized = String(symbolName || "").trim();
	if (!normalized)
		return [];

	const variants = [];
	const addVariant = value =>
	{
		const v = String(value || "").trim();
		if (v && !variants.includes(v))
			variants.push(v);
	};

	addVariant(normalized);
	addVariant(normalized.toUpperCase());
	addVariant(normalized.toLowerCase());
	if (normalized.toLowerCase() === "scatter")
		addVariant("Scatter");

	const candidates = [];
	const seen = new Set();
	const addCandidate = path =>
	{
		if (typeof path !== "string")
			return;
		const p = path.trim();
		if (!p || seen.has(p))
			return;
		seen.add(p);
		candidates.push(p);
	};

	for (const name of variants)
	{
		for (const basePath of INFO_SYMBOL_IMAGE_BASE_CANDIDATES)
			addCandidate(`${basePath}/${name}.png`);
	}

	return candidates;
}

async function getInfoSymbolRuntimeResolvedCandidates(symbolName)
{
	const normalized = String(symbolName || "").trim();
	if (!normalized || !g_runtime?.assets || typeof g_runtime.assets.getProjectFileUrl !== "function")
		return [];

	const variants = [];
	const addVariant = value =>
	{
		const v = String(value || "").trim();
		if (v && !variants.includes(v))
			variants.push(v);
	};

	addVariant(normalized);
	addVariant(normalized.toUpperCase());
	addVariant(normalized.toLowerCase());
	if (normalized.toLowerCase() === "scatter")
		addVariant("Scatter");

	const out = [];
	const seen = new Set();
	const addOut = value =>
	{
		if (typeof value !== "string")
			return;
		const v = value.trim();
		if (!v || seen.has(v))
			return;
		seen.add(v);
		out.push(v);
	};

	for (const name of variants)
	{
		try
		{
			const resolved = g_runtime.assets.getProjectFileUrl(`symbols/${name}.png`);
			if (resolved && typeof resolved.then === "function")
			{
				// eslint-disable-next-line no-await-in-loop
				const awaited = await resolved;
				addOut(awaited);
			}
			else
			{
				addOut(resolved);
			}
		}
		catch (_err)
		{
			// ignore
		}
	}

	return out;
}

function getInfoSymbolNamesForPreload()
{
	const names = [...INFO_SYMBOL_ORDER, "Scatter"];
	const unique = [];
	for (const name of names)
	{
		const normalized = String(name || "").trim();
		if (normalized && !unique.includes(normalized))
			unique.push(normalized);
	}
	return unique;
}

function loadImageUrl(url)
{
	return new Promise(resolve =>
	{
		const img = new Image();
		let settled = false;
		const done = ok =>
		{
			if (settled)
				return;
			settled = true;
			resolve(!!ok);
		};
		img.onload = () => done(true);
		img.onerror = () => done(false);
		img.src = url;
	});
}

async function preloadInfoSymbolImages()
{
	const symbolNames = getInfoSymbolNamesForPreload();
	for (const symbolName of symbolNames)
	{
		const runtimeCandidates = await getInfoSymbolRuntimeResolvedCandidates(symbolName);
		const fallbackCandidates = getInfoSymbolImagePathCandidates(symbolName);
		const candidates = [...runtimeCandidates, ...fallbackCandidates];
		for (const url of candidates)
		{
			// eslint-disable-next-line no-await-in-loop
			const ok = await loadImageUrl(url);
			if (!ok)
				continue;

			infoSymbolResolvedUrlMap.set(symbolName, url);
			break;
		}
	}
}

function bindInfoSymbolImageWithFallback(imageElement)
{
	if (!(imageElement instanceof HTMLImageElement))
		return false;

	const symbolName = String(imageElement.dataset.symbol || "").trim();
	if (!symbolName)
		return false;

	const preloadedUrl = infoSymbolResolvedUrlMap.get(symbolName);
	if (preloadedUrl)
	{
		imageElement.onerror = null;
		imageElement.src = preloadedUrl;
		return true;
	}

	// Do not fire blind URL retries here to avoid noisy 404 logs.
	imageElement.removeAttribute("src");
	return false;
}

function formatInfoCurrency(value)
{
	const safe = Number(value);
	if (!Number.isFinite(safe))
		return "$0.00";
	return `$${safe.toFixed(2)}`;
}

function showInfoPanel()
{
	if (!ensureInfoPanelLayer())
		return false;

	renderInfoPanelPaytable();
	const layer = document.getElementById(INFO_PANEL_ID);
	if (!(layer instanceof HTMLElement))
		return false;

	layer.classList.add("is-visible");
	return true;
}

function hideInfoPanel()
{
	const layer = document.getElementById(INFO_PANEL_ID);
	if (!(layer instanceof HTMLElement))
		return false;
	layer.classList.remove("is-visible");
	return true;
}

function onInfoPanelClick(event)
{
	const target = event.target;
	if (!(target instanceof HTMLElement))
		return;

	const clickedButton = target.closest("button");
	if (clickedButton instanceof HTMLButtonElement)
		callC3Function("btnTouch");

	const actionElement = target.closest("[data-action]");
	if (!(actionElement instanceof HTMLElement))
		return;

	if (actionElement.dataset.action === "close-info")
		hideInfoPanel();
}

function ensureFreeSpinsPopupLayer()
{
	if (typeof document === "undefined" || !document.body)
		return false;

	ensureFreeSpinsPopupStyle();

	let layer = document.getElementById(FREESPIN_POPUP_ID);
	if (!layer)
	{
		layer = document.createElement("div");
		layer.id = FREESPIN_POPUP_ID;
		layer.innerHTML = `
			<div class="fsp-card">
				<div class="fsp-title" data-field="title">FREE SPINS</div>
				<div class="fsp-text" data-field="text"></div>
				<button class="fsp-btn" type="button" data-action="confirm" data-signal="">B?T ??U</button>
			</div>
		`;
		document.body.appendChild(layer);
		layer.addEventListener("click", onFreeSpinsPopupClick);
	}
	return true;
}

function ensureFreeSpinsPopupStyle()
{
	if (typeof document === "undefined")
		return;
	if (document.getElementById(FREESPIN_POPUP_STYLE_ID))
		return;

	const style = document.createElement("style");
	style.id = FREESPIN_POPUP_STYLE_ID;
	style.textContent = `
		#${FREESPIN_POPUP_ID} {
			position: fixed;
			inset: 0;
			display: none;
			align-items: center;
			justify-content: center;
			padding: 16px;
			background: rgba(0, 0, 0, 0.62);
			z-index: 40;
			pointer-events: auto;
			font-family: "Arial Black", "Impact", sans-serif;
		}
		#${FREESPIN_POPUP_ID}.is-visible {
			display: flex;
		}
		#${FREESPIN_POPUP_ID} .fsp-card {
			width: min(92vw, 420px);
			border-radius: 14px;
			border: 2px solid rgba(255, 255, 255, 0.16);
			background: rgba(0, 0, 0, 0.88);
			box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
			padding: 20px 18px 18px;
			text-align: center;
			color: #fff;
		}
		#${FREESPIN_POPUP_ID} .fsp-title {
			font-size: 28px;
			line-height: 1.1;
			color: #ffc52f;
			margin-bottom: 10px;
		}
		#${FREESPIN_POPUP_ID} .fsp-text {
			font-size: 22px;
			line-height: 1.3;
			color: #f3f3f3;
			margin-bottom: 16px;
		}
		#${FREESPIN_POPUP_ID} .fsp-btn {
			min-width: 160px;
			height: 44px;
			border: 0;
			border-radius: 10px;
			background: #ffc52f;
			color: #111;
			font-size: 18px;
			font-weight: 900;
			cursor: pointer;
		}
	`;
	document.head.appendChild(style);
}

function showFreeSpinsPopup(signalName, payload = {})
{
	if (!ensureFreeSpinsPopupLayer())
		return false;

	const layer = document.getElementById(FREESPIN_POPUP_ID);
	if (!(layer instanceof HTMLElement))
		return false;

	const title = layer.querySelector("[data-field='title']");
	const text = layer.querySelector("[data-field='text']");
	const confirmBtn = layer.querySelector("[data-action='confirm']");
	if (!(title instanceof HTMLElement) || !(text instanceof HTMLElement) || !(confirmBtn instanceof HTMLButtonElement))
		return false;

	let popupTitle = "FREE SPINS";
	let popupText = "";
	let buttonText = "START";
	if (signalName === "freeSpinsStart")
	{
		const awarded = Number(payload.awardedSpins || 0);
		popupTitle = "FREE SPINS WON!";
		popupText = `You have been awarded ${awarded} free spins.`;
		buttonText = "START";
	}
	else if (signalName === "freeSpinsRetrigger")
	{
		const awarded = Number(payload.awardedSpins || 0);
		const remaining = Number(payload.remainingSpins || 0);
		popupTitle = "RETRIGGER FREE SPINS!";
		popupText = `+${awarded} free spins. Remaining: ${remaining}.`;
		buttonText = "CONTINUE";
	}
	else if (signalName === "freeSpinsEnd")
	{
		const totalWin = Number(payload.totalSessionWin || 0);
		popupTitle = "FREE SPINS COMPLETED";
		popupText = `Total Win: ${formatCurrencyGrouped(totalWin)}`;
		buttonText = "FINISH";
		hideTumbleWinBanner();
		bottomGuiState.lastWin = isFinite(totalWin) ? totalWin : 0;
		updateBottomGuiView();
	}

	title.textContent = popupTitle;
	text.textContent = popupText;
	confirmBtn.textContent = buttonText;
	confirmBtn.dataset.signal = signalName;

	freeSpinsPopupState.visibleSignal = signalName;
	layer.classList.add("is-visible");
	return true;
}

function hideFreeSpinsPopup(signalName = "")
{
	const layer = document.getElementById(FREESPIN_POPUP_ID);
	if (!(layer instanceof HTMLElement))
		return false;

	if (signalName && freeSpinsPopupState.visibleSignal && freeSpinsPopupState.visibleSignal !== signalName)
		return false;

	freeSpinsPopupState.visibleSignal = "";
	layer.classList.remove("is-visible");
	return true;
}

function onFreeSpinsPopupClick(event)
{
	const target = event.target;
	if (!(target instanceof HTMLElement))
		return;
	const button = target.closest("[data-action='confirm']");
	if (!(button instanceof HTMLButtonElement))
		return;

	callC3Function("btnTouch");

	const signalName = String(button.dataset.signal || "").trim();
	if (!signalName)
		return;
	if (signalName === "freeSpinsStart")
		callC3Function("transition", "start");
	else if (signalName === "freeSpinsEnd")
		callC3Function("transition", "end");

	updateBottomGuiView();
	resolveFreeSpinsSignal(signalName, "popup");
}

async function triggerFreeSpinsStart(awardedSpins, remainingSpins, scatterCount)
{
	const waitSignal = waitForFreeSpinsSignal("freeSpinsStart");
	callC3Function("freeSpinsStart", awardedSpins, remainingSpins, scatterCount);
	await delay(2000);
	showFreeSpinsPopup("freeSpinsStart", { awardedSpins, remainingSpins, scatterCount });
	await waitSignal;
	hideFreeSpinsPopup("freeSpinsStart");
}

async function triggerFreeSpinsRetrigger(awardedSpins, remainingSpins, scatterCount)
{
	const waitSignal = waitForFreeSpinsSignal("freeSpinsRetrigger");
	callC3Function("freeSpinsRetrigger", awardedSpins, remainingSpins, scatterCount);
	showFreeSpinsPopup("freeSpinsRetrigger", { awardedSpins, remainingSpins, scatterCount });
	await waitSignal;
	hideFreeSpinsPopup("freeSpinsRetrigger");
}

async function triggerFreeSpinsEnd(finalAccumulatedMultiplier, totalSessionWin)
{
	const waitSignal = waitForFreeSpinsSignal("freeSpinsEnd");
	callC3Function("freeSpinsEnd", finalAccumulatedMultiplier, totalSessionWin);
	showFreeSpinsPopup("freeSpinsEnd", { finalAccumulatedMultiplier, totalSessionWin });
	await waitSignal;
	hideFreeSpinsPopup("freeSpinsEnd");
}

function triggerFreeSpinsRemaining(remainingSpins)
{
	const currentTotalMultiplier = freeSpinTotalMultiplier > 0 ? freeSpinTotalMultiplier : 1;
	const totalWin = formatCurrencyGrouped(Number(freeSpinsSessionTotalWin || 0));
	callC3Function("freeSpinsRemaining", remainingSpins, currentTotalMultiplier, totalWin);
}

function callC3Function(functionName, ...args)
{
	if (!g_runtime)
		return;

	try
	{
		if (typeof g_runtime.callFunction === "function")
		{
			g_runtime.callFunction(functionName, ...args);
			return;
		}

		if (g_runtime.functions && typeof g_runtime.functions.call === "function")
			g_runtime.functions.call(functionName, ...args);
	}
	catch (err)
	{
		console.warn(`Failed calling function ${functionName}: ${err}`);
	}
}

function waitForFreeSpinsSignal(signalName)
{
	const queue = freeSpinSignalWaiters[signalName];
	if (!Array.isArray(queue))
		return Promise.resolve();

	return new Promise(resolve =>
	{
		queue.push(resolve);
	});
}

function resolveFreeSpinsSignal(signalName, source = "external")
{
	const queue = freeSpinSignalWaiters[signalName];
	if (!Array.isArray(queue))
		return false;

	// Prevent auto-start/auto-continue: when popup is visible for this signal,
	// only popup confirmation is allowed to resolve it.
	if (source !== "popup" && freeSpinsPopupState.visibleSignal === signalName)
	{
		return false;
	}

	const resolver = queue.shift();
	if (typeof resolver !== "function")
	{
		return false;
	}

	resolver();
	return true;
}

function ackFreeSpinsStart()
{
	return resolveFreeSpinsSignal("freeSpinsStart");
}

function ackFreeSpinsRetrigger()
{
	return resolveFreeSpinsSignal("freeSpinsRetrigger");
}

function ackFreeSpinsEnd()
{
	return resolveFreeSpinsSignal("freeSpinsEnd");
}

function ackFreeSpinsSignal(signalName)
{
	const normalized = String(signalName || "").trim();
	if (!normalized)
		return false;
	return resolveFreeSpinsSignal(normalized);
}

function getScreenMultiplierSum()
{
	let sum = 0;

	for (const [symbolUid, textInst] of symbolMultiplierMap.entries())
	{
		if (!isInstanceAlive(textInst))
			continue;

		const symbolInst = findSymbolByUid(symbolUid);
		if (!isInstanceAlive(symbolInst))
			continue;

		if (!isMultiplierAnimation(getCurrentAnimationName(symbolInst)))
			continue;

		const value = parseInt(String(textInst.text).replace("x", ""), 10);
		if (!isNaN(value) && value > 0)
			sum += value;
	}

	return sum;
}

function isInstanceAlive(inst)
{
	if (!inst)
		return false;

	if (typeof inst.isDestroyed === "boolean")
		return !inst.isDestroyed;

	if (g_runtime && typeof g_runtime.getInstanceByUid === "function")
		return !!g_runtime.getInstanceByUid(inst.uid);

	try
	{
		return !!inst.objectType;
	}
	catch (_err)
	{
		return false;
	}
}

function forceSnapColumnsToGrid()
{
	if (!currentGridConfig)
		return;

	for (let col = 0; col < currentGridConfig.cols; col++)
	{
		const x = currentGridConfig.startX + col * currentGridConfig.spacingX;
		const column = currentGridConfig.columns[col] ?? [];

		for (let row = 0; row < column.length; row++)
		{
			const inst = column[row];
			if (!isInstanceAlive(inst))
				continue;

			inst.x = x;
			inst.y = currentGridConfig.startY + row * currentGridConfig.spacingY;
		}
	}
}

function forceScatterTriggerBoard(minScatterCount)
{
	if (!currentGridConfig || !g_runtime?.objects?.symbols)
		return false;

	const symbolsObject = g_runtime.objects.symbols;
	if (!symbolsObject.getAnimation("Scatter"))
		return false;

	const targetCount = Math.max(0, Math.floor(Number(minScatterCount)));
	if (targetCount <= 0)
		return true;

	const aliveSymbols = [];
	for (const column of currentGridConfig.columns)
	{
		for (const inst of column)
		{
			if (isInstanceAlive(inst))
				aliveSymbols.push(inst);
		}
	}

	if (!aliveSymbols.length)
		return false;

	shuffleInPlace(aliveSymbols);
	const forceCount = Math.min(targetCount, aliveSymbols.length);
	for (let i = 0; i < forceCount; i++)
	{
		const inst = aliveSymbols[i];
		const previousAnimationName = getCurrentAnimationName(inst);
		inst.setAnimation("Scatter", "beginning");
		symbolAnimationMap.set(inst.uid, "Scatter");
		syncMultiplierForSymbol(inst, "Scatter", previousAnimationName);
	}

	return countSymbolsOnScreen("Scatter") >= targetCount;
}

function pickBoughtFreeSpinsScatterCount()
{
	const totalWeight = BOUGHT_FREESPINS_SCATTER_4_WEIGHT + BOUGHT_FREESPINS_SCATTER_5_WEIGHT + BOUGHT_FREESPINS_SCATTER_6_WEIGHT;
	let roll = randomInt(1, totalWeight);
	roll -= BOUGHT_FREESPINS_SCATTER_4_WEIGHT;
	if (roll <= 0)
		return 4;
	roll -= BOUGHT_FREESPINS_SCATTER_5_WEIGHT;
	if (roll <= 0)
		return 5;
	return 6;
}

function forceBoughtFreeSpinsScatterBoard()
{
	if (!currentGridConfig || !g_runtime?.objects?.symbols)
		return false;

	const symbolsObject = g_runtime.objects.symbols;
	if (!symbolsObject.getAnimation("Scatter"))
		return false;

	const aliveSymbols = [];
	for (const column of currentGridConfig.columns)
	{
		for (const inst of column)
		{
			if (isInstanceAlive(inst))
				aliveSymbols.push(inst);
		}
	}
	if (aliveSymbols.length < FREE_SPINS_TRIGGER_SCATTERS)
		return false;

	const availableAnimations = getAvailableSymbolAnimations(symbolsObject);
	const nonScatterAnimations = availableAnimations.filter(name => name !== "Scatter");
	if (!nonScatterAnimations.length)
		return false;

	const targetScatterCount = Math.min(pickBoughtFreeSpinsScatterCount(), aliveSymbols.length);
	shuffleInPlace(aliveSymbols);
	const scatterUids = new Set(aliveSymbols.slice(0, targetScatterCount).map(inst => inst.uid));

	for (const inst of aliveSymbols)
	{
		const previousAnimationName = getCurrentAnimationName(inst);
		const nextAnimationName = scatterUids.has(inst.uid)
			? "Scatter"
			: pickRandom(nonScatterAnimations);
		inst.setAnimation(nextAnimationName, "beginning");
		symbolAnimationMap.set(inst.uid, nextAnimationName);
		syncMultiplierForSymbol(inst, nextAnimationName, previousAnimationName);
	}

	const finalScatterCount = countSymbolsOnScreen("Scatter");
	return finalScatterCount === targetScatterCount && finalScatterCount >= FREE_SPINS_TRIGGER_SCATTERS;
}

function canGuaranteeBoughtFreeSpinsTrigger()
{
	if (!currentGridConfig || !g_runtime?.objects?.symbols)
		return false;

	const symbolsObject = g_runtime.objects.symbols;
	if (!symbolsObject.getAnimation("Scatter"))
		return false;

	let aliveCount = 0;
	for (const column of currentGridConfig.columns ?? [])
	{
		for (const inst of column)
		{
			if (isInstanceAlive(inst))
				aliveCount++;
		}
	}

	return aliveCount >= FREE_SPINS_TRIGGER_SCATTERS;
}

;
