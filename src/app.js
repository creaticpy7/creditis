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

// --- Lógica del Dashboard ---

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar la base de datos y luego renderizar el dashboard
  initDB().then(() => {
    console.log('Base de datos inicializada.');
    renderDashboard();
    setupEventListeners();
  }).catch(error => {
    console.error('Error al inicializar la base de datos:', error);
  });
});

function renderDashboard() {
  // Datos de ejemplo (mock data)
  const mockData = {
    totalBalance: 15000000,
    totalDebt: 35000000,
    todayCollections: 1250000,
    overdueClients: 3,
    weeklyCollections: [500000, 750000, 1200000, 900000, 1500000, 400000, 100000] // Lunes a Domingo
  };

  // Actualizar las tarjetas del dashboard
  document.getElementById('total-balance').textContent = `Gs. ${mockData.totalBalance.toLocaleString('es-PY')}`;
  document.getElementById('total-debt').textContent = `Gs. ${mockData.totalDebt.toLocaleString('es-PY')}`;
  document.getElementById('today-collections').textContent = `Gs. ${mockData.todayCollections.toLocaleString('es-PY')}`;
  document.getElementById('overdue-clients').textContent = mockData.overdueClients;

  // Renderizar el gráfico de cobros semanales
  renderWeeklyChart(mockData.weeklyCollections);
}

function renderWeeklyChart(weeklyData) {
  const ctx = document.getElementById('weekly-chart').getContext('2d');
  
  // Destruir el gráfico existente si lo hay, para evitar duplicados al re-renderizar
  if (window.myChart instanceof Chart) {
    window.myChart.destroy();
  }

  window.myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      datasets: [{
        label: 'Cobros (Gs.)',
        data: weeklyData,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'Gs. ' + value.toLocaleString('es-PY');
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// --- Lógica de Eventos y Formularios ---

function setupEventListeners() {
  const addLoanBtn = document.getElementById('add-loan-btn');
  const cancelLoanBtn = document.getElementById('cancel-loan-btn');
  const loanModal = document.getElementById('loan-modal');
  const loanForm = document.getElementById('loan-form');

  addLoanBtn.addEventListener('click', () => {
    loanModal.classList.remove('hidden');
  });

  cancelLoanBtn.addEventListener('click', () => {
    loanModal.classList.add('hidden');
  });

  loanForm.addEventListener('submit', event => {
    event.preventDefault(); // Evitar que la página se recargue

    const formData = new FormData(loanForm);
    const loanData = {
      amount: parseFloat(formData.get('loan-amount')),
      term: parseInt(formData.get('loan-term')),
      interestRate: parseFloat(formData.get('interest-rate')),
      startDate: formData.get('start-date')
    };

    console.log('Datos del nuevo préstamo:', loanData);
    
    // Aquí es donde en el futuro se guardarán los datos en IndexedDB
    
    loanForm.reset(); // Limpiar el formulario
    loanModal.classList.add('hidden'); // Ocultar el modal
  });
}
