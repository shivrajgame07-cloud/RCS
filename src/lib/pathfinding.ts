interface Node {
  x: number;
  y: number;
  g: number; // cost from start
  h: number; // heuristic cost to end
  f: number; // total cost
  parent: Node | null;
}

export function findPath(start: { x: number; y: number }, end: { x: number; y: number }, grid: number[][]) {
  const openList: Node[] = [];
  const closedList: Node[] = [];

  const startNode: Node = { x: Math.round(start.x), y: Math.round(start.y), g: 0, h: 0, f: 0, parent: null };
  const endNode: Node = { x: Math.round(end.x), y: Math.round(end.y), g: 0, h: 0, f: 0, parent: null };

  openList.push(startNode);

  while (openList.length > 0) {
    let currentIndex = 0;
    for (let i = 0; i < openList.length; i++) {
      if (openList[i].f < openList[currentIndex].f) currentIndex = i;
    }

    const currentNode = openList[currentIndex];
    openList.splice(currentIndex, 1);
    closedList.push(currentNode);

    if (currentNode.x === endNode.x && currentNode.y === endNode.y) {
      const path: { x: number; y: number }[] = [];
      let current: Node | null = currentNode;
      while (current) {
        path.push({ x: current.x, y: current.y });
        current = current.parent;
      }
      return path.reverse();
    }

    const neighbors = [
      { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }
    ];

    for (const neighbor of neighbors) {
      const nx = currentNode.x + neighbor.x;
      const ny = currentNode.y + neighbor.y;

      if (nx < 0 || nx >= grid.length || ny < 0 || ny >= grid[0].length || grid[nx][ny] === 1) continue;

      if (closedList.find(n => n.x === nx && n.y === ny)) continue;

      const gScore = currentNode.g + 1;
      let existingNode = openList.find(n => n.x === nx && n.y === ny);

      if (!existingNode || gScore < existingNode.g) {
        const hScore = Math.abs(nx - endNode.x) + Math.abs(ny - endNode.y);
        if (!existingNode) {
          openList.push({ x: nx, y: ny, g: gScore, h: hScore, f: gScore + hScore, parent: currentNode });
        } else {
          existingNode.g = gScore;
          existingNode.f = gScore + hScore;
          existingNode.parent = currentNode;
        }
      }
    }
  }

  return [];
}
