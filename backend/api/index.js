export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only handle `/api`
  return res.status(200).json({
    status: "ok",
    message: "HeyU backend service is running",
    endpoints: {
      health: "/api/health",
      bookings: "/api/bookings",
      services: "/api/services",
      blockedDates: "/api/blocked-dates",
      email: {
        sendConfirmation: "/api/email/send-confirmation"
      }
    }
  });
}
