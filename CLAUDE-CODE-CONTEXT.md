# THE GLASS WILD — Claude Code Project Context
## Comprehensive Handoff Document
## February 2026

---

# EXECUTIVE SUMMARY

**The Glass Wild** is a photorealistic ecosystem simulation where players design, build, and nurture living terrariums, aquariums, paludariums, and reef tanks. Starting with a small desktop enclosure, players progress to room-sized biodomes with hundreds of species across terrestrial, freshwater, brackish, and saltwater environments.

**Platform:** Web-based (Three.js)
**Art Style:** Semi-realistic (AI-generated models via Meshy.ai)
**Genre:** Sandbox simulation toy (not a progression game)
**Species Target:** 503 total species (18 JSON files created so far)

---

# TECHNICAL DECISIONS

## Stack
- **Frontend:** Three.js for 3D rendering
- **Language:** JavaScript/TypeScript
- **Build Tool:** Vite (recommended)
- **3D Models:** GLB/GLTF format (exported from Meshy.ai)
- **Data:** JSON files for all species definitions (~350 fields per species)
- **Persistence:** LocalStorage for MVP, cloud sync later

## Architecture

```
┌─────────────────────────────────────┐
│  Three.js Rendering Layer           │
│  - Glass enclosure with refraction  │
│  - PBR materials and lighting       │
│  - Procedural animations            │
│  - Camera controls (orbit, zoom)    │
│  - Post-processing (bloom, DOF)     │
└─────────────────────────────────────┘
                 ↑
┌─────────────────────────────────────┐
│  Simulation Engine                  │
│  - Creature AI & behaviors          │
│  - Needs system (hunger, stress)    │
│  - Environment parameters           │
│  - Species compatibility matrix     │
│  - Population dynamics              │
└─────────────────────────────────────┘
                 ↑
┌─────────────────────────────────────┐
│  Data Layer                         │
│  - 503 species JSON definitions     │
│  - ~350 fields per species          │
│  - Organized by category/subcategory│
└─────────────────────────────────────┘
                 ↑
┌─────────────────────────────────────┐
│  Persistence Layer                  │
│  - Save/load terrarium states       │
│  - Creature individual data         │
│  - Unlocked content                 │
└─────────────────────────────────────┘
```

## Model Pipeline
1. User generates 3D models in Meshy.ai (text/image to 3D)
2. Export as GLB with textures
3. Import into Three.js project
4. Claude Code adds procedural animations
5. Wire up to simulation behaviors

---

# DESIGN PILLARS

These guide every decision:

## 1. Authenticity
Everything behaves like real life. Species have real requirements. Water chemistry follows real rules. The game teaches actual husbandry through play.

## 2. Emergence
No scripted events. Behavior emerges from systems interacting. Population booms happen because conditions were right. Don't script outcomes—build systems that create them.

## 3. Observation
Watching is playing. The core loop is looking at your enclosure and noticing things. Camera controls must make close observation satisfying.

## 4. Consequence
Decisions matter. Add incompatible species and watch the consequences unfold. The simulation respects player choices by making them meaningful.

## 5. Beauty
Visual quality is essential—this is the hook. Realistic glass refraction, proper lighting, detailed creatures. AI-generated models should be semi-realistic quality.

## 6. Scalable Complexity
Simple at small scale, complex at large scale. A beginner can succeed with isopods. A veteran can manage room-sized ecosystems.

---

# CORE GAMEPLAY LOOP

**NOT a progression game. A sandbox simulation toy.**

```
Observe → Notice something → Decide to intervene (or not) → See result → Repeat
```

- No win/lose state
- No forced progression
- Player experiments freely
- Ecosystem responds realistically
- New content unlocks organically through play
- "What happens if I put these together?" energy

---

# ENCLOSURE TIERS

| Tier | Name | Dimensions | Volume | Key Unlocks |
|------|------|------------|--------|-------------|
| 1 | Small | 18" cube | ~27 gal | Starting terrarium, nano reef (soft coral) |
| 2 | Medium | 24" cube | ~60 gal | Full nano reef, small paludarium |
| 3 | Large | 36" x 24" x 36" | ~135 gal | Mixed reef, full paludarium |
| 4 | Extra Large | 48" x 36" x 48" | ~360 gal | SPS reef, specialty setups |
| 5 | Walk-In | 6' x 6' x 6' | ~1,600 gal | Birds unlock, multi-zone |
| 6 | Room | 10' x 10' x 10' | ~7,500 gal | Mammals unlock, complete freedom |

---

# ENVIRONMENT TYPES

| Type | Description | Examples |
|------|-------------|----------|
| Terrestrial | Land-only enclosure | Tropical vivarium, arid desert |
| Freshwater Aquatic | Freshwater-only tank | Planted tank, cichlid tank |
| Saltwater Aquatic | Marine-only tank | Reef tank, FOWLR |
| Brackish Aquatic | Mixed salinity water | Mangrove, fiddler crab habitat |
| Paludarium | Land + freshwater hybrid | Riparian, waterfall setups |
| Marine Paludarium | Land + saltwater | Mangrove reef, tidal zone |

---

# SPECIES DATA SYSTEM

## Current Progress
- **18 of 503 species complete** (3.6%)
- Cleanup Crew: 9/9 ✅ COMPLETE
- Display Invertebrates: 9/18 (50%)

## File Structure
```
species-data/
├── SCHEMA.md              # Full field definitions (~350 fields)
├── _progress.json         # Tracks completion status
├── terrestrial/
│   ├── cleanup-crew/      # 9 species ✅
│   ├── invertebrates/     # 9 of 18 species
│   ├── amphibians/
│   │   ├── dart-frogs/
│   │   ├── tree-frogs/
│   │   └── other/
│   ├── reptiles/
│   ├── birds/
│   ├── mammals/
│   └── plants/
├── freshwater/
│   ├── fish/
│   ├── invertebrates/
│   └── plants/
├── brackish/
└── saltwater/
    ├── fish/
    ├── invertebrates/
    ├── anemones/
    └── corals/
```

## Schema Overview (~350 fields per species)

| Section | Fields | Purpose |
|---------|--------|---------|
| Identity | 13 | ID, names, tier, difficulty, price |
| Physical | 19 | Size, lifespan, colors, morphs |
| Environment | 35 | Temperature, humidity, substrate, lighting |
| Water Parameters | 30 | pH, salinity, calcium (aquatic only) |
| Diet & Feeding | 35 | Food types, hunting style, feeding schedule |
| Social Structure | 32 | Group size, hierarchy, territory |
| Reproduction | 40 | Breeding, eggs, parental care |
| Behavior & Activity | 50 | Movement, sleep, exploration |
| Stress & Health | 35 | Stress sources, diseases, hardiness |
| Personality | 12 | Boldness, aggression, curiosity ranges |
| Compatibility | ~15/entry | Interactions with other species |
| Aggression & Combat | 18 | Attack/defense behaviors |
| Communication | 14 | Vocalizations, visual signals |
| Special Abilities | 15 | Camouflage, venom, regeneration |
| Animations | 15 | Required animation states |
| Category-Specific | 20-30 | Coral growth, fish reef-safety, etc. |

---

# MVP REQUIREMENTS

## Phase 1: Beautiful Empty Terrarium
- [ ] Glass enclosure with realistic refraction
- [ ] Proper lighting (ambient + directional)
- [ ] Camera controls (orbit, zoom, pan)
- [ ] Ground/substrate
- [ ] Basic environment (rocks, plants—can be procedural)

## Phase 2: First Creature
- [ ] Load GLB model from Meshy
- [ ] Procedural walking animation
- [ ] Basic AI: wander, rest, eat
- [ ] Needs system: hunger decreases over time
- [ ] Stress system: responds to environment

## Phase 3: Ecosystem
- [ ] Multiple creatures
- [ ] Predator/prey interactions
- [ ] Population dynamics
- [ ] Food chain (springtails → isopods → frog)
- [ ] Environmental parameters affect creatures

## Phase 4: Player Interaction
- [ ] Feed button (spawn food)
- [ ] Mist button (increase humidity)
- [ ] Inspect creature (click to see stats)
- [ ] Time controls (pause, 1x, 5x, 10x)
- [ ] Save/load functionality

---

# ANIMATION APPROACH

Since models from Meshy are static (no rigging), use **procedural animation**:

## Isopods/Insects
- **Legs:** Alternating tripod gait calculated via code
- **Antennae:** Sine wave oscillation, react to nearby objects
- **Body:** Subtle segment flexing during movement
- **Defense:** Morph into ball shape when stressed (isopods)

## Frogs
- **Idle:** Breathing animation (scale thorax)
- **Movement:** Hop with anticipation squash/stretch
- **Hunting:** Freeze → tongue strike (fast scale animation)
- **Calling:** Throat pouch inflation

## Fish
- **Swimming:** Sine wave along spine
- **Fins:** Secondary motion following body
- **Schooling:** Boids algorithm for group movement

## General Principles
- Use bone-based transforms on mesh vertices
- Or simpler: translate/rotate/scale body parts
- Physics for secondary motion (antennae, tails)
- State machine drives which animation plays

---

# THREE.JS SPECIFIC GUIDANCE

## Recommended Libraries
```json
{
  "three": "latest",
  "postprocessing": "for bloom, DOF",
  "tweakpane": "debug UI",
  "gsap": "smooth animations"
}
```

## Key Features Needed

### Glass Material
```javascript
// Transmission material for realistic glass
new THREE.MeshPhysicalMaterial({
  transmission: 1,
  thickness: 0.5,
  roughness: 0,
  metalness: 0,
  ior: 1.5,
  envMapIntensity: 1
})
```

### Model Loading
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
const loader = new GLTFLoader()
loader.load('models/isopod.glb', (gltf) => {
  scene.add(gltf.scene)
})
```

### Procedural Animation Pattern
```javascript
class Creature {
  constructor(model, speciesData) {
    this.model = model
    this.species = speciesData
    this.state = 'idle'
    this.needs = { hunger: 100, stress: 0 }
  }
  
  update(delta) {
    this.updateNeeds(delta)
    this.updateBehavior(delta)
    this.updateAnimation(delta)
  }
  
  updateAnimation(delta) {
    // Procedural leg movement, etc.
  }
}
```

---

# PROJECT STRUCTURE (RECOMMENDED)

```
glass-wild/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js                 # Entry point
│   ├── scene/
│   │   ├── Terrarium.js        # Enclosure, glass, lighting
│   │   ├── Camera.js           # Orbit controls
│   │   └── Environment.js      # Substrate, plants, decor
│   ├── creatures/
│   │   ├── Creature.js         # Base class
│   │   ├── ProceduralAnim.js   # Animation utilities
│   │   └── behaviors/
│   │       ├── Wander.js
│   │       ├── Hunt.js
│   │       └── Flee.js
│   ├── simulation/
│   │   ├── Ecosystem.js        # Main simulation loop
│   │   ├── NeedsSystem.js      # Hunger, stress, etc.
│   │   └── Compatibility.js    # Species interactions
│   ├── data/
│   │   └── species/            # All 503 JSON files
│   ├── ui/
│   │   ├── HUD.js
│   │   └── Inspector.js
│   └── utils/
│       ├── math.js
│       └── helpers.js
├── public/
│   └── models/                 # GLB files from Meshy
└── README.md
```

---

# WORKING WITH THE USER

## User's Role
- Generate 3D models in Meshy.ai
- Creative direction (what looks right)
- Testing and feedback
- Upload models to project

## Claude Code's Role
- All Three.js code
- Simulation systems
- Procedural animations
- UI/UX implementation
- Integrating species JSON data

## Communication Style
- User is technical but new to 3D/game dev
- Prefers seeing results quickly over long explanations
- Wants "vibe coding" — you build, they direct
- Iterate fast, polish later

---

# REFERENCE DOCUMENTS

The user has these documents in their project files:

1. **the-glass-wild-gdd-v3.docx** — Full game design document
2. **glass-wild-instructions.docx** — Project context and instructions
3. **glass-wild-master-species-list.md** — All 503 species listed
4. **SCHEMA.md** — Complete field definitions for species JSON

---

# IMMEDIATE NEXT STEPS

1. **Set up project** — Vite + Three.js boilerplate
2. **Build terrarium** — Glass box with lighting
3. **Add camera controls** — Orbit, zoom, inspect
4. **Create model loader** — Ready for Meshy GLBs
5. **Build basic creature class** — With procedural animation hooks
6. **Wait for user's first model** — Then bring it to life!

---

# SUCCESS CRITERIA

The MVP is successful when:
- ✅ Beautiful glass terrarium renders in browser
- ✅ User can orbit camera smoothly
- ✅ At least one Meshy creature walks around
- ✅ Creature has basic needs (hunger depletes)
- ✅ User can feed the creature
- ✅ Save/load works
- ✅ It feels alive and fun to watch

---

**This document should give Claude Code full context to begin building The Glass Wild.**
