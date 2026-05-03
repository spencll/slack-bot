import dotenv from 'dotenv';
dotenv.config();
import * as browserManager from "./browserManager.js";

async function findPatient(id, nth) {
  const start = Date.now()
  let found = false //Flag for if info is found
  const {page, context} = browserManager.getPage();
  try{
    console.log("Rev opened", new Date().toLocaleString("en-US", {
  timeZone: "America/New_York"
}));

    await page.fill('[data-test-id="loginUsername"]', process.env.REV_USERNAME);
    await page.fill('[data-test-id="loginPassword"]', process.env.REV_PASSWORD);
    await page.click('[data-test-id="loginBtn"]');
    await page.locator('[data-test-id="headerParentNavigateButtonpatients"]').click();
    // Attempt patient input 
        try {
            await page.locator('#patient-panel').getByRole('textbox').click();
            await page.locator('#patient-panel').getByRole('textbox').fill(`#${id}`);
            await page.locator('[data-test-id="simpleSearchSearch"]').click();
            await page.locator(`[data-test-id="patientSearchResultsTable"] >> text=${id}`).first().click({ timeout: 1000 })
          console.log(`Clicked on ${id}`);
          found = true
        } catch (error) {
        throw new Error("Patient not found.")
        }
    
    // Handles patients with alerts
const rxMenu = page.locator('[data-test-id="rxMenu"]');
try {
  await rxMenu.click({ timeout: 500 });
} catch {
  // rxMenu wasn't clickable — modal probably blocking it
  const closeBtn = page.locator('[data-test-id="alertHistoryModalCloseButton"]');
  if (await closeBtn.isVisible()) await closeBtn.click();
  // retry the click after closing modal
  await rxMenu.click();
}
    // Get to trials
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
       const runtime = Number(((Date.now() - start) / 1000).toFixed(2));
        console.log(`Processed in ${runtime} seconds`);
        return runtime;

} catch (error) {
  throw new Error('Contact lens mapped to inactive brand. Inform doc to update to latest brand then finalize.');
}
  }
  catch (error){
      console.log(error)
      return error.message
  }
  finally{
    await context.clearCookies();
    page.goto(process.env.REV_URL);
  }
}

export default findPatient;