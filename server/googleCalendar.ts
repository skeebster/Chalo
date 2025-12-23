import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

export async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export interface CalendarEventParams {
  title: string;
  description: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
}

export async function createCalendarEvent(params: CalendarEventParams) {
  const calendar = await getUncachableGoogleCalendarClient();
  
  const event = {
    summary: params.title,
    description: params.description,
    location: params.location,
    start: {
      dateTime: params.startDateTime,
      timeZone: params.timeZone || 'America/New_York',
    },
    end: {
      dateTime: params.endDateTime,
      timeZone: params.timeZone || 'America/New_York',
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return response.data;
}

export async function createMultipleCalendarEvents(events: CalendarEventParams[]) {
  const results = [];
  for (const event of events) {
    const result = await createCalendarEvent(event);
    results.push(result);
  }
  return results;
}
