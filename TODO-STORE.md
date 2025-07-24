## # Store and Pinia refactor ideas

The `grid.ts` store is functional but has a few architectural smells that could cause issues as the app grows.

### Issues:

- The grid store has a lot of responsibilities and could be split
- Using manual reactivity triggers (`characterUpdateTrigger`) is an anti-pattern

### Improvements:

- Split the grid store into smaller, focused stores
- Use proper Vue reactivity instead of manual triggers

### Detailed Ideas

#### Eliminate the Manual Reactivity Trigger

The `characterUpdateTrigger.value++` is a workaround indicating that Pinia isn't detecting changes properly. This typically happens when mutating a non-reactive object (like the `Grid` class instance) inside a `ref`.

**Recommendation: Refactor the `Grid` Class and Store Interaction**

Instead of mutating the `Grid` instance, make its methods return new data structures, and have the store actions update the state.

**Example: `removeCharacter`**

```typescript
// --- src/lib/grid.ts (Inside Grid class) ---
// This method should just calculate and return the result, not mutate the instance state.
// Let's assume you refactor it to be more functional. For now, let's focus on the store.

// --- src/stores/grid.ts ---
// BEFORE
const removeCharacterFromHex = (hexId: number) => {
  grid.value.removeCharacter(hexId)
  characterUpdateTrigger.value++ // Manual trigger
}

// AFTER
const removeCharacterFromHex = (hexId: number) => {
  // The core logic inside grid.value.removeCharacter should not mutate
  // `this.storage` directly in a way Pinia can't see.
  // A better pattern is to have the Grid class methods return what changed
  // and let the store apply the update.

  // The simplest fix without a major Grid class refactor is to re-assign the ref's value
  // to force reactivity, though refactoring the Grid class is the ideal solution.
  grid.value.removeCharacter(hexId)
  grid.value = Grid.clone(grid.value) // Assuming you add a clone method to the Grid class
}
```
