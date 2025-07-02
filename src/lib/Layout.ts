import { Hex } from './Hex'

// Orientation for pointy-top hexes
const SQRT3 = Math.sqrt(3)

export interface Point {
  x: number
  y: number
}

export interface LayoutConfig {
  size: Point // size of a hex (radius)
  origin: Point // pixel origin (center of Hex(0,0,0))
}

export class Layout {
  size: Point
  origin: Point

  constructor(config: LayoutConfig) {
    this.size = config.size
    this.origin = config.origin
  }

  // Convert hex to pixel (center)
  hexToPixel(hex: Hex): Point {
    const x = this.size.x * (SQRT3 * hex.q + (SQRT3 / 2) * hex.r)
    const y = this.size.y * (3 / 2) * hex.r
    return {
      x: x + this.origin.x,
      y: y + this.origin.y,
    }
  }

  // Convert pixel to hex (fractional)
  pixelToHex(point: Point): Hex {
    const q =
      (((point.x - this.origin.x) * SQRT3) / 3 - (point.y - this.origin.y) / 3) / this.size.x
    const r = ((point.y - this.origin.y) * 2) / 3 / this.size.y
    return Hex.fromAxial(q, r) // You may want to round to nearest hex
  }

  // Get the corner points of a hex as an array of Points
  polygonCorners(hex: Hex): Point[] {
    const center = this.hexToPixel(hex)
    const corners: Point[] = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30)
      corners.push({
        x: center.x + this.size.x * Math.cos(angle),
        y: center.y + this.size.y * Math.sin(angle),
      })
    }
    return corners
  }
}
