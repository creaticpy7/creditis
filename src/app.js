/**
 * Calcula la cuota mensual de un préstamo utilizando el método de amortización francés.
 */
function calculateAmortization(principal, monthlyInterestRatePercentage, numberOfMonths) {
  if (principal <= 0 || numberOfMonths <= 0) return 0;
  if (monthlyInterestRatePercentage === 0) return parseFloat((principal / numberOfMonths).toFixed(2));
  const monthlyRate = monthlyInterestRatePercentage / 100;
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths);
  const denominator = Math.pow(1 + monthlyRate, numberOfMonths) - 1;
  if (denominator === 0) return 0;
  const monthlyPayment = numerator / denominator;
  return parseFloat(monthlyPayment.toFixed(2));
}

// --- Lógica del Dashboard ---

document.addEventListener('DOMContentLoaded', () => {
  initDB().then(() => {
    console.log('Base de datos inicializada.');
    if (document.getElementById('total-balance')) {
      renderDashboard();
    }
    setupEventListeners();
  }).catch(error => {
    console.error('Error al inicializar la base de datos:', error);
  });
});

function renderDashboard() {
  // TODO: Reemplazar estos datos de ejemplo con cálculos reales de la base de datos.
  const mockData = {
    totalBalance: 15000000,
    totalDebt: 35000000,
    todayCollections: 1250000,
    overdueClients: 3,
    weeklyCollections: [500000, 750000, 1200000, 900000, 1500000, 400000, 100000]
  };
  document.getElementById('total-balance').textContent = `Gs. ${mockData.totalBalance.toLocaleString('es-PY')}`;
  document.getElementById('total-debt').textContent = `Gs. ${mockData.totalDebt.toLocaleString('es-PY')}`;
  document.getElementById('today-collections').textContent = `Gs. ${mockData.todayCollections.toLocaleString('es-PY')}`;
  document.getElementById('overdue-clients').textContent = mockData.overdueClients;
  renderWeeklyChart(mockData.weeklyCollections);
}

function renderWeeklyChart(weeklyData) {
  const ctx = document.getElementById('weekly-chart').getContext('2d');
  if (window.myChart instanceof Chart) window.myChart.destroy();
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
      scales: { y: { beginAtZero: true, ticks: { callback: value => 'Gs. ' + value.toLocaleString('es-PY') } } },
      plugins: { legend: { display: false } }
    }
  });
}

// --- Lógica de Eventos y Formularios ---

function setupEventListeners() {
  const menuBtn = document.getElementById('menu-btn');
  const navMenu = document.getElementById('nav-menu');
  const newLoanLink = document.getElementById('new-loan-link');
  const loanModal = document.getElementById('loan-modal');
  const cancelLoanBtn = document.getElementById('cancel-loan-btn');
  const loanForm = document.getElementById('loan-form');

  menuBtn.addEventListener('click', () => {
    const isHidden = navMenu.classList.contains('hidden');
    if (isHidden) {
      navMenu.classList.remove('hidden', 'opacity-0', 'scale-95');
      navMenu.classList.add('opacity-100', 'scale-100');
    } else {
      navMenu.classList.add('opacity-0', 'scale-95');
      setTimeout(() => navMenu.classList.add('hidden'), 300); // Esperar a que termine la transición
    }
  });

  if (newLoanLink) {
    newLoanLink.addEventListener('click', (e) => {
      e.preventDefault();
      loanModal.classList.remove('hidden');
      navMenu.classList.add('hidden', 'opacity-0', 'scale-95');
    });
  }

  if (cancelLoanBtn) {
    cancelLoanBtn.addEventListener('click', () => {
      loanModal.classList.add('hidden');
    });
  }

  if (loanForm) {
    // Calcular interés total dinámicamente
    const capitalInput = document.getElementById('capital');
    const cantidadCuotasInput = document.getElementById('cantidadCuotas');
    const montoCuotaInput = document.getElementById('montoCuota');
    const interesTotalInput = document.getElementById('interesTotal');

    const calculateInterest = () => {
      const capital = parseFloat(capitalInput.value) || 0;
      const cantidadCuotas = parseInt(cantidadCuotasInput.value) || 0;
      const montoCuota = parseFloat(montoCuotaInput.value) || 0;

      if (capital > 0 && cantidadCuotas > 0 && montoCuota > 0) {
        const totalPagado = cantidadCuotas * montoCuota;
        const interesGanado = totalPagado - capital;
        const porcentajeInteres = (interesGanado / capital) * 100;
        interesTotalInput.value = porcentajeInteres.toFixed(2) + ' %';
      } else {
        interesTotalInput.value = '';
      }
    };

    capitalInput.addEventListener('input', calculateInterest);
    cantidadCuotasInput.addEventListener('input', calculateInterest);
    montoCuotaInput.addEventListener('input', calculateInterest);

    loanForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(loanForm);

      const cliente = {
        cedula: formData.get('cedula'),
        nombreApellido: formData.get('nombreApellido'),
        // Se pueden añadir más campos del cliente si se añaden al formulario
      };

      const prestamo = {
        clienteCedula: formData.get('cedula'),
        capital: parseFloat(formData.get('capital')),
        frecuenciaPago: formData.get('frecuenciaPago'),
        cantidadCuotas: parseInt(formData.get('cantidadCuotas')),
        montoCuota: parseFloat(formData.get('montoCuota')),
        interesTotal: document.getElementById('interesTotal').value,
        fechaDesembolso: formData.get('fechaDesembolso'),
        fechaPrimerPago: formData.get('fechaPrimerPago'),
        estado: formData.get('estado'),
      };

      try {
        await saveCliente(cliente);
        await savePrestamo(prestamo);
        alert('Préstamo grabado exitosamente.');
        loanForm.reset();
        loanModal.classList.add('hidden');
      } catch (error) {
        console.error('Error al grabar el préstamo:', error);
        alert('Error al grabar el préstamo. Verifique la consola para más detalles.');
      }
    });
  }
}
