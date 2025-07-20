import { ref } from 'vue'
import type { CharacterType } from '../types/character'

// MIME type for character drag data
const CHARACTER_MIME_TYPE = 'application/character'

// Drag state
const isDragging = ref(false)
const draggedCharacter = ref<CharacterType | null>(null)
const draggedImageSrc = ref<string>('')
const dragPreviewPosition = ref({ x: 0, y: 0 })

export const useDragDrop = () => {
  // Start dragging a character
  const startDrag = (event: DragEvent, character: CharacterType, characterId: string, imageUrl?: string) => {
    if (!event.dataTransfer) return

    isDragging.value = true
    draggedCharacter.value = character
    draggedImageSrc.value = imageUrl || characterId

    // Set initial position
    updateDragPosition(event.clientX, event.clientY)

    // Set drag data
    event.dataTransfer.setData(CHARACTER_MIME_TYPE, JSON.stringify({
      character,
      characterId
    }))

    // Set drag effect
    event.dataTransfer.effectAllowed = 'copy'
    
    // Hide the default drag image
    const dragImage = new Image()
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='
    event.dataTransfer.setDragImage(dragImage, 0, 0)
    
    // Add visual feedback to original element
    if (event.target instanceof HTMLElement) {
      event.target.style.opacity = '0.5'
    }

    // Add global mouse move listener for drag preview
    document.addEventListener('dragover', handleGlobalDragOver)
    document.addEventListener('drag', handleGlobalDrag)
  }

  // Update drag preview position
  const updateDragPosition = (x: number, y: number) => {
    dragPreviewPosition.value = { x: x - 35, y: y - 35 } // Offset to center the preview
  }

  // Global drag over handler for position tracking
  const handleGlobalDragOver = (event: DragEvent) => {
    if (isDragging.value) {
      updateDragPosition(event.clientX, event.clientY)
      // Don't prevent default here - let the target elements handle it
    }
  }

  // Global drag handler for position tracking
  const handleGlobalDrag = (event: DragEvent) => {
    if (isDragging.value && event.clientX !== 0 && event.clientY !== 0) {
      updateDragPosition(event.clientX, event.clientY)
    }
  }

  // Handle drag end
  const endDrag = (event: DragEvent) => {
    isDragging.value = false
    draggedCharacter.value = null
    draggedImageSrc.value = ''

    // Reset visual feedback
    if (event.target instanceof HTMLElement) {
      event.target.style.opacity = '1'
    }

    // Remove global event listeners
    document.removeEventListener('dragover', handleGlobalDragOver)
    document.removeEventListener('drag', handleGlobalDrag)
    
    // Emit event to clear any hover states
    document.dispatchEvent(new CustomEvent('drag-ended'))
  }

  // Handle drag over (required for drop to work)
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
  }

  // Handle drop
  const handleDrop = (event: DragEvent): { character: CharacterType; characterId: string } | null => {
    event.preventDefault()
    console.log('handleDrop called')
    
    if (!event.dataTransfer) {
      console.log('No dataTransfer')
      return null
    }

    try {
      const dragData = event.dataTransfer.getData(CHARACTER_MIME_TYPE)
      console.log('Drag data:', dragData)
      
      if (!dragData) {
        console.log('No drag data found')
        return null
      }

      const { character, characterId } = JSON.parse(dragData)
      console.log('Parsed character:', character.id)
      return { character, characterId }
    } catch (error) {
      console.error('Error parsing drag data:', error)
      return null
    }
  }

  // Check if event contains character data
  const hasCharacterData = (event: DragEvent): boolean => {
    return event.dataTransfer?.types.includes(CHARACTER_MIME_TYPE) || false
  }

  return {
    // State
    isDragging,
    draggedCharacter,
    draggedImageSrc,
    dragPreviewPosition,
    
    // Actions
    startDrag,
    endDrag,
    handleDragOver,
    handleDrop,
    hasCharacterData,
    updateDragPosition,
  }
}