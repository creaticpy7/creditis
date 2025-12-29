let db;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CreditisDB', 1);

    request.onupgradeneeded = event => {
      db = event.target.result;
      console.log('Database upgrade needed');

      // Crear almacén de objetos para Clientes
      if (!db.objectStoreNames.contains('clientes')) {
        const clientesStore = db.createObjectStore('clientes', { keyPath: 'id', autoIncrement: true });
        clientesStore.createIndex('nombre', 'nombre', { unique: false });
        console.log('Object store "clientes" created');
      }

      // Crear almacén de objetos para Préstamos
      if (!db.objectStoreNames.contains('prestamos')) {
        const prestamosStore = db.createObjectStore('prestamos', { keyPath: 'id', autoIncrement: true });
        prestamosStore.createIndex('clienteId', 'clienteId', { unique: false });
        console.log('Object store "prestamos" created');
      }

      // Crear almacén de objetos para Pagos
      if (!db.objectStoreNames.contains('pagos')) {
        const pagosStore = db.createObjectStore('pagos', { keyPath: 'id', autoIncrement: true });
        pagosStore.createIndex('prestamoId', 'prestamoId', { unique: false });
        console.log('Object store "pagos" created');
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

// Futuras funciones CRUD para la base de datos irán aquí
// Ejemplo: addCliente, getClientes, addPrestamo, etc.
