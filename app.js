require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const http = require('http');
const ngrok = require('@ngrok/ngrok');
const app = express();
app.use(bodyParser.json());

app.get('/test', (req, res) => { 
    res.send('Server is working!')});

app.post('/slack/events', (req, res) => {
    const { challenge, event } = req.body;    
    // Respond to Slack's URL verification challenge
    if (challenge) {
        res.send( challenge );
    }
    
    // Handle message events
    if (event && event.type === 'message' && event.text) {
        const message = event.text.toLowerCase();
        const user = event.user

         // Check for specific content in the message and reply accordingly
         if (message.includes('ov') && user!=='U080K2QSZL3' ) {
            // Post a reply back to the channel
            const reply = {
                channel: event.channel,
                text: 'Oh a office visit',
            };
            // Make a call to Slack API to send the reply
            postMessage(reply);
        }
        
        // Hello greeting
        if (message.includes('hello') && user!=='U080K2QSZL3' ) {
            // Post a reply back to the channel
            const reply = {
                channel: event.channel,
                text: 'Hello! How can I assist you today?',
            };
            // Make a call to Slack API to send the reply
            postMessage(reply);
        }
    }
    res.sendStatus(200);
});

// Function to post a message to Slack
function postMessage(message) {
    axios.post('https://slack.com/api/chat.postMessage', message, {
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

    