const { test, expect } = require('@playwright/test');

test.describe('Full E2E User Flow', () => {

  test.use({
    viewport: { width: 1280, height: 720 },
    baseURL: 'http://127.0.0.1:8080/src/',
  });

  // Navegar a la página principal antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    // Esperar a que la base de datos se inicialice, lo que indica que la aplicación está lista
    await page.waitForFunction(() => window.db !== undefined, null, { timeout: 10000 });
  });

  test('should create client, loan, view payment plan, and pay an installment', async ({ page }) => {
    // 1. Navegar a la página principal y crear un nuevo cliente
    await page.goto('/index.html');
    
    // Abrir menú y hacer clic en Nuevo Cliente
    await page.locator('#menu-btn').click();
    await page.locator('#new-client-link').click();
    
    // Rellenar y enviar formulario de cliente
    const clientModal = page.locator('#client-modal');
    await expect(clientModal).toBeVisible();
    await page.fill('#client-cedula', '5555555');
    await page.fill('#client-nombres', 'Ana');
    await page.fill('#client-apellidos', 'Gomez');
    await page.locator('#client-form button[type="submit"]').click();
    await expect(clientModal).toBeHidden();

    // 2. Crear un nuevo préstamo para el cliente
    await page.locator('#menu-btn').click();
    await page.locator('#new-loan-link').click();

    // Rellenar y enviar formulario de préstamo
    const loanModal = page.locator('#loan-modal');
    await expect(loanModal).toBeVisible();
    await page.fill('#cedula', '5555555');
    await page.fill('#nombreApellido', 'Ana Gomez');
    await page.fill('#capital', '2000000');
    await page.selectOption('#frecuenciaPago', 'M');
    await page.fill('#cantidadCuotas', '2');
    await page.fill('#montoCuota', '1100000');
    const today = new Date().toISOString().split('T')[0];
    await page.fill('#fechaDesembolso', today);
    await page.fill('#fechaPrimerPago', today);
    await page.locator('#loan-form button[type="submit"]').click();
    
    // El modal debe cerrarse, indicando que el préstamo y las cuotas se guardaron
    await expect(loanModal).toBeHidden({ timeout: 10000 });

    // 3. Navegar a la lista de préstamos y abrir el plan de pagos
    await page.goto('/prestamos.html');

    // Esperar a que aparezca la tarjeta del préstamo y hacer clic en "Cobrar"
    const loanCard = page.locator('.bg-white.p-4.rounded-lg.shadow-md:has-text("Ana Gomez")');
    await expect(loanCard).toBeVisible();
    await loanCard.locator('a:has-text("Cobrar")').click();

    // 4. Verificar que estamos en la página del plan de pagos
    await expect(page).toHaveURL(/.*plan_pago.html\?id=\d+/);
    await expect(page.locator('h1:has-text("Plan de Pago: Ana Gomez")')).toBeVisible();

    // 5. Pagar la primera cuota
    const firstInstallmentRow = page.locator('#cuotas-table-body tr:first-child');
    await expect(firstInstallmentRow.locator('td:has-text("PENDIENTE")')).toBeVisible();
    await firstInstallmentRow.locator('button:has-text("Pagar")').click();

    // 6. Rellenar y enviar el modal de pago
    const paymentModal = page.locator('#payment-modal');
    await expect(paymentModal).toBeVisible();
    await page.fill('#payment-amount', '1100000');
    await paymentModal.locator('button[type="submit"]').click();
    await expect(paymentModal).toBeHidden();

    // 7. Verificar que el estado de la cuota cambió a "PAGADO"
    await expect(firstInstallmentRow.locator('td:has-text("PAGADO")')).toBeVisible();
    
    // La prueba es un éxito si llega a este punto
  });
});
