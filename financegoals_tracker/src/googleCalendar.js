import { gapi } from "gapi-script";

/**
 * PUBLIC_INTERFACE
 * Adds an event to the Google user's primary calendar via gapi.
 * Note: gapi uses the user's Google session; you must be signed in and authorized.
 * @param {Object} eventData - Including summary, description, start/end dateTime, reminders, etc.
 * @param {Function} onSuccess - Called on successful event creation.
 * @param {Function} onError - Called with error.
 */
export function addGoogleCalendarEvent(eventData, onSuccess, onError) {
  // gapi must be loaded and authorized
  if (!window.gapi || !window.gapi.client) {
    onError && onError("Google API not loaded.");
    return;
  }
  window.gapi.client.calendar.events.insert({
    calendarId: "primary",
    resource: eventData,
  }).then(
    (res) => {
      onSuccess && onSuccess(res);
    },
    (err) => {
      onError && onError(err);
    }
  );
}

/**
 * PUBLIC_INTERFACE
 * Prepares a calendar event payload from Goalie reminder info.
 * @param {Object} params - { goalName, amount, dueDate, description }
 * Summary: Generates an event for the user's given savings goal.
 */
export function makeGoalieCalendarEvent({ goalName, amount, dueDate, description }) {
  const startDate = new Date(dueDate);
  startDate.setHours(9, 0, 0); // morning 9 AM
  const endDate = new Date(dueDate);
  endDate.setHours(10, 0, 0); // 1 hour slot

  return {
    summary: `Goal Reminder: ${goalName}`,
    description: description || `Remember to contribute ₹${amount} towards "${goalName}"!`,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 10 },
        { method: "email", minutes: 30 }
      ]
    }
  };
}

// No explicit Google OAuth redirect_uri is hardcoded anywhere in the codebase.
