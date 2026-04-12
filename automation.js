import dotenv from 'dotenv';
dotenv.config();
import * as browserManager from "./browserManager.js";

async function clickWithTimeout(page, selector, timeout) {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeout)
    );
    const actionPromise = page.locator(selector).first().click();
    return Promise.race([actionPromise, timeoutPromise]);
  }

async function findPatient(id, nth) {
  const start = Date.now()
  let found = false //Flag for if info is found
  const {page, context} = browserManager.getPage();
  try{
    const now = new Date();
    const estTime = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York", // Eastern Time zone
      dateStyle: "full",
      timeStyle: "long"
    }).format(now);
    console.log("Rev opened",estTime)
    
    await page.fill('[data-test-id="loginUsername"]', process.env.REV_USERNAME);
    await page.fill('[data-test-id="loginPassword"]', process.env.REV_PASSWORD);
    await page.click('[data-test-id="loginBtn"]');
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

        }
    
    if (!found) throw new Error("Patient not found.")

    // Handles patients with alerts
    await page.waitForTimeout(1000)
    const close = page.locator('[data-test-id="alertHistoryModalCloseButton"]')
    if (await close.count()>0) await close.click()

    // Get to trials
    await page.locator('[data-test-id="rxMenu"]').click();
    await page.locator('[data-test-id="patientPrescriptionsScreenAddButton"]').click();
    await page.getByRole('menuitem', { name: 'Add Contact Lens Rx' }).click();
    await page.locator('[data-test-id="viewHistoryButton"]').click();
    await page.locator('[data-test-id="\\31 "]').click()
    await page.locator('[data-test-id="\\32 "]').click();
    //If no trials return
        try {
      await page.locator(':text("CL Trial")').first().waitFor({ state: 'visible', timeout: 2000 });
} catch (error) {
  throw new Error('No trials found.');
}
    await page.locator('[data-test-id="opticalHistoryModal"]').getByRole('gridcell', { name: 'CL Trial' }).nth(nth - 1).click();

    // Saving
    await page.locator('[data-test-id="saveAuthButton"]').click();
    try {
      await page.locator('[data-test-id="saveAuthButton"]').waitFor({
        state: 'detached',
        timeout: 2000 // timeout in milliseconds
      });
} catch (error) {
  throw new Error('Contact lens mapped to inactive brand. Inform doc to update to latest brand then finalize.');
}
   console.log(`Processed in ${(Date.now() - start) / 1000} seconds`);
  }
  catch (error){
      console.log(error)
      return error.message
  }
  finally{
    await context.clearCookies();
    await page.reload();
  }
}

export default findPatient;