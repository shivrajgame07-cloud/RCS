export function parseVoiceCommand(text: string) {
  const steps: { type: 'move' | 'turn'; value: number; unit: 'cm' | 'deg' }[] = [];
  const normalized = text.toLowerCase().trim();
  
  if (!normalized) return [];

  const UNIT_CONVERSIONS: { [key: string]: number } = {
    'cm': 1,
    'centimeter': 1,
    'centimeters': 1,
    'm': 100,
    'meter': 100,
    'meters': 100,
    'inch': 2.54,
    'inches': 2.54,
    'foot': 30.48,
    'feet': 30.48
  };

  const RELATIVE_TURNS: { [key: string]: number } = {
    'a bit': 15,
    'slightly': 15,
    'a little': 15,
    'some': 45,
    'sharply': 90,
    'a lot': 90,
    'completely': 180,
    'halfway': 180,
    'around': 180
  };

  // Split command into segments by conjunctions
  const segments = normalized.split(/\s+(?:then|and|afterwards|next)\s+/);

  segments.forEach(seg => {
    let found = false;

    // Movement: (direction) (value) (unit?) or (direction) (unit?)
    // Examples: "move forward 2 meters", "backwards 50", "go forward half a meter" (half not supported yet, keep it simple)
    const moveRegex = /(?:move|go|drive|travel)\s+(forward|backward|back|reverse)?\s*(\d*\.?\d+)?\s*(cm|centimeters?|m|meters?|inches?|ft|feet|foot)?/i;
    const moveMatch = seg.match(moveRegex);

    if (moveMatch && (moveMatch[1] || moveMatch[2])) {
      const direction = moveMatch[1] || 'forward';
      const rawValue = moveMatch[2] ? parseFloat(moveMatch[2]) : 10; // Default to 10 if no number
      const unit = moveMatch[3] || 'cm';
      const multiplier = (direction.includes('back') || direction.includes('reverse')) ? -1 : 1;
      const unitMult = UNIT_CONVERSIONS[unit] || 1;

      steps.push({
        type: 'move',
        value: rawValue * multiplier * unitMult,
        unit: 'cm'
      });
      found = true;
    }

    // Turns: (turn) (direction) (value degrees?) or (turn) (relative term) (direction)
    // Examples: "turn left 90 degrees", "rotate right sharply", "turn a bit right"
    const relativeKeys = Object.keys(RELATIVE_TURNS).join('|');
    const turnRegex = new RegExp(`(?:turn|rotate|spin)\\s+(?:(${relativeKeys})\\s+)?(left|right|ccw|cw)\\s*(?:(?:by|to)?\\s*(\\d+))?`, 'i');
    const turnMatch = seg.match(turnRegex);

    if (turnMatch) {
      const relativeTerm = turnMatch[1];
      const direction = turnMatch[2];
      const rawValue = turnMatch[3] ? parseInt(turnMatch[3]) : (relativeTerm ? RELATIVE_TURNS[relativeTerm] : 90);
      const multiplier = (direction === 'left' || direction === 'ccw') ? 1 : -1;

      steps.push({
        type: 'turn',
        value: rawValue * multiplier,
        unit: 'deg'
      });
      found = true;
    }

    // Fallback for simple "left 90" or "right 45"
    if (!found) {
      const simpleTurnMatch = seg.match(/(left|right)\s+(\d+)/i);
      if (simpleTurnMatch) {
        const direction = simpleTurnMatch[1];
        const val = parseInt(simpleTurnMatch[2]);
        steps.push({
          type: 'turn',
          value: val * (direction === 'left' ? 1 : -1),
          unit: 'deg'
        });
      }
    }
  });

  return steps;
}
