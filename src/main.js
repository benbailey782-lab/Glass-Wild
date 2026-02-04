import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  VignetteEffect,
  ToneMappingEffect,
  ToneMappingMode,
  SMAAEffect,
  SMAAPreset
} from 'postprocessing'

import { Terrarium } from './scene/Terrarium.js'
import { Lighting } from './scene/Lighting.js'
import { Environment } from './scene/Environment.js'
import { HUD } from './ui/HUD.js'

// ============================================================
// SCENE SETUP
// ============================================================

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1a1a2e)

// Camera - positioned for premium product shot feel
const camera = new THREE.PerspectiveCamera(
  40, // Slightly tighter FOV for product photography feel
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(55, 35, 55)

// ============================================================
// RENDERER
// ============================================================

const renderer = new THREE.WebGLRenderer({
  powerPreference: 'high-performance',
  antialias: false, // Using SMAA post-process instead
  stencil: false,
  depth: true
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.1
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.SRGBColorSpace
document.body.appendChild(renderer.domElement)

// ============================================================
// POST-PROCESSING
// ============================================================

const composer = new EffectComposer(renderer)

// Render pass
const renderPass = new RenderPass(scene, camera)
composer.addPass(renderPass)

// SMAA anti-aliasing
const smaaEffect = new SMAAEffect({
  preset: SMAAPreset.HIGH
})

// Bloom effect - subtle glow
const bloomEffect = new BloomEffect({
  intensity: 0.35,
  luminanceThreshold: 0.75,
  luminanceSmoothing: 0.3,
  mipmapBlur: true,
  radius: 0.7
})

// Vignette - subtle darkening at edges
const vignetteEffect = new VignetteEffect({
  darkness: 0.4,
  offset: 0.35
})

// Tone mapping (already done by renderer, but can add filmic adjustments)
const toneMappingEffect = new ToneMappingEffect({
  mode: ToneMappingMode.AGX,
  resolution: 256,
  whitePoint: 4.0,
  middleGrey: 0.6
})

// Combined effect pass
const effectPass = new EffectPass(
  camera,
  smaaEffect,
  bloomEffect,
  vignetteEffect,
  toneMappingEffect
)
composer.addPass(effectPass)

// ============================================================
// ORBIT CONTROLS
// ============================================================

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.minDistance = 25
controls.maxDistance = 120
controls.maxPolarAngle = Math.PI / 2 + 0.2
controls.minPolarAngle = 0.2
controls.target.set(0, 10, 0)
controls.enablePan = false // Cleaner for product showcase

// ============================================================
// LIGHTING
// ============================================================

const lighting = new Lighting(scene, renderer)

// Load HDRI environment map asynchronously
lighting.loadHDRI().then(() => {
  console.log('HDRI environment loaded')
}).catch((err) => {
  console.warn('HDRI load failed, using fallback:', err)
})

// ============================================================
// TERRARIUM
// ============================================================

const terrarium = new Terrarium(20)
scene.add(terrarium.group)

// ============================================================
// ENVIRONMENT (fog, dust particles)
// ============================================================

const environment = new Environment(scene, 20)

// ============================================================
// HUD
// ============================================================

const hud = new HUD()

// ============================================================
// KEYBOARD CONTROLS
// ============================================================

window.addEventListener('keydown', (event) => {
  if (event.key === 'h' || event.key === 'H') {
    terrarium.toggleGlassVisibility()
    hud.updateGlassHint(terrarium.glassVisible)
  }
})

// ============================================================
// ANIMATION LOOP
// ============================================================

const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)

  const deltaTime = clock.getDelta()
  const elapsedTime = clock.getElapsedTime()

  // Update systems
  controls.update()
  terrarium.update(deltaTime)
  environment.update(deltaTime, elapsedTime)
  lighting.update(deltaTime)

  // Render with post-processing
  composer.render()
}

animate()

// ============================================================
// RESPONSIVE RESIZE
// ============================================================

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
})

// ============================================================
// RENDER PIPELINE VISUALIZATION (for debugging)
// ============================================================

if (import.meta.env?.DEV) {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  GLASS WILD RENDER PIPELINE                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌─────────────┐                                             ║
║  │   Scene     │  Three.js Scene Graph                       ║
║  │  (objects)  │  - Terrarium (glass, substrate, plants)     ║
║  └──────┬──────┘  - Lighting (HDRI env + 3-point lights)     ║
║         │         - Environment (fog planes, dust particles) ║
║         ▼                                                    ║
║  ┌─────────────┐                                             ║
║  │  Renderer   │  WebGLRenderer                              ║
║  │  Settings   │  - PCFSoftShadowMap                         ║
║  └──────┬──────┘  - ACESFilmicToneMapping                    ║
║         │         - sRGB Color Space                         ║
║         ▼                                                    ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │              POST-PROCESSING STACK                      │ ║
║  │  ┌─────────────┐                                        │ ║
║  │  │ RenderPass  │ → Base scene render                    │ ║
║  │  └──────┬──────┘                                        │ ║
║  │         ▼                                               │ ║
║  │  ┌─────────────┐                                        │ ║
║  │  │EffectPass   │ → Combined effects:                    │ ║
║  │  │             │   • SMAA (anti-aliasing)               │ ║
║  │  │             │   • Bloom (intensity: 0.35)            │ ║
║  │  │             │   • Vignette (subtle edge darkening)   │ ║
║  │  │             │   • AGX Tone Mapping                   │ ║
║  │  └──────┬──────┘                                        │ ║
║  └─────────┼───────────────────────────────────────────────┘ ║
║            ▼                                                 ║
║  ┌─────────────┐                                             ║
║  │   Canvas    │  Final composited output                    ║
║  └─────────────┘                                             ║
║                                                              ║
║  MATERIALS:                                                  ║
║  • Glass: MeshPhysicalMaterial (transmission, IOR 1.5)       ║
║  • Plants: MeshStandardMaterial (emissive glow)              ║
║  • Substrate: Displaced geometry + varied materials          ║
║                                                              ║
║  ATMOSPHERE:                                                 ║
║  • FogExp2 (depth-based, density 0.008)                      ║
║  • Volumetric fog planes (4 layers)                          ║
║  • Dust particles (150 points, additive blend)               ║
║                                                              ║
║  CONTROLS:                                                   ║
║  • H key: Toggle glass walls (smooth 0.3s fade)              ║
║  • Mouse: Orbit camera                                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `)
}
