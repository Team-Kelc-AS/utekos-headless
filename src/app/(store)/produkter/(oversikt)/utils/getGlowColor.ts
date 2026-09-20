export const getGlowColor = (linkColor: string) => {
  const colorMap: Record<string, string> = {
    'text-ancient-water': 'oklch(0.8733 0.0246 259.82)',
    'text-ceramic': 'oklch(0.6678 0.1141 194.02)',
    'text-green-400': '#38b49e',
    'text-very-peri': 'oklch(0.5433 0.105 281.67)',
    'text-heart': 'oklch(0.6302 0.2298 25.38)',
    'text-primary': 'oklch(0.537541 0.156162 44.0778)',
    'text-dark-teal': 'oklch(0.3507 0.0622 183.77)'
  }
  return colorMap[linkColor] || 'oklch(0.8733 0.0246 259.82)'
}
