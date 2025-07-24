# TODO: URL Serialization Optimization

## Overview
The current Copy Link feature generates URLs that can become quite long due to verbose JSON serialization. This document outlines potential optimizations to significantly reduce URL length while maintaining full functionality.

## Current State Analysis

### Data Patterns
- **Character IDs**: 84 unique strings (3-15 chars, avg 6-7 chars)
- **Map Names**: 5 maps ("arena1" - "arena5", 6 chars each)
- **Team Values**: "Ally", "Enemy" (4-5 chars each)
- **Hex IDs**: Numbers 1-45 (already compact)
- **Artifact IDs**: 5 unique strings (8-12 chars each)

### Current URL Example
```
?state=eyJ2ZXJzaW9uIjoxLCJtYXAiOiJhcmVuYTEiLCJjaGFyYWN0ZXJzIjpbeyJoZXhJZCI6NSwiY2hhcmFjdGVySWQiOiJzaGFraXIiLCJ0ZWFtIjoiQWxseSJ9XSwiYXJ0aWZhY3RzIjp7ImFsbHkiOiJzdGFyc2hhcmQiLCJlbmVteSI6bnVsbH19
```
**Length**: ~200+ characters

## Optimization Opportunities

### 1. Character ID Compression 🎯 **HIGHEST IMPACT**
**Current**: Full string names (6-15 chars)
```json
{"characterId": "elijah-lailah"}  // 15 chars
```

**Optimized**: Character index mapping
```typescript
// Implementation approach:
const CHAR_LOOKUP = ['alsa', 'antandra', 'arden', ...] // 84 entries
const CHAR_MAP = new Map(CHAR_LOOKUP.map((id, i) => [id, i]))

// "elijah-lailah" → index 25 → "P" in base36
```

**Expected Savings**: 70-80% reduction per character reference

### 2. JSON Structure Optimization
**Current**: Verbose property names
```json
{
  "version": 1,
  "map": "arena1",
  "characters": [{"hexId": 5, "characterId": "shakir", "team": "Ally"}],
  "artifacts": {"ally": "starshard", "enemy": null}
}
```

**Optimized**: Shortened keys + arrays
```json
{
  "v": 1,
  "m": "1",
  "c": [[5, 42, "A"]],  // [hexId, charIndex, team]
  "a": ["S", null]      // [ally, enemy]
}
```

**Expected Savings**: ~40 chars in structure + 70% in character data

### 3. Enum Value Compression
**Current**:
- Teams: `"Ally"` (4 chars), `"Enemy"` (5 chars)
- Maps: `"arena1"` (6 chars)
- Artifacts: `"starshard"` (9 chars)

**Optimized**:
- Teams: `"A"`, `"E"` (1 char each)
- Maps: `"1"`, `"2"`, `"3"`, `"4"`, `"5"` (1 char each)
- Artifacts: `"S"`, `"E"`, `"B"`, `"C"`, `"I"` (1 char each)

**Expected Savings**: 75-85% reduction per enum reference

### 4. Advanced Compression Techniques
- **Binary encoding**: Replace JSON+base64 with custom binary format
- **Bit packing**: Pack multiple small values into single bytes
- **Variable-length encoding**: Compress numbers based on actual ranges
- **Dictionary compression**: Create mini-dictionaries for repeated patterns

## Expected Results

### Target URL Length
```
?state=eyJ2IjoxLCJtIjoiMSIsImMiOltbNSw0MiwiQSJdXSwiYSI6WyJTIixudWxsXX0%3D
```
**Length**: ~80-100 characters
**Overall Reduction**: 50-60% shorter URLs

## Implementation Strategy

### Phase 1: Character Index System
- [ ] Create character lookup arrays in `src/utils/characterLookup.ts`
- [ ] Add encode/decode functions for character IDs
- [ ] Update serialization to use indices instead of names
- [ ] Maintain backward compatibility with version field
- [ ] Test with existing shared URLs

**Files to modify**:
- `src/utils/gridStateSerializer.ts`
- `src/utils/urlStateManager.ts`

### Phase 2: Structure Optimization
- [ ] Implement shortened property names
- [ ] Convert character objects to arrays `[hexId, charIndex, team]`
- [ ] Compress team enum values to single characters
- [ ] Compress map keys to single digits
- [ ] Compress artifact IDs to single characters

### Phase 3: Advanced Compression (Optional)
- [ ] Research and implement custom binary encoding
- [ ] Add compression library (e.g., pako for gzip)
- [ ] Benchmark different compression approaches
- [ ] Consider URL length limits across browsers/platforms

## Benefits

### User Experience
- **Shorter URLs**: Easier to share, especially on mobile
- **Better UX**: URLs fit better in chat/email interfaces
- **Faster sharing**: Less data to copy/paste

### Technical Benefits
- **Faster parsing**: Smaller JSON objects
- **Better caching**: Shorter URLs are more cache-friendly
- **Network efficiency**: Less data transfer
- **Future-proof**: Index-based system scales with more characters

### Mobile Considerations
- **SMS limits**: Shorter URLs work better in text messages
- **URL sharing**: Some platforms truncate long URLs
- **QR codes**: Shorter URLs generate simpler QR codes

## Compatibility Considerations

### Backward Compatibility
- Use version field to support both old and new formats
- Implement gradual migration strategy
- Maintain decode support for existing shared URLs

### Browser Limits
- Most browsers support URLs up to 2083 characters
- Current optimization keeps us well under this limit
- Consider URL shortening services for extreme cases

## Testing Strategy

### Test Cases
- [ ] Empty grid state
- [ ] Single character placement
- [ ] Full grid with all character types
- [ ] Mixed team placements
- [ ] Various artifact combinations
- [ ] All map configurations

### Performance Testing
- [ ] Measure encoding/decoding performance
- [ ] Compare URL lengths before/after
- [ ] Test browser compatibility
- [ ] Validate shared URL restoration

## Future Enhancements

### Possible Extensions
- **Custom URL shortener**: Internal service for even shorter URLs
- **Compression algorithms**: Research domain-specific compression
- **Progressive encoding**: Different compression levels based on data size
- **URL analytics**: Track which optimizations provide most benefit

---

## Implementation Priority
1. **High**: Character ID compression (biggest impact, lowest risk)
2. **Medium**: Structure optimization (good savings, moderate effort)
3. **Low**: Advanced compression (diminishing returns, higher complexity)

*Estimated development time: 1-2 days for Phase 1, 2-3 days for Phase 2*