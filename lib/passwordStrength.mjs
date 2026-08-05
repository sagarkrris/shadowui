export function getPasswordStrength(password = "") {
  const value = String(password);
  const checks = [
    value.length >= 12,
    value.length >= 16,
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ];
  const score = checks.filter(Boolean).length;
  const label = score <= 2 ? "Weak" : score <= 4 ? "Fair" : "Strong";
  return { score, total: checks.length, label, percent: Math.round((score / checks.length) * 100) };
}
