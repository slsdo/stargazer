import { State } from '../lib/gridState'

export const getHexFillColor = (state: State): string => {
  switch (state) {
    case State.AVAILABLE_SELF:
      return '#fff'
    case State.AVAILABLE_ENEMY:
    case State.OCCUPIED_ENEMY:
      return '#ffe8e8'
    case State.OCCUPIED_SELF:
      return '#e8f5e8'
    case State.BLOCKED:
      return '#6d6b67'
    case State.BLOCKED_BREAKABLE:
      return '#d9d5cd'
    case State.DEFAULT:
    default:
      return '#f0f0f0'
  }
}

export const getHexStrokeColor = (state: State): string => {
  switch (state) {
    case State.AVAILABLE_SELF:
      return '#4CAF50'
    case State.AVAILABLE_ENEMY:
    case State.OCCUPIED_ENEMY:
      return '#f44336'
    case State.OCCUPIED_SELF:
      return '#4CAF50'
    case State.BLOCKED:
    case State.BLOCKED_BREAKABLE:
      return '#000'
    case State.DEFAULT:
    default:
      return '#ccc'
  }
}
