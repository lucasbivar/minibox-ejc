export function formatBrazilPhone(rawInput: string): string {
  const withoutCountryCode = rawInput.startsWith("+55") ? rawInput.slice(3) : rawInput;
  const digits = withoutCountryCode.replace(/\D/g, "").slice(0, 11);

  if (digits.length === 0) {
    return "";
  }

  let result = `+55 (${digits.slice(0, 2)}`;

  if (digits.length >= 2) {
    result += ")";
  }

  if (digits.length > 2) {
    const subscriberDigits = digits.slice(2);
    const splitIndex = digits.length > 10 ? 5 : 4;
    const prefix = subscriberDigits.slice(0, splitIndex);
    const suffix = subscriberDigits.slice(splitIndex);
    result += suffix ? ` ${prefix}-${suffix}` : ` ${prefix}`;
  }

  return result;
}
