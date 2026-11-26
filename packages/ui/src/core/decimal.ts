export interface Decimal {
  readonly coefficient: bigint;
  readonly exponent: number;
}

export function power(exponent: number): bigint {
  return 10n ** BigInt(exponent);
}

export function decimal(value: number): Decimal {
  const [significand = '0', magnitude = '0'] = String(value).split('e');
  const [whole = '0', fraction = ''] = significand.split('.');
  const digits = whole + fraction;
  const coefficient = digits.replace(/0+$/, '');
  return coefficient
    ? {
        coefficient: BigInt(coefficient),
        exponent: Number(magnitude) - fraction.length + digits.length - coefficient.length,
      }
    : { coefficient: 0n, exponent: 0 };
}

export function units(value: Decimal, exponent: number): bigint {
  return value.coefficient === 0n ? 0n : value.coefficient * power(value.exponent - exponent);
}

export function floorDivide(value: bigint, divisor: bigint): bigint {
  const quotient = value / divisor;
  return value % divisor < 0n ? quotient - 1n : quotient;
}
