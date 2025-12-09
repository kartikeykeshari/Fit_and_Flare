require('dotenv').config();
const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;
if (twilioSid && twilioToken) {
  const twilio = require('twilio');
  client = twilio(twilioSid, twilioToken);
}

async function sendSms(to, body) {
  if (!client) {
    console.warn('Twilio not configured. Skipping SMS send:', body);
    return null;
  }
  const message = await client.messages.create({ body, from: fromNumber, to });
  return message;
}

module.exports = { sendSms };
