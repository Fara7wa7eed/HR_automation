// Public settings only. Never put passwords, API keys, or n8n header secrets here.
window.HR_CONFIG = Object.freeze({
  apiBaseUrl: "", // empty = same origin for local gateway; production: HTTPS gateway origin
  positionManagementFormUrl: "", // full Google Forms URL, restricted to verified HR accounts
  leaveFormUrl: "./leave.html",
  refreshMs: 60000
});
