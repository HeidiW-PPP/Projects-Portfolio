# Heidi W. Portfolio — Three.js Card Stack

## Project Goal
Personal portfolio site as a single `index.html`. A 3D diagonal card stack — cards fan from lower-left (large/near) to upper-right (small/far), like a conveyor belt you scroll through. Live at: `https://heidyw-ppp.github.io/Projects/`

## Reference Images
- `NewReference.png` — original unveil.fr reference

## How to Screenshot
```bash
node screenshot.js
```
Output: `ss_v10.png`. Requires Node.js + Puppeteer (`npm install` if needed). Opens `http://localhost:8765/` — do NOT use `file://`.

## Current State (as of 2026-06-18)

**✅ Working:**
- Three.js r155 loaded locally from `three.min.js`
- 20 tiles, all with real images from `tile_images/`, data driven from `projects.js`
- Diagonal stack from lower-left (large) to upper-right (small), angle ~50°
- Smooth scroll with easing (`deltaY / 320`), snap to integer after 240ms idle
- No pop on entry/exit — frustum culling disabled, fold threshold = 13
- Cards slide right on hover (lerp 0.05, offset 1.1) with smooth easing
- Rounded image corners (`ShapeGeometry` with r=0.09, UV-remapped)
- Dark background with purple diagonal streak effect + dot grid overlay
- Nav rebranded: "HEIDI W. — PROJECTS PORTFOLIO" + "CONTACT" buttons
- Nav buttons and bottom OVERVIEW/INDEX labels scale up on hover (spring easing)
- Click on card navigates to `project.html?id=project-XX`
- `project.html` — dark-themed detail page, reads from `projects.js`
- `.gitignore` in place, deployed to GitHub Pages

**⏳ Next session:**
- Fill in real project data in `projects.js` — 2-year project roadmap planned, projects will align with coursework
- First portfolio project in progress: `Diagnostic Feature Analysis` (Summer 2026) — see `C:\Users\Heidi Reneau\OneDrive\Desktop\Projects\Diagnostic Feature Analysis`

## Portfolio Project Roadmap

Projects planned to align with coursework over junior/senior years at UNCC (CS BA, Bioinformatics concentration + Software Dev & Data Science minors).

| Semester | Course(s) | Project |
|----------|-----------|---------|
| Summer 2026 | — | **Breast Cancer Diagnostic Feature Analysis** — Python EDA + ML on Wisconsin Breast Cancer dataset. Repo: `HeidiW-PPP/Diagnostic-Feature-Analysis` |
| Fall 2026 | BINF 3101 + ITSC 3160 | DNA sequence database — SQL schema + Python query tool |
| Spring 2027 | ITIS 4166 + BINF 2111 | Bioinformatics REST API |
| Fall 2027 | BINF 3201 + ITCS 3162 | Genomics pipeline + ML classifier on biological data |
| Spring 2028 | BINF 4211 + Capstone | Applied ML on genomics data — flagship project |

## Technical Architecture

### Files
```
index.html        — main portfolio (single file, all inline)
projects.js       — project data array (edit this to add/update projects)
project.html      — detail page template (reads ?id= from URL)
three.min.js      — Three.js r155 local copy
tile_images/      — 20 tile images (tile1.jpg … tile20.jpg/png/webp)
screenshot.js     — Puppeteer screenshot tool
```

### Three.js Setup
```javascript
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.01, 100);
camera.position.set(3.5, 1.8, 8.0);
camera.lookAt(0.3, 0.0, -3.5);

const STEP = new THREE.Vector3(0.26, 0.52, -1.10);
// Each card shifts: +0.26 right, +0.52 up, -1.10 into scene
```

### Card Geometry (per tile)
Each `THREE.Group` contains:
1. **Face** — `roundedRect(w, h, 0.09)` ShapeGeometry, image texture, UV-remapped to [0,1]
   - `frustumCulled = false` on group + all children

### Rounded Rect Helper
```javascript
function roundedRect(w, h, r) {
  const shape = new THREE.Shape();
  // ... quadratic curves at each corner ...
  const geo = new THREE.ShapeGeometry(shape, 6);
  // UV fix: remap from shape-space to [0,1]
  const uvs = geo.attributes.uv;
  for (let i = 0; i < uvs.count; i++) {
    uvs.setXY(i, (uvs.getX(i) + w/2) / w, (uvs.getY(i) + h/2) / h);
  }
  return geo;
}
```

### Scroll + Hover Logic
```javascript
let scrollPos = 0, target = 0;
let hoveredIdx = -1;
const hoverOffsets = new Array(N).fill(0);

// Each frame:
scrollPos += (target - scrollPos) * 0.10;

// Per card:
const base = Math.round(scrollPos);
const frac = scrollPos - base;
let slot = posMod(i - base, N);
if (slot > 13) slot -= N;   // fold threshold 13 (not N/2) — keeps far cards off-screen cleanly
const s = slot - frac;
hoverOffsets[i] += ((i === hoveredIdx ? 1 : 0) - hoverOffsets[i]) * 0.05;
groups[i].position.set(STEP.x * s + hoverOffsets[i] * 1.1, STEP.y * s, STEP.z * s);
```

### Background
Pure CSS layered divs at `z-index:0` behind WebGL canvas (`z-index:1`, `alpha:true`):
- Base: `#000`
- `#bg-radial`: dark grey radial gradient from top-left with CSS mask fade
- 5 `.streak` divs: purple `rgb(138,50,220)` linear gradient + `skewX(45deg)` + CSS mask patterns
- `#bg-dots`: radial dot grid, 20px repeat, 20% opacity

### Nav
```html
<div class="nav-item">HEIDI W. — PROJECTS PORTFOLIO</div>
<div class="nav-item">CONTACT</div>
```
Hover: `transform: scale(1.08)` with spring cubic-bezier easing.

### projects.js Format
```javascript
{
  id: 'project-01',      // used for project.html?id=
  title: 'Project Name',
  subtitle: 'One line description',
  img: 'tile_images/tile1.jpg',
  w: 1.85, h: 2.50,      // card dimensions in world units — DO NOT change
  tags: ['Python', 'React'],
  year: '2026',
  github: 'https://github.com/...',
  live: '',
  description: 'Full write-up here.',
  images: [],
}
```

## Commands Reference
```bash
# Screenshot (kills any server on 8765 first)
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
