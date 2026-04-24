export function parseVoiceCommand(text: string) {
  const steps: { type: 'move' | 'turn'; value: number; unit: 'cm' | 'deg' }[] = [];
  const normalized = text.toLowerCase();
  
  // Basic patterns
  const movePatterns = [
    /forward\s+(\d+)/,
    /move\s+(\d+)/,
    /go\s+(\d+)/,
    /back\s+(\d+)/,
    /backward\s+(\d+)/
  ];

  const turnPatterns = [
    /right\s+(\d+)/,
    /left\s+(\d+)/,
    /turn\s+(\d+)/
  ];

  // This is a naive parser for the demo
  // A real implementation would use a more robust regex or NLP
  const segments = normalized.split(/then|and/);

  segments.forEach(seg => {
    movePatterns.forEach(pattern => {
      const match = seg.match(pattern);
      if (match) {
        steps.push({
          type: 'move',
          value: parseInt(match[1]) * (seg.includes('back') ? -1 : 1),
          unit: 'cm'
        });
      }
    });

    turnPatterns.forEach(pattern => {
      const match = seg.match(pattern);
      if (match) {
        steps.push({
          type: 'turn',
          value: parseInt(match[1]) * (seg.includes('left') ? -1 : 1),
          unit: 'deg'
        });
      }
    });
  });

  return steps;
}
