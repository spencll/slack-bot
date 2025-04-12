require('dotenv').config();
const { chromium } = require('playwright');

async function clickWithTimeout(page, selector, timeout) {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeout)
    );
    const actionPromise = page.locator(selector).first().click();
    return Promise.race([actionPromise, timeoutPromise]);
  }

async function findPatient(id, cl, power) {
  let browser, context, page;
  let found = false
  try{
    browser = await chromium.launch({ headless: true, args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage']});
    context = await browser.newContext({
      userAgent: process.env.USER_AGENT
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
    await page.locator(':text("1 of")').waitFor()
    
    // Specific trial checker 
    if (cl || power){
    const rows = page.locator('div[role="row"]')
    const count = await rows.count();
    let found = false
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const html = await row.innerHTML();
      if (cl && power) {
        if (html.includes(cl) && html.includes(power)){
          console.log(`Trial with brand ${cl} and power ${power} found`)
          found = true
          await row.click()
          break
        }
      }
      else if (cl) {
        if (html.includes(cl)) {
          console.log(`Trial with brand ${cl} found`)
          found = true
          await row.click()
          break
        }
      }
  }
  if (!found) throw new Error("Specified trial not found")
}
  
  //   if (cl) {
  //     // Attempt to click the brand, no power specified
  //     if (!power){
  //     const brand= page.getByText(cl).first();
  //     await brand.waitFor({ state: 'visible' });
  //     if (await brand.isVisible()) await brand.click();
  //     else return new Error("Brand not found.")
  //     }

  // } 
  //default first option
  else await page.locator('[data-test-id="opticalHistoryModal"]').getByRole('gridcell', { name: 'CL Trial' }).first().click(); 
  

    // Saving
    await page.locator('[data-test-id="saveAuthButton"]').click();
    await page.locator('[data-test-id="saveAuthButton"]').waitFor({ state: 'detached' });

  }

  catch (error){
    console.log(error)
    return error
  }
  finally {
    await page.close();
    await context.close();
    await browser.close();
  }
  
}
module.exports = findPatient