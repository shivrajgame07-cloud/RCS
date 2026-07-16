import * as THREE from 'three';

export interface GridNode {
  x: number;
  z: number;
  g: number; // Cost from start
  h: number; // Estimated cost to end
  f: number; // Total cost (g + h)
  parent: GridNode | null;
}

const GRID_SIZE = 1;
const SEARCH_RADIUS = 20;

export function aStar(start: THREE.Vector3, end: THREE.Vector3): THREE.Vector3[] {
  const openSet: GridNode[] = [];
  const closedSet: Set<string> = new Set();

  const startNode: GridNode = {
    x: Math.round(start.x / GRID_SIZE) * GRID_SIZE,
    z: Math.round(start.z / GRID_SIZE) * GRID_SIZE,
    g: 0,
    h: diagonalDistance(start.x, start.z, end.x, end.z),
    f: 0,
    parent: null
  };
  startNode.f = startNode.h;

  openSet.push(startNode);

  while (openSet.length > 0) {
    // Get node with lowest f
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIdx].f) currentIdx = i;
    }
    const current = openSet.splice(currentIdx, 1)[0];
    closedSet.add(`${current.x},${current.z}`);

    // If reached end (close enough)
    if (Math.abs(current.x - end.x) < GRID_SIZE && Math.abs(current.z - end.z) < GRID_SIZE) {
      return reconstructPath(current);
    }

    // Neighbors
    const neighbors = getNeighbors(current);
    for (const neighbor of neighbors) {
      if (closedSet.has(`${neighbor.x},${neighbor.z}`)) continue;

      const gScore = current.g + 1;
      let inOpenSet = false;
      let openNode = openSet.find(n => n.x === neighbor.x && n.z === neighbor.z);
      
      if (openNode) {
        if (gScore < openNode.g) {
          openNode.g = gScore;
          openNode.f = openNode.g + openNode.h;
          openNode.parent = current;
        }
      } else {
        neighbor.g = gScore;
        neighbor.h = diagonalDistance(neighbor.x, neighbor.z, end.x, end.z);
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.parent = current;
        openSet.push(neighbor);
      }
    }

    // Safety break
    if (closedSet.size > 500) break;
  }

  return [new THREE.Vector3(start.x, 0, start.z), new THREE.Vector3(end.x, 0, end.z)];
}

function getNeighbors(node: GridNode): GridNode[] {
  const neighbors: GridNode[] = [];
  const dirs = [
    { x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 },
    { x: 1, z: 1 }, { x: 1, z: -1 }, { x: -1, z: 1 }, { x: -1, z: -1 }
  ];

  for (const dir of dirs) {
    neighbors.push({
      x: node.x + dir.x * GRID_SIZE,
      z: node.z + dir.z * GRID_SIZE,
      g: 0, h: 0, f: 0, parent: null
    });
  }
  return neighbors;
}

function diagonalDistance(x1: number, z1: number, x2: number, z2: number): number {
  const dx = Math.abs(x1 - x2);
  const dz = Math.abs(z1 - z2);
  return (dx + dz) + (Math.sqrt(2) - 2) * Math.min(dx, dz);
}

function reconstructPath(node: GridNode): THREE.Vector3[] {
  const path: THREE.Vector3[] = [];
  let current: GridNode | null = node;
  while (current) {
    path.unshift(new THREE.Vector3(current.x, 0.05, current.z));
    current = current.parent;
  }
  return path;
}
