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

// UI System
import { gameState } from './core/GameState.js'
import { uiManager } from './ui/UIManager.js'
import { LandingPage } from './ui/LandingPage.js'
import { GameHUD } from './ui/GameHUD.js'

// ============================================================
// GAME STATE
// ============================================================

let gameInitialized = false
let animationFrameId = null
let landingPage = null
let gameHUD = null

// Three.js objects (initialized lazily)
let scene, camera, renderer, composer, controls
let terrarium, lighting, environment
let clock
let smaaEffect, bloomEffect, vignetteEffect, effectPass

// FPS tracking
let lastTime = performance.now()
let frameCount = 0
let fps = 0

// ============================================================
// INITIALIZE THREE.JS GAME
// ============================================================

function initGame() {
  if (gameInitialized) return
  gameInitialized = true

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  // Camera - positioned for premium product shot feel
  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(55, 35, 55)

  // Renderer
  renderer = new THREE.WebGLRenderer({
    powerPreference: 'high-performance',
    antialias: false,
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

  // Post-processing
  setupPostProcessing()

  // Orbit Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 25
  controls.maxDistance = 120
  controls.maxPolarAngle = Math.PI / 2 + 0.2
  controls.minPolarAngle = 0.2
  controls.target.set(0, 10, 0)
  controls.enablePan = false

  // Lighting
  lighting = new Lighting(scene, renderer)
  lighting.loadHDRI().then(() => {
    console.log('HDRI environment loaded')
  }).catch((err) => {
    console.warn('HDRI load failed, using fallback:', err)
  })

  // Terrarium
  terrarium = new Terrarium(20)
  scene.add(terrarium.group)

  // Environment (fog, dust particles)
  environment = new Environment(scene, 20)

  // Clock
  clock = new THREE.Clock()

  // Keyboard controls
  setupKeyboardControls()

  // Window resize
  window.addEventListener('resize', handleResize)

  // Apply initial quality settings
  applyQualitySettings(gameState.getSetting('graphics', 'quality'))

  console.log('Game initialized')
}

// ============================================================
// POST-PROCESSING SETUP
// ============================================================

function setupPostProcessing() {
  composer = new EffectComposer(renderer)

  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)

  smaaEffect = new SMAAEffect({
    preset: SMAAPreset.HIGH
  })

  bloomEffect = new BloomEffect({
    intensity: 0.35,
    luminanceThreshold: 0.75,
    luminanceSmoothing: 0.3,
    mipmapBlur: true,
    radius: 0.7
  })

  vignetteEffect = new VignetteEffect({
    darkness: 0.4,
    offset: 0.35
  })

  const toneMappingEffect = new ToneMappingEffect({
    mode: ToneMappingMode.AGX,
    resolution: 256,
    whitePoint: 4.0,
    middleGrey: 0.6
  })

  effectPass = new EffectPass(
    camera,
    smaaEffect,
    bloomEffect,
    vignetteEffect,
    toneMappingEffect
  )
  composer.addPass(effectPass)
}

// ============================================================
// QUALITY SETTINGS
// ============================================================

function applyQualitySettings(quality) {
  if (!gameInitialized) return

  switch (quality) {
    case 'low':
      bloomEffect.intensity = 0
      smaaEffect.edgeDetectionMaterial.edgeDetectionThreshold = 0.2
      renderer.setPixelRatio(1)
      break
    case 'medium':
      bloomEffect.intensity = 0.2
      smaaEffect.edgeDetectionMaterial.edgeDetectionThreshold = 0.1
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      break
    case 'high':
    default:
      bloomEffect.intensity = 0.35
      smaaEffect.edgeDetectionMaterial.edgeDetectionThreshold = 0.05
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      break
  }
}

// ============================================================
// KEYBOARD CONTROLS
// ============================================================

function setupKeyboardControls() {
  window.addEventListener('keydown', (event) => {
    // Only handle H key for glass toggle when in game
    if (gameState.currentScreen !== 'game') return

    if (event.key === 'h' || event.key === 'H') {
      terrarium.toggleGlassVisibility()
    }
  })
}

// ============================================================
// ANIMATION LOOP
// ============================================================

function animate() {
  animationFrameId = requestAnimationFrame(animate)

  const deltaTime = clock.getDelta()
  const elapsedTime = clock.getElapsedTime()

  // Calculate FPS
  frameCount++
  const currentTime = performance.now()
  if (currentTime - lastTime >= 1000) {
    fps = frameCount
    frameCount = 0
    lastTime = currentTime
    if (gameHUD) {
      gameHUD.updateFps(fps)
    }
  }

  // Skip updates if paused
  if (!gameState.isPaused) {
    // Update play time
    gameState.updatePlayTime(deltaTime * gameState.timeScale)

    // Update systems with time scale
    const scaledDelta = deltaTime * gameState.timeScale
    terrarium.update(scaledDelta)
    environment.update(scaledDelta, elapsedTime)
    lighting.update(scaledDelta)
  }

  // Always update controls
  controls.update()

  // Render
  composer.render()
}

function startAnimationLoop() {
  if (!animationFrameId && gameInitialized) {
    clock.start()
    animate()
  }
}

function stopAnimationLoop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
    if (clock) clock.stop()
  }
}

// ============================================================
// RESIZE HANDLER
// ============================================================

function handleResize() {
  if (!gameInitialized) return

  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
}

// ============================================================
// SCREEN MANAGEMENT
// ============================================================

function showLandingPage() {
  // Hide game HUD
  if (gameHUD) {
    gameHUD.hide()
  }

  // Hide info text
  const infoEl = document.getElementById('info')
  if (infoEl) {
    infoEl.classList.add('hidden')
  }

  // Stop animation if running
  stopAnimationLoop()

  // Show landing page
  if (!landingPage) {
    landingPage = new LandingPage()
  }
  landingPage.show()
}

function showGame() {
  // Hide landing page
  if (landingPage) {
    landingPage.hide()
  }

  // Initialize game if needed
  initGame()

  // Show info text
  const infoEl = document.getElementById('info')
  if (infoEl) {
    infoEl.classList.remove('hidden')
  }

  // Show HUD
  if (!gameHUD) {
    gameHUD = new GameHUD()
  }
  gameHUD.show()

  // Start animation
  startAnimationLoop()

  // Notify
  const tank = gameState.currentTank
  if (tank) {
    uiManager.notify(`Welcome to ${tank.name}`, 'success')
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================

// Listen for screen changes
gameState.on('screenChange', (screen) => {
  if (screen === 'landing') {
    showLandingPage()
  } else if (screen === 'game') {
    showGame()
  }
})

// Listen for settings changes
gameState.on('settingChanged', ({ category, key, value }) => {
  if (category === 'graphics' && key === 'quality') {
    applyQualitySettings(value)
  }
})

// Listen for auto-save
gameState.on('autoSaved', (tank) => {
  uiManager.notify('Auto-saved', 'info', 2000)
})

// ============================================================
// STARTUP
// ============================================================

// Start with landing page
showLandingPage()

// ============================================================
// DEBUG (DEV MODE)
// ============================================================

if (import.meta.env?.DEV) {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  THE GLASS WILD v0.1.0                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  RENDER PIPELINE:                                            ║
║  • WebGLRenderer (PCFSoftShadowMap, ACESFilmicToneMapping)   ║
║  • Post-processing: SMAA, Bloom, Vignette, AGX Tone Mapping  ║
║                                                              ║
║  MATERIALS:                                                  ║
║  • Glass: MeshPhysicalMaterial (transmission, IOR 1.5)       ║
║  • Plants: MeshStandardMaterial (emissive glow)              ║
║  • Substrate: Displaced geometry + varied materials          ║
║                                                              ║
║  CONTROLS:                                                   ║
║  • H key: Toggle glass walls                                 ║
║  • ESC: Pause menu                                           ║
║  • Mouse: Orbit camera                                       ║
║                                                              ║
║  UI SYSTEM:                                                  ║
║  • Landing Page → New Game / Continue / Settings             ║
║  • Game HUD → Time controls, stats, quick actions            ║
║  • Pause Menu → Resume / Save / Settings / Main Menu         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `)

  // Expose for debugging
  window.gameState = gameState
  window.uiManager = uiManager
}
