# THE GLASS WILD
## Complete Game Design & Technical Specification Document
### Version 1.0 | February 2026

---

# TABLE OF CONTENTS

1. PART 1: VISION & IDENTITY
2. PART 2: GAME SYSTEMS OVERVIEW
3. PART 3: ENVIRONMENT SIMULATION
4. PART 4: CREATURE SYSTEMS
5. PART 5: CREATURE INTERACTIONS
6. PART 6: PLANT SYSTEMS
7. PART 7: PLAYER INTERACTION
8. PART 8: PROGRESSION SYSTEM
9. PART 9: USER INTERFACE
10. PART 10: TECHNICAL ARCHITECTURE
11. PART 11: CONTENT SPECIFICATION
12. PART 12: DEVELOPMENT ROADMAP
13. APPENDICES
    - Appendix A: Complete Species List (503 Species)
    - Appendix B: Species JSON Schema Reference
    - Appendix C: Unlock Table
    - Appendix D: XP Values Table
    - Appendix E: Equipment Stats
    - Appendix F: Glossary

---

# PART 1: VISION & IDENTITY

## 1.1 Executive Summary

### The Pitch

**The Glass Wild** is a web-based photorealistic ecosystem simulation where players design, build, and nurture living terrariums, aquariums, paludariums, and reef tanks. Starting with a small 18-inch desktop enclosure, players progress through increasingly complex ecosystems, eventually managing room-sized biodomes with hundreds of species across terrestrial, freshwater, brackish, and saltwater environments.

This is not a casual pet game. This is a deep simulation where every creature has individual needs, personality, and memory. Where ecosystems thrive or collapse based on the player's understanding of real husbandry principles. Where watching is playing, and every death teaches a lesson.

### Core Fantasy

You are a god-like overseer of miniature worlds. You create habitats from nothing, populate them with life, and watch ecosystems emerge from the interactions of your creatures. You don't control the animals—you create the conditions for them to live. When they thrive, you feel pride. When they die, you feel responsibility.

### Target Audience

- **Primary:** Adults 25-45 interested in nature, aquariums, terrariums
- **Secondary:** Simulation game enthusiasts (Dwarf Fortress, RimWorld fans)
- **Tertiary:** Relaxation/ambient game seekers

### Platform & Technology

| Aspect | Choice |
|--------|--------|
| Platform | Web-based (browser) |
| Engine | Three.js (WebGL) |
| Art Style | Semi-realistic (AI-generated via Meshy.ai) |
| Save System | LocalStorage with future cloud sync |

### Key Differentiators

| Feature | The Glass Wild | Typical Pet Games |
|---------|---------------|-------------------|
| Simulation Depth | Real husbandry parameters | Simplified meters |
| Creature AI | Individual personality, memory | Generic behaviors |
| Ecosystem | Emergent food chains, population dynamics | Static populations |
| Failure State | Yes—creatures die, ecosystems collapse | Forgiving or none |
| Visual Quality | Semi-realistic, photographic | Stylized/cartoon |
| Scale | 503 species, 6 enclosure tiers | Limited roster |

---

## 1.2 Design Pillars

These six pillars guide every design decision. When features conflict, refer to these.

### Pillar 1: AUTHENTICITY

Everything behaves like real life. Species have real requirements. Temperature, humidity, pH matter and follow real rules. The game teaches actual husbandry through play.

**In Practice:**
- Species data reflects real-world biology
- Equipment mirrors real husbandry equipment
- Incompatible species react as they would in nature

### Pillar 2: EMERGENCE

No scripted events. Behavior emerges from systems interacting. Population booms happen because conditions support them. Extinctions happen because predation or environment killed them.

**In Practice:**
- We build systems, not scenarios
- Every playthrough differs based on player choices
- Surprising behaviors emerge from system interactions

### Pillar 3: OBSERVATION

Watching is playing. The core gameplay loop is noticing things. The camera system makes close observation satisfying at every scale.

**In Practice:**
- Camera rewards close inspection
- Creatures have subtle behavioral tells
- Environment changes are visible before warnings appear

### Pillar 4: CONSEQUENCE

Decisions matter. The game respects player choices by making them meaningful. No "undo" for creature death.

**In Practice:**
- Adding wrong species has lasting effects
- Neglect causes death, not just "unhappiness"
- Recovery from mistakes takes time

### Pillar 5: BEAUTY

Photorealistic visuals are essential—this is the hook. The terrarium should look like a photograph.

**Technical Commitments:**
- PBR materials on all assets
- Realistic glass refraction
- Dynamic lighting with day/night
- Post-processing stack (bloom, DOF, color grading)

### Pillar 6: SCALABLE COMPLEXITY

Simple at small scale, complex at large scale. A beginner succeeds with isopods. A veteran manages room-sized ecosystems.

**Progression:**
| Tier | Complexity |
|------|------------|
| 1 | 1-3 parameters, hardy species |
| 2-3 | Full parameters, food chains |
| 4-5 | Multiple zones, demanding species |
| 6 | Everything, full simulation |

---

## 1.3 Core Experience

### The Core Loop (Minute-to-Minute)

```
OBSERVE → NOTICE → DECIDE → ACT/WAIT → RESULT → OBSERVE...
```

1. **OBSERVE:** Look at your terrarium
2. **NOTICE:** See something (behavior, warning, opportunity)
3. **DECIDE:** Intervene or let it play out
4. **ACT/WAIT:** Take action or continue watching
5. **RESULT:** See the consequence
6. **OBSERVE:** Continue watching...

### Session Types

| Duration | Activity |
|----------|----------|
| 5 min | Check status, quick adjustments |
| 30 min | Extended observation, building |
| 2 hours | New terrarium setup, troubleshooting |

### What Brings Players Back

| Hook | Mechanism |
|------|-----------|
| Attachment | Named creatures with personality |
| Progression | Unlocking new species and tiers |
| Discovery | Rare behaviors, breeding outcomes |
| Pride | Beautiful, thriving ecosystems |
| Challenge | Harder species, larger ecosystems |
| Relaxation | Ambient watching, low-pressure |

---

# PART 2: GAME SYSTEMS OVERVIEW

## 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            GAME MANAGER                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ SaveManager │ │ XPManager   │ │UnlockManager│ │ Settings    │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
            │   TANK 1    │   │   TANK 2    │   │   TANK 3    │
            │  (active)   │   │  (paused)   │   │  (paused)   │
            └──────┬──────┘   └─────────────┘   └─────────────┘
                   │
    ┌──────────────┼──────────────┬──────────────┬──────────────┐
    ▼              ▼              ▼              ▼              ▼
┌────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ World  │  │Environment│  │ Creature │  │  Plant   │  │Interaction│
│ State  │  │  System   │  │  System  │  │  System  │  │  System  │
└────────┘  └───────────┘  └──────────┘  └──────────┘  └──────────┘
```

## 2.2 The Terrarium

### Enclosure Tiers

| Tier | Name | Dimensions | Volume | Key Unlocks |
|------|------|------------|--------|-------------|
| 1 | Small | 18" cube | ~27 gal | Starting, nano reef (soft coral) |
| 2 | Medium | 24" cube | ~60 gal | Full nano reef, small paludarium |
| 3 | Large | 36" × 24" × 36" | ~135 gal | Mixed reef, full paludarium |
| 4 | Extra Large | 48" × 36" × 48" | ~360 gal | SPS reef, specialty setups |
| 5 | Walk-In | 6' × 6' × 6' | ~1,600 gal | **BIRDS UNLOCK**, multi-zone |
| 6 | Room | 10' × 10' × 10' | ~7,500 gal | **MAMMALS UNLOCK**, complete freedom |

### Environment Types

| Type | Description | Examples |
|------|-------------|----------|
| Terrestrial | Land-only | Tropical vivarium, arid desert |
| Freshwater | Freshwater-only | Planted tank, cichlid tank |
| Saltwater | Marine-only | Reef tank, FOWLR |
| Brackish | Mixed salinity | Mangrove, fiddler crab habitat |
| Paludarium | Land + freshwater | Riparian, waterfall setups |
| Marine Paludarium | Land + saltwater | Mangrove reef, tidal zone |

## 2.3 Time & Simulation

### Time Scale

| Speed | Real Time | Game Time | Use Case |
|-------|-----------|-----------|----------|
| Paused | — | — | Build mode, inspection |
| 1× | 1 second | 1 minute | Close observation |
| 2× | 1 second | 2 minutes | Standard play |
| 5× | 1 second | 5 minutes | Waiting for events |
| 10× | 1 second | 10 minutes | Fast forward |

### Day/Night Cycle

```
00:00-05:00  Night     0-10% light    Nocturnal active
05:00-07:00  Dawn      10-50%         Transition
07:00-18:00  Day       50-100%        Diurnal active
18:00-20:00  Dusk      50-10%         Transition
20:00-24:00  Night     10-0%          Nocturnal active
```

### Multi-Tank Rules

- Only ONE tank active at a time
- Inactive tanks completely paused
- No offline progression
- Switching is instant

---

# PART 3: ENVIRONMENT SIMULATION

## 3.1 Environmental Parameters

### Temperature System

```
Current Temp = Base Temp + Heat Sources - Heat Sinks + Drift

Effects on Creatures:
- Ideal: Normal behavior
- Too cold: Slowed metabolism, seeking heat, stress
- Too hot: Seeking shade, panting, stress
- Critical: Health damage, death risk
```

### Humidity System

```
Humidity decays toward ambient (40%)
Increases from: misting, water features, plants, substrate

Humidity Curve After Misting:
100% ╭─╮
 80% │  ╰──╮
 60% │      ╰───╮
 40% ┴──────────╰────► Time
```

### Lighting System

```javascript
{
  intensity: 0-100,
  spectrum: {
    visible: 0-100,
    uvb: 0-10,        // For reptiles
    actinic: 0-100    // For corals
  },
  photoperiod: {
    sunrise: "07:00",
    sunset: "19:00"
  }
}
```

## 3.2 Equipment System

### Equipment Tiers

**Heating:**
| Tier | Name | Cost | Effect |
|------|------|------|--------|
| Basic | Heat Mat | $20 | +5°F substrate |
| Upgraded | Ceramic Emitter | $50 | +10°F zone |
| Advanced | Thermostat | $80 | Maintains target |
| Premium | Multi-zone Climate | $200 | Multiple zones |

**Lighting:**
| Tier | Name | Cost | Effect |
|------|------|------|--------|
| Basic | Basic LED | $30 | On/off only |
| Upgraded | Timer LED | $60 | Day/night auto |
| Advanced | Full Spectrum | $120 | UVB + visible |
| Premium | Smart Lighting | $250 | Sunrise/sunset sim |

**Misting:**
| Tier | Name | Cost | Effect |
|------|------|------|--------|
| Basic | Spray Bottle | $5 | Manual +40% |
| Upgraded | Misting System | $80 | Timer-based |
| Advanced | Fogger | $120 | Sustained humidity |
| Premium | Humidity Controller | $200 | Automatic |

---

# PART 4: CREATURE SYSTEMS

## 4.1 Creature Data Model

### Species vs Individual

**Species Data (from 503 JSON files):**
- Static properties shared by all members
- Biological constants (size range, lifespan, diet)
- Behavioral tendencies
- Requirements (temperature, humidity, space)

**Individual Data (runtime):**
- Unique ID and optional name
- Current state (health, hunger, age)
- Personality (within species ranges)
- Memory (learned locations, experiences)
- Relationships (mate, offspring, rivals)

### Individual Instance Structure

```javascript
{
  // Identity
  id: "creature_uuid",
  speciesId: "dendrobates_auratus",
  name: "Hoppy",
  
  // Physical
  age: 142,              // days
  lifeStage: "adult",
  size: 3.8,             // cm
  health: 85,            // 0-100
  
  // Needs (0-100, 100 = satisfied)
  needs: {
    hunger: 67,
    thirst: 82,
    stress: 23,
    rest: 71
  },
  
  // Personality (set at birth)
  personality: {
    boldness: 0.7,
    aggression: 0.3,
    curiosity: 0.8,
    activity: 0.6
  },
  
  // Memory
  memory: {
    knownFoodSources: [...],
    knownThreats: [...],
    knownHidingSpots: [...],
    territory: { bounds },
    lastMate: "creature_id"
  },
  
  // Current State
  behavior: {
    current: "hunting",
    target: "prey_id"
  },
  
  // Position
  position: { x, y, z },
  rotation: { x, y, z }
}
```

## 4.2 Needs System

### Need Depletion

| Need | Base Rate/Hour | Modifiers |
|------|----------------|-----------|
| Hunger | -2.0 | Activity, temperature, size |
| Thirst | -3.0 | Temperature, humidity, activity |
| Rest | -1.5 | Activity level, stress |

### Hunger States

| Value | State | Behavior Effect |
|-------|-------|-----------------|
| 80-100 | Satiated | May ignore food |
| 50-79 | Comfortable | Normal |
| 25-49 | Hungry | Increased food-seeking |
| 10-24 | Very Hungry | Food-seeking dominates |
| 1-9 | Starving | Desperate, health damage |
| 0 | Starvation | Death after sustained period |

### Stress Sources

| Stressor | Stress/Hour |
|----------|-------------|
| Temperature outside comfort | 5-15 |
| Humidity outside comfort | 3-10 |
| No hiding spots | 5 |
| Predator visible | 20 |
| Overcrowding | 3-8 |
| No food (24h+) | 5 |
| Aggressive tankmate | 5-15 |

## 4.3 Behavior System

### Priority System

| Priority | Category | Behaviors | Trigger |
|----------|----------|-----------|---------|
| 1 (highest) | Survival | Flee predator | Predator detected |
| 2 | Survival | Find water | Thirst < 20 |
| 3 | Survival | Find food | Hunger < 25 |
| 4 | Comfort | Seek temperature | Temp comfort < 40 |
| 5 | Comfort | Find hide | Stress > 60 |
| 6 | Comfort | Rest | Rest < 30 |
| 7 | Social | Find mate | Breeding conditions met |
| 8 | Social | Territorial patrol | Has territory |
| 9 | Exploration | Investigate | New object detected |
| 10 (lowest) | Idle | Wander | No other needs |

### Memory System

| Memory Type | Duration | Effect |
|-------------|----------|--------|
| Food source | 7 days | Returns to successful spots |
| Water source | 14 days | Knows where to drink |
| Threat creature | 3 days | Avoids specific predator |
| Safe hiding spot | 30 days | Returns when stressed |
| Territory | Permanent | Patrols and defends |
| Mate | Until death | Pair bonding |

## 4.4 Lifecycle System

### Life Stages

| Stage | Duration | Characteristics |
|-------|----------|-----------------|
| Egg/Gestation | Species-specific | Immobile, vulnerable |
| Juvenile | 20-40% of lifespan | Small, faster metabolism, can't breed |
| Subadult | 10-20% | Near adult size, can't breed |
| Adult | 40-60% | Full size, can breed |
| Elder | 10-20% | Slower, reduced breeding, health decline |

### Death Causes

| Cause | Condition | Visual |
|-------|-----------|--------|
| Starvation | Hunger = 0 extended | Emaciated, collapse |
| Dehydration | Thirst = 0 extended | Shriveled, collapse |
| Predation | Killed by predator | Attack animation |
| Combat | Territorial fight | Wounds, collapse |
| Old age | Age > max lifespan | Peaceful collapse |
| Environmental | Critical temp/humidity | Distress, collapse |
| Disease | Untreated illness | Progressive symptoms |
| Stress | Sustained 100% stress | Sudden death |

## 4.5 Personality System

### Traits (0-1 scale, randomized within species range)

| Trait | Low | High |
|-------|-----|------|
| Boldness | Hides frequently, flees early | Visible, approaches threats |
| Aggression | Avoids conflict, shares space | Fights over resources |
| Curiosity | Ignores new objects | Investigates changes |
| Activity | Sedentary, moves only when necessary | Constantly moving |

### Inheritance

```
offspring_trait = (parent1 + parent2) / 2 + random_variation(±0.1)
Result clamped to species min/max range
```

---

# PART 5: CREATURE INTERACTIONS

## 5.1 Compatibility Matrix

### Relationship Types

| Type | Description | Outcome |
|------|-------------|---------|
| Predator | Hunts and eats target | Predation events |
| Prey | Hunted by target | Fleeing, death |
| Competitor | Competes for resources | Stress, fighting |
| Territorial | Defends space | Fighting, exclusion |
| Neutral | No interaction | Ignore each other |
| Symbiotic | Mutually beneficial | Bonuses to both |

## 5.2 Predator/Prey System

### Hunting Sequence

```
DETECT → STALK → CHASE → STRIKE → SUCCESS/FAILURE

Success: Prey dies, predator consumes
Failure: Prey escapes, both stressed
```

### Kill Mechanics (Per Design: "As graphic as possible")

- Visible bite/strike contact
- Prey struggles during consumption
- Blood/injury indicators (toggleable in settings)
- Consumption takes time proportional to prey size
- Partial consumption leaves remains

### Prey Escape Factors

| Factor | Effect |
|--------|--------|
| Distance when detected | More distance = more likely escape |
| Speed difference | Faster prey = more likely escape |
| Hiding spots available | Safe destination = likely escape |
| Predator stamina | Low stamina = gives up sooner |

## 5.3 Breeding System

### Breeding Conditions (All must be met)

- Life stage = adult
- Health > 70
- Stress < 40
- Hunger > 50
- Rest > 40
- Environment meets species requirements
- Not recently bred (cooldown)

### Courtship Sequence

```
APPROACH → DISPLAY → RESPONSE → MATING

Display behaviors vary by species:
- Dart frogs: calling, toe-tapping
- Geckos: head bobbing, tail waving
- Birds: song, feather display
- Fish: color intensification, dancing
```

### Offspring

- Inherit personality traits from parents
- Start as juvenile, must survive to adulthood
- Higher metabolism, more vulnerable to predation
- Competition with siblings

### Parental Care Types

| Type | Behavior |
|------|----------|
| None | Eggs/offspring abandoned |
| Egg guarding | Parent stays near eggs |
| Egg tending | Parent maintains conditions |
| Feeding | Parent provides food |
| Transport | Parent carries young (dart frogs) |
| Extended | Parent protects until subadult |

## 5.4 Territorial Behavior

### Territory Establishment

- Species must be territorial (from JSON)
- Creature must be adult
- Sufficient space available
- Creature selects center, patrols perimeter

### Territorial Disputes

```
Intruder enters territory
        ↓
Owner detects → THREAT DISPLAY
        ↓
Intruder leaves OR ESCALATE
        ↓
More aggressive display
        ↓
Intruder leaves OR FIGHT
        ↓
Winner keeps/takes territory
Loser flees wounded
```

## 5.5 Disease & Health

### Disease Types

| Disease | Transmission | Outcome |
|---------|--------------|---------|
| Parasites | Contact, substrate | Chronic, treatable |
| Bacterial | Water quality, wounds | Can be fatal |
| Fungal | High humidity, stress | Often fatal |
| Viral | Contact | Often fatal |

### Disease Risk

```
risk = base_risk × stress_modifier × environment_modifier × exposure_modifier
```

### Player Intervention

- Quarantine (remove from tank)
- Improve conditions
- Equipment (UV sterilizers)
- **Success not guaranteed** (realistic)

---

# PART 6: PLANT SYSTEMS

## 6.1 Plant Data Model

```javascript
{
  id: "plant_uuid",
  speciesId: "fern_small",
  age: 45,                // days
  size: 0.8,              // 0.1 = seedling, 1.0 = mature
  health: 90,
  position: { x, y, z },
  attachedTo: "object_id", // if epiphytic
  state: "healthy"        // healthy, stressed, dying, dead
}
```

## 6.2 Plant Growth

### Growth Factors

```
daily_growth = base_rate × light × humidity × nutrients × health
```

### Growth Stages

```
Seedling (0.1-0.3) → Young (0.3-0.6) → Mature (0.6-1.0) → Full (1.0)
```

## 6.3 Plant Spread

- Plants with spread ability spawn new seedlings nearby
- Population self-regulates through competition for light
- Shaded plants die

## 6.4 Plant Death Causes

| Cause | Timeline |
|-------|----------|
| Light starvation | Days to weeks |
| Dehydration | Days |
| Overwatering (root rot) | Weeks |
| Being eaten | Immediate |
| Crowding | Weeks |

## 6.5 Plant-Creature Interactions

| Interaction | Effect |
|-------------|--------|
| Food source | Herbivores consume, plant health decreases |
| Cover | Reduced predator detection, reduced stress |
| Climbing surface | Small creatures traverse |
| Humidity contribution | Each plant adds to local humidity |
| Microhabitat | Bromeliads hold water for tadpoles |
# PART 7: PLAYER INTERACTION

## 7.1 Build Mode

### Entering Build Mode

- Press B or click Build button
- Simulation pauses
- UI changes to build interface
- Exit with B or Done button

### Placement Mechanics

1. Select asset from catalog
2. Ghost/preview appears at cursor
3. Ghost shows green (valid) or red (invalid)
4. Click to place
5. Scroll wheel to rotate
6. Strict collision detection (no interpenetration)

### Placement Options

| Option | Control |
|--------|---------|
| Grid snap | G to toggle |
| Free placement | Default |
| Rotation | Scroll wheel or Q/E |
| Fine rotation | Shift + rotate |
| Delete | Select + Delete key |

## 7.2 Simulation Mode

### Observation Controls

| Input | Action |
|-------|--------|
| Left-click drag | Orbit camera |
| Right-click drag | Pan camera |
| Scroll wheel | Zoom in/out |
| Middle-click | Reset camera |
| Double-click creature | Focus on creature |
| H | Toggle glass visibility |

### Time Controls

```
⏸ Pause | ▶ 1× | ▶▶ 2× | ▶▶▶ 5× | ▶▶▶▶ 10×

Shortcuts: Space = Pause/Play, 1-4 = Speeds
```

### Quick Actions

| Button | Effect |
|--------|--------|
| 💧 Mist | Immediately boost humidity |
| 🍖 Feed | Open food selection, drop food |
| 💡 Lights | Toggle manual override |

## 7.3 Creature Management

### Adding Creatures

1. Open Creature Catalog
2. Select species (if unlocked)
3. See requirements and compatibility warnings
4. Click Add
5. Creature spawns in appropriate location

### Releasing Creatures

1. Click creature
2. Click "Release"
3. Confirm dialog
4. Creature removed permanently (no refund)

### Naming Creatures

- Default: "[Species] #[number]"
- Click name to edit
- Custom name persists and shows in all UI

## 7.4 Notifications & Guidance

### Notification Types

| Type | Icon | Trigger | Duration |
|------|------|---------|----------|
| Info | ℹ️ | Discovery, milestone | 5 sec |
| Warning | ⚠️ | Parameter drifting | Until resolved |
| Danger | 🔴 | Critical condition | Until resolved |
| Death | 💀 | Creature died | 10 sec |
| Birth | 🥚 | New offspring | 5 sec |
| Level Up | ⬆️ | Player leveled | 10 sec |
| Unlock | 🔓 | New content | 10 sec |

### Guidance Style (Cities: Skylines approach)

**Instead of:** "ERROR: HUMIDITY CRITICAL!"
**Use:** "Your terrarium is getting dry. Some creatures may be stressed."

**Instead of:** "Incompatible species!"
**Use:** "Heads up: Dart frogs may hunt springtails. This could be interesting... or problematic."

### Learning By Doing

- No forced tutorials
- Contextual tooltips appear naturally
- Deaths show cause in creature log

---

# PART 8: PROGRESSION SYSTEM

## 8.1 XP System

### XP Sources

| Event | XP | Notes |
|-------|-----|-------|
| Daily Healthy Tank | 10 | All creatures healthy |
| Creature Survives 7 Days | 25 | First time only |
| Creature Survives 30 Days | 50 | First time only |
| Successful Breeding | 100 | Per event |
| Offspring Reaches Adult | 75 | Per offspring |
| New Species Added | 50 | First time |
| Population 10 | 100 | First time |
| Population 25 | 200 | First time |
| Population 50 | 400 | First time |
| Population 100 | 800 | First time |
| Ecosystem Stable 7 Days | 150 | No deaths |
| Ecosystem Stable 30 Days | 500 | No deaths |
| Discovery: Rare Behavior | 75 | First witness |
| Discovery: Predation | 50 | First witness |
| New Tank Purchased | 100 | Per tank |
| Equipment Upgraded | 25 | Per upgrade |

### Level Requirements

| Level | XP Required | Cumulative |
|-------|-------------|------------|
| 1 | 0 | 0 |
| 5 | 500 | 1,150 |
| 10 | 2,000 | 7,450 |
| 15 | 5,000 | 25,450 |
| 20 | 10,000 | 65,450 |
| 25 | 20,000 | 145,450 |
| 30 | 50,000 | 325,450 |

## 8.2 Unlocks

### Tank Unlocks

| Level | Unlock |
|-------|--------|
| 1 | Small Tank - Terrestrial |
| 3 | Small Tank - Freshwater |
| 5 | Medium Tank - Terrestrial |
| 7 | Small Tank - Saltwater (Nano) |
| 10 | Medium Tank - All types |
| 15 | Large Tank - All types |
| 20 | Extra Large Tank |
| 25 | Walk-In Tank (BIRDS UNLOCK) |
| 30 | Room Tank (MAMMALS UNLOCK) |

### Species Unlock Examples

| Level | Unlocks |
|-------|---------|
| 1 | Springtails, Dwarf White Isopods, Basic plants |
| 3 | Mourning Gecko, More isopods |
| 5 | Dairy Cow Isopods, Stick Insects |
| 6 | Ghost Mantis, Dart Frogs (easy) |
| 10 | Orchid Mantis, More Dart Frogs |
| 15 | Crested Gecko, More freshwater |
| 20 | Advanced reptiles |
| 25 | Birds, LPS Corals |
| 30 | Mammals, All species |

## 8.3 Discovery System

### Encyclopedia

- Tracks all species discovered
- Shows completion percentage by category
- Unlocks detailed info when species added
- Records witnessed behaviors

---

# PART 9: USER INTERFACE

## 9.1 UI Philosophy

1. **Minimal by default** - Show only what's needed
2. **Information on demand** - Details when requested
3. **Non-intrusive** - Don't block terrarium view
4. **Beautiful** - UI matches premium visuals

### Visual Style

- Glass-morphism (semi-transparent, blur)
- Subtle borders, rounded corners
- Icons over text where possible
- Minimal chrome

### Color Palette

| Use | Color | Hex |
|-----|-------|-----|
| Background | Charcoal | #1a1a1a |
| Accent | Moss Green | #4a7c59 |
| Text Primary | Warm White | #f5f5f0 |
| Warning | Amber | #d4a84b |
| Danger | Rust Red | #c45c4a |
| Success | Life Green | #6db56d |

## 9.2 Main HUD Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [🏠] THE GLASS WILD              Day 47  🌡️76°F 💧78%  [⚙️]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    TERRARIUM VIEW                               │
│                                                      [📋]       │
│                                                      [🔨]       │
│                                                      [🦎]       │
├─────────────────────────────────────────────────────────────────┤
│  [⏸][▶][▶▶][▶▶▶]     💧Mist  🍖Feed      Isopods: 12  🐸: 2   │
└─────────────────────────────────────────────────────────────────┘
```

## 9.3 Creature Inspection Panel

```
┌─────────────────────────────────────────────────────────────────┐
│  🐸 "Hoppy"                                           [✕ Close] │
│  Dendrobates auratus (Green & Black Dart Frog)                  │
├─────────────────────────────────────────────────────────────────┤
│  AGE: 47 days (Adult)    SIZE: 1.4 inches                       │
│                                                                 │
│  PERSONALITY:                                                   │
│  Bold ████████░░    Curious ██████░░░░    Active ███████░░░    │
│                                                                 │
│  NEEDS:                                                         │
│  Health  ████████████████████ 95%                              │
│  Hunger  ██████████████░░░░░░ 70%                              │
│  Thirst  ████████████████░░░░ 82%                              │
│  Stress  ██░░░░░░░░░░░░░░░░░░ 12% ✓                            │
│  Rest    ██████████████████░░ 88%                              │
│                                                                 │
│  CURRENT: Hunting  TARGET: Springtail #47                       │
│                                                                 │
│  [Follow Camera]  [View History]  [Release]                    │
└─────────────────────────────────────────────────────────────────┘
```

---

# PART 10: TECHNICAL ARCHITECTURE

## 10.1 Technology Stack

| Technology | Purpose |
|------------|---------|
| Three.js | 3D rendering |
| JavaScript ES6+ | Core language |
| Vite | Build tool, dev server |
| GSAP | Smooth animations |
| Postprocessing | Visual effects |

## 10.2 Project Structure

```
glass-wild/
├── public/
│   ├── models/
│   │   ├── creatures/
│   │   ├── plants/
│   │   └── hardscape/
│   ├── textures/
│   └── audio/
│
├── src/
│   ├── main.js
│   ├── core/
│   │   ├── Game.js
│   │   ├── GameLoop.js
│   │   └── EventBus.js
│   ├── scene/
│   │   ├── SceneManager.js
│   │   ├── Terrarium.js
│   │   ├── Lighting.js
│   │   └── PostProcessing.js
│   ├── simulation/
│   │   ├── WorldState.js
│   │   ├── EnvironmentSystem.js
│   │   └── TimeManager.js
│   ├── creatures/
│   │   ├── Creature.js
│   │   ├── CreatureManager.js
│   │   ├── NeedsSystem.js
│   │   └── BehaviorTree.js
│   ├── plants/
│   │   ├── Plant.js
│   │   └── PlantManager.js
│   ├── interactions/
│   │   ├── PredationSystem.js
│   │   └── BreedingSystem.js
│   ├── progression/
│   │   ├── XPSystem.js
│   │   └── UnlockManager.js
│   ├── ui/
│   │   ├── UIManager.js
│   │   ├── HUD.js
│   │   └── BuildMode.js
│   ├── persistence/
│   │   └── SaveManager.js
│   └── data/
│       └── species/  (503 JSON files)
```

## 10.3 Rendering Pipeline

### Post-Processing Stack

1. Render pass
2. SSAO (ambient occlusion)
3. Bloom
4. Depth of Field
5. Color grading
6. Vignette
7. FXAA (anti-aliasing)

### Quality Targets

- Glass: transmission 0.95, thickness 2, roughness 0.05, IOR 1.5
- HDRI environment map
- Three-point lighting (key, fill, rim)
- Soft shadows (PCFSoftShadowMap)

## 10.4 Asset Pipeline

### Meshy → Game Flow

1. Generate model in Meshy.ai
2. Export as GLB (embedded textures)
3. Optional Blender normalization
4. Drop into public/models/[category]/
5. Register in assetManifest.json
6. AssetManager loads on demand

### Scale Standard

**1 unit = 1 centimeter**

| Real Size | Game Units |
|-----------|------------|
| 1 inch | 2.54 |
| 18 inches | 45.72 |
| 6 feet | 182.88 |

## 10.5 Save System

### What Gets Saved

```javascript
{
  version: "1.0.0",
  timestamp: "ISO date",
  player: {
    xp, level, discoveries, achievements, settings
  },
  tanks: [
    {
      id, name, tier, environmentType,
      time: { gameDay, timeOfDay },
      environment: { temperature, humidity, light, equipment },
      worldState: { placedObjects },
      creatures: [ /* full creature state */ ],
      plants: [ /* full plant state */ ]
    }
  ]
}
```

### Auto-Save

- Every 5 minutes
- On tank switch
- On exit (if possible)
- Keep last 3 auto-saves

## 10.6 Performance Budget

### Targets

| Metric | Target | Minimum |
|--------|--------|---------|
| Frame Rate | 60 FPS | 30 FPS |
| Resolution | 1080p | 720p |
| Load Time | < 5 sec | < 10 sec |

### Creature Limits by Tier

| Tier | Max Creatures | Max Plants |
|------|---------------|------------|
| 1 | 50 | 30 |
| 2 | 100 | 50 |
| 3 | 200 | 100 |
| 4 | 400 | 200 |
| 5 | 800 | 400 |
| 6 | 1500 | 800 |

### LOD Strategy

| Distance | Detail |
|----------|--------|
| < 50cm | Full geometry, animation, particles |
| 50-150cm | LOD1, simplified animation |
| > 150cm | LOD2, billboard/impostor |
| Off-screen | Statistical simulation only |

---

# PART 11: CONTENT SPECIFICATION

## 11.1 Species Summary

| Category | Count | Tier Range |
|----------|-------|------------|
| Terrestrial Cleanup Crew | 9 | 1-3 |
| Terrestrial Invertebrates | 18 | 1-4 |
| Dart Frogs | 8 | 2-3 |
| Tree Frogs | 7 | 3-4 |
| Other Amphibians | 11 | 3-4 |
| Geckos | 11 | 1-4 |
| Chameleons | 5 | 2-4 |
| Anoles/Lizards | 6 | 3-4 |
| Snakes | 4 | 3-4 |
| Birds | 8 | 5-6 |
| Mammals | 4 | 6 |
| Terrestrial Plants | 26 | 1-4 |
| Freshwater Fish | 55 | 1-6 |
| Freshwater Inverts | 17 | 1-3 |
| Freshwater Plants | 29 | 1-3 |
| Brackish Species | 18 | 2-4 |
| Marine Fish | 79 | 1-6 |
| Marine Inverts | 46 | 1-5 |
| Anemones | 11 | 1-4 |
| Corals | 60 | 1-6 |
| **TOTAL** | **503** | |

## 11.2 Asset Requirements

### Model Specifications

| Type | Polygons | Texture |
|------|----------|---------|
| Small creature (<1") | 2-5K | 512² |
| Medium creature (1-4") | 5-15K | 1024² |
| Large creature (4"+) | 15-30K | 2048² |
| Plants | 1-10K | 1024² |
| Hardscape | 0.5-5K | 1024² |

### Naming Convention

```
[category]-[subcategory]-[name]-[variant].glb

Examples:
creature-cleanup-isopod-powder-blue.glb
creature-amphibian-frog-auratus.glb
plant-fern-small.glb
```

---

# PART 12: DEVELOPMENT ROADMAP

## 12.1 Phase Overview

| Phase | Weeks | Focus |
|-------|-------|-------|
| 0: Foundation | 1-2 | Beautiful empty terrarium |
| 1: World State | 3-4 | Placement system |
| 2: Environment | 5-6 | Parameters, equipment |
| 3: First Creature | 7-9 | Isopod AI complete |
| 4: Population | 10-11 | Breeding, growth |
| 5: Predator/Prey | 12-14 | Food chain |
| 6: Progression | 15-16 | XP, unlocks |
| 7: Multi-Tank | 17-18 | Multiple terrariums |
| 8: Expansion | Ongoing | More species |
| 9: Polish | Ongoing | Tutorial, sound, UX |

## 12.2 Phase Details

### Phase 0: Foundation (Weeks 1-2) ← CURRENT

**Deliverable:** Screenshot-worthy empty terrarium

Tasks:
- [x] Vite + Three.js setup
- [ ] Quality lighting (HDRI, three-point)
- [ ] Glass material with refraction
- [ ] Post-processing stack
- [ ] Camera controls
- [ ] Glass visibility toggle (H)

**Success Criteria:**
- Glass looks like real glass
- Lighting feels natural
- 60 FPS

### Phase 3: First Creature (Weeks 7-9)

**Deliverable:** Living isopod that survives or dies

Tasks:
- Creature class with needs
- Behavior tree (wander, eat, drink, rest)
- Procedural animation
- Creature inspector UI
- Lifecycle (aging, death)

**Success Criteria:**
- Isopod wanders realistically
- Responds to environment
- Can die from neglect

### Phase 5: Predator/Prey (Weeks 12-14)

**Deliverable:** Working food chain

Tasks:
- Hunting behaviors (detect, stalk, strike)
- Flee behaviors
- Kill/consume mechanics
- Add Springtails (prey) and Dart Frog (predator)

**Success Criteria:**
- Frogs hunt springtails
- Kills are visible and impactful
- Population balances through predation
# Appendix A Continued - Additional Species (433-503)

### Additional Freshwater Continued

| # | Species | Tier | Size | Notes |
|---|---------|------|------|-------|
| 447 | Pictus Catfish | 3 | 5in | Active |
| 448 | Upside Down Catfish | 3 | 4in | Inverted |
| 449 | Glass Catfish | 3 | 5in | Transparent |
| 450 | Bamboo Catfish | 4 | 8in | Needs current |
| 451 | Dojo Loach | 3 | 10in | Weather fish |
| 452 | Yoyo Loach | 3 | 5in | Pattern |

### Additional Marine Fish (18 species)

| # | Species | Tier | Size | Notes |
|---|---------|------|------|-------|
| 453 | Pink Skunk Clownfish | 2 | 4in | Peaceful |
| 454 | Saddleback Clownfish | 3 | 5in | Semi-aggressive |
| 455 | Black Ocellaris | 2 | 3in | Color morph |
| 456 | Snowflake Clownfish | 2 | 3in | Pattern morph |
| 457 | Convict Tang | 4 | 8in | Schooling tang |
| 458 | Sailfin Tang | 5 | 15in | Gets huge |
| 459 | Naso Tang | 5 | 18in | Unicorn |
| 460 | Sohal Tang | 5 | 16in | Aggressive |
| 461 | Blonde Naso | 5 | 18in | Peaceful |
| 462 | Bicolor Angel | 3 | 6in | Hardy |
| 463 | Regal Angel | 5 | 10in | Difficult |
| 464 | Japanese Swallowtail Angel | 4 | 7in | Rare |
| 465 | Genicanthus Angels | 4 | 8in | Haremic |
| 466 | Mystery Wrasse | 4 | 5in | Expensive |
| 467 | Halichoeres Wrasses | 3 | 4in | Sand sleepers |
| 468 | Coris Wrasses | 4 | 6in | Color change |
| 469 | Helfrichi Firefish | 4 | 3in | Deep water |
| 470 | Dracula Goby | 4 | 3in | Rare |

### Additional Marine Invertebrates (15 species)

| # | Species | Tier | Size | Notes |
|---|---------|------|------|-------|
| 471 | Dardanus Hermit | 3 | 4in | Large hermit |
| 472 | Anemone Hermit | 3 | 3in | Carries anemone |
| 473 | Strawberry Crab | 3 | 2in | Colorful |
| 474 | Pompom Crab | 2 | 1in | Holds pompoms |
| 475 | Bumble Bee Snail | 2 | 0.5in | Predatory |
| 476 | Tiger Cowrie | 3 | 4in | Pattern |
| 477 | Spider Conch | 3 | 6in | Unique shape |
| 478 | Long Spine Urchin | 2 | 12in | Dramatic |
| 479 | Short Spine Urchin | 2 | 4in | Safer |
| 480 | Rock Boring Urchin | 3 | 3in | Burrows |
| 481 | Serpent Star | 2 | 10in | Active |
| 482 | Green Serpent Star | 2 | 12in | Can eat fish |
| 483 | Chocolate Chip Star | 3 | 6in | NOT reef safe |
| 484 | Crown of Thorns | 6 | 18in | DANGEROUS |
| 485 | Tiger Tail Cucumber | 3 | 8in | Safe |

### Additional Corals (18 species)

| # | Species | Tier | Flow | Notes |
|---|---------|------|------|-------|
| 486 | Bounce Mushroom | 2 | Low | Collectible |
| 487 | Jawbreaker Mushroom | 2 | Low | Expensive |
| 488 | Superman Mushroom | 2 | Low | Rare |
| 489 | People Eater Zoa | 1 | Med | Named variety |
| 490 | Armor of God Zoa | 1 | Med | Named variety |
| 491 | Eagle Eye Zoa | 1 | Med | Common |
| 492 | Dragon Eye Zoa | 1 | Med | Popular |
| 493 | Rainbow Acan | 3 | Low | Multi-color |
| 494 | Ultra Chalice | 4 | Low-Med | Designer |
| 495 | Jason Fox Monti | 4 | High | Named |
| 496 | WWC Grafted Monti | 4 | High | Named |
| 497 | Rainbow Monti | 4 | High | Multi-color |
| 498 | Tyree LE Coral | 5 | High | Limited Edition |
| 499 | Walt Disney Acro | 5 | Very High | Collectible |
| 500 | Strawberry Shortcake | 5 | Very High | Named Acro |
| 501 | Oregon Tort Acro | 5 | Very High | Classic |
| 502 | Homewrecker Acro | 5 | Very High | Named |
| 503 | ORA Red Planet Acro | 5 | Very High | Iconic |

---

# APPENDIX B: SPECIES JSON SCHEMA REFERENCE

## Quick Reference

**Total Fields:** ~350  
**Location:** `/src/data/species/`  
**Format:** One JSON file per species  
**Naming:** `lowercase-hyphenated.json`

## Core Sections

```
identity        (13 fields)  - ID, names, category, tier, difficulty
physical        (19 fields)  - Size, lifespan, colors, patterns
environment     (35 fields)  - Habitat requirements, enclosure needs
water_parameters (30 fields) - For aquatic species only
diet            (35 fields)  - Food types, feeding behavior, hunting
social          (32 fields)  - Group structure, territory, hierarchy
reproduction    (40 fields)  - Breeding, offspring, parental care
behavior        (50 fields)  - Activity, movement, zones, sleep
stress          (35 fields)  - Health, disease, stress sources
personality     (12 fields)  - Trait ranges (boldness, aggression, etc.)
compatibility   (per entry)  - Relationships with other species
aggression      (18 fields)  - Combat, defense, threat display
communication   (14 fields)  - Sounds, visual signals, chemicals
special_abilities (15+ fields) - Unique behaviors, camouflage
animations      (15 fields)  - Required animation types
category_specific (varies)   - Coral, fish, bird, mammal specifics
```

## Key Enums

**difficulty:** easy, medium, hard, expert, near_impossible  
**activity_pattern:** diurnal, nocturnal, crepuscular, cathemeral  
**social_type:** solitary, pair, harem, colony, school, loose_group  
**diet_type:** carnivore, herbivore, omnivore, insectivore, detritivore, filter_feeder  
**aggression_baseline:** peaceful, semi_aggressive, aggressive, highly_aggressive

## Example Entry (Abbreviated)

```json
{
  "meta": {
    "schema_version": "1.0",
    "created": "2026-02-04",
    "status": "complete"
  },
  "identity": {
    "id": "dendrobates_auratus",
    "common_name": "Green and Black Dart Frog",
    "scientific_name": "Dendrobates auratus",
    "category": "amphibian",
    "subcategory": "dart_frog",
    "tier_unlock": 2,
    "difficulty": "easy"
  },
  "physical": {
    "size_adult_inches": 1.5,
    "lifespan_years_min": 8,
    "lifespan_years_max": 12,
    "colors_primary": ["green", "black"]
  },
  "environment": {
    "environment_type": ["terrestrial"],
    "humidity_range_min": 70,
    "humidity_range_max": 100,
    "temperature_range_min_f": 65,
    "temperature_range_max_f": 80
  }
}
```

---

# APPENDIX C: UNLOCK TABLE

## Tank Unlocks

| Level | Tank |
|-------|------|
| 1 | Small (18") - Terrestrial |
| 3 | Small (18") - Freshwater |
| 5 | Medium (24") - Terrestrial |
| 7 | Small (18") - Saltwater (Nano) |
| 10 | Medium (24") - All Types |
| 15 | Large (36") - All Types |
| 20 | Extra Large (48") - All Types |
| 25 | Walk-In (6') - BIRDS UNLOCK |
| 30 | Room (10') - MAMMALS UNLOCK |

## Species Unlock Examples by Level

| Level | Terrestrial | Freshwater | Saltwater |
|-------|-------------|------------|-----------|
| 1 | Springtails, Dwarf White Isopods | Betta, Ember Tetra | Clown Goby |
| 2 | Powder Blue/Orange Isopods | Neon Tetra, Cherry Shrimp | - |
| 3 | Mourning Gecko | Cardinal Tetra | - |
| 4 | - | Zebra Danio, Guppy | - |
| 5 | Dairy Cow Isopods, Stick Insects | Corydoras | - |
| 6 | Ghost Mantis, D. auratus | - | Clownfish |
| 7 | D. leucomelas | Honey Gourami | Firefish |
| 8 | Giant Canyon Isopods | Bristlenose Pleco | Royal Gramma |
| 10 | Orchid Mantis, Tree Frogs | Rams | More Clownfish |
| 12 | Tarantulas | - | Wrasses |
| 15 | Crested Gecko | Angelfish | Dwarf Angels |
| 18 | Chameleons | Discus | Tangs |
| 20 | Advanced Reptiles | Large Cichlids | Large Angels |
| 22 | - | - | Soft Corals |
| 25 | BIRDS | - | LPS Corals |
| 28 | More Birds | - | SPS Corals |
| 30 | MAMMALS | Arowana, Stingray | NPS Corals, Sharks |

## Equipment Unlocks

| Level | Equipment |
|-------|-----------|
| 1 | Heat Mat, Basic LED, Spray Bottle |
| 3 | Heat Lamp |
| 5 | Timer Misting |
| 8 | Thermostat |
| 10 | Full Spectrum Lighting |
| 12 | Fogger |
| 15 | Smart Climate Control |
| 18 | Multi-zone Heating |
| 20 | Humidity Controller |
| 25 | Premium Automation |

---

# APPENDIX D: XP VALUES TABLE

## XP Gain Events

| Event | XP | Repeatable |
|-------|-----|------------|
| Daily Healthy Tank | 10 | Daily |
| Creature Survives 7 Days | 25 | Per creature, once |
| Creature Survives 30 Days | 50 | Per creature, once |
| Successful Breeding | 100 | Per event |
| Offspring Reaches Adult | 75 | Per offspring |
| New Species Added | 50 | Per species, once |
| Population Milestone (10) | 100 | Once |
| Population Milestone (25) | 200 | Once |
| Population Milestone (50) | 400 | Once |
| Population Milestone (100) | 800 | Once |
| Ecosystem Stable 7 Days | 150 | Once per tank |
| Ecosystem Stable 30 Days | 500 | Once per tank |
| Discovery: Rare Behavior | 75 | Per behavior, once |
| Discovery: Predation Event | 50 | Once |
| New Tank Purchased | 100 | Per tank |
| Equipment Upgraded | 25 | Per upgrade |

## Level Thresholds

| Level | XP to Next | Total XP |
|-------|------------|----------|
| 1 | 100 | 0 |
| 2 | 100 | 100 |
| 3 | 150 | 200 |
| 4 | 200 | 350 |
| 5 | 300 | 550 |
| 6 | 350 | 850 |
| 7 | 400 | 1,200 |
| 8 | 500 | 1,600 |
| 9 | 600 | 2,100 |
| 10 | 800 | 2,700 |
| 15 | 2,500 | 10,200 |
| 20 | 5,000 | 30,200 |
| 25 | 10,000 | 67,700 |
| 30 | 25,000 | 142,700 |

---

# APPENDIX E: EQUIPMENT STATS

## Heating Equipment

| Name | Tier | Cost | Effect | Automation |
|------|------|------|--------|------------|
| None | 0 | - | Room ambient | - |
| Heat Mat | Basic | $20 | +5°F substrate | Manual |
| Heat Lamp | Basic+ | $35 | +10°F basking | Manual |
| Ceramic Emitter | Upgraded | $50 | +10°F zone, no light | Manual |
| Thermostat | Advanced | $80 | Maintains target | Automatic |
| Multi-zone Climate | Premium | $200 | Multiple zones | Programmable |

## Lighting Equipment

| Name | Tier | Cost | Effect | Automation |
|------|------|------|--------|------------|
| Ambient Only | 0 | - | Room light | - |
| Basic LED | Basic | $30 | On/off | Manual |
| Timer LED | Upgraded | $60 | Day/night | Timer |
| Full Spectrum | Advanced | $120 | UVB + visible | Timer |
| Smart Lighting | Premium | $250 | Sunrise/sunset | Programmable |

## Misting Equipment

| Name | Tier | Cost | Effect | Automation |
|------|------|------|--------|------------|
| None | 0 | - | No humidity control | - |
| Spray Bottle | Basic | $5 | +40% manual | Manual |
| Misting System | Upgraded | $80 | Scheduled spray | Timer |
| Fogger | Advanced | $120 | Sustained humidity | Timer |
| Humidity Controller | Premium | $200 | Target maintenance | Automatic |

## Aquatic Equipment

| Name | Category | Cost | Effect |
|------|----------|------|--------|
| Sponge Filter | Filtration | $15 | Basic |
| HOB Filter | Filtration | $50 | Better |
| Canister Filter | Filtration | $150 | Best |
| Basic Heater | Temperature | $25 | Maintains temp |
| Wavemaker | Flow | $80 | Water movement |
| Protein Skimmer | Filtration | $200 | Marine waste removal |
| Auto Top-Off | Maintenance | $150 | Water level |

---

# APPENDIX F: GLOSSARY

## General Terms

| Term | Definition |
|------|------------|
| **Bioactive** | Self-sustaining ecosystem with cleanup crew |
| **Cleanup Crew** | Decomposers that process waste (isopods, springtails) |
| **Cycling** | Establishing beneficial bacteria in new tank |
| **Ecosystem** | Community of interacting organisms and environment |
| **Enclosure** | The terrarium/aquarium container |
| **Husbandry** | Care and management of animals |
| **Paludarium** | Tank with both land and water areas |
| **Terrarium** | Land-based enclosure |
| **Vivarium** | General term for life-supporting enclosure |

## Creature Terms

| Term | Definition |
|------|------------|
| **Arboreal** | Tree-dwelling |
| **Crepuscular** | Active at dawn/dusk |
| **Detritivore** | Eats decaying organic matter |
| **Diurnal** | Active during day |
| **Fossorial** | Burrowing lifestyle |
| **Insectivore** | Eats insects |
| **Nocturnal** | Active at night |
| **Parthenogenic** | Reproduces without mating |
| **Territorial** | Defends specific area |

## Aquarium Terms

| Term | Definition |
|------|------------|
| **Brackish** | Water between fresh and salt (1.005-1.015 SG) |
| **FOWLR** | Fish Only With Live Rock |
| **GH** | General Hardness (calcium/magnesium) |
| **KH** | Carbonate Hardness (buffering) |
| **LPS** | Large Polyp Stony coral |
| **NPS** | Non-Photosynthetic coral (needs feeding) |
| **PAR** | Photosynthetically Active Radiation |
| **Reef Safe** | Won't harm corals |
| **SG** | Specific Gravity (salinity measure) |
| **SPS** | Small Polyp Stony coral |

## Game Terms

| Term | Definition |
|------|------------|
| **Needs** | Hunger, thirst, stress, rest values |
| **Personality** | Individual trait values (boldness, etc.) |
| **Tier** | Enclosure size level (1-6) |
| **XP** | Experience points for progression |

---

# DOCUMENT COMPLETE

**THE GLASS WILD - Game Design & Technical Specification**  
**Version 1.0 | February 2026**  
**503 Species | ~350 Fields per Species | 6 Tiers | Infinite Possibilities**

*Build worlds. Nurture life. Watch nature unfold.*
-e 

---

# APPENDIX A: COMPLETE 503 SPECIES LIST


# THE GLASS WILD â€” MASTER SPECIES LIST
## Version 1.0 â€” LOCKED
## February 2026

**Total Species: 503**

---

# TERRESTRIAL LIFE

## Cleanup Crew (9 species)

| Species | Tier | Size | Role |
|---------|------|------|------|
| Springtails (Folsomia candida) | 1 | 1mm | Primary decomposer, prey |
| Dwarf White Isopods | 1 | 5mm | Decomposer, prey |
| Powder Blue Isopods | 1 | 10mm | Hardy decomposer |
| Powder Orange Isopods | 1 | 10mm | Color variant |
| Dairy Cow Isopods | 2 | 15mm | Decorative |
| Zebra Isopods | 2 | 12mm | Pattern variety |
| Rubber Ducky Isopods | 2 | 15mm | Collectible |
| Giant Canyon Isopods | 3 | 30mm | Large impressive |
| Giant Orange Isopods | 3 | 30mm | Size variety |

## Terrestrial Invertebrates â€” Display (16 species)

| Species | Tier | Size | Notes |
|---------|------|------|-------|
| Stick Insects (small) | 1 | 3in | Camouflage |
| Leaf Insects (small) | 1 | 2in | Camouflage |
| Ghost Mantis | 2 | 2in | Easy mantis |
| Dead Leaf Mantis | 2 | 2.5in | Camouflage |
| Stick Insects (large) | 2 | 6in | Impressive |
| Leaf Insects (large) | 2 | 4in | Impressive |
| Bumblebee Millipede | 2 | 3in | Colorful |
| Orchid Mantis | 3 | 3in | Beautiful |
| Giant Asian Mantis | 3 | 4in | Large |
| Pink Toe Tarantula | 3 | 5in | Docile, arboreal |
| Curly Hair Tarantula | 3 | 5in | Docile beginner |
| Emperor Scorpion | 3 | 6in | UV reactive |
| Whip Spider (Amblypygi) | 3 | 4in | Unique look |
| Hercules Beetle | 3 | 6in | Impressive display |
| Giant African Millipede | 3 | 10in | Large decomposer |
| Mexican Red Knee Tarantula | 4 | 6in | Classic |
| Green Bottle Blue Tarantula | 4 | 5in | Stunning colors |
| Giant Centipede | 4 | 8in | DANGER â€” Apex predator |

## Amphibians â€” Dart Frogs (8 species)

| Species | Tier | Size | Difficulty |
|---------|------|------|------------|
| Dendrobates auratus (Green & Black) | 2 | 1.5in | Easy |
| Dendrobates leucomelas (Bumblebee) | 2 | 1.5in | Easy |
| Ranitomeya imitator (Mimic) | 2 | 0.75in | Medium |
| Ranitomeya variabilis | 2 | 0.75in | Medium |
| Dendrobates tinctorius (Dyeing) | 3 | 2in | Medium |
| Oophaga pumilio (Strawberry) | 3 | 0.75in | Hard |
| Phyllobates terribilis (Golden Poison) | 3 | 2in | Medium |
| Phyllobates bicolor | 3 | 1.5in | Medium |

## Amphibians â€” Tree Frogs (7 species)

| Species | Tier | Size | Difficulty |
|---------|------|------|------------|
| Clown Tree Frog | 3 | 1.5in | Medium |
| Gray Tree Frog | 3 | 2in | Easy |
| Red-eyed Tree Frog | 3 | 2.5in | Medium |
| Amazon Milk Frog | 3 | 3in | Medium |
| White's Tree Frog (Dumpy) | 4 | 4in | Easy |
| Waxy Monkey Frog | 4 | 3in | Medium |
| Tiger Leg Monkey Frog | 4 | 3in | Medium |

## Amphibians â€” Other (11 species)

| Species | Tier | Size | Notes |
|---------|------|------|-------|
| Fire-bellied Toad | 3 | 2in | Paludarium classic |
| Oriental Fire-bellied Newt | 3 | 4in | Semi-aquatic |
| Pacman Frog | 3 | 5in | Ambush predator |
| Fire Salamander | 4 | 8in | Terrestrial |
| Tiger Salamander | 4 | 8in | North American |
| Marbled Salamander | 4 | 4in | Beautiful pattern |
| Spanish Ribbed Newt | 4 | 8in | Hardy |
| Axolotl | 4 | 10in | Fully aquatic |

## Reptiles â€” Geckos (10 species)

| Species | Tier | Size | Difficulty |
|---------|------|------|------------|
| Mourning Gecko | 1 | 3in | Easy, parthenogenic |
| Gold Dust Day Gecko | 2 | 4in | Medium |
| Pygmy Chameleon | 2 | 3in | Medium |
| Crested Gecko | 3 | 8in | Easy |
| Gargoyle Gecko | 3 | 8in | Easy |
| Giant Day Gecko | 3 | 10in | Medium |
| Chahoua Gecko | 4 | 10in | Medium |
| Tokay Gecko | 4 | 12in | Feisty |
| Leachianus Gecko | 4 | 14in | Largest gecko |
| Satanic Leaf-tailed Gecko | 4 | 6in | Camouflage |
| Mossy Leaf-tailed Gecko | 4 | 6in | Camouflage |

## Reptiles â€” Chameleons (5 species)

| Species | Tier | Size | Difficulty |
|---------|------|------|------------|
| Pygmy Chameleon | 2 | 3in | Medium |
| Carpet Chameleon | 4 | 6in | Medium |
| Jackson's Chameleon | 4 | 10in | Hard |
| Panther Chameleon | 4 | 18in | Hard |
| Veiled Chameleon | 4 | 18in | Hard |

## Reptiles â€” Anoles & Lizards (7 species)

| Species | Tier | Size | Notes |
|---------|------|------|-------|
| Green Anole | 3 | 6in | Easy, native |
| Long-tailed Grass Lizard | 3 | 10in | Active |
| Emerald Tree Skink | 3 | 8in | Bright green |
| Knight Anole | 4 | 18in | Large anole |
| Cuban False Chameleon | 4 | 8in | Unique look |
| Chinese Crocodile Lizard | 4 | 16in | Semi-aquatic |

## Reptiles â€” Snakes (4 species)

| Species | Tier | Size | Notes |
|---------|------|------|-------|
| Rough Green Snake | 3 | 24in | Insectivore |
| Ringneck Snake | 3 | 12in | Tiny, secretive |
| African House Snake | 4 | 36in | Small, docile |
| Kenyan Sand Boa | 4 | 24in | Burrower |

## Birds (8 species) â€” Tier 5+ Only

| Species | Tier | Size | Difficulty |
|---------|------|------|------------|
| Zebra Finch | 5 | 4in | Easy |
| Society Finch | 5 | 4in | Easy |
| Gouldian Finch | 5 | 5in | Medium |
| Button Quail | 5 | 4in | Easy |
| Diamond Dove | 5 | 7in | Easy |
| Cordon Bleu Finch | 5 | 5in | Medium |
| Strawberry Finch | 5 | 4in | Medium |
| Canary | 6 | 5in | Medium |

## Mammals (4 species) â€” Tier 6 Only

| Species | Tier | Size | Notes |
|---------|------|------|-------|
| African Pygmy Mouse | 6 | 3in | Colony species |
| Pygmy Jerboa | 6 | 2in body | Hopping |
| Sugar Glider | 6 | 6in body | Gliding |
| Short-tailed Opossum | 6 | 5in body | Marsupial |

## Terrestrial Plants (26 species)

| Species | Tier | Type | Light |
|---------|------|------|-------|
| Pothos (various) | 1 | Climbing | Low-Med |
| Java Moss | 1 | Moss | Low |
| Sheet Moss | 1 | Moss | Low |
| Pillow Moss | 1 | Moss | Low |
| Selaginella | 1 | Ground cover | Med |
| Peperomia (various) | 1 | Compact | Med |
| Ferns (small) | 1 | Upright | Low-Med |
| Riccia | 1 | Floating/terr | Low |
| Ficus pumila | 2 | Climbing | Med |
| Begonia (various) | 2 | Upright | Med |
| Philodendron (small) | 2 | Climbing | Med |
| Tillandsia (Air Plants) | 2 | Epiphytic | Med |
| Dischidia | 2 | Epiphytic | Med |
| Bromeliads (small) | 2 | Rosette | Med |
| Bromeliads (large) | 3 | Rosette | Med |
| Orchids (various) | 3 | Epiphytic | Med-High |
| Monstera adansonii | 3 | Climbing | Med |
| Marcgravia | 3 | Shingle plant | Med |
| Hoya (various) | 3 | Climbing | Med |
| Ferns (large) | 3 | Upright | Low-Med |
| Bird's Nest Fern | 3 | Rosette | Med |
| Maidenhair Fern | 3 | Delicate | Med |
| Rabbit's Foot Fern | 3 | Spreading | Med |
| Jewel Orchid | 4 | Terrestrial | Low |
| Nepenthes (Pitcher) | 4 | Carnivorous | High |
| Anthurium (various) | 4 | Epiphytic | Med |

---

# FRESHWATER LIFE

## Freshwater Fish â€” Nano/Community (30 species)

| Species | Tier | Size | Schooling |
|---------|------|------|-----------|
| Betta | 1 | 2.5in | Solitary |
| Ember Tetra | 1 | 0.75in | 8+ |
| Chili Rasbora | 1 | 0.5in | 8+ |
| Endler's Livebearer | 1 | 1in | 6+ |
| Pygmy Corydoras | 1 | 1in | 6+ |
| Otocinclus | 1 | 2in | 3+ |
| Neon Tetra | 2 | 1.5in | 6+ |
| Cardinal Tetra | 2 | 2in | 6+ |
| Harlequin Rasbora | 2 | 2in | 6+ |
| Celestial Pearl Danio | 2 | 1in | 6+ |
| Zebra Danio | 2 | 2in | 6+ |
| White Cloud Minnow | 2 | 1.5in | 6+ |
| Honey Gourami | 2 | 2in | No |
| Dwarf Gourami | 2 | 3in | No |
| Panda Corydoras | 2 | 2in | 6+ |
| Bronze Corydoras | 2 | 2.5in | 6+ |
| Guppy | 2 | 2in | 6+ |
| Platy | 2 | 2.5in | 6+ |
| Kuhli Loach | 2 | 4in | 3+ |
| Dwarf Chain Loach | 2 | 2in | 6+ |
| Bristlenose Pleco | 2 | 5in | No |
| Rummy Nose Tetra | 3 | 2in | 6+ |
| Black Neon Tetra | 3 | 1.5in | 6+ |
| Glowlight Tetra | 3 | 1.5in | 6+ |
| Pearl Gourami | 3 | 4in | No |
| Swordtail | 3 | 5in | 3+ |
| Molly | 3 | 4in | 3+ |
| Siamese Algae Eater | 3 | 6in | 2+ |
| Hillstream Loach | 3 | 3in | 2+ |
| Black Ghost Knifefish | 3 | 18in | Solitary |
| Elephant Nose Fish | 3 | 9in | Solitary |

## Freshwater Fish â€” Cichlids (12 species)

| Species | Tier | Size | Difficulty |
|---------|------|------|------------|
| German Blue Ram | 3 | 2.5in | Medium |
| Bolivian Ram | 3 | 3in | Easy |
| Apistogramma cacatuoides | 3 | 3in | Medium |
| Apistogramma agassizii | 3 | 3in | Medium |
| Kribensis | 3 | 4in | Easy |
| Angelfish | 4 | 6in | Medium |
| Discus | 4 | 8in | Hard |
| Yellow Lab Cichlid | 4 | 4in | Easy |
| Electric Blue Acara | 4 | 6in | Medium |
| Firemouth | 4 | 6in | Medium |
| Keyhole Cichlid | 4 | 4in | Easy |
| Severum | 5 | 8in | Medium |

## Freshwater Fish â€” Large (12 species) â€” Tier 5/6

| Species | Tier | Size | Notes |
|---------|------|------|-------|
| Oscar | 5 | 12in | Personality |
| Flowerhorn | 5 | 12in | Hybrid |
| Bichir (various) | 5 | 12-24in | Prehistoric |
| Rope Fish | 4 | 15in | Snake-like |
| Arowana (Silver) | 6 | 36in | Trophy fish |
| Arowana (Asian) | 6 | 36in | Ultimate |
| Freshwater Stingray | 6 | 18in+ | Exotic |
| Red Devil | 6 | 12in | Aggressive |
| Peacock Bass | 6 | 24in | Predator |
| Giant Gourami | 6 | 24in | Huge |
| Redtail Catfish | 6 | 48in | Monster |
| Pacu | 6 | 30in | Vegetarian |

## Freshwater Invertebrates (22 species)

| Species | Tier | Size | Role |
|---------|------|------|------|
| Cherry Shrimp (Red) | 1 | 1in | Display, cleanup |
| Cherry Shrimp (Blue) | 1 | 1in | Color variant |
| Cherry Shrimp (Yellow) | 1 | 1in | Color variant |
| Ghost Shrimp | 1 | 1.5in | Cheap, fun |
| Nerite Snail (various) | 1 | 1in | Algae |
| Ramshorn Snail | 1 | 1in | Cleanup |
| Malaysian Trumpet Snail | 1 | 1in | Substrate |
| Thai Micro Crab | 1 | 0.5in | Nano |
| Amano Shrimp | 2 | 2in | Best algae |
| Crystal Red Shrimp | 2 | 1in | Advanced |
| Crystal Black Shrimp | 2 | 1in | Advanced |
| Mystery Snail | 2 | 2in | Colorful |
| Rabbit Snail | 2 | 3in | Unique |
| Assassin Snail | 2 | 1in | Snail control |
| Dwarf Crayfish (CPO) | 2 | 2in | Colorful |
| Bamboo Shrimp | 3 | 3in | Filter feeder |
| Vampire Shrimp | 3 | 3in | Filter feeder |

## Freshwater Plants (37 species)

| Species | Tier | Type | CO2 |
|---------|------|------|-----|
| Java Fern | 1 | Epiphytic | No |
| Anubias (small) | 1 | Epiphytic | No |
| Java Moss | 1 | Moss | No |
| Marimo Moss Ball | 1 | Novelty | No |
| Frogbit | 1 | Floating | No |
| Salvinia | 1 | Floating | No |
| Duckweed | 1 | Floating | No |
| Cryptocoryne (small) | 1 | Rooted | No |
| Amazon Sword | 2 | Rooted | Helpful |
| Vallisneria | 2 | Grass | No |
| Cryptocoryne (all) | 2 | Rooted | No |
| Dwarf Sagittaria | 2 | Grass | No |
| Rotala (various) | 2 | Stem | Helpful |
| Ludwigia (various) | 2 | Stem | Helpful |
| Hygrophila (various) | 2 | Stem | No |
| Water Sprite | 2 | Floating/planted | No |
| Cabomba | 2 | Stem | Helpful |
| Hornwort | 2 | Stem | No |
| Anubias (all) | 2 | Epiphytic | No |
| Limnophila | 2 | Stem | Helpful |
| Monte Carlo | 3 | Carpet | Yes |
| Dwarf Baby Tears | 3 | Carpet | Yes |
| Glossostigma | 3 | Carpet | Yes |
| Bucephalandra | 3 | Epiphytic | No |
| Pogostemon helferi | 3 | Rosette | Yes |
| Pogostemon erectus | 3 | Stem | Yes |
| Alternanthera reineckii | 3 | Stem | Yes |
| Red Root Floater | 3 | Floating | No |
| Limnophila aromatica | 3 | Stem | Yes |

---

# BRACKISH LIFE (22 species)

| Species | Tier | Size | Notes |
|---------|------|------|-------|
| Bumblebee Goby | 2 | 1.5in | Tiny, colorful |
| Mollies | 2 | 4in | Adaptable |
| Guppies (wild-type) | 2 | 2in | Adaptable |
| Wrestling Halfbeak | 2 | 3in | Surface |
| Fiddler Crab | 3 | 2in | Semi-terrestrial |
| Red Claw Crab | 3 | 4in | Escape artist |
| Thai Devil Crab | 3 | 3in | Colorful |
| Figure 8 Puffer | 3 | 3in | Personality |
| Knight Goby | 3 | 4in | Predatory |
| Violet Goby (Dragon) | 3 | 15in | Unique look |
| Mudskipper (Indian) | 4 | 4in | Walks on land |
| Mudskipper (Atlantic) | 4 | 6in | Walks on land |
| Archer Fish | 4 | 10in | Spits at prey |
| Green Spotted Puffer | 4 | 6in | Larger puffer |
| Monos | 4 | 8in | Schooling |
| Scats | 4 | 12in | Schooling |
| Targetfish | 4 | 6in | Archery behavior |
| Colombian Shark Catfish | 4 | 12in | Active |

---

# SALTWATER LIFE

## Marine Fish â€” Beginner (15 species)

| Species | Tier | Size | Temperament |
|---------|------|------|-------------|
| Clown Goby (various) | 1 | 1.5in | Peaceful |
| Neon Goby | 1 | 2in | Peaceful |
| Ocellaris Clownfish | 2 | 3in | Peaceful |
| Percula Clownfish | 2 | 3in | Peaceful |
| Firefish | 2 | 3in | Peaceful |
| Purple Firefish | 2 | 3in | Peaceful |
| Royal Gramma | 2 | 3in | Semi-aggressive |
| Tailspot Blenny | 2 | 2.5in | Peaceful |
| Bicolor Blenny | 2 | 4in | Peaceful |
| Pajama Cardinal | 2 | 3in | Peaceful |
| Bangaii Cardinal | 2 | 3in | Peaceful |
| Yellowtail Damsel | 2 | 3in | Semi-aggressive |
| Chromis (Blue-green) | 2 | 3in | Peaceful |
| Orchid Dottyback | 2 | 3in | Semi-aggressive |
| Neon Dottyback | 2 | 3in | Semi-aggressive |

## Marine Fish â€” Intermediate (22 species)

| Species | Tier | Size | Temperament |
|---------|------|------|-------------|
| Clarkii Clownfish | 3 | 5in | Semi-aggressive |
| Six Line Wrasse | 3 | 3in | Semi-aggressive |
| Melanurus Wrasse | 3 | 5in | Semi-aggressive |
| Flame Angelfish | 3 | 4in | Semi-aggressive |
| Coral Beauty | 3 | 4in | Semi-aggressive |
| Lemonpeel Angelfish | 3 | 5in | Semi-aggressive |
| Lawnmower Blenny | 3 | 5in | Peaceful |
| Midas Blenny | 3 | 5in | Peaceful |
| Watchman Goby | 3 | 4in | Peaceful |
| Yasha Goby | 3 | 2in | Peaceful |
| Diamond Goby | 3 | 6in | Peaceful |
| Randall's Goby | 3 | 3in | Peaceful |
| Flame Hawkfish | 3 | 4in | Semi-aggressive |
| Longnose Hawkfish | 3 | 5in | Semi-aggressive |
| Fairy Wrasse (various) | 3 | 4in | Peaceful |
| Flasher Wrasse | 3 | 3in | Peaceful |
| Yellow Tang | 4 | 8in | Semi-aggressive |
| Kole Tang | 4 | 6in | Peaceful |
| Tomini Tang | 4 | 5in | Peaceful |
| Scopas Tang | 4 | 8in | Semi-aggressive |
| Foxface | 4 | 8in | Peaceful (venomous) |

## Marine Fish â€” Advanced (28 species)

| Species | Tier | Size | Notes |
|---------|------|------|-------|
| Mandarin Dragonet | 4 | 3in | Needs copepods |
| Spotted Mandarin | 4 | 3in | Needs copepods |
| Copperband Butterfly | 4 | 8in | Aiptasia eater |
| Raccoon Butterfly | 4 | 8in | Easier butterfly |
| Tomato Clownfish | 4 | 5in | Semi-aggressive |
| Maroon Clownfish | 4 | 6in | Aggressive |
| Anthias (Lyretail) | 4 | 5in | Schooling |
| Anthias (Bartletts) | 4 | 4in | Schooling |
| Leopard Wrasse | 4 | 5in | Delicate |
| Clown Trigger | 4 | 18in | Aggressive |
| Niger Trigger | 4 | 12in | Semi-aggressive |
| Bluethroat Trigger | 4 | 10in | Milder trigger |
| Blue Hippo Tang | 5 | 12in | Semi-aggressive |
| Powder Blue Tang | 5 | 9in | Sensitive |
| Purple Tang | 5 | 8in | Semi-aggressive |
| Emperor Angelfish | 5 | 15in | Semi-aggressive |
| Queen Angelfish | 5 | 18in | Semi-aggressive |
| French Angelfish | 5 | 15in | Semi-aggressive |
| Harlequin Tusk | 5 | 10in | Semi-aggressive |
| Dogface Puffer | 5 | 12in | Personality |
| Porcupine Puffer | 5 | 12in | Personality |
| Lionfish | 5 | 15in | Venomous predator |
| Frogfish | 5 | 8in | Ambush predator |
| Filefish (Aiptasia-eating) | 5 | 4in | Pest control |
| Batfish | 5 | 18in | Peaceful |
| Snowflake Eel | 5 | 24in | Escape risk |
| Achilles Tang | 6 | 9in | Expert only |

## Marine Fish â€” Specialty (14 species)

| Species | Tier | Size | Notes |
|---------|------|------|-------|
| Seahorse (various) | 4 | 4-8in | Species tank |
| Pipefish | 4 | 6in | Species tank |
| Dwarf Cuttlefish | 5 | 4in | Short-lived |
| Garden Eels | 5 | 16in | Colony, sand |
| Common Octopus | 6 | varies | Escape artist |
| Nautilus | 6 | 8in | Deep water |
| Leafy Seadragon | 6 | 14in | Ultimate display |
| Weedy Seadragon | 6 | 18in | Display |
| Moon Jellyfish | 6 | 12in | Kreisel tank |
| Spotted Jellyfish | 6 | 6in | Kreisel tank |
| Bamboo Shark | 6 | 40in | Room scale |
| Epaulette Shark | 6 | 36in | Room scale |
| Blue Spot Ray | 6 | 18in | Room scale |
| Blue Ring Octopus | 6 | 3in | DEADLY â€” Display only |
| Cone Snail (various) | 6 | 4in | DEADLY â€” Display only |
| Box Jellyfish | 6 | 10in | DEADLY â€” Display only |

## Marine Invertebrates â€” Cleanup Crew (21 species)

| Species | Tier | Size | Role |
|---------|------|------|------|
| Blue Leg Hermit | 1 | 1in | Algae |
| Astrea Snail | 1 | 1in | Algae |
| Cerith Snail | 1 | 1in | Sand/algae |
| Nassarius Snail | 1 | 1in | Scavenger |
| Trochus Snail | 2 | 1in | Best all-around |
| Turbo Snail | 2 | 2in | Heavy algae |
| Margarita Snail | 2 | 1in | Cold water |
| Nerite Snail (marine) | 2 | 1in | Algae |
| Scarlet Hermit | 2 | 1.5in | Colorful |
| Red Leg Hermit | 2 | 1in | Algae |
| Halloween Hermit | 3 | 2in | Striking |
| Fighting Conch | 3 | 3in | Sand sifter |
| Sally Lightfoot Crab | 3 | 3in | Algae, fast |
| Emerald Crab | 2 | 2in | Bubble algae |
| Tuxedo Urchin | 2 | 3in | Algae |
| Pincushion Urchin | 2 | 4in | Algae |
| Pencil Urchin | 3 | 5in | Different look |
| Sand Sifting Star | 3 | 8in | Sand |
| Brittle Star | 2 | 6in | Scavenger |
| Sea Cucumber | 3 | 8in | Detritus |
| Linckia Star | 4 | 12in | Display |
| Red Fromia Star | 3 | 4in | Display |

## Marine Invertebrates â€” Display (27 species)

| Species | Tier | Size | Notes |
|---------|------|------|-------|
| Sexy Shrimp | 1 | 0.5in | Tiny, dances |
| Pom Pom Crab | 1 | 1in | Holds anemones |
| Porcelain Crab | 1 | 1in | Anemone dweller |
| Cleaner Shrimp (Skunk) | 2 | 2in | Cleaning stations |
| Fire Shrimp | 2 | 2in | Bright red |
| Peppermint Shrimp | 2 | 2in | Aiptasia control |
| Feather Duster | 2 | 4in | Tube worm |
| Coral Banded Shrimp | 3 | 3in | Striking |
| Pistol Shrimp (various) | 3 | 2in | Pairs with gobies |
| Arrow Crab | 3 | 4in | Bristle worm control |
| Decorator Crab | 3 | 3in | Camouflage |
| Christmas Tree Worm | 3 | 1in | In coral |
| Anemone Crab | 3 | 1in | Symbiont |
| Harlequin Shrimp | 4 | 2in | Eats starfish |
| Maxima Clam | 4 | 12in | Intense light |
| Crocea Clam | 4 | 6in | Colorful |
| Derasa Clam | 5 | 18in | Easier clam |
| Squamosa Clam | 5 | 16in | Large |
| Flame Scallop | 4 | 3in | Difficult |
| Sea Apple | 5 | 6in | Toxic risk |
| Nudibranch (various) | 5 | 2in | Specialist |
| Lettuce Sea Slug | 4 | 3in | Algae eater |
| Horseshoe Crab | 5 | 12in | Needs space |
| Mantis Shrimp | 5 | 6in | SPECIES TANK â€” Apex |

## Anemones (12 species)

| Species | Tier | Difficulty | Hosts Clowns |
|---------|------|------------|--------------|
| Rock Flower Anemone | 1 | Easy | No |
| Mini Carpet Anemone | 1 | Medium | Some |
| Bubble Tip Anemone | 2 | Medium | Yes â€” most |
| Tube Anemone | 3 | Medium | No |
| Long Tentacle Anemone | 3 | Hard | Yes |
| Sebae Anemone | 3 | Hard | Yes |
| Magnificent Anemone | 4 | Expert | Yes â€” preferred |
| Carpet Anemone (Haddoni) | 4 | Hard | Yes â€” eats fish |
| Carpet Anemone (Gigantea) | 5 | Hard | Yes â€” eats fish |
| Aiptasia | 1+ | PEST | No |
| Majano | 2+ | PEST | No |

## Corals â€” Soft (14 species)

| Species | Tier | Flow | Light | Aggression |
|---------|------|------|-------|------------|
| Mushrooms (Rhodactis) | 1 | Low | Low | Low |
| Mushrooms (Discosoma) | 1 | Low | Low | Low |
| Mushrooms (Ricordea) | 1 | Low-Med | Med | Low |
| Zoanthids | 1 | Med | Med | Low-Med |
| Palythoa | 1 | Med | Med | Low-Med |
| Green Star Polyps | 1 | Med-High | Med | INVASIVE |
| Clove Polyps | 1 | Med | Med | Low |
| Blue Clove Polyps | 1 | Med | Med | Low |
| Xenia (Pulsing) | 1 | Med | Med | INVASIVE |
| Anthelia | 1 | Med | Med | Med |
| Kenya Tree | 1 | Med | Med | Low |
| Toadstool Leather | 2 | Med | Med | Med |
| Devil's Hand Leather | 2 | Med | Med | Med |
| Sinularia | 2 | Med | Med | Med |
| Cabbage Leather | 2 | Med | Med | Med |
| Pipe Organ Coral | 2 | Med | Med | Low |

## Corals â€” LPS (20 species)

| Species | Tier | Flow | Light | Aggression |
|---------|------|------|-------|------------|
| Duncan | 2 | Med | Med-High | Low |
| Candy Cane | 2 | Low-Med | Med | Low |
| Blastomussa | 2 | Low | Med | Low |
| Acan Lords | 2 | Low | Med | Med |
| Torch Coral | 3 | Med | Med | HIGH |
| Hammer Coral | 3 | Med | Med | HIGH |
| Frogspawn | 3 | Med | Med | HIGH |
| Octospawn | 3 | Med | Med | HIGH |
| Bubble Coral | 3 | Low | Med | HIGH |
| Brain Coral (Open) | 3 | Low-Med | Med | Med |
| Brain Coral (Closed) | 3 | Low-Med | Med | Med |
| Lobo Brain | 3 | Low | Med | Med |
| Acan Echinata | 3 | Low | Med | Med |
| Scolymia | 3 | Low | Med | Med |
| Chalice Coral | 3 | Low-Med | Med | Med |
| Favia | 3 | Low-Med | Med | Med |
| Favites | 3 | Low-Med | Med | Med |
| Lobophyllia | 3 | Low | Med | Med |
| Plate Coral | 3 | Low | Med | Med |
| Goniopora* | 3 | Low-Med | Med | Med |
| Alveopora | 3 | Low-Med | Med | Med |
| Elegance Coral* | 5 | Low | Med | Med |

*Expert â€” High failure rate

## Corals â€” SPS (18 species)

| Species | Tier | Flow | Light | Notes |
|---------|------|------|-------|-------|
| Montipora capricornis | 4 | High | High | Plating, easier SPS |
| Montipora digitata | 4 | High | High | Branching |
| Montipora confusa | 4 | High | High | Encrusting |
| Birdsnest (Seriatopora) | 4 | High | High | Delicate branches |
| Stylophora | 4 | High | High | Cat's paw |
| Pocillopora | 4 | High | High | Fast grower |
| Pavona | 4 | High | High | Cactus coral |
| Leptoseris | 4 | Med-High | Med-High | Plating |
| Porites | 4 | High | High | Encrusting |
| Cyphastrea | 3 | Med | Med | Easier SPS |
| Platygyra | 3 | Med | Med | Brain-like |
| Hydnophora | 4 | High | High | Horn coral |
| Merulina | 4 | High | High | Ruffled |
| Acropora (Table) | 5 | Very High | Very High | THE PINNACLE |
| Acropora (Staghorn) | 5 | Very High | Very High | THE PINNACLE |
| Acropora (other varieties) | 5 | Very High | Very High | THE PINNACLE |
| Millepora (Fire Coral) | 5 | High | High | Stinging |

## Corals â€” Non-Photosynthetic (6 species) â€” Tier 6

| Species | Tier | Difficulty | Notes |
|---------|------|------------|-------|
| Sun Coral (Tubastrea) | 6 | Expert | Target feeding |
| Dendrophyllia | 6 | Expert | Similar to sun |
| Chili Coral | 6 | Expert | Non-photo soft |
| Gorgonians (various) | 6 | Hard-Expert | Fan corals |
| Carnation Coral* | 6 | Near Impossible | Don't even try |

*Marked as educational "this is too hard"

---

# SUMMARY

| Category | Count |
|----------|-------|
| Terrestrial Invertebrates | 25 |
| Cleanup Crew (Terrestrial) | 9 |
| Amphibians | 26 |
| Reptiles | 27 |
| Birds | 8 |
| Mammals | 4 |
| Terrestrial Plants | 26 |
| Freshwater Fish | 54 |
| Freshwater Invertebrates | 17 |
| Freshwater Plants | 37 |
| Brackish Species | 18 |
| Marine Fish | 79 |
| Marine Invertebrates | 48 |
| Anemones | 12 |
| Corals | 58 |
| **TOTAL** | **503** |

---

# TIER UNLOCK SUMMARY

| Tier | Size | New Species | Highlights |
|------|------|-------------|------------|
| 1 | 27 gal | ~65 | Basics: springtails, isopods, nano fish, soft corals |
| 2 | 60 gal | ~95 | First real animals: dart frogs, clownfish, LPS begins |
| 3 | 135 gal | ~120 | Complexity: coral warfare, larger predators, full LPS |
| 4 | 360 gal | ~100 | Demanding: SPS corals, specialty marine, dangerous inverts |
| 5 | 1,600 gal | ~70 | BIRDS UNLOCK, large tangs, apex predators |
| 6 | 7,500 gal | ~53 | MAMMALS UNLOCK, sharks, deadly displays, full freedom |

---

## SPECIAL CATEGORIES

### Apex Predators
- Giant Centipede (Terrestrial)
- Mantis Shrimp (Marine)
- Lionfish (Marine)
- Carpet Anemone (Marine)

### Deadly â€” Display Only
- Blue Ring Octopus
- Cone Snails
- Box Jellyfish

### Ambush Predators
- Pacman Frog
- Frogfish
- Octopus

### Pest Species (Spawn in tanks)
- Aiptasia
- Majano

### Expert/High Failure Rate
- Goniopora
- Elegance Coral
- Carnation Coral
- Moorish Idol (CUT â€” too hard)

---

**DOCUMENT LOCKED â€” February 2026**
**The Glass Wild â€” 503 Species**
