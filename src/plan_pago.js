document.addEventListener('DOMContentLoaded', () => {
  initDB().then(() => {
    loadPaymentPlan();
    setupEventListeners();
  }).catch(error => {
    console.error('Error al inicializar la base de datos en la página del plan de pagos:', error);
    document.getElementById('loan-details').innerHTML = '<p class="text-red-500">Error al cargar la base de datos.</p>';
  });
});

async function loadPaymentPlan() {
  const params = new URLSearchParams(window.location.search);
  const prestamoId = parseInt(params.get('id'), 10);

  if (isNaN(prestamoId)) {
    document.getElementById('loan-details').innerHTML = '<p class="text-red-500">ID de préstamo no válido.</p>';
    return;
  }

  try {
    const prestamo = await getPrestamoById(prestamoId);
    if (!prestamo) {
      document.getElementById('loan-details').innerHTML = '<p class="text-red-500">Préstamo no encontrado.</p>';
      return;
    }
    
    const cliente = await getClienteByCedula(prestamo.clienteCedula);
    displayLoanDetails(prestamo, cliente);

    const cuotas = await getCuotasByPrestamoId(prestamoId);
    displayCuotas(cuotas);

  } catch (error) {
    console.error('Error al cargar el plan de pago:', error);
    document.getElementById('loan-details').innerHTML = '<p class="text-red-500">Error al cargar los datos del préstamo.</p>';
  }
}

function displayLoanDetails(prestamo, cliente) {
  const detailsDiv = document.getElementById('loan-details');
  const clienteNombre = cliente ? cliente.nombreApellido : 'Cliente no encontrado';
  detailsDiv.innerHTML = `
    <h1 class="text-2xl font-bold text-gray-800">Plan de Pago: ${clienteNombre}</h1>
    <p class="text-gray-600">Monto del Préstamo: <span class="font-semibold">Gs. ${prestamo.capital.toLocaleString('es-PY')}</span></p>
    <p class="text-gray-600">Cuotas: <span class="font-semibold">${prestamo.cantidadCuotas} de Gs. ${prestamo.montoCuota.toLocaleString('es-PY')}</span></p>
  `;
}

function displayCuotas(cuotas) {
  const tableBody = document.getElementById('cuotas-table-body');
  if (!cuotas || cuotas.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No se encontraron cuotas para este préstamo.</td></tr>';
    return;
  }
  
  tableBody.innerHTML = '';
  cuotas.forEach(cuota => {
    const estadoClass = cuota.estado === 'PAGADO' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">${cuota.numeroCuota}</td>
      <td class="px-6 py-4 whitespace-nowrap">${new Date(cuota.fechaVencimiento).toLocaleDateString('es-PY')}</td>
      <td class="px-6 py-4 whitespace-nowrap">Gs. ${cuota.montoCuota.toLocaleString('es-PY')}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoClass}">
          ${cuota.estado}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        ${cuota.estado === 'PENDIENTE' ? `<button class="pay-cuota-btn text-indigo-600 hover:text-indigo-900" data-cuota-id="${cuota.id}" data-cuota-numero="${cuota.numeroCuota}" data-cuota-monto="${cuota.montoCuota}">Pagar</button>` : ''}
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function setupEventListeners() {
    const tableBody = document.getElementById('cuotas-table-body');
    tableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('pay-cuota-btn')) {
            const cuotaId = event.target.dataset.cuotaId;
            const cuotaNumero = event.target.dataset.cuotaNumero;
            const cuotaMonto = event.target.dataset.cuotaMonto;
            openPaymentModal(cuotaId, cuotaNumero, cuotaMonto);
        }
    });

    const paymentForm = document.getElementById('payment-form');
    const cancelBtn = document.getElementById('cancel-payment-btn');
    
    paymentForm.addEventListener('submit', handlePaymentSubmit);
    cancelBtn.addEventListener('click', closePaymentModal);
}

function openPaymentModal(cuotaId, cuotaNumero, cuotaMonto) {
    const modal = document.getElementById('payment-modal');
    document.getElementById('payment-cuota-id').value = cuotaId;
    document.getElementById('payment-cuota-numero').textContent = cuotaNumero;
    document.getElementById('payment-amount').value = parseFloat(cuotaMonto).toLocaleString('es-PY');
    document.getElementById('payment-date').valueAsDate = new Date();
    
    modal.classList.remove('hidden');
}

function closePaymentModal() {
    document.getElementById('payment-modal').classList.add('hidden');
}

async function handlePaymentSubmit(event) {
    event.preventDefault();
    const cuotaId = parseInt(document.getElementById('payment-cuota-id').value, 10);
    const fechaPago = document.getElementById('payment-date').value;
    const montoPagado = parseFloat(document.getElementById('payment-amount').value.replace(/\./g, ''));

    try {
        await updateCuotaPago(cuotaId, fechaPago, montoPagado);
        console.log(`Pago registrado para la cuota ${cuotaId}`);
        closePaymentModal();
        loadPaymentPlan(); // Recargar la tabla para mostrar el nuevo estado
    } catch (error) {
        console.error('Error al registrar el pago:', error);
        alert('Hubo un error al registrar el pago.');
    }
}

// (Reutilizado de app.js, podría moverse a un archivo de utilidades)
function formatNumberInput(event) {
  const input = event.target;
  let value = input.value.replace(/\./g, '');
  value = value.replace(/[^0-9]/g, ''); 
  if (value) {
    input.value = parseInt(value, 10).toLocaleString('es-PY');
  } else {
    input.value = '';
  }
}

const amountInput = document.getElementById('payment-amount');
if (amountInput) {
    amountInput.addEventListener('input', formatNumberInput);
}
