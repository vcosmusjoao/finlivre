import { stripInstallmentText } from '../projection';

describe('stripInstallmentText', () => {
  it('remove "Parcela X/Y" do final', () => {
    expect(stripInstallmentText('CASAS BAHIA Parcela 3/12')).toBe('CASAS BAHIA');
  });

  it('remove "- Parcela X/Y" com traço antes', () => {
    expect(stripInstallmentText('CASAS BAHIA - Parcela 8/12')).toBe('CASAS BAHIA');
  });

  it('remove "- X/Y" no formato curto com traço', () => {
    expect(stripInstallmentText('Pix no Crédito - BUYTICKET - 1/3')).toBe('Pix no Crédito - BUYTICKET');
  });

  it('remove " X/Y" no final sem traço', () => {
    expect(stripInstallmentText('CASAS BAHIA 03/12')).toBe('CASAS BAHIA');
  });

  it('é case-insensitive para a palavra Parcela', () => {
    expect(stripInstallmentText('Loja PARCELA 2/5')).toBe('Loja');
  });

  it('não altera descrição sem parcela', () => {
    expect(stripInstallmentText('NETFLIX')).toBe('NETFLIX');
    expect(stripInstallmentText('iFood - NuPay')).toBe('iFood - NuPay');
  });

  it('não confunde datas (dia/mês) no meio da descrição com parcela', () => {
    // "10/06" no meio não está no final — não deve ser removido
    expect(stripInstallmentText('Compra 10/06 no mercado')).toBe('Compra 10/06 no mercado');
  });
});
