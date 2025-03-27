require('dotenv').config();
const { chromium } = require('playwright');

async function clickWithTimeout(page, selector, timeout) {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeout)
    );
    const actionPromise = page.locator(selector).first().click();
    return Promise.race([actionPromise, timeoutPromise]);
  }

async function findPatient(id, cl) {
  let browser, context, page;
  let found = false
  try{
    browser = await chromium.launch({ headless: true, args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage']});
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    page = await context.newPage();
    await page.goto('https://revolutionehr.com/static/#/');
    console.log("Rev opened")
    await page.locator('[data-test-id="loginUsername"]').click();
    await page.locator('[data-test-id="loginUsername"]').fill(process.env.REV_USERNAME);
    await page.locator('[data-test-id="loginUsername"]').press('Tab');
    await page.locator('[data-test-id="loginPassword"]').fill(process.env.REV_PASSWORD);
    await page.locator('[data-test-id="loginBtn"]').click();
    await page.locator('[data-test-id="headerParentNavigateButtonpatients"]').click();
    // Attempt patient input 
   
        try {
            await page.locator('#patient-panel').getByRole('textbox').click();
            await page.locator('#patient-panel').getByRole('textbox').fill(`#${id}`);
            await page.locator('[data-test-id="simpleSearchSearch"]').click();
            // Below is what I want to timeout quickly
            await clickWithTimeout(page, `[data-test-id="patientSearchResultsTable"] >> text=${id}`, 5000);
          console.log(`Clicked on ${id}`);
          found = true
        } catch (error) {
          console.log(`${id} not found`);
        }
    
    if (!found) return new Error("Patient not found.")
    
    // Get to trials
    await page.locator('[data-test-id="rxMenu"]').click();
    await page.locator('[data-test-id="patientPrescriptionsScreenAddButton"]').click();
    await page.getByRole('menuitem', { name: 'Add Contact Lens Rx' }).click();
    await page.locator('[data-test-id="viewHistoryButton"]').click();
    await page.locator('[data-test-id="\\32 "]').click();

    if (cl) {
      // Attempt to click the second option based on the specified brand
      const brand= page.getByText(cl).first();
      await brand.waitFor({ state: 'visible' });
      if (await brand.isVisible()) await brand.click();
      else return new Error("Brand not found.")
      
  } else {
      // Default
      await page.locator('[data-test-id="opticalHistoryModal"]').getByRole('gridcell', { name: 'CL Trial' }).first().click();
  }
  
    await page.locator('[data-test-id="saveAuthButton"]').click();
    await page.waitForTimeout(2000);

  }
  catch (error){
    console.log(error)
    return error
  }
  finally {

    // Add any additional actions here
    await page.close();
    await context.close();
    await browser.close();
  }
  
}
module.exports = findPatient