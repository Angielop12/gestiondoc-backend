/**
 * Helper compartido — obtiene un access token fresco usando el refresh token
 */

async function getAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token"
    })
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("No se pudo obtener access token: " + JSON.stringify(data));
  }
  return data.access_token;
}

function setCors(res, req) {
  const allowed = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allowed);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function verifyPin(pin) {
  return pin && pin === process.env.APP_PIN;
}

module.exports = { getAccessToken, setCors, verifyPin };
