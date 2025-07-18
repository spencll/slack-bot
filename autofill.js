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
    browser = await chromium.launch({ headless: false, args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage']});
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


    // Handles patients with alerts
    await page.waitForTimeout(1000)
    const close = page.locator('[data-test-id="alertHistoryModalCloseButton"]')
    if (await close.count()>0) await close.click()

    //navigate to patient form
    await page.locator('[data-test-id="documentsImagesMenu"]').click();
    await page.getByRole('gridcell', { name: 'IntakeQ' }).click();
    await page.getByRole('gridcell', { name: 'is template cell column header' }).nth(1).locator('[data-test-id="folderFileListPreviewButton"]').click();
    await page.waitForTimeout(2000) //Wait for page load
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
    const output= `
    eyeConditions: ${eyeConditions}
    eyeHistory: ${eyeHistory}
    eyeDrops: ${eyeDrops}
    medConditions: ${medConditions}
    meds: ${meds}
    allergies: ${allergies}
    `;

    //navigate to pages to input form data
    await page.getByRole('button', { name: 'Close', exact: true }).click();  //CLose preview 
    await page.locator('[data-test-id="patientSummaryMenu"]').click();
    await page.locator('[data-test-id="examHistoryPodexpand"]').click();
    await page.getByRole('gridcell', { name: 'No' }).click();
    await page.getByRole('link', { name: ' History' }).click();
    //Reason for visit
    await page.locator('[data-test-id="patientReasonForVisitSection"]').getByRole('textbox', { name: 'textbox' }).fill(output)
    await page.locator('[data-test-id="encounterWorkflowNextButton"]').click();
    await page.waitForTimeout(5000)
    
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




