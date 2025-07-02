<template>
  <div class="hex-grid-container">
    <div class="controls mb-4">
      <h2 class="text-2xl font-bold mb-2">Hexagonal Grid</h2>
      <p class="text-gray-600 mb-2">
        Click on any hex to select it.
        <span v-if="selectedHex"> Selected: Hex {{ selectedHex.getId() }}</span>
      </p>
      <div class="flex gap-4 mb-2">
        <button
          @click="resetGrid"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reset Grid
        </button>
        <button
          @click="toggleShowCoords"
          class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          {{ showCoords ? 'Hide' : 'Show' }} Coordinates
        </button>
      </div>
    </div>

    <div class="grid-wrapper border-2 border-gray-200 rounded-lg p-4 bg-white overflow-auto">
      <svg
        :width="svgWidth"
        :height="svgHeight"
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        class="mx-auto"
      >
        <!-- Render each hex -->
        <g v-for="hex in hexes" :key="hexKey(hex)" @click="selectHex(hex)" style="cursor: pointer">
          <!-- Hex polygon -->
          <polygon
            :points="getPolygonPoints(hex)"
            :fill="getHexFill(hex)"
            :stroke="getHexStroke(hex)"
            :stroke-width="getHexStrokeWidth(hex)"
            class="hex-polygon transition-all duration-200 hover:stroke-blue-400"
          />

          <!-- Hex ID text -->
          <text
            :x="getHexCenter(hex).x"
            :y="getHexCenter(hex).y + 4"
            text-anchor="middle"
            font-size="14"
            font-weight="bold"
            :fill="getTextColor(hex)"
            pointer-events="none"
          >
            {{ hex.getId() }}
          </text>

          <!-- Coordinates text (when enabled) -->
          <text
            v-if="showCoords"
            :x="getHexCenter(hex).x"
            :y="getHexCenter(hex).y - 8"
            text-anchor="middle"
            font-size="10"
            :fill="getTextColor(hex)"
            pointer-events="none"
            opacity="0.7"
          >
            {{ hex.q }},{{ hex.r }}
          </text>
        </g>
      </svg>
    </div>

    <!-- Debug info -->
    <div class="mt-4 p-4 bg-gray-100 rounded-lg">
      <h3 class="font-semibold mb-2">Grid Info:</h3>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div><strong>Total Hexes:</strong> {{ hexes.length }}</div>
        <div><strong>Available:</strong> {{ getStateCount(State.AVAILABLE_SELF) }}</div>
        <div><strong>Occupied (Self):</strong> {{ getStateCount(State.OCCUPIED_SELF) }}</div>
        <div><strong>Occupied (Enemy):</strong> {{ getStateCount(State.OCCUPIED_ENEMY) }}</div>
        <div><strong>Blocked:</strong> {{ getStateCount(State.BLOCKED) }}</div>
        <div v-if="selectedHex">
          <strong>Selected Coords:</strong> ({{ selectedHex.q }}, {{ selectedHex.r }},
          {{ selectedHex.s }})
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Import your classes (adjust paths as needed)
// import { Grid, State } from './Grid'
// import { Layout, type Point, type LayoutConfig } from './Layout'
// import { Hex } from './Hex'

// Mock implementations for demonstration - replace with your actual imports
class Hex {
  constructor(
    public q: number,
    public r: number,
    public s: number,
    private id: number = -1,
  ) {}
  getId(): number {
    return this.id
  }
}

enum State {
  DEFAULT = 0,
  AVAILABLE_SELF = 1,
  AVAILABLE_ENEMY = 2,
  OCCUPIED_SELF = 3,
  OCCUPIED_ENEMY = 4,
  BLOCKED = 5,
}

interface Point {
  x: number
  y: number
}

class Layout {
  constructor(private config: { size: Point; origin: Point }) {}

  hexToPixel(hex: Hex): Point {
    const SQRT3 = Math.sqrt(3)
    const x = this.config.size.x * (SQRT3 * hex.q + (SQRT3 / 2) * hex.r)
    const y = this.config.size.y * (3 / 2) * hex.r
    return {
      x: x + this.config.origin.x,
      y: y + this.config.origin.y,
    }
  }

  polygonCorners(hex: Hex): Point[] {
    const center = this.hexToPixel(hex)
    const corners: Point[] = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30)
      corners.push({
        x: center.x + this.config.size.x * Math.cos(angle),
        y: center.y + this.config.size.y * Math.sin(angle),
      })
    }
    return corners
  }
}

class Grid {
  private storage = new Map<string, { hex: Hex; state: State }>()

  constructor() {
    // Simplified grid data for demo
    const gridData = [
      [43, 45],
      [35, 38, 40, 42, 44],
      [28, 31, 34, 37, 39, 41],
      [21, 24, 27, 30, 33, 36],
      [14, 17, 20, 23, 26, 29, 32],
      [10, 13, 16, 19, 22, 25],
      [5, 7, 9, 12, 15, 18],
      [2, 4, 6, 8, 11],
      [1, 3],
    ]

    const rowConfigs = [
      { r: -4, qOffset: -1 },
      { r: -3, qOffset: -2 },
      { r: -2, qOffset: -3 },
      { r: -1, qOffset: -3 },
      { r: 0, qOffset: -3 },
      { r: 1, qOffset: -3 },
      { r: 2, qOffset: -3 },
      { r: 3, qOffset: -2 },
      { r: 4, qOffset: -1 },
    ]

    for (let rowIndex = 0; rowIndex < gridData.length; rowIndex++) {
      const row = gridData[rowIndex]
      const config = rowConfigs[rowIndex]

      for (let i = 0; i < row.length; i++) {
        const q = config.qOffset + i
        const r = config.r
        const s = -q - r
        const id = row[i]
        const hex = new Hex(q, r, s, id)

        this.storage.set(`${q},${r},${s}`, { hex, state: State.DEFAULT })
      }
    }
  }

  keys(): Hex[] {
    return Array.from(this.storage.values()).map((entry) => entry.hex)
  }

  getState(hex: Hex): State {
    return this.storage.get(`${hex.q},${hex.r},${hex.s}`)?.state || State.DEFAULT
  }

  set(hex: Hex, state: State): void {
    const entry = this.storage.get(`${hex.q},${hex.r},${hex.s}`)
    if (entry) {
      entry.state = state
    }
  }

  entries(): Array<{ hex: Hex; value: State }> {
    return Array.from(this.storage.values()).map((entry) => ({
      hex: entry.hex,
      value: entry.state,
    }))
  }
}

// Reactive state
const grid = ref(new Grid())
const layout = ref(
  new Layout({
    size: { x: 25, y: 25 },
    origin: { x: 200, y: 150 },
  }),
)
const selectedHex = ref<Hex | null>(null)
const showCoords = ref(false)

// Computed properties
const hexes = computed(() => grid.value.keys())
const svgWidth = computed(() => 400)
const svgHeight = computed(() => 300)

// Methods
const hexKey = (hex: Hex): string => `${hex.q},${hex.r},${hex.s}`

const getHexCenter = (hex: Hex): Point => {
  return layout.value.hexToPixel(hex)
}

const getPolygonPoints = (hex: Hex): string => {
  const corners = layout.value.polygonCorners(hex)
  return corners.map((corner) => `${corner.x},${corner.y}`).join(' ')
}

const getHexFill = (hex: Hex): string => {
  if (selectedHex.value && hexKey(hex) === hexKey(selectedHex.value)) {
    return '#3b82f6' // Blue when selected
  }

  const state = grid.value.getState(hex)
  switch (state) {
    case State.AVAILABLE_SELF:
      return '#10b981' // Green
    case State.AVAILABLE_ENEMY:
      return '#f59e0b' // Yellow
    case State.OCCUPIED_SELF:
      return '#3b82f6' // Blue
    case State.OCCUPIED_ENEMY:
      return '#ef4444' // Red
    case State.BLOCKED:
      return '#6b7280' // Gray
    default:
      return '#f9fafb' // Light gray
  }
}

const getHexStroke = (hex: Hex): string => {
  if (selectedHex.value && hexKey(hex) === hexKey(selectedHex.value)) {
    return '#1d4ed8' // Darker blue when selected
  }
  return '#374151' // Dark gray
}

const getHexStrokeWidth = (hex: Hex): number => {
  if (selectedHex.value && hexKey(hex) === hexKey(selectedHex.value)) {
    return 3
  }
  return 2
}

const getTextColor = (hex: Hex): string => {
  if (selectedHex.value && hexKey(hex) === hexKey(selectedHex.value)) {
    return '#ffffff' // White text on selected hex
  }

  const state = grid.value.getState(hex)
  switch (state) {
    case State.OCCUPIED_SELF:
    case State.OCCUPIED_ENEMY:
    case State.BLOCKED:
      return '#ffffff'
    default:
      return '#374151'
  }
}

const selectHex = (hex: Hex): void => {
  selectedHex.value = selectedHex.value && hexKey(hex) === hexKey(selectedHex.value) ? null : hex
}

const resetGrid = (): void => {
  grid.value = new Grid()
  selectedHex.value = null
}

const toggleShowCoords = (): void => {
  showCoords.value = !showCoords.value
}

const getStateCount = (state: State): number => {
  return grid.value.entries().filter((entry) => entry.value === state).length
}

// Demo function to set some random states
const setDemoStates = (): void => {
  const hexArray = hexes.value

  // Set some hexes to different states for demonstration
  if (hexArray.length > 10) {
    grid.value.set(hexArray[5], State.AVAILABLE_SELF)
    grid.value.set(hexArray[10], State.OCCUPIED_SELF)
    grid.value.set(hexArray[15], State.AVAILABLE_ENEMY)
    grid.value.set(hexArray[20], State.OCCUPIED_ENEMY)
    grid.value.set(hexArray[25], State.BLOCKED)
  }
}

onMounted(() => {
  setDemoStates()
})
</script>

<style scoped>
.hex-grid-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.grid-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 350px;
}

.hex-polygon {
  transition:
    stroke 0.2s ease,
    stroke-width 0.2s ease;
}

.hex-polygon:hover {
  stroke: #60a5fa !important;
  stroke-width: 3;
}

.controls {
  text-align: center;
}

@media (max-width: 640px) {
  .hex-grid-container {
    padding: 0.5rem;
  }

  .controls .flex {
    flex-direction: column;
    gap: 0.5rem;
  }

  .controls button {
    width: 100%;
  }
}
</style>
