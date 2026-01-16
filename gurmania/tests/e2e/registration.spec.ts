/**
 * E2E TEST 1: Complete User Registration Flow
 * 
 * Ispitni slučaj: Kompletan flow registracije korisnika - redovni slučaj
 * Flow: Register → Verify success message → Check database
 */

import { test, expect } from '@playwright/test';

test.describe('User Registration Flow - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to registration page
    await page.goto('/auth/register');
  });

  test('should complete full registration flow successfully', async ({ page }) => {
    // ULAZNI PODACI
    const testEmail = `test-${Date.now()}@fer.hr`;
    const testPassword = 'TestPassword123!';
    const testName = 'Test User E2E';

    // KORACI ISPITIVANJA:
    
    // Korak 1: Provjeri da je forma vidljiva
    await expect(page.getByRole('button', { name: /kreiraj račun/i })).toBeVisible();

    // Korak 2: Popuni formu
    await page.fill('input[name="name"], input[type="text"]', testName);
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.fill('input[id="confirmPassword"], input[name="confirmPassword"]', testPassword);
    await page.check('input[id="terms"]');

    // Korak 3: Screenshot prije submita
    await page.screenshot({ path: 'test-results/e2e-registration-form-filled.png' });

    // Korak 4: Submit formu
    await page.click('button[type="submit"]');

    // OČEKIVANI IZLAZ:
    // Provjeri da je prikazana success poruka (stranica ne redirekta, samo promijeni content)
    await expect(page.getByText('Provjerite svoj email')).toBeVisible({ timeout: 10000 });

    // Screenshot rezultata
    await page.screenshot({ path: 'test-results/e2e-registration-success.png' });

    // DOBIVENI IZLAZ: Verificiraj da je success poruka prikazana
    await expect(page.getByText(/poslali smo link za verifikaciju/i)).toBeVisible();
  });

  test('should show validation errors for invalid input (boundary test)', async ({ page }) => {
    // ULAZNI PODACI: Prazna forma
    
    // Korak 1: Pokušaj submit bez popunjavanja
    await page.click('button[type="submit"]');

    // OČEKIVANI IZLAZ: Prikaži validation errore
    // HTML5 validation ili custom validation
    const nameInput = page.locator('input[name="name"], input[type="text"]').first();

    // Check for HTML5 validation or error messages
    const hasValidationError = 
      await nameInput.evaluate((el: HTMLInputElement) => !el.validity.valid) ||
      await page.locator('text=/obavezno|required/i').isVisible().catch(() => false);

    expect(hasValidationError).toBeTruthy();

    await page.screenshot({ path: 'test-results/e2e-registration-validation.png' });
  });

  test('should show error for duplicate email', async ({ page }) => {
    // ULAZNI PODACI: Email koji već postoji (koristimo isti 2 puta)
    const duplicateEmail = `duplicate-${Date.now()}@fer.hr`;

    // Korak 1: Prva registracija
    await page.fill('input[name="name"], input[type="text"]', 'First User');
    await page.fill('input[name="email"], input[type="email"]', duplicateEmail);
    await page.fill('input[name="password"], input[type="password"]', 'Password123!');
    await page.fill('input[id="confirmPassword"], input[name="confirmPassword"]', 'Password123!');
    await page.check('input[id="terms"]');
    await page.click('button[type="submit"]');

    // Čekaj da se procesira
    await page.waitForTimeout(2000);

    // Korak 2: Vrati se na registraciju i pokušaj isti email
    await page.goto('/auth/register');
    await page.fill('input[name="name"], input[type="text"]', 'Second User');
    await page.fill('input[name="email"], input[type="email"]', duplicateEmail);
    await page.fill('input[name="password"], input[type="password"]', 'Password456!');
    await page.fill('input[id="confirmPassword"], input[name="confirmPassword"]', 'Password456!');
    await page.check('input[id="terms"]');
    await page.click('button[type="submit"]');

    // OČEKIVANI IZLAZ: Error poruka o postojećem emailu
    const errorMessage = page.locator('text=/već.*registrirali|already.*exist/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'test-results/e2e-registration-duplicate.png' });
  });

  test('should show error when terms are not accepted', async ({ page }) => {
    // ULAZNI PODACI: Sve ispravno osim što nisu prihvaćeni uvjeti
    const testEmail = `test-terms-${Date.now()}@fer.hr`;

    // Korak 1: Popuni formu ali ne označi checkbox
    await page.fill('input[name="name"], input[type="text"]', 'Test User');
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', 'TestPassword123!');
    await page.fill('input[id="confirmPassword"], input[name="confirmPassword"]', 'TestPassword123!');
    // Namjerno ne označavamo checkbox

    // Korak 2: Submit formu
    await page.click('button[type="submit"]');

    // OČEKIVANI IZLAZ: Error poruka o prihvaćanju uvjeta
    await expect(page.getByText(/morate prihvatiti uvjete/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'test-results/e2e-registration-terms-validation.png' });
  });
});
