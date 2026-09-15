export const getGlowColor = (linkColor: string) => {
  const colorMap: Record<string, string> = {
    'text-blue-400': '#60a5fa',
    'text-cyan-400': '#22d3ee',
    'text-sky-400': '#38bdf8',
    'text-green-400': '#4ade80',
    'text-purple-400': '#c084fc',
    'text-pink-400': '#f472b6',
    'text-orange-400': '#fb923c'
  }
  return colorMap[linkColor] || '#60a5fa'
}
