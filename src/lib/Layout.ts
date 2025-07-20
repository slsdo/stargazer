import { Hex } from './Hex'

const SQRT3 = Math.sqrt(3)

// Orientation matrices for hex-to-pixel and pixel-to-hex conversion
export interface Orientation {
  f0: number // forward transform matrix (2x2)
  f1: number
  f2: number
  f3: number
  b0: number // backward transform matrix (2x2)
  b1: number
  b2: number
  b3: number
  startAngle: number // angle offset for corner vertices, multiples of 60deg
}

// Pointy-top orientation
export const POINTY: Orientation = {
  f0: SQRT3,
  f1: SQRT3 / 2,
  f2: 0,
  f3: 3 / 2,
  b0: SQRT3 / 3,
  b1: -1 / 3,
  b2: 0,
  b3: 2 / 3,
  startAngle: 0.5,
}

// Flat-top orientation
export const FLAT: Orientation = {
  f0: 3 / 2,
  f1: 0,
  f2: SQRT3 / 2,
  f3: SQRT3,
  b0: 2 / 3,
  b1: 0,
  b2: -1 / 3,
  b3: SQRT3 / 3,
  startAngle: 0,
}

export interface Point {
  x: number
  y: number
}

export class Layout {
  orientation: Orientation
  size: Point
  origin: Point

  constructor(
    orientation: Orientation, // hex orientation (pointy-top or flat-top)
    size: Point, // size of a hex (radius)
    origin: Point, // pixel origin (center of Hex(0,0,0))
  ) {
    this.orientation = orientation
    this.size = size
    this.origin = origin
  }

  // Convert hex to pixel (center)
  hexToPixel(hex: Hex): Point {
    const M = this.orientation
    const x = (M.f0 * hex.q + M.f1 * hex.r) * this.size.x
    const y = (M.f2 * hex.q + M.f3 * hex.r) * this.size.y
    return {
      x: x + this.origin.x,
      y: y + this.origin.y,
    }
  }

  // Convert pixel to hex (fractional)
  pixelToHex(point: Point): Hex {
    const M = this.orientation
    const pt = {
      x: (point.x - this.origin.x) / this.size.x,
      y: (point.y - this.origin.y) / this.size.y,
    }
    const q = M.b0 * pt.x + M.b1 * pt.y
    const r = M.b2 * pt.x + M.b3 * pt.y
    return Hex.fromAxial(q, r)
  }

  // Calculate offset used to get corner location relative to center
  hexCornerOffset(corner: number): Point {
    const angle = (2 * Math.PI * (this.orientation.startAngle + corner)) / 6
    return {
      x: this.size.x * Math.cos(angle),
      y: this.size.y * Math.sin(angle),
    }
  }

  // Get the corner points of a hex as an array of Points
  polygonCorners(hex: Hex): Point[] {
    const center = this.hexToPixel(hex)
    const corners: Point[] = []
    for (let i = 0; i < 6; i++) {
      const offset = this.hexCornerOffset(i)
      corners.push({
        x: center.x + offset.x,
        y: center.y + offset.y,
      })
    }
    return corners
  }
}
