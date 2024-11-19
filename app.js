require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const http = require('http');
const ngrok = require('@ngrok/ngrok');
const app = express();
const { GoogleGenerativeAI } = require('@google/generative-ai');

app.use(bodyParser.json());

app.get('/test', (req, res) => { 
    res.send('Server is working!')});

async function responseAI(prompt) {

    // Initialize Google Generative AI client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
        // Make a synchronous chat completion request to the Gemini API using the GoogleGenerativeAI client
        const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash"
        });
    
    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text() || "Sorry, I couldn't generate a response."
        return text
    } catch (error) {
        console.error('Error processing request:', error);
        throw new Error('Internal Server Error');
    }
    }


app.post('/slack/events', async (req, res) => {
    const { challenge, event } = req.body;    
    // Respond to Slack's URL verification challenge
    if (challenge) {
        res.send( challenge );
    }
    
    // Handle message events
    if (event && event.type === 'message' && event.text) {
        const message = event.text.toLowerCase();
        const user = event.user

         // Start of ov 
         if (message.includes('ov') && user!=='U080K2QSZL3' ) {

            try{
            //Prompting technician for reason for visit. 
            const response = "What is the reason for the visit? Start reply with Reason: \nReason: patient is having blurry vision"

            // Post a reply back to the channel
            const reply = {
                channel: event.channel,
                text: response,
            };
            // Make a call to Slack API to send the reply
            postMessage(reply);
        }
            catch (error){
                console.error("Error sending response",error)
            }

        }

        if (message.includes('reason:') && user!=='U080K2QSZL3' ) {

            try{
            //Process with AI
            const response = await responseAI(`Here is the reason for visit for a patient at a eye doctor office. ${message}. What relevent testing do you suggest for the technicians to perform? No explaination needed. Technicians can do visual acuity, IOP, FDT, pachymetry, topography, auto-refractor, optos, and OCT.`)

            // Post a reply back to the channel
            const reply = {
                channel: event.channel,
                text: response,
            };
            // Make a call to Slack API to send the reply
            postMessage(reply);
        }
            catch (error){
                console.error("Error sending AI response",error)
            }

        }
        
    }
    res.sendStatus(200);
});

// Function to post a message to Slack
async function postMessage(message) {
    await axios.post('https://slack.com/api/chat.postMessage', message, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SLACK_API}`,
        }
    });
}

// Create webserver
http.createServer(app).listen(8080, () => console.log('Node.js web server at 8080 is running...'));

// Get your endpoint online
ngrok.connect({ addr: 8080, authtoken: process.env.NGROK_AUTHTOKEN, domain: process.env.NGROK_DOMAIN})
	.then(listener => console.log(`Ingress established at: ${listener.url()}` ));

    