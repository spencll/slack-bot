


//Extract from patient intake 
const viewer = document.getElementById("viewer");
const spans = Array.from(document.querySelectorAll('#viewer span'));
const combinedText = Array.from(viewer.querySelectorAll("span"))
  .slice(40,150)
  .map(span => span.innerText.trim())
  .filter(text => text.length > 0)
  .join(" ");

const eyeConditions=combinedText.match(/Current medical conditions:\s*(.*?)\s*Current Med/i)?.[1]
const eyeHistory=combinedText.match(/surgery:\s*(.*?)\s*Eye drops currently used/i)?.[1]
const eyeDrops=combinedText.match(/Eye drops currently used:\s*(.*?)\s*Currently wear/i)?.[1]
const medConditions= combinedText.match(/Current medical conditions:\s*(.*?)\s*Current Med/i)?.[1]
const meds= combinedText.match(/Medications and supplements:\s*(.*?)\s*Medication allergies:/i)?.[1]
const allergies= combinedText.match(/Medication allergies:\s*(.*?)\s*Current Primary/i)?.[1]
console.log(combinedText)
console.log(eyeHistory)
console.log(eyeDrops)
console.log(medConditions)
console.log(meds)
console.log(allergies)
