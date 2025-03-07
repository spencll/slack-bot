require('dotenv').config();
const { chromium } = require('playwright');

async function clickWithTimeout(page, selector, timeout) {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeout)
    );
    const actionPromise = page.locator(selector).first().click();
    return Promise.race([actionPromise, timeoutPromise]);
  }

async function findPatient(names) {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://revolutionehr.com/static/#/');
    await page.locator('[data-test-id="loginUsername"]').click();
    await page.locator('[data-test-id="loginUsername"]').fill(process.env.REV_USERNAME);
    await page.locator('[data-test-id="loginUsername"]').press('Tab');
    await page.locator('[data-test-id="loginPassword"]').fill(process.env.REV_PASSWORD);
    await page.locator('[data-test-id="loginBtn"]').click();
    await page.locator('[data-test-id="headerParentNavigateButtonpatients"]').click();
    // Attempt patient input 
    for (const name of names) {
        try {
            await page.locator('#patient-panel').getByRole('textbox').click();
            await page.locator('#patient-panel').getByRole('textbox').fill(name);
            await page.locator('[data-test-id="simpleSearchSearch"]').click();
            // Below is what I want to timeout quickly
            await clickWithTimeout(page, `[data-test-id="patientSearchResultsTable"] >> text=${name}`, 1000);
          console.log(`Clicked on ${name}`);
          break; // Exit the loop once a name is found and clicked
        } catch (error) {
          console.log(`${name} not found, trying next name...`);
        }
    }
    await page.locator('[data-test-id="rxMenu"]').click();
    await page.getByRole('tab', { name: 'Contact Lens' }).locator('div').first().click();
    await page.locator('[data-test-id="patientPrescriptionsScreenAddButton"]').click();
    await page.getByRole('menuitem', { name: 'Add Contact Lens Rx' }).click();
    await page.locator('[data-test-id="viewHistoryButton"]').click();
    await page.locator('[data-test-id="opticalHistoryModal"] [data-test-id="\\32 "]').click();
    await page.locator('[data-test-id="opticalHistoryModal"]').getByRole('gridcell', { name: 'CL Trial' }).first().click();
    await page.locator('[data-test-id="saveAuthButton"]').click();

    // await page.getByRole('gridcell', { name: '/27/2025' }).nth(2).click();
    // await page.locator('[data-test-id="saveAuthButton"]').click();
    


    // Add any additional actions here
    await browser.close();
}
module.exports = findPatient