// Mapping des classes Tailwind vers les couleurs CSS
export const PROJECT_COLORS = [
  { name: 'Bleu', value: 'bg-blue-500', hex: '#3B82F6', cssClass: 'bg-blue-500' },
  { name: 'Violet', value: 'bg-purple-500', hex: '#8B5CF6', cssClass: 'bg-purple-500' },
  { name: 'Orange', value: 'bg-orange-500', hex: '#F97316', cssClass: 'bg-orange-500' },
  { name: 'Vert', value: 'bg-green-500', hex: '#10B981', cssClass: 'bg-green-500' },
  { name: 'Rouge', value: 'bg-red-500', hex: '#EF4444', cssClass: 'bg-red-500' },
  { name: 'Rose', value: 'bg-pink-500', hex: '#EC4899', cssClass: 'bg-pink-500' },
  { name: 'Indigo', value: 'bg-indigo-500', hex: '#6366F1', cssClass: 'bg-indigo-500' },
  { name: 'Teal', value: 'bg-teal-500', hex: '#14B8A6', cssClass: 'bg-teal-500' },
  { name: 'Jaune', value: 'bg-yellow-500', hex: '#EAB308', cssClass: 'bg-yellow-500' },
  { name: 'Gris', value: 'bg-gray-500', hex: '#6B7280', cssClass: 'bg-gray-500' },
];

// Fonction pour assombrir une couleur de 50%
function darkenColor(hex: string, percent: number = 50): string {
  // Convertir hex en RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Assombrir de 50%
  const factor = (100 - percent) / 100;
  const newR = Math.round(r * factor);
  const newG = Math.round(g * factor);
  const newB = Math.round(b * factor);
  
  // Convertir en hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Fonction pour obtenir la couleur CSS à partir de la classe Tailwind
export const getProjectColor = (tailwindClass: string, darken: boolean = true): string => {
  const color = PROJECT_COLORS.find(c => c.value === tailwindClass);
  if (!color) return darken ? darkenColor('#6B7280', 50) : '#6B7280';
  return darken ? darkenColor(color.hex, 50) : color.hex; // Couleur originale si darken=false
};

// Fonction pour obtenir la classe CSS à partir de la classe Tailwind
export const getProjectCssClass = (tailwindClass: string): string => {
  const color = PROJECT_COLORS.find(c => c.value === tailwindClass);
  return color ? color.cssClass : 'bg-gray-500';
}; 