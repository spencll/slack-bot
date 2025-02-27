require('dotenv').config();
const { chromium } = require('playwright');

async function findPatient(name) {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://revolutionehr.com/static/#/');
    await page.locator('[data-test-id="loginUsername"]').click();
    await page.locator('[data-test-id="loginUsername"]').fill(process.env.REV_USERNAME);
    await page.locator('[data-test-id="loginUsername"]').press('Tab');
    await page.locator('[data-test-id="loginPassword"]').fill(process.env.REV_PASSWORD);
    await page.locator('[data-test-id="loginBtn"]').click();
    await page.locator('[data-test-id="headerParentNavigateButtonpatients"]').click();
    await page.locator('#patient-panel').getByRole('textbox').click();
    await page.locator('#patient-panel').getByRole('textbox').fill('testing, anne');
    await page.locator('[data-test-id="simpleSearchSearch"]').click();
    await page.locator('[data-test-id="patientSearchResultsTable"]').getByText('Testing, Anne').click();
    await page.locator('[data-test-id="rxMenu"]').click();
    await page.getByRole('tab', { name: 'Contact Lens' }).locator('div').first().click();
    await page.locator('[data-test-id="patientPrescriptionsScreenAddButton"]').click();
    await page.getByRole('menuitem', { name: 'Add Contact Lens Rx' }).click();
    // Works up to this point
    await page.locator('[data-test-id="viewHistoryButton"]').click();
    // await page.getByRole('gridcell', { name: '/27/2025' }).nth(2).click();
    // await page.locator('[data-test-id="saveAuthButton"]').click();
    


    // Add any additional actions here
    // await browser.close();
}
module.exports = findPatient