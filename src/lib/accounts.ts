/** Color suggestions for known Brazilian banks + a preset palette for custom accounts. */

const BANK_COLORS: Record<string, string> = {
  nubank:       '#820AD1',
  inter:        '#FF6900',
  c6:           '#1E1E1E',
  itau:         '#F36F21',
  bradesco:     '#CC0000',
  santander:    '#EC0000',
  picpay:       '#21C25E',
  xp:           '#1A1A2E',
  btg:          '#003087',
  caixa:        '#005CA9',
  sicoob:       '#007DB3',
  sicredi:      '#009B3A',
  original:     '#00704A',
  neon:         '#00D4AA',
  pagbank:      '#00A859',
  mercadopago:  '#009EE3',
};

/** Preset swatches shown in the color picker. */
export const COLOR_PRESETS = [
  '#820AD1', // Nubank purple
  '#FF6900', // Inter orange
  '#21C25E', // PicPay green
  '#3B82F6', // blue
  '#EC4899', // pink
  '#F59E0B', // amber
  '#14B8A6', // teal
  '#6B7280', // gray (default)
];

/** Returns a color hex for a bank name, or gray if unknown. */
export function suggestAccountColor(name: string): string {
  const normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

  for (const [key, color] of Object.entries(BANK_COLORS)) {
    if (normalized.includes(key)) return color;
  }
  return '#6B7280';
}
