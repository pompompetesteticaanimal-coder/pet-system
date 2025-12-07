
declare var google: any;

const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/spreadsheets.readonly';

export const googleService = {
  tokenClient: null as any,
  
  init: (callback: (tokenResponse: any) => void) => {
    if (typeof google !== 'undefined' && google.accounts) {
      const clientId = localStorage.getItem('petgestor_client_id');
      
      if (!clientId) {
        console.warn('Google Client ID não configurado.');
        return;
      }

      googleService.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
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
      // Tenta recuperar caso tenha falhado na init
      const clientId = localStorage.getItem('petgestor_client_id');
      if (!clientId) {
          alert('ID do cliente não encontrado. Reinicie a configuração.');
          return;
      }
      alert('Sistema de login carregando... tente novamente em 2 segundos.');
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
