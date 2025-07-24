<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface MapInfo {
  key: string
  name: string
}

const props = defineProps<{
  activeTab: string
  availableMaps: MapInfo[]
  selectedMap: string
}>()

const emit = defineEmits<{
  tabChange: [tab: string]
  mapChange: [mapKey: string]
}>()

const showMapDropdown = ref(false)

const setActiveTab = (tab: string) => {
  emit('tabChange', tab)
  showMapDropdown.value = false // Close dropdown when switching tabs
}

const toggleMapDropdown = () => {
  showMapDropdown.value = !showMapDropdown.value
}

const handleMapChange = (mapKey: string) => {
  emit('mapChange', mapKey)
  showMapDropdown.value = false // Close dropdown after selection
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const dropdown = document.querySelector('.tab-dropdown')
  if (dropdown && !dropdown.contains(event.target as Node)) {
    showMapDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="tab-container">
    <div class="tab-buttons">
      <button
        @click="setActiveTab('characters')"
        :class="['tab-btn', { active: activeTab === 'characters' }]"
      >
        Characters
      </button>
      <button
        @click="setActiveTab('artifacts')"
        :class="['tab-btn', { active: activeTab === 'artifacts' }]"
      >
        Artifacts
      </button>
      <button
        @click="setActiveTab('mapEditor')"
        :class="['tab-btn', { active: activeTab === 'mapEditor' }]"
      >
        Map Editor
      </button>
      <div class="tab-dropdown">
        <button @click="toggleMapDropdown" class="tab-btn dropdown-btn">
          Map: {{ availableMaps.find((m) => m.key === selectedMap)?.name || 'Arena 1' }} ▼
        </button>
        <div v-if="showMapDropdown" class="dropdown-content">
          <button
            v-for="map in availableMaps"
            :key="map.key"
            @click="handleMapChange(map.key)"
            :class="['dropdown-item', { selected: selectedMap === map.key }]"
          >
            {{ map.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Tab Content Slot -->
    <div class="tab-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.tab-container {
  margin: var(--spacing-2xl) 0;
}

.tab-buttons {
  display: flex;
  justify-content: flex-start;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-large) var(--radius-large) 0 0;
  padding: 0;
  overflow: visible;
  border: 2px solid var(--color-border-primary);
  border-bottom: none;
}

.tab-btn {
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  padding: var(--spacing-lg) var(--spacing-2xl);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all var(--transition-fast);
  border-right: 1px solid var(--color-border-primary);
  position: relative;
}

.tab-btn:last-child {
  border-right: none;
}

.tab-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
}

.tab-btn.active {
  background: var(--color-bg-primary);
  color: var(--color-primary);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-primary);
}

.tab-content {
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border-primary);
  border-radius: 0 0 var(--radius-large) var(--radius-large);
  border-top: none;
}

.tab-dropdown {
  position: relative;
  display: inline-block;
  overflow: visible;
}

.dropdown-btn {
  border-right: 1px solid var(--color-border-primary);
}

.dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border-primary);
  border-top: none;
  border-radius: 0 0 var(--radius-medium) var(--radius-medium);
  z-index: var(--z-dropdown, 9999);
  max-height: 400px;
  overflow-y: auto;
  min-width: 120px;
  box-shadow: var(--shadow-medium);
}

.dropdown-item {
  width: 100%;
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all var(--transition-fast);
  text-align: center;
  border-bottom: 1px solid var(--color-bg-secondary);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
}

.dropdown-item.selected {
  background: var(--color-primary);
  color: white;
}
</style>
