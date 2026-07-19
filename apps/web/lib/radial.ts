// Seat/bubble geometry for the radial HQ scene. All positions are percentages
// (0-100) of a square-ish container, so the layout scales with viewport
// without any pixel math in the components themselves.

export interface SeatPosition {
  seat: number;
  /** degrees, -90 = 12 o'clock, increasing clockwise */
  angleDeg: number;
  x: number;
  y: number;
}

const CENTER = 50;
const RX = 38; // ellipse horizontal radius (% of container) — wider than tall,
const RY = 32; //  to suit a 16:9 projector and ease crowding at N=5/6.

/** Places N seats evenly around the center at 360°/N spacing, seat 0 at the top. */
export function seatLayout(n: number): SeatPosition[] {
  if (n <= 0) return [];
  return Array.from({ length: n }, (_, i) => {
    const angleDeg = -90 + i * (360 / n);
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      seat: i,
      angleDeg,
      x: CENTER + RX * Math.cos(angleRad),
      y: CENTER + RY * Math.sin(angleRad),
    };
  });
}

/** A point further outward from center along a seat's angle, for anchoring its ThinkBubble. */
export function outwardPoint(pos: SeatPosition, outwardPct: number): { x: number; y: number } {
  const angleRad = (pos.angleDeg * Math.PI) / 180;
  return {
    x: pos.x + outwardPct * Math.cos(angleRad),
    y: pos.y + outwardPct * Math.sin(angleRad),
  };
}

/** ThinkBubble steps down one size notch once the council is 5 or 6 strong (spec 07). */
export function bubbleSizeNotch(councilSize: number): "normal" | "compact" {
  return councilSize >= 5 ? "compact" : "normal";
}
