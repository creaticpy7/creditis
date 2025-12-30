document.addEventListener('DOMContentLoaded', () => {
  initDB().then(() => {
    console.log('Base de datos inicializada para la página de clientes.');
    loadAndDisplayClients();
    setupEventListeners();
  }).catch(error => {
    console.error('Error al inicializar la base de datos:', error);
  });
});

async function loadAndDisplayClients() {
  const clientsListDiv = document.getElementById('clients-list');
  
  if (!db) {
    clientsListDiv.innerHTML = '<p class="text-red-500">Error: La base de datos no está inicializada.</p>';
    return;
  }

  const transaction = db.transaction(['clientes'], 'readonly');
  const store = transaction.objectStore('clientes');
  const getAllRequest = store.getAll();

  getAllRequest.onsuccess = () => {
    const clientes = getAllRequest.result;

    if (clientes.length === 0) {
      clientsListDiv.innerHTML = '<p class="text-gray-500">No hay clientes registrados.</p>';
      return;
    }

    clientsListDiv.innerHTML = '';

    clientes.forEach(cliente => {
      const card = document.createElement('div');
      card.className = 'bg-white p-4 rounded-lg shadow-md';

      card.innerHTML = `
        <div class="mb-2">
          <h2 class="text-lg font-bold text-blue-700">${cliente.nombreApellido}</h2>
          <p class="text-sm text-gray-600">Cédula: ${cliente.cedula}</p>
          <p class="text-sm text-gray-600">Teléfono: ${cliente.telefono1 || 'No disponible'}</p>
        </div>
        <div class="mt-4 flex justify-end space-x-2">
          <button class="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600">Modificar</button>
          <button class="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600">Eliminar</button>
          <button class="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600">Cancelar</button>
        </div>
      `;
      clientsListDiv.appendChild(card);
    });
  };

  getAllRequest.onerror = event => {
    console.error('Error al leer los clientes:', event.target.error);
    clientsListDiv.innerHTML = '<p class="text-red-500">Error al cargar la lista de clientes.</p>';
  };
}

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
