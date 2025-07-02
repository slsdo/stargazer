<script setup lang="ts">
import { ref } from 'vue'
import CharacterSelection from '../components/CharacterSelection.vue'
import Test from '../components/Test.vue'
import type { CharacterType } from '../types/character'
import { Grid, State } from '../lib/Grid'
import { Layout } from '../lib/Layout'

const grid = new Grid()
const layout = new Layout({ size: { x: 32, y: 32 }, origin: { x: 250, y: 250 } })
const hexes = grid.keys()
const isIsometric = ref(false)
const skewX = ref(-3)
const skewY = ref(1)
const scaleX = ref(0.95)
const scaleY = ref(0.65)

const characters = (
  Object.values(
    import.meta.glob('../data/character/*.json', { eager: true, import: 'default' }),
  ) as CharacterType[]
).sort((a, b) => a.faction.localeCompare(b.faction))

const characterImages = Object.fromEntries(
  Object.entries(
    import.meta.glob('../assets/images/character/*.png', { eager: true, import: 'default' }),
  ).map(([path, src]) => [(path.split('/').pop() ?? '').replace('.png', ''), src as string]),
)

const icons = Object.fromEntries(
  Object.entries(
    import.meta.glob('../assets/images/icons/*.png', { eager: true, import: 'default' }),
  ).map(([path, src]) => [(path.split('/').pop() ?? '').replace('.png', ''), src as string]),
)
</script>

<template>
  <main>
    <div class="content">
      <div class="grid">
        <h1>AFKJ Grid</h1>
        <div class="section">
          <p>Edit</p>
        </div>
      </div>

      <div class="section"><Test /></div>

      <div class="section">
        <button @click="isIsometric = !isIsometric" style="margin-bottom: 1em">
          {{ isIsometric ? 'Standard View' : 'Isometric View' }}
        </button>
        <div v-if="isIsometric" style="margin-bottom: 1em">
          <label
            >skewX: {{ skewX }}
            <input type="range" min="-60" max="60" v-model.number="skewX" />
          </label>
          <label style="margin-left: 2em"
            >skewY: {{ skewY }}
            <input type="range" min="-60" max="60" v-model.number="skewY" />
          </label>
          <label style="margin-left: 2em"
            >scaleX: {{ scaleX }}
            <input type="range" min="0.2" max="2" step="0.01" v-model.number="scaleX" />
          </label>
          <label style="margin-left: 2em"
            >scaleY: {{ scaleY }}
            <input type="range" min="0.2" max="2" step="0.01" v-model.number="scaleY" />
          </label>
        </div>
        <div id="map">
          <svg :width="500" :height="500">
            <g
              :transform="
                isIsometric ? `skewX(${skewX}) skewY(${skewY}) scale(${scaleX},${scaleY})` : ''
              "
            >
              <g v-for="hex in hexes" :key="hex.getId()">
                <polygon
                  :points="
                    layout
                      .polygonCorners(hex)
                      .map((p) => `${p.x},${p.y}`)
                      .join(' ')
                  "
                  :fill="'#fff'"
                  :stroke="'#222'"
                  stroke-width="2"
                />
                <text
                  :x="layout.hexToPixel(hex).x"
                  :y="layout.hexToPixel(hex).y + 6"
                  text-anchor="middle"
                  font-size="18"
                  fill="#222"
                  font-family="monospace"
                >
                  {{ hex.getId() }}
                </text>
                <text
                  :x="layout.hexToPixel(hex).x"
                  :y="layout.hexToPixel(hex).y + 18"
                  text-anchor="middle"
                  font-size="8"
                  fill="#555"
                  font-family="monospace"
                >
                  ({{ hex.q }},{{ hex.r }},{{ hex.s }})
                </text>
              </g>
            </g>
          </svg>
        </div>
      </div>

      <div class="section">
        <CharacterSelection
          :characters="characters"
          :characterImages="characterImages"
          :icons="icons"
        />
      </div>
    </div>
  </main>
</template>

<style scoped>
main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.content {
  max-width: 1280px;
  width: 100%;
  padding: 0 2em;
  text-align: center;
}

.section {
  padding: 2em;
  margin: 2rem 0;
  color: #484848;
  background-color: #f8f5ec;
  border-radius: 8px;
}

.svgGrid {
  border: 1px solid #000;
}
</style>
