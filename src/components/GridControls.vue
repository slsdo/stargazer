<script setup lang="ts">
defineProps<{
  showDebug: boolean
  showArrows: boolean
  showHexIds: boolean
}>()

const emit = defineEmits<{
  'update:showDebug': [value: boolean]
  'update:showArrows': [value: boolean]
  'update:showHexIds': [value: boolean]
  copyLink: []
  copyImage: []
  download: []
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

const handleCopyLink = () => {
  emit('copyLink')
}

const handleCopyImage = () => {
  emit('copyImage')
}

const handleDownload = () => {
  emit('download')
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

    <!-- Action Buttons -->
    <button @click="handleCopyLink" class="action-btn">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="btn-icon"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      Link
    </button>
    <button @click="handleCopyImage" class="action-btn">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="btn-icon"
      >
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="m4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </svg>
      Copy
    </button>
    <button @click="handleDownload" class="action-btn">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="btn-icon"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7,10 12,15 17,10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Download
    </button>
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
  gap: var(--spacing-xs);
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  user-select: none;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border-primary);
  border-radius: var(--radius-medium);
  padding: var(--spacing-sm) var(--spacing-md);
  transition: all var(--transition-fast);
}

.grid-toggle-checkbox {
  width: 0.9rem;
  height: 0.9rem;
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
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
  height: auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.action-btn:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.btn-icon {
  flex-shrink: 0;
}
</style>
