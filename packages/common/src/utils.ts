export const toDecimal = (value: string | number, tokenType: any): number => {
  if (typeof value === 'number') {
    return value * 10 ** 6;
  }

  return value ? parseFloat(value) * 10 ** 6 : 0;
};
