import { suggestAccountColor } from '../accounts';

describe('suggestAccountColor', () => {
  it('reconhece Nubank', () => {
    expect(suggestAccountColor('Nubank')).toBe('#820AD1');
  });

  it('reconhece Inter', () => {
    expect(suggestAccountColor('Inter')).toBe('#FF6900');
  });

  it('reconhece PicPay', () => {
    expect(suggestAccountColor('PicPay')).toBe('#21C25E');
  });

  it('é case-insensitive', () => {
    expect(suggestAccountColor('NUBANK')).toBe('#820AD1');
    expect(suggestAccountColor('nubank')).toBe('#820AD1');
  });

  it('faz match por substring — nome composto', () => {
    expect(suggestAccountColor('Conta Nubank Pessoal')).toBe('#820AD1');
    expect(suggestAccountColor('Banco Inter PF')).toBe('#FF6900');
  });

  it('ignora acentos no nome', () => {
    // "Caixa Econômica" → normaliza para "caixa economica" → bate em "caixa"
    expect(suggestAccountColor('Caixa Econômica')).toBe('#005CA9');
  });

  it('retorna cinza para banco desconhecido', () => {
    expect(suggestAccountColor('Banco do Brasil')).toBe('#6B7280');
    expect(suggestAccountColor('')).toBe('#6B7280');
  });
});
