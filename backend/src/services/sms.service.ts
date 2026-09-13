import axios from 'axios';
import logger from '../utils/logger';

export interface EmergencySMSPayload {
  userName: string;
  userPhone: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
  sosId: string;
  emergencyType?: string;
  contacts: { name: string; phone: string }[];
}

export class SmsService {
  /**
   * Send single SMS message via Twilio REST API or Fast2SMS API
   */
  public static async sendSMS(toPhone: string, messageBody: string): Promise<boolean> {
    const provider = (process.env.SMS_PROVIDER || '').toLowerCase();
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
    const fast2smsKey = process.env.FAST2SMS_API_KEY;

    // 1. Twilio SMS Integration
    if (provider === 'twilio' || (twilioSid && twilioToken && twilioFrom)) {
      try {
        if (!twilioSid || !twilioToken || !twilioFrom) {
          throw new Error('Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) missing in .env');
        }

        const authHeader = `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`;
        const params = new URLSearchParams();
        params.append('To', toPhone);
        params.append('From', twilioFrom);
        params.append('Body', messageBody);

        const res = await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          params.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: authHeader,
            },
            timeout: 10000,
          }
        );

        logger.info(`📱 Twilio SMS sent successfully to ${toPhone} (SID: ${res.data?.sid})`);
        return true;
      } catch (err: any) {
        logger.error(`❌ Twilio SMS dispatch error to ${toPhone}: ${err?.response?.data?.message || err.message}`);
        return false;
      }
    }

    // 2. Fast2SMS Integration (India)
    if (provider === 'fast2sms' || fast2smsKey) {
      try {
        if (!fast2smsKey) throw new Error('FAST2SMS_API_KEY missing in .env');

        const res = await axios.post(
          'https://www.fast2sms.com/dev/bulkV2',
          {
            route: 'v3',
            sender_id: 'TXTIND',
            message: messageBody,
            numbers: toPhone.replace(/[^0-9]/g, ''),
          },
          {
            headers: {
              authorization: fast2smsKey,
            },
            timeout: 10000,
          }
        );

        if (res.data && res.data.return === false) {
          logger.warn(`⚠️ Fast2SMS API Notice for ${toPhone}: ${res.data.message || 'Transaction required'}`);
          logger.info(`📲 [SIMULATED CELLULAR SMS DISPATCH] To: ${toPhone} | Message: "${messageBody}"`);
          return false;
        }

        logger.info(`📱 Fast2SMS sent successfully to ${toPhone} (Request ID: ${res.data?.request_id || 'OK'})`);
        return true;
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err?.message || 'Unknown SMS Error';
        logger.error(`❌ Fast2SMS dispatch error to ${toPhone}: ${errorMsg}`);
        logger.info(`📲 [SIMULATED CELLULAR SMS DISPATCH] To: ${toPhone} | Message: "${messageBody}"`);
        return false;
      }
    }

    // 3. Simulated SMS Dispatch (Default when no SMS API key configured in .env)
    logger.info(`📲 [SIMULATED CELLULAR SMS DISPATCH] To: ${toPhone} | Message: "${messageBody}"`);
    return true;
  }

  /**
   * Dispatch Emergency SMS to all registered emergency contacts upon SOS alert trigger
   */
  public static async dispatchSOSAlerts(payload: EmergencySMSPayload): Promise<void> {
    const mapUrl = `https://maps.google.com/?q=${payload.latitude},${payload.longitude}`;
    const messageBody =
      `🚨 EMERGENCY SOS ALERT!\n` +
      `${payload.userName} (${payload.userPhone}) has triggered an urgent safety alert!\n` +
      `Location: ${payload.locationAddress}\n` +
      `Live Map GPS: ${mapUrl}\n` +
      `Immediate action required! Call 112 / Pink Police 1515.`;

    const dispatchPromises = payload.contacts.map((contact) =>
      SmsService.sendSMS(contact.phone, messageBody)
    );

    await Promise.all(dispatchPromises);
  }
}

export default SmsService;
