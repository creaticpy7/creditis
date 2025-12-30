document.addEventListener('DOMContentLoaded', () => {
  initDB().then(() => {
    console.log('Base de datos inicializada para la página de préstamos.');
    loadAndDisplayLoans();
    setupEventListeners(); // Reutilizar la lógica del menú
  }).catch(error => {
    console.error('Error al inicializar la base de datos:', error);
  });
});

/**
 * Carga todos los préstamos desde IndexedDB y los muestra en la página.
 */
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

    // Limpiar la lista antes de añadir nuevos elementos
    loansListDiv.innerHTML = '';

    for (const prestamo of prestamos) {
      // Buscar el cliente asociado a cada préstamo
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
          <button class="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600">Cobrar</button>
          <button class="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600">Modificar</button>
          <button class="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600">Eliminar</button>
          <button class="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600">Cancelar</button>
        </div>
      `;
      loansListDiv.appendChild(card);
    }
  };

  getAllRequest.onerror = event => {
    console.error('Error al leer los préstamos:', event.target.error);
    loansListDiv.innerHTML = '<p class="text-red-500">Error al cargar la lista de préstamos.</p>';
  };
}

// --- Lógica de Eventos para el Menú ---
function setupEventListeners() {
  const menuBtn = document.getElementById('menu-btn');
  const navMenu = document.getElementById('nav-menu');
  
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
