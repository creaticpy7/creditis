let db;

function initDB() {
  return new Promise((resolve, reject) => {
    // Incrementar la versión de la base de datos a 3
    const request = indexedDB.open('CreditisDB', 3);

    request.onupgradeneeded = event => {
      db = event.target.result;
      console.log('Database upgrade needed');

      let clientesStore;
      if (!db.objectStoreNames.contains('clientes')) {
        clientesStore = db.createObjectStore('clientes', { keyPath: 'id', autoIncrement: true });
      } else {
        clientesStore = event.target.transaction.objectStore('clientes');
      }
      if (!clientesStore.indexNames.contains('cedula')) {
        clientesStore.createIndex('cedula', 'cedula', { unique: true });
      }

      let prestamosStore;
      if (!db.objectStoreNames.contains('prestamos')) {
        prestamosStore = db.createObjectStore('prestamos', { keyPath: 'id', autoIncrement: true });
      } else {
        prestamosStore = event.target.transaction.objectStore('prestamos');
      }
      if (!prestamosStore.indexNames.contains('clienteCedula')) {
        prestamosStore.createIndex('clienteCedula', 'clienteCedula', { unique: false });
      }

      // --- Almacén de Pagos ---
      let pagosStore;
      if (!db.objectStoreNames.contains('pagos')) {
        pagosStore = db.createObjectStore('pagos', { keyPath: 'id', autoIncrement: true });
      } else {
        pagosStore = event.target.transaction.objectStore('pagos');
      }
      if (!pagosStore.indexNames.contains('prestamoId')) {
        pagosStore.createIndex('prestamoId', 'prestamoId', { unique: false });
        console.log('Index "prestamoId" created on "pagos" store');
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

function saveCliente(cliente) {
  return new Promise((resolve, reject) => {
    if (!db) return reject('Database not initialized');
    const transaction = db.transaction(['clientes'], 'readwrite');
    const store = transaction.objectStore('clientes');
    const cedulaIndex = store.index('cedula');
    const getRequest = cedulaIndex.get(cliente.cedula);

    getRequest.onsuccess = () => {
      const existingClient = getRequest.result;
      // Si el cliente existe, actualizamos sus datos. Si no, lo creamos.
      const dataToStore = existingClient ? { ...existingClient, ...cliente } : cliente;
      const putRequest = store.put(dataToStore);

      putRequest.onsuccess = () => resolve(putRequest.result);
      putRequest.onerror = event => reject('Error saving client: ' + event.target.error);
    };
    getRequest.onerror = event => reject('Error fetching client by cedula: ' + event.target.error);
  });
}

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

/**
 * Guarda un nuevo pago en la base de datos.
 * @param {object} pago - El objeto del pago a guardar.
 * @returns {Promise<number>} La ID del nuevo pago guardado.
 */
function savePago(pago) {
  return new Promise((resolve, reject) => {
    if (!db) return reject('Database not initialized');
    const transaction = db.transaction(['pagos'], 'readwrite');
    const store = transaction.objectStore('pagos');
    const request = store.add(pago);

    request.onsuccess = () => resolve(request.result);
    request.onerror = event => reject('Error saving pago: ' + event.target.error);
  });
}

function getPrestamoById(id) {
  return new Promise((resolve, reject) => {
    if (!db) return reject('Database not initialized');
    const transaction = db.transaction(['prestamos'], 'readonly');
    const store = transaction.objectStore('prestamos');
    const request = store.get(id);

    request.onsuccess = () => {
        if (request.result) {
            resolve(request.result);
        } else {
            reject('Prestamo not found with id: ' + id);
        }
    };
    request.onerror = event => reject('Error fetching prestamo by id: ' + event.target.error);
  });
}
