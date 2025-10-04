require('dotenv').config();
const { chromium } = require('playwright');

async function clickWithTimeout(page, selector, timeout) {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeout)
    );
    const actionPromise = page.locator(selector).first().click();
    return Promise.race([actionPromise, timeoutPromise]);
  }

async function pretest(id) {
  let browser, context, page, page2;
  let found = false //Flag for if info is found
  
  try{
    browser = await chromium.launch({ headless: true, args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage']});
    context = await browser.newContext({
      userAgent: process.env.USER_AGENT
    });
    page = await context.newPage();
    page2 = await context.newPage();
    await page2.goto('https://telemedicine.luxottica.com/login');
    console.log("Pretest opened")
    await page2.getByRole('checkbox', { name: 'are you in store?' }).check();
    await page2.getByTestId('sign-in-login-page').click();
    await page2.getByRole('textbox', { name: 'Username:' }).fill(process.env.PRETEST_USER);
    await page2.getByRole('textbox', { name: 'Password:' }).fill(process.env.PRETEST_PASS);
    await page2.getByRole('button', { name: 'Login' }).click();
    await page2.goto('https://telemedicine.luxottica.com/room-device');
    await page2.getByTestId('radio-selection-1').locator('span').nth(1).click();
    await page2.getByTestId('device-selection-next-button').click();
    console.log("logged in")

    //getting to desginated patient
    //filter by pretest started
    //navigate to pretest menu
    //expand all
    //extract data/images


    //REVVVVVVVVVVVVVVVVVVVVVVVVVVVV

    //Get to patient
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

    // Handles patients with alerts
    await page.waitForTimeout(1000)
    const close = page.locator('[data-test-id="alertHistoryModalCloseButton"]')
    if (await close.count()>0) await close.click()

    //Ok, on patient page now 

 

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

  module.exports = pretest




