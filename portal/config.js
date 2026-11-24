// Public settings only. Never put passwords, API keys, or n8n header secrets here.
window.HR_CONFIG = Object.freeze({
  apiBaseUrl: "https://trucks-fax-excluding-mechanical.trycloudflare.com", // temporary test gateway; replace with permanent HTTPS hosting before production
  positionManagementFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEJDx-K4tD2EELlg9K8z3CuWaa0nPl1RpB5-wrR6tn_hZyCg/viewform", // restrict to verified HR accounts before use
  leaveFormUrl: "./leave.html",
  refreshMs: 60000
});
