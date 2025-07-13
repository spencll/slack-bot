require('dotenv').config();
const { chromium } = require('playwright');

async function clickWithTimeout(page, selector, timeout) {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeout)
    );
    const actionPromise = page.locator(selector).first().click();
    return Promise.race([actionPromise, timeoutPromise]);
  }

async function autofill(id) {
  let browser, context, page;
  let found = false //Flag for if info is found
  
  try{
    browser = await chromium.launch({ headless: true, args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage']});
    context = await browser.newContext({
      userAgent: process.env.USER_AGENT
    });
    page = await context.newPage();
    await page.goto('https://telemedicine.luxottica.com/login');
    console.log("Pretest opened")
    await page.getByRole('checkbox', { name: 'are you in store?' }).check();
    await page.getByTestId('sign-in-login-page').click();
    await page.getByRole('textbox', { name: 'Username:' }).fill('SLD2156');
    await page.getByRole('textbox', { name: 'Password:' }).fill('>09u&&InH#10');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.goto('https://telemedicine.luxottica.com/room-device');
    await page.getByTestId('radio-selection-1').locator('span').nth(1).click();
    await page.getByTestId('device-selection-next-button').click();
    console.log("logged in")

    //getting to pretest 
    await page.getByText('Christopher Saponara').click();
   

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


    // Handles patients with alerts
    await page.waitForTimeout(1000)
    const close = page.locator('[data-test-id="alertHistoryModalCloseButton"]')
    if (await close.count()>0) await close.click()

    //navigate to patient form
    await page.locator('[data-test-id="documentsImagesMenu"]').click();
    await page.getByRole('gridcell', { name: 'IntakeQ' }).click();
    await page.getByRole('gridcell', { name: 'is template cell column header' }).nth(1).locator('[data-test-id="folderFileListPreviewButton"]').click();
    await page.waitForTimeout(1000) //Wait for page load
    await page.getByRole('button', { name: 'Next Page' }).click();
    //Parse out patient form
    await page.waitForSelector('#viewer');
    const combinedText = await page.evaluate(() => {
    const viewer = document.getElementById("viewer");
    if (!viewer) return "";
    return Array.from(viewer.querySelectorAll("span"))
      .slice(40, 150)
      .map(span => span.innerText.trim())
      .filter(text => text.length > 0)
      .join(" ");
  });


    const eyeConditions=combinedText.match(/eye conditions:\s*(.*?)\s*Past history/i)?.[1]
    const eyeHistory=combinedText.match(/surgery:\s*(.*?)\s*Eye drops currently used/i)?.[1]
    const eyeDrops=combinedText.match(/Eye drops currently used:\s*(.*?)\s*Currently wear/i)?.[1]
    const medConditions= combinedText.match(/Current medical conditions:\s*(.*?)\s*Current Med/i)?.[1]
    const meds= combinedText.match(/Medications and supplements:\s*(.*?)\s*Medication allergies:/i)?.[1]
    const allergies= combinedText.match(/Medication allergies:\s*(.*?)\s*Current Primary/i)?.[1]
    console.log(combinedText)
    console.log(eyeConditions)
    console.log(eyeHistory)
    console.log(eyeDrops)
    console.log(medConditions)
    console.log(meds)
    console.log(allergies)
    //navigate to pages to input form data

    //CLose preview 
    
    // await page.locator('[data-test-id="examHistoryMenu"]').click();
    // await page.locator('.e-row > td:nth-child(4)').first().click();
    // await page.getByRole('link', { name: ' History' }).click();


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

  module.exports = autofill




