/**
 * Calendar Agent
 * Responsible ONLY for Google Calendar operations.
 */

import {
  checkCalendarAvailability,
  createCalendarEvent,
  verifyCalendarEvent,
  CalendarEventParams,
} from '../integrations/calendar';

export class CalendarAgent {
  readonly id = 'calendar';
  readonly name = 'Calendar Agent';

  async checkAvailability(timeMin: string, timeMax: string) {
    return await checkCalendarAvailability({ timeMin, timeMax });
  }

  async scheduleEvent(params: CalendarEventParams) {
    return await createCalendarEvent(params);
  }

  async verifyEvent(eventId: string, expectedTitle?: string) {
    return await verifyCalendarEvent({ eventId, expectedTitle });
  }
}

export const calendarAgent = new CalendarAgent();
