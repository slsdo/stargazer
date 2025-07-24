<script setup lang="ts">
import { Team } from '../lib/types/team'

const props = defineProps<{
  selectedTeam: Team
  showCounts?: boolean
  allyCount?: number
  enemyCount?: number
  maxCount?: number
}>()

const emit = defineEmits<{
  teamChange: [team: Team]
}>()

const setTeam = (team: Team) => {
  emit('teamChange', team)
}
</script>

<template>
  <div class="team-toggle">
    <button
      @click="setTeam(Team.ALLY)"
      :class="['team-btn', { active: selectedTeam === Team.ALLY }]"
    >
      <span v-if="showCounts">Ally ({{ allyCount }}/{{ maxCount }})</span>
      <span v-else>Ally</span>
    </button>
    <button
      @click="setTeam(Team.ENEMY)"
      :class="['team-btn', { active: selectedTeam === Team.ENEMY }]"
    >
      <span v-if="showCounts">Enemy ({{ enemyCount }}/{{ maxCount }})</span>
      <span v-else>Enemy</span>
    </button>
  </div>
</template>

<style scoped>
.team-toggle {
  display: flex;
  justify-content: center;
  gap: 0;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-large);
  padding: 4px;
  border: 2px solid var(--color-border-primary);
  width: fit-content;
}

.team-btn {
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all var(--transition-fast);
  border-radius: var(--radius-medium);
  width: 120px;
}

.team-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
}

.team-btn.active {
  background: var(--color-primary);
  color: white;
}
</style>
