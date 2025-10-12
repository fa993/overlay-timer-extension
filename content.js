console.log(
	'[OverlayTimer] ✅ content.js injected into:',
	window.location.href
);

class QTracker {
	/**
	 * @param {number} secondsPerQuestion - Number of seconds per question
	 * @param {function} onUpdateCallback - Optional function called with getStatus() every second
	 */
	constructor(secondsPerQuestion, onUpdateCallback = null) {
		if (!secondsPerQuestion || secondsPerQuestion <= 0) {
			throw new Error('secondsPerQuestion must be a positive number');
		}

		this.secondsPerQuestion = secondsPerQuestion;
		this.expectedQ = 1;
		this.actualQ = 1;
		this.startTime = null;
		this.elapsedSeconds = 0;
		this._intervalId = null;
		this._onUpdateCallback = onUpdateCallback;

		console.log(
			`[QTracker] Initialized with ${secondsPerQuestion}s per question.`
		);
	}

	// Start the tracker
	start() {
		if (this._intervalId) {
			console.warn('[QTracker] Already running.');
			return;
		}

		this.startTime = Date.now();
		this._intervalId = setInterval(() => this._update(), 500);

		console.log('[QTracker] Timer started.');
	}

	// Stop the tracker
	stop() {
		if (!this._intervalId) {
			console.warn('[QTracker] Not running.');
			return;
		}

		clearInterval(this._intervalId);
		this._intervalId = null;

		console.log('[QTracker] Timer stopped.');
	}

	isRunning() {
		return this._intervalId !== null;
	}

	// Reset tracker
	reset() {
		this.stop();
		this.expectedQ = 1;
		this.actualQ = 1;
		this.elapsedSeconds = 0;
		this.startTime = null;

		console.log('[QTracker] Tracker reset.');
	}

	// Update elapsed time & expected question number
	_update() {
		if (!this.startTime) return;
		this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
		this.expectedQ =
			Math.floor(this.elapsedSeconds / this.secondsPerQuestion) + 1;

		console.debug(
			`[QTracker] Elapsed: ${this.elapsedSeconds}s | Expected Q: ${this.expectedQ} | Actual Q: ${this.actualQ}`
		);

		this._callUpdateCallback();
	}

	// Increment actual question count
	nextQuestion() {
		this.actualQ++;
		console.log(`[QTracker] Moved to next question: ${this.actualQ}`);
		this._callUpdateCallback();
	}

	_callUpdateCallback() {
		// Call the callback if provided
		if (typeof this._onUpdateCallback === 'function') {
			this._onUpdateCallback(this.getStatus());
		}
	}

	// Manually set actual question
	setActualQ(qNum) {
		if (qNum < 0) {
			console.warn('[QTracker] Question number cannot be negative.');
			return;
		}
		this.actualQ = qNum;
		console.log(`[QTracker] Actual question set to: ${this.actualQ}`);
	}

	// Return current state
	getStatus() {
		return {
			elapsedSeconds: this.elapsedSeconds,
			expectedQ: this.expectedQ,
			actualQ: this.actualQ,
			secondsPerQuestion: this.secondsPerQuestion,
		};
	}
}

function getContrastColor(rgb) {
	// Parse "rgb(r,g,b)"
	const match = rgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
	if (!match) return '#00ffcc'; // fallback
	const r = parseInt(match[1], 10);
	const g = parseInt(match[2], 10);
	const b = parseInt(match[3], 10);

	// Compute luminance
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

	// Light background → dark text, dark background → light text
	return luminance > 0.5 ? '#000000' : '#ffffff';
}

let overlay = null;
let timerEl = null;
let qTracker = null;
var line1El = null;
var line2El = null;

// Create overlay
function createOverlay() {
	if (overlay) {
		console.warn('[OverlayTimer] Overlay already exists, skipping creation.');
		return;
	}

	console.log('[OverlayTimer] Creating overlay...');

	overlay = document.createElement('div');
	// overlay.id = "overlay-timer-container";
	// overlay.style.position = "fixed";
	// overlay.style.top = "0";
	// overlay.style.left = "0";
	// overlay.style.width = "100%";
	// overlay.style.height = "100%";
	// overlay.style.background = "rgba(10, 10, 10, 0.3)";
	// overlay.style.zIndex = "999999";
	// overlay.style.display = "flex";
	// overlay.style.justifyContent = "center";
	// overlay.style.alignItems = "center";
	// overlay.style.color = "#00ffcc";
	// overlay.style.fontSize = "5em";
	// overlay.style.fontFamily = "'Courier New', monospace";
	// overlay.style.backdropFilter = "blur(3px)";
	// overlay.style.pointerEvents = "none"; // makes it click-through

	overlay.id = 'overlay-timer-container';
	overlay.style.position = 'fixed';
	overlay.style.top = '10px'; // 🔹 top-left position
	overlay.style.left = '15px';
	overlay.style.zIndex = '999999';
	overlay.style.color = '#00ffcc';
	overlay.style.fontSize = '2em';
	overlay.style.fontFamily = "'Courier New', monospace";
	overlay.style.pointerEvents = 'none'; // click-through
	overlay.style.background = 'transparent'; // no blur or shading
	overlay.style.padding = '5px 10px';
	overlay.style.borderRadius = '6px';
	overlay.style.backdropFilter = 'blur(3px)';

	const bodyStyle = window.getComputedStyle(document.body);
	const bgColor = bodyStyle.backgroundColor || 'rgb(255,255,255)';

	overlay.style.color = getContrastColor(bgColor);

	timerEl = document.createElement('div');
	timerEl.id = 'timer-display';
	timerEl.textContent = '00:00';

	line1El = document.createElement('div');
	line1El.id = 'line1-display';
	line1El.textContent = 'You are behind by';

	line2El = document.createElement('div');
	line2El.id = 'line2-display';
	line2El.textContent = 'Actual Q: Expected Q';

	overlay.appendChild(timerEl);
	overlay.appendChild(line1El);
	overlay.appendChild(line2El);

	// ✅ Append overlay to the very top of DOM
	document.documentElement.appendChild(overlay);

	qTracker = new QTracker(90, updateTimer);
	qTracker.start();
	isRunning = true;

	console.log('[OverlayTimer] Overlay created and timer started.');
}

// Remove overlay
function removeOverlay() {
	if (!overlay) {
		console.warn('[OverlayTimer] Tried to remove overlay, but none exists.');
		return;
	}

	console.log('[OverlayTimer] Removing overlay...');

	qTracker.stop();
	overlay.remove();
	overlay = null;
	isRunning = false;

	console.log('[OverlayTimer] Overlay removed.');
}

// Update timer text
function updateTimer(status) {
	const elapsed = status.elapsedSeconds;
	const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
	const secs = String(elapsed % 60).padStart(2, '0');
	timerEl.textContent = `${mins}:${secs}`;
	console.debug('[OverlayTimer] Timer updated:', timerEl.textContent);

	const diff = status.actualQ * status.secondsPerQuestion - elapsed;

	// if (diff < 0) {
	// 	line1El.textContent = `You are behind by ${Math.abs(diff)}s`;
	// } else {
	// 	line1El.textContent = `You are ahead by ${Math.abs(diff)}s`;
	// }

	line1El.textContent = `Time left: ${diff}s`;

	line2El.textContent = `Actual Q: ${status.actualQ} Expected Q: ${status.expectedQ}`;
}

// Listen for Enter key toggles
window.addEventListener('keydown', (e) => {
	const active = document.activeElement;
	const isTyping =
		active &&
		(active.tagName === 'INPUT' ||
			active.tagName === 'TEXTAREA' ||
			active.isContentEditable);

	if (e.key === 's' && !isTyping) {
		console.log(
			'[OverlayTimer] S key detected. isRunning =',
			qTracker?.isRunning()
		);
		qTracker?.isRunning() ? removeOverlay() : createOverlay();
	}

	if (e.key === 'Enter' && qTracker?.isRunning()) {
		qTracker?.nextQuestion();
	}
});
