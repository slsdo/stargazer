# Character ID Migration Plan - Hard Cutover

## Executive Summary

This plan outlines a complete migration from using `character.name` as the primary identifier to using `character.id` throughout the application. This is a breaking change with no backward compatibility - a clean, one-time cutover that will improve performance and consistency.

## Current State Analysis

### How Character Names Are Currently Used
- **Grid System**: All grid methods use character names as identifiers
- **State Management**: Character placement tracking uses name-based Sets and Maps  
- **URL Serialization**: Character names stored in URL state
- **Drag & Drop**: Character names used in drag data
- **Component Props**: Character names passed between components
- **Store Methods**: All character operations use names as parameters

### Post-Migration State
- **character.name**: Used ONLY for display purposes (UI labels, debug views)
- **character.id**: Used for ALL functional operations (placement, lookup, storage)

## Migration Strategy - Single Phase Implementation

### Core Infrastructure Updates

#### 1. Grid System Overhaul
```typescript
// src/lib/grid.ts
interface GridTile {
  hex: Hex
  state: State
  characterId?: number  // Changed from character?: string
  team?: Team
}

// Updated methods:
- placeCharacter(hexOrId: Hex | number, characterId: number, team: Team)
- getCharacterIdOnTile(hexOrId: Hex | number): number | undefined  
- removeCharacter(hexOrId: Hex | number)
- hasCharacter(hexOrId: Hex | number): boolean
- getCharacterCount(): number
- clearAllCharacters(): void

// Updated team tracking:
- teamCharacters: Map<Team, Set<number>>  // Changed from Set<string>
```

#### 2. Character Store Complete Rewrite
```typescript
// src/stores/character.ts
- getTilesWithCharacters(): Array<GridTile & { characterId: number }>
- placeCharacterOnHex(hexId: number, characterId: number, team: Team)
- autoPlaceCharacter(characterId: number, team: Team)
- moveCharacter(fromHexId: number, toHexId: number, characterId: number)
- swapCharacters(fromHexId: number, toHexId: number)
- removeCharacterFromHex(hexId: number)
- getCharacterOnHex(hexId: number): number | undefined
- isCharacterPlaced(characterId: number, team: Team): boolean
```

#### 3. Data Loading & Character Utilities
```typescript
// src/utils/dataLoader.ts
- characterRangesCache: Map<number, number>  // ID -> range
- getCharacterRanges(): Map<number, number>

// New file: src/utils/characterUtils.ts
export function createCharacterIdMap(characters: CharacterType[]): Map<number, CharacterType>
export function getCharacterById(characters: CharacterType[], id: number): CharacterType | undefined
export function getCharacterNameById(characters: CharacterType[], id: number): string | undefined
```

#### 4. Game Data Store Updates
```typescript
// src/stores/gameData.ts
- characterRanges: Map<number, number>  // Changed from Map<string, number>
- getCharacterRange(characterId: number): number
- getCharacterById(characterId: number): CharacterType | undefined
- getCharacterNameById(characterId: number): string | undefined
```

### Component Updates

#### 5. Character Selection Component
```typescript
// src/components/CharacterSelection.vue
- isCharacterPlaced(characterId: number): boolean
- handleCharacterClick(character: CharacterType): void // uses character.id
- removeCharacterFromGrid(characterId: number): void
- All store calls updated to use character.id
```

#### 6. Grid Components
```typescript
// src/components/GridManager.vue
- characterPlacements: Map<number, number>  // hexId -> characterId
- All character operations use IDs
- Character lookups by ID for drag/drop

// src/components/GridCharacters.vue
- characterPlacements: Map<number, number>  // Changed prop type
- getCharacterLevel(characterId: number): 's' | 'a'
- getBackgroundColor(characterId: number): string
- Character image lookup: characterImages[getCharacterNameById(characterId)]
```

#### 7. Drag & Drop System
```typescript
// src/composables/useDragDrop.ts
interface DragData {
  characterId: number     // Changed from characterName: string
  character: CharacterType
  characterImage?: string
}

// src/components/DragDropProvider.vue
- All drag data uses character.id
- Drop handling uses character.id
- Team assignment uses character.id
```

### State Serialization

#### 8. URL State Management
```typescript
// src/utils/gridStateSerializer.ts
interface GridState {
  characterId?: number    // Changed from characterName?: string
}

// src/stores/urlState.ts
- Serialize/deserialize character IDs instead of names
- URL format completely changes (breaking change)
```

### Pathfinding Integration

#### 9. Pathfinding Store Updates
```typescript
// src/stores/pathfinding.ts
- tilesWithCharacters processing uses characterId
- Range lookups use character ID maps
- Debug pathfinding results use character IDs
```

#### 10. Character Range Integration
```typescript
// All pathfinding operations use:
- characterRanges.get(characterId) instead of characterRanges.get(characterName)
- Character lookup by ID for range calculations
```

## Implementation Checklist

### Phase 1: Data Layer (Day 1)
- [ ] Update GridTile interface to use characterId
- [ ] Rewrite Grid class methods for character ID
- [ ] Update characterRangesCache to use ID as key
- [ ] Create character utility functions
- [ ] Update gameData store for ID-based operations

### Phase 2: Store Layer (Day 2) 
- [ ] Completely rewrite character store methods
- [ ] Update team tracking to use character IDs
- [ ] Modify grid store integration
- [ ] Update pathfinding store for ID usage

### Phase 3: Component Layer (Day 3)
- [ ] Update CharacterSelection to use character.id
- [ ] Modify GridManager for ID-based operations
- [ ] Update GridCharacters for ID-based rendering
- [ ] Fix all character image lookups (name-based display)

### Phase 4: Interaction Layer (Day 4)
- [ ] Rewrite drag & drop to use character IDs
- [ ] Update all event handlers for ID usage
- [ ] Modify character placement logic
- [ ] Fix character removal operations

### Phase 5: Serialization & Testing (Day 5)
- [ ] Update URL serialization for character IDs
- [ ] Rewrite grid state serialization
- [ ] Comprehensive testing of all flows
- [ ] Performance validation

## Display vs Functional Usage

### Functional Usage (character.id)
- Grid tile storage
- Character placement tracking
- Drag & drop operations
- URL serialization
- Store method parameters
- Event handling
- Pathfinding calculations

### Display Usage (character.name)
```typescript
// Examples of acceptable character.name usage:
- Debug grid labels: `${getCharacterNameById(characterId)}`
- UI tooltips: `character.name`
- Console logging: `Found character: ${character.name}`
- Error messages: `Character ${character.name} not found`
```

## Breaking Changes

### Complete Breaking Changes
1. **URL Format**: All existing URLs become invalid
2. **Grid Serialization**: Saved grid states incompatible
3. **Component Props**: All character-related props change type
4. **Store APIs**: All character store methods change signatures
5. **Event Signatures**: All character events use IDs

### No Migration Path
- No backward compatibility maintained
- Clean break from name-based system
- Existing saved states will be lost

## Testing Strategy

### Critical Test Areas
1. **Character Placement**: Place/remove characters by ID
2. **Drag & Drop**: Full drag/drop workflow with IDs
3. **Team Management**: Character team assignment by ID
4. **URL Serialization**: Save/load grid state with IDs
5. **Pathfinding**: All pathfinding calculations with IDs
6. **Display**: Character names show correctly in UI

### Test Data Requirements
- Characters with sequential IDs (1, 2, 3...)
- Mixed team placements
- Complex grid states for serialization testing

## Implementation Notes

### Character Lookup Patterns
```typescript
// BEFORE (using names)
const character = characters.find(c => c.name === characterName)
const range = characterRanges.get(characterName)

// AFTER (using IDs)
const character = characterIdMap.get(characterId)
const range = characterRanges.get(characterId)
const characterName = character?.name || 'Unknown'
```

### Error Handling
- Character ID not found scenarios
- Invalid ID type validation
- Graceful degradation for display

### Performance Expectations
- Character lookup operations: 90%+ faster (Map vs Array.find)
- Memory usage: 15-20% reduction
- URL state size: 30-40% smaller

## Success Criteria

### Functional Requirements
- ✅ All character operations use character.id
- ✅ Character names only used for display
- ✅ No name-based functional code remains
- ✅ All existing features work with IDs

### Performance Requirements  
- ✅ Character lookups sub-millisecond
- ✅ Memory usage reduced
- ✅ URL serialization faster

### Code Quality
- ✅ Type safety improved
- ✅ No string-based character identification
- ✅ Clear separation of display vs functional usage

---

**Status**: Ready for Implementation
**Author**: Claude  
**Date**: 2025-01-26
**Implementation**: 5-day hard cutover
**Breaking Changes**: Complete - No backward compatibility