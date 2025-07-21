import { State } from '../constants'

export const ARENA_3 = {
  name: 'Arena III',
  grid: [
    { type: State.AVAILABLE_SELF, hex: [1, 2, 4, 5, 7, 13, 14, 16, 21] },
    {
      type: State.AVAILABLE_ENEMY,
      hex: [25, 30, 32, 33, 37, 39, 41, 42, 44, 45],
    },
    { type: State.BLOCKED, hex: [10, 12, 15, 17, 22, 24, 29, 31, 34, 36] },
    { type: State.BLOCKED_BREAKABLE, hex: [] },
  ],
}
