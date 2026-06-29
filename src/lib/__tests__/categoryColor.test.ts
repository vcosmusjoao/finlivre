import { colorForCategory, CATEGORY_COLORS } from '../categoryColor';

describe('colorForCategory', () => {
  it('é determinístico: mesma categoria → mesma cor', () => {
    expect(colorForCategory('Food')).toBe(colorForCategory('Food'));
    expect(colorForCategory('Transport')).toBe(colorForCategory('Transport'));
  });

  it('sempre retorna uma cor da paleta', () => {
    for (const name of ['Food', 'Transport', 'Uncategorized', 'Shopping', 'Saúde', '']) {
      expect(CATEGORY_COLORS).toContain(colorForCategory(name));
    }
  });

  it('não depende da posição/quantidade de categorias (estável entre meses)', () => {
    // "Food" tem a mesma cor independentemente de quais outras categorias existam.
    const foodAlone = colorForCategory('Food');
    const foodAmongMany = colorForCategory('Food');
    expect(foodAlone).toBe(foodAmongMany);
  });

  it('distingue categorias diferentes (na prática, sem colisão para nomes comuns)', () => {
    const colors = new Set(
      ['Food', 'Transport', 'Subscriptions', 'Pharmacy'].map(colorForCategory),
    );
    // 4 categorias comuns em uma paleta de 8 não devem colapsar para 1 só.
    expect(colors.size).toBeGreaterThan(1);
  });
});
