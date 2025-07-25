<script setup lang="ts">
import TeamToggle from './TeamToggle.vue'
import ClearButton from './ClearButton.vue'
import { useSelectionState } from '../composables/useSelectionState'

interface Props {
  containerClass?: string
  showCounts?: boolean
  allyCount?: number
  enemyCount?: number
  maxCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  showCounts: false,
  allyCount: 0,
  enemyCount: 0,
  maxCount: 5,
})

const { selectedTeam, characterStore, artifactStore, handleTeamChange, handleClearAll } =
  useSelectionState()
</script>

<template>
  <div :class="containerClass">
    <div class="controls-row">
      <TeamToggle
        :selectedTeam="selectedTeam"
        :showCounts="showCounts"
        :allyCount="allyCount"
        :enemyCount="enemyCount"
        :maxCount="maxCount"
        @team-change="handleTeamChange"
      />
      <ClearButton @click="handleClearAll" />
    </div>

    <slot :selectedTeam="selectedTeam" :characterStore="characterStore" :artifactStore="artifactStore" />
  </div>
</template>

<style scoped>
.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
}
</style>