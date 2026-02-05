import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/**
 * Singleton GLB/GLTF model loader with caching.
 * Models are loaded once and cloned for each creature instance.
 */
class ModelLoader {
  constructor() {
    this.loader = new GLTFLoader()
    this.cache = new Map()       // speciesId → THREE.Group (original)
    this.loading = new Map()     // speciesId → Promise (in-flight loads)
  }

  /**
   * Load a GLB model. Returns a CLONE of the cached original.
   * @param {string} speciesId - Used as cache key
   * @param {string} path - URL path to .glb file (relative to public/)
   * @returns {Promise<THREE.Group>} - Cloned model ready to use
   */
  async load(speciesId, path) {
    // Return clone from cache if already loaded
    if (this.cache.has(speciesId)) {
      return this.cache.get(speciesId).clone()
    }

    // If currently loading, wait for it then clone
    if (this.loading.has(speciesId)) {
      await this.loading.get(speciesId)
      return this.cache.get(speciesId).clone()
    }

    // Start loading
    const loadPromise = new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          const model = gltf.scene
          // Enable shadows on all meshes
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true
              child.receiveShadow = true
            }
          })
          this.cache.set(speciesId, model)
          this.loading.delete(speciesId)
          resolve()
        },
        undefined, // onProgress - not needed
        (error) => {
          console.error(`Failed to load model for ${speciesId}:`, error)
          this.loading.delete(speciesId)
          reject(error)
        }
      )
    })

    this.loading.set(speciesId, loadPromise)
    await loadPromise
    return this.cache.get(speciesId).clone()
  }

  /**
   * Check if a model is already cached
   */
  has(speciesId) {
    return this.cache.has(speciesId)
  }

  /**
   * Dispose all cached models
   */
  dispose() {
    for (const [, model] of this.cache) {
      model.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => {
              if (m.map) m.map.dispose()
              if (m.normalMap) m.normalMap.dispose()
              if (m.roughnessMap) m.roughnessMap.dispose()
              if (m.metalnessMap) m.metalnessMap.dispose()
              m.dispose()
            })
          } else {
            if (child.material.map) child.material.map.dispose()
            if (child.material.normalMap) child.material.normalMap.dispose()
            if (child.material.roughnessMap) child.material.roughnessMap.dispose()
            if (child.material.metalnessMap) child.material.metalnessMap.dispose()
            child.material.dispose()
          }
        }
      })
    }
    this.cache.clear()
  }
}

export const modelLoader = new ModelLoader()
export default modelLoader
