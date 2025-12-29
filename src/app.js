/**
 * Calcula la cuota mensual de un préstamo utilizando el método de amortización francés.
 * cuota = P * r * (1+r)^n / ((1+r)^n - 1)
 * @param {number} principal - El monto total del préstamo (P).
 * @param {number} monthlyInterestRatePercentage - La tasa de interés mensual en porcentaje (ej. 2 para 2%).
 * @param {number} numberOfMonths - El número total de cuotas, o plazo en meses (n).
 * @returns {number} El monto de la cuota mensual, redondeado a 2 decimales.
 */
function calculateAmortization(principal, monthlyInterestRatePercentage, numberOfMonths) {
  if (principal <= 0 || numberOfMonths <= 0) {
    return 0;
  }

  // Si la tasa de interés es 0, la cuota es simplemente el capital dividido por el plazo.
  if (monthlyInterestRatePercentage === 0) {
    return parseFloat((principal / numberOfMonths).toFixed(2));
  }

  const monthlyRate = monthlyInterestRatePercentage / 100; // r

  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths);
  const denominator = Math.pow(1 + monthlyRate, numberOfMonths) - 1;

  if (denominator === 0) {
    return 0; // Evita la división por cero, aunque no debería ocurrir con una tasa > 0.
  }

  const monthlyPayment = numerator / denominator;

  return parseFloat(monthlyPayment.toFixed(2));
}
