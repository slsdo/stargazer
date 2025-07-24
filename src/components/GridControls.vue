<script setup lang="ts">
const props = defineProps<{
  showDebug: boolean
  showArrows: boolean
  showHexIds: boolean
}>()

const emit = defineEmits<{
  'update:showDebug': [value: boolean]
  'update:showArrows': [value: boolean]
  'update:showHexIds': [value: boolean]
}>()

const handleDebugChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:showDebug', target.checked)
}

const handleArrowsChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:showArrows', target.checked)
  emit('update:showHexIds', target.checked) // Keep hex IDs in sync with arrows
}
</script>

<template>
  <div class="grid-controls">
    <label class="grid-toggle-btn">
      <input
        type="checkbox"
        :checked="showDebug"
        @change="handleDebugChange"
        class="grid-toggle-checkbox"
      />
      <span class="grid-toggle-text">Debug View</span>
    </label>
    <label class="grid-toggle-btn">
      <input
        type="checkbox"
        :checked="showArrows"
        @change="handleArrowsChange"
        class="grid-toggle-checkbox"
      />
      <span class="grid-toggle-text">Show Details</span>
    </label>
  </div>
</template>

<style scoped>
.grid-controls {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.grid-toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  user-select: none;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border-primary);
  border-radius: var(--radius-medium);
  padding: var(--spacing-sm) var(--spacing-lg);
  transition: all var(--transition-fast);
}

.grid-toggle-checkbox {
  width: 1.1rem;
  height: 1.1rem;
  cursor: pointer;
  accent-color: var(--color-primary);
  margin: 0;
}

.grid-toggle-text {
  font-weight: 600;
}

.grid-toggle-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.action-btn {
  background: var(--color-primary);
  color: white;
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-medium);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
}

.action-btn:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}
</style>
