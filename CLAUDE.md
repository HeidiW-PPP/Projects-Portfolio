# UNVEIL Portfolio — Three.js Card Stack

## Project Goal
Recreate the unveil.fr portfolio site as a single `index.html`. The site is a 3D diagonal card stack — cards fan from lower-left (large/near) to upper-right (small/far), like a conveyor belt you scroll through.

## Reference Images
- `NewReference.png` — **primary reference**
- Near card exits via bottom edge, center-left (~25% from left). Far cards exit via top edge, center-right (~75% from left). ~10–12 cards visible. Diagonal angle ~48–54° from horizontal.

## How to Screenshot
```bash
node screenshot.js
```
Output: `ss_v10.png`. Requires Node.js + Puppeteer (`npm install` if needed). Opens `http://localhost:8765/` — do NOT use `file://`.

## Current State (as of 2026-06-17)

**✅ Working:**
- Three.js r155 loaded locally from `three.min.js`
- 20 tiles: 6 real images + 14 gradient glass tiles, interleaved
- Camera above-right shows right + top glass edges on every card
- Diagonal stack from lower-left (large) to upper-right (small), angle ~50°
- Scroll with easing (`deltaY / 320`), snap to integer after 240ms idle
- Glass opacity: 0.55

**❌ Remaining issues (priority order):**
1. **Pop on entry/exit** — Cards snap into/out of view instead of sliding from a corner. Fix: `grp.frustumCulled = false` on every group + traverse children.
2. **Glass tile appearance** — Try opacity 0.65–0.70 to feel more like frosted glass.
3. **Edge strip polish** — `EDGE = 0.10`. Try `color: 0xfffaef, opacity: 0.92` for warm-white edge.
4. **Font** — Currently Barlow. Original uses `nb_international_proregular`. Add if file available locally.

## Technical Architecture

### File: `index.html`
Single file, all inline:
```
<header class="nav">       — UNVEIL ® PROJECTS | RESEARCH | STUDIO | CONTACT
<canvas id="c">            — Three.js WebGL canvas (position: fixed, inset: 0)
<div class="bottom-nav">   — OVERVIEW | INDEX
<script src="three.min.js"> + inline script
```

### Three.js Setup
```javascript
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.01, 100);
camera.position.set(3.5, 1.8, 8.0);
camera.lookAt(0.3, 0.0, -3.5);

const STEP = new THREE.Vector3(0.20, 0.40, -0.85);
// Each card shifts: +0.20 right, +0.40 up, -0.85 into scene
// Diagonal ≈ 50° from horizontal on screen

const EDGE = 0.10;  // glass edge thickness in world units
```

### Card Geometry (per tile)
Each `THREE.Group` contains:
1. **Face plane** — `PlaneGeometry(w, h)`, image or gradient texture
2. **Top border** — thin white line on face surface (z-offset 0.002)
3. **Left border** — thin white line on face surface (z-offset 0.002)
4. **Right glass edge** — `PlaneGeometry(EDGE, h)`, `rotation.y = +Math.PI/2`, at `x = w/2`
5. **Top glass edge** — `PlaneGeometry(w, EDGE)`, `rotation.x = -Math.PI/2`, at `y = h/2`

**CRITICAL rotations:**
- Right edge: `rotation.y = +π/2` → normal faces +X. DO NOT use -π/2.
- Top edge: `rotation.x = -π/2` → normal faces +Y. DO NOT use +π/2.

### Scroll Logic
```javascript
let scrollPos = 0, target = 0;

// Each frame:
scrollPos += (target - scrollPos) * 0.10;

// Per card:
const base = Math.round(scrollPos);
const frac = scrollPos - base;
let slot = posMod(i - base, N);
if (slot > N / 2) slot -= N;   // fold: slot range -(N/2)…+(N/2)
const s = slot - frac;
groups[i].position.set(STEP.x * s, STEP.y * s, STEP.z * s);
```

### Tile Array
N = 20. Slot assignment at scroll=0:
- `i = 19` → `slot = -1` (near card, partially off-screen lower-left)
- `i = 0`  → `slot = 0` (first fully-visible card)

Image tiles at indices: 0, 1, 3, 4, 6, 19.
Glass tiles: all others. `transparent: true, opacity: 0.55, depthWrite: true`.

## Fix Plan: Pop Issue (Priority 1)

### Problem
Three.js frustum culls each `Group` via bounding sphere. The cull is binary — a card vanishes in one frame rather than sliding off the edge.

### Solution
Disable frustum culling on every group and its children. The slot math still moves cards off-screen; Three.js always submits draw calls, GPU clips off-screen triangles harmlessly.

```javascript
// In TILES.forEach, right before scene.add(grp):
grp.traverse(obj => { obj.frustumCulled = false; });
scene.add(grp);
```

### Verification
1. `node screenshot.js` — static frame should look identical to before
2. Open `http://localhost:8765/` and scroll slowly
3. Cards should enter from the bottom-left as a small corner, grow smoothly as you scroll
4. Cards should shrink to a tiny corner at the top-right, then disappear cleanly
5. No flash, pop, or teleport at any scroll speed

## Commands Reference
```bash
# Screenshot
node screenshot.js

# Dev server
node -e "
const http=require('http'),fs=require('fs'),path=require('path');
const s=http.createServer((req,res)=>{
  const f=path.join(__dirname,req.url==='/'?'index.html':req.url);
  try{res.end(fs.readFileSync(f))}catch{res.writeHead(404);res.end()}
});
s.listen(8765,()=>console.log('http://localhost:8765/'));
"
```

## Comparison Workflow
1. Edit `index.html`
2. `node screenshot.js` → `ss_v10.png`
3. Read `ss_v10.png` and `NewReference.png` side by side
4. List specific mismatches
5. Fix and repeat — minimum 2 rounds before stopping
