require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const http = require('http');
const ngrok = require('@ngrok/ngrok');
const app = express();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { WebClient } = require('@slack/web-api');
const { exec } = require('child_process');
const findPatient = require('./automation.js')
const autofill =  require('./autofill.js')

const killNgrokSessions = () => {
    exec('ngrok kill', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error killing ngrok sessions: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });
}

app.use(bodyParser.json());

app.get('/test', (req, res) => { 
    res.send('Server is working!')});

app.get('/delete', (req, res) => { 
    const userWeb = new WebClient(process.env.SLACK_USER_OAUTH)
    const botWeb = new WebClient(process.env.SLACK_BOT_OAUTH);
    async function deleteMessages() {
        try {
            // Fetch the conversation history
            const result = await userWeb.conversations.history({
                channel: process.env.SLACK_TEST_CHANNEL_ID,
                limit: 10, // Adjust the limit as needed
            });
    
            // Iterate through the messages and delete them
            for (const message of result.messages) {
                if (message.user || message.bot_id) { // Check if the message was posted by a user or bot
                    // Use the appropriate token to delete the message
                    const webClient = message.bot_id ? botWeb : userWeb;
                    await webClient.chat.delete({
                        channel: process.env.SLACK_TEST_CHANNEL_ID,
                        ts: message.ts,
                    });
                    console.log(`Deleted message with timestamp: ${message.ts}`);
                }
            }
    
            console.log('All messages deleted.');
        } catch (error) {
            console.error(`Error deleting messages: ${error}`);
        }
    }
    deleteMessages();
    res.send('Deleted messages')}
    );

    
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
    if (challenge) res.send( challenge );
    
    // Handle message events
    if (event && event.type === 'message' && event.text) {
        const message = event.text.toLowerCase();
   
        // final + # does the request.
        if (message.includes("final") && message.includes("#")) {

            // Extract ID
            function extractID(sentence) {
                const match = sentence.match(/#(\d+)/); // Regex to find # followed by digits and capture the digits
                return match ? match[1] : null; // Return only the captured digits
              }
            
            function extractNth(sentence){
                const match = sentence.match(/\s\d+/)
                return match ? Number(match[0])-1 : null
            }
            const id = extractID(message)
            const nth = extractNth(message)

        function debounce(func, delay) {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    func(...args);
                }, delay);
            };
        }

        // Prevents multiple calls. 
        const debouncedFindPatient = debounce(async (id, nth) => {
            const error = await findPatient(id, nth);
            if (error) {
                postMessage({
                channel: event.channel,
                text: `${error}`,
            });}
            // Only post the error message once
            else {   
                postMessage({
                    channel: event.channel,
                    text: `✅`,
                });
            }
        }, 300);
        
        debouncedFindPatient(id, nth);
    }
    //autofill
            if (message.includes("autofill") && message.includes("#")) {

            // Extract ID
            function extractID(sentence) {
                const match = sentence.match(/#(\d+)/); // Regex to find # followed by digits and capture the digits
                return match ? match[1] : null; // Return only the captured digits
              }

            const id = extractID(message)

        function debounce(func, delay) {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    func(...args);
                }, delay);
            };
        }

        // Prevents multiple calls. 
        const debouncedAutofill = debounce(async (id) => {
            const error = await autofill(id);
            if (error) {
                postMessage({
                channel: event.channel,
                text: `${error}`,
            });}
            // Only post the error message once
            else {   
                postMessage({
                    channel: event.channel,
                    text: `✅`,
                });
            }
        }, 300);
        
        debouncedAutofill(id);
    }


        //Extracting OV from message. 
        // const isOV = (message) => /(?<!\S)ov(?!\S)/.test(message)
      
        //  if (isOV(message) && user!==process.env.SLACK_BOT_ID ) {

        //     try{
        //     //Prompting technician for reason for visit. 
        //     const response = "What is the reason for the visit? \nUse the format of example below. \nReason: patient is having blurry vision"

        //     // Post a reply back to the channel
        //     const reply = {
        //         channel: event.channel,
        //         text: response,
        //     };
        //     // Make a call to Slack API to send the reply
        //     postMessage(reply);
        // }
        //     catch (error){
        //         console.error("Error sending response",error)
        //     }

        // }

        // if (message.includes('reason:') && user!==process.env.SLACK_BOT_ID) {

        //     try{
        //     //Process with AI
        //     const response = await responseAI(`Here is the reason for visit for a patient at a eye doctor office. ${message}. What relevent testing do you suggest for the technicians to perform? No explaination. Technicians can do IOP, retinal imaging, and OCT`)

        //     // Post a reply back to the channel
        //     const reply = {
        //         channel: event.channel,
        //         text: response
        //     };
        //     // Make a call to Slack API to send the reply
        //     postMessage(reply);
        // }
        //     catch (error){
        //         console.error("Error sending AI response",error)
        //     }

        // }
        
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

const PORT = process.env.PORT || 8080;
http.createServer(app).listen(PORT, () => {
  console.log(`Node.js web server running on port ${PORT}...`);
});

// Get your endpoint online
ngrok.connect({ addr: 8080, authtoken: process.env.NGROK_AUTHTOKEN, domain: process.env.NGROK_DOMAIN})
	.then(listener => console.log(`Ingress established at: ${listener.url()}` ));




    