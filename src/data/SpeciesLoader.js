/**
 * SpeciesLoader - Loads and caches species data from JSON files
 */

// Species file path mapping (files served from public directory)
const SPECIES_PATHS = {
  powder_blue_isopod: '/data/species/terrestrial/cleanup-crew/powder-blue-isopod.json',
  springtails: '/data/species/terrestrial/cleanup-crew/springtails.json',
  dendrobates_auratus: '/data/species/terrestrial/amphibians/dart-frogs/dendrobates-auratus.json'
}

// Cache for loaded species data
const speciesCache = new Map()

// Required fields for validation
const REQUIRED_FIELDS = [
  'identity.id',
  'identity.common_name',
  'physical.size_adult_inches',
  'behavior.movement_speed_normal',
  'stress.stress_baseline'
]

/**
 * Check if a nested field exists in an object
 */
function hasNestedField(obj, path) {
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current === undefined || current === null || !(part in current)) {
      return false
    }
    current = current[part]
  }
  return true
}

/**
 * Validate that required fields exist in species data
 */
function validateSpeciesData(data, speciesId) {
  const missingFields = []
  for (const field of REQUIRED_FIELDS) {
    if (!hasNestedField(data, field)) {
      missingFields.push(field)
    }
  }

  if (missingFields.length > 0) {
    console.warn(`Species "${speciesId}" is missing required fields: ${missingFields.join(', ')}`)
    return false
  }

  return true
}

/**
 * Load species data by ID
 * @param {string} speciesId - The species identifier (e.g., 'powder_blue_isopod')
 * @returns {Promise<Object|null>} - Species data or null if not found
 */
export async function load(speciesId) {
  // Check cache first
  if (speciesCache.has(speciesId)) {
    return speciesCache.get(speciesId)
  }

  // Get file path
  const filePath = SPECIES_PATHS[speciesId]
  if (!filePath) {
    console.warn(`Unknown species ID: "${speciesId}". Available species: ${Object.keys(SPECIES_PATHS).join(', ')}`)
    return null
  }

  try {
    const response = await fetch(filePath)
    if (!response.ok) {
      console.warn(`Failed to load species "${speciesId}": HTTP ${response.status}`)
      return null
    }

    const data = await response.json()

    // Validate required fields
    if (!validateSpeciesData(data, speciesId)) {
      return null
    }

    // Cache the data
    speciesCache.set(speciesId, data)

    return data
  } catch (error) {
    console.warn(`Error loading species "${speciesId}":`, error)
    return null
  }
}

/**
 * Preload multiple species
 * @param {string[]} speciesIds - Array of species IDs to preload
 * @returns {Promise<Map<string, Object>>} - Map of species ID to data
 */
export async function preload(speciesIds) {
  const results = new Map()
  const promises = speciesIds.map(async (id) => {
    const data = await load(id)
    if (data) {
      results.set(id, data)
    }
  })
  await Promise.all(promises)
  return results
}

/**
 * Get a cached species (returns null if not loaded)
 * @param {string} speciesId - The species identifier
 * @returns {Object|null} - Cached species data or null
 */
export function getCached(speciesId) {
  return speciesCache.get(speciesId) || null
}

/**
 * Check if a species is loaded in cache
 * @param {string} speciesId - The species identifier
 * @returns {boolean}
 */
export function isLoaded(speciesId) {
  return speciesCache.has(speciesId)
}

/**
 * Clear the species cache
 */
export function clearCache() {
  speciesCache.clear()
}

/**
 * Get all available species IDs
 * @returns {string[]}
 */
export function getAvailableSpecies() {
  return Object.keys(SPECIES_PATHS)
}

// Default export as an object with all methods
export default {
  load,
  preload,
  getCached,
  isLoaded,
  clearCache,
  getAvailableSpecies
}
