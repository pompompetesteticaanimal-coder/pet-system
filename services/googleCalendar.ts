
declare var google: any;

// ATENÇÃO: Substitua pelo seu Client ID real do Google Cloud Console
// Para rodar localmente, certifique-se de adicionar http://localhost:3000 (ou sua porta) nas origens JS autorizadas no console do Google.
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE'; 
// Adicionado escopo para ler planilhas
const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/spreadsheets.readonly';

export const googleService = {
  tokenClient: null as any,
  
  init: (callback: (tokenResponse: any) => void) => {
    if (typeof google !== 'undefined' && google.accounts) {
      googleService.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: callback,
      });
    } else {
      console.error('Google Identity Services script not loaded');
    }
  },

  login: () => {
    if (googleService.tokenClient) {
      googleService.tokenClient.requestAccessToken();
    } else {
      alert('Serviço de login Google não inicializado. Verifique sua conexão.');
    }
  },

  getUserProfile: async (accessToken: string) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile', error);
      return null;
    }
  },

  createEvent: async (accessToken: string, eventDetails: {
    summary: string;
    description: string;
    startTime: string; // ISO string
    durationMin: number;
  }) => {
    const start = new Date(eventDetails.startTime);
    const end = new Date(start.getTime() + eventDetails.durationMin * 60000);

    const event = {
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: {
        dateTime: start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating calendar event', error);
      return null;
    }
  },

  // Nova função para ler dados da planilha
  getSheetValues: async (accessToken: string, spreadsheetId: string, range: string) => {
    try {
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      return data.values;
    } catch (error) {
      console.error('Error fetching sheet data', error);
      throw error;
    }
  }
};
