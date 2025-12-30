document.addEventListener('DOMContentLoaded', () => {
  initDB().then(() => {
    console.log('Base de datos inicializada para la página de préstamos.');
    loadAndDisplayLoans();
    setupEventListeners();
    setupPaymentModalListeners();
  }).catch(error => {
    console.error('Error al inicializar la base de datos:', error);
  });
});

async function loadAndDisplayLoans() {
  const loansListDiv = document.getElementById('loans-list');
  if (!db) {
    loansListDiv.innerHTML = '<p class="text-red-500">Error: La base de datos no está inicializada.</p>';
    return;
  }
  const transaction = db.transaction(['prestamos'], 'readonly');
  const store = transaction.objectStore('prestamos');
  const getAllRequest = store.getAll();

  getAllRequest.onsuccess = async () => {
    const prestamos = getAllRequest.result;
    if (prestamos.length === 0) {
      loansListDiv.innerHTML = '<p class="text-gray-500">No hay préstamos registrados.</p>';
      return;
    }
    loansListDiv.innerHTML = '';

    for (const prestamo of prestamos) {
      const cliente = await getClienteByCedula(prestamo.clienteCedula);
      const nombreCliente = cliente ? cliente.nombreApellido : 'Cliente no encontrado';
      const card = document.createElement('div');
      card.className = 'bg-white p-4 rounded-lg shadow-md';
      const estadoClass = prestamo.estado === 'ACTIVO' ? 'text-green-600' : 'text-red-600';
      card.innerHTML = `
        <div class="flex justify-between items-center mb-2">
          <h2 class="text-lg font-bold text-blue-700">${nombreCliente}</h2>
          <span class="text-sm font-semibold ${estadoClass}">${prestamo.estado}</span>
        </div>
        <p class="text-gray-600">Capital: <span class="font-medium">Gs. ${prestamo.capital.toLocaleString('es-PY')}</span></p>
        <div class="mt-4 flex justify-end space-x-2">
          <button class="pay-btn px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600" data-loan-id="${prestamo.id}" data-client-name="${nombreCliente}">Cobrar</button>
          <button class="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600">Modificar</button>
          <button class="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600">Eliminar</button>
          <button class="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600">Cancelar</button>
        </div>
      `;
      loansListDiv.appendChild(card);
    }

    document.querySelectorAll('.pay-btn').forEach(button => {
        button.addEventListener('click', openPaymentModal);
    });
  };
  getAllRequest.onerror = event => {
    console.error('Error al leer los préstamos:', event.target.error);
    loansListDiv.innerHTML = '<p class="text-red-500">Error al cargar la lista de préstamos.</p>';
  };
}

function openPaymentModal(event) {
    const loanId = event.target.dataset.loanId;
    const clientName = event.target.dataset.clientName;

    const modal = document.getElementById('payment-modal');
    document.getElementById('payment-loan-id').value = loanId;
    document.getElementById('payment-client-name').textContent = clientName;
    document.getElementById('payment-date').valueAsDate = new Date();
    document.getElementById('payment-amount').value = '';
    document.getElementById('payment-installment').value = '';

    modal.classList.remove('hidden');
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    modal.classList.add('hidden');
}

function setupPaymentModalListeners() {
    const paymentForm = document.getElementById('payment-form');
    const cancelBtn = document.getElementById('cancel-payment-btn');
    const amountInput = document.getElementById('payment-amount');

    // Aplicar formato de miles al campo de monto
    if(amountInput) {
        amountInput.addEventListener('input', formatNumberInput);
    }

    paymentForm.addEventListener('submit', handlePaymentSubmit);
    cancelBtn.addEventListener('click', closePaymentModal);
}

async function handlePaymentSubmit(event) {
    event.preventDefault();
    const loanId = parseInt(document.getElementById('payment-loan-id').value, 10);
    const fecha = document.getElementById('payment-date').value;
    const monto = unformatNumber(document.getElementById('payment-amount').value);
    const numeroCuota = parseInt(document.getElementById('payment-installment').value, 10);

    const pago = {
        prestamoId: loanId,
        fecha,
        monto,
        numeroCuota,
        fechaCreacion: new Date().toISOString()
    };

    try {
        await savePago(pago);
        alert('Pago registrado con éxito.');
        closePaymentModal();

        const prestamo = await getPrestamoById(loanId);
        const cliente = await getClienteByCedula(prestamo.clienteCedula);

        generatePDFReceipt(pago, prestamo, cliente);

        loadAndDisplayLoans(); // Recargar la lista
    } catch (error) {
        console.error('Error al guardar el pago:', error);
        alert('Error al registrar el pago.');
    }
}

function generatePDFReceipt(pago, prestamo, cliente) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Encabezado
    doc.setFontSize(20);
    doc.text("JOC Soluciones Financieras", 105, 20, null, null, "center");
    doc.setFontSize(12);
    doc.text("Recibo de Pago", 105, 30, null, null, "center");

    // Línea divisoria
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    // Datos del Recibo
    doc.setFontSize(10);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-PY')}`, 20, 45);
    doc.text(`Recibo N°: ${pago.id || 'N/A'}`, 150, 45);

    // Datos del Cliente y Préstamo
    doc.setFontSize(12);
    doc.text("Detalles del Cliente", 20, 60);
    doc.setFontSize(10);
    doc.text(`Nombre: ${cliente.nombreApellido}`, 20, 70);
    doc.text(`Cédula: ${cliente.cedula}`, 20, 75);
    doc.text(`Teléfono: ${cliente.telefono1 || 'N/A'}`, 20, 80);

    doc.setFontSize(12);
    doc.text("Detalles del Préstamo", 110, 60);
    doc.setFontSize(10);
    doc.text(`Préstamo ID: ${prestamo.id}`, 110, 70);
    doc.text(`Capital: Gs. ${prestamo.capital.toLocaleString('es-PY')}`, 110, 75);

    // Detalles del Pago
    doc.setFontSize(12);
    doc.text("Detalles del Pago Registrado", 20, 95);
    doc.setFontSize(10);
    doc.text(`Fecha de Pago: ${new Date(pago.fecha + 'T00:00:00').toLocaleDateString('es-PY')}`, 20, 105);
    doc.text(`Número de Cuota Pagada: ${pago.numeroCuota}`, 20, 110);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Monto Pagado: Gs. ${pago.monto.toLocaleString('es-PY')}`, 20, 120);
    doc.setFont(undefined, 'normal');

    // Pie de página
    doc.line(20, 270, 190, 270);
    doc.text("Gracias por su pago.", 105, 280, null, null, "center");

    // Guardar el PDF
    doc.save(`Recibo_Pago_${cliente.nombreApellido}_${pago.fecha}.pdf`);
}


function setupEventListeners() {
  const menuBtn = document.getElementById('menu-btn');
  const navMenu = document.getElementById('nav-menu');
  if (!menuBtn || !navMenu) return;

  menuBtn.addEventListener('click', () => {
    const isHidden = navMenu.classList.contains('hidden');
    if (isHidden) {
      navMenu.classList.remove('hidden', 'opacity-0', 'scale-95');
      navMenu.classList.add('opacity-100', 'scale-100');
    } else {
      navMenu.classList.add('opacity-0', 'scale-95');
      setTimeout(() => navMenu.classList.add('hidden'), 300);
    }
  });

  document.addEventListener('click', (event) => {
    if (!menuBtn.contains(event.target) && !navMenu.contains(event.target)) {
      navMenu.classList.add('opacity-0', 'scale-95');
      setTimeout(() => navMenu.classList.add('hidden'), 300);
    }
  });
}
