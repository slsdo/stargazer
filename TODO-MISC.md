## Refactor and Improvement Ideas, Code Quality & Patterns

Goal is to enhance the codebase's maintainability, readability, and scalability. The refactoring should be done incrementally, starting with the most critical issues, then moving to architectural improvements.

- Improve performance in pathfinding and calculations, such as introduce memoization
- There are "magic values" scattered across the codebase (e.g., radii, colors, animation timings). For files with many magic numbers, consider moving them to constants at top of their class/file/scripts
- Duplicate code in similar components (Character/Artifact selection), is there room for improvement?
- Inconsistent JSDoc comments, just remove them, keep important informations in the block comments
- Complex logic without explanations, document complex algorithms (pathfinding, hex math)
