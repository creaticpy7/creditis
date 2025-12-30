let db;

function initDB() {
  return new Promise((resolve, reject) => {
    // Incrementar la versión de la base de datos a 2
    const request = indexedDB.open('CreditisDB', 2);

    request.onupgradeneeded = event => {
      db = event.target.result;
      console.log('Database upgrade needed');

      // --- Almacén de Clientes ---
      // Si el almacén 'clientes' no existe, lo creamos.
      // Si ya existe, nos aseguramos de que tenga el índice 'cedula'.
      let clientesStore;
      if (!db.objectStoreNames.contains('clientes')) {
        clientesStore = db.createObjectStore('clientes', { keyPath: 'id', autoIncrement: true });
      } else {
        clientesStore = event.target.transaction.objectStore('clientes');
      }

      // Crear un índice único para la cédula para evitar duplicados
      if (!clientesStore.indexNames.contains('cedula')) {
        clientesStore.createIndex('cedula', 'cedula', { unique: true });
        console.log('Index "cedula" created on "clientes" store');
      }

      // --- Almacén de Préstamos ---
      // Si el almacén 'prestamos' no existe, lo creamos.
      let prestamosStore;
      if (!db.objectStoreNames.contains('prestamos')) {
        prestamosStore = db.createObjectStore('prestamos', { keyPath: 'id', autoIncrement: true });
      } else {
        prestamosStore = event.target.transaction.objectStore('prestamos');
      }

      // Crear un índice para buscar préstamos por cédula de cliente
      if (!prestamosStore.indexNames.contains('clienteCedula')) {
        prestamosStore.createIndex('clienteCedula', 'clienteCedula', { unique: false });
        console.log('Index "clienteCedula" created on "prestamos" store');
      }
    };

    request.onsuccess = event => {
      db = event.target.result;
      console.log('Database opened successfully');
      resolve(db);
    };

    request.onerror = event => {
      console.error('Database error:', event.target.error);
      reject('Error opening database');
    };
  });
}

// --- Funciones CRUD para Clientes ---

/**
 * Guarda o actualiza un cliente. Si un cliente con la misma cédula ya existe,
 * se actualiza. Si no, se crea uno nuevo.
 * @param {object} cliente - El objeto del cliente a guardar.
 * @returns {Promise<number>} La ID del cliente guardado o actualizado.
 */
function saveCliente(cliente) {
  return new Promise((resolve, reject) => {
    if (!db) return reject('Database not initialized');
    const transaction = db.transaction(['clientes'], 'readwrite');
    const store = transaction.objectStore('clientes');
    const cedulaIndex = store.index('cedula');
    const getRequest = cedulaIndex.get(cliente.cedula);

    getRequest.onsuccess = () => {
      const existingClient = getRequest.result;
      const dataToStore = existingClient ? { ...existingClient, ...cliente } : cliente;
      const putRequest = store.put(dataToStore);

      putRequest.onsuccess = () => resolve(putRequest.result);
      putRequest.onerror = event => reject('Error saving client: ' + event.target.error);
    };
    getRequest.onerror = event => reject('Error fetching client by cedula: ' + event.target.error);
  });
}

/**
 * Obtiene un cliente por su número de cédula.
 * @param {string} cedula - El número de cédula del cliente.
 * @returns {Promise<object|undefined>} El objeto del cliente o undefined si no se encuentra.
 */
function getClienteByCedula(cedula) {
  return new Promise((resolve, reject) => {
    if (!db) return reject('Database not initialized');
    const transaction = db.transaction(['clientes'], 'readonly');
    const store = transaction.objectStore('clientes');
    const index = store.index('cedula');
    const request = index.get(cedula);

    request.onsuccess = () => resolve(request.result);
    request.onerror = event => reject('Error fetching client by cedula: ' + event.target.error);
  });
}

// --- Funciones CRUD para Préstamos ---

/**
 * Guarda un nuevo préstamo en la base de datos.
 * @param {object} prestamo - El objeto del préstamo a guardar.
 * @returns {Promise<number>} La ID del nuevo préstamo guardado.
 */
function savePrestamo(prestamo) {
  return new Promise((resolve, reject) => {
    if (!db) return reject('Database not initialized');
    const transaction = db.transaction(['prestamos'], 'readwrite');
    const store = transaction.objectStore('prestamos');
    const request = store.add(prestamo);

    request.onsuccess = () => resolve(request.result);
    request.onerror = event => reject('Error saving prestamo: ' + event.target.error);
  });
}
