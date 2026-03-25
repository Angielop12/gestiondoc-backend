/**
 * /api/setup
 * Endpoint de configuración única — obtiene el refresh token de Google
 * Visita esta URL una sola vez para autorizar la cuenta del proyecto
 */

const SCOPES = "https://www.googleapis.com/auth/drive";

module.exports = async (req, res) => {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT = `https://${req.headers.host}/api/setup`;

  // Paso 2: Google nos devuelve un code, lo intercambiamos por tokens
  if (req.query.code) {
    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: req.query.code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT,
          grant_type: "authorization_code"
        })
      });

      const data = await tokenRes.json();

      if (!data.refresh_token) {
        return res.send(`
          <h2>❌ No se obtuvo refresh_token</h2>
          <p>Respuesta de Google: <pre>${JSON.stringify(data, null, 2)}</pre></p>
          <p>Intenta de nuevo yendo a <a href="/api/setup">/api/setup</a></p>
        `);
      }

      return res.send(`
        <style>body{font-family:sans-serif;max-width:700px;margin:40px auto;padding:20px}</style>
        <h2>✅ ¡Autorización exitosa!</h2>
        <p>Copia este <strong>Refresh Token</strong> y agrégalo como variable de entorno en Vercel con el nombre <code>GOOGLE_REFRESH_TOKEN</code>:</p>
        <textarea rows="4" style="width:100%;font-family:monospace;font-size:13px;padding:10px">${data.refresh_token}</textarea>
        <br><br>
        <p><strong>Pasos:</strong></p>
        <ol>
          <li>Ve al dashboard de Vercel → tu proyecto → Settings → Environment Variables</li>
          <li>Agrega: <code>GOOGLE_REFRESH_TOKEN</code> = el token de arriba</li>
          <li>Haz clic en Save y luego Redeploy</li>
          <li>¡La plataforma estará lista!</li>
        </ol>
      `);
    } catch (err) {
      return res.send(`<h2>Error</h2><pre>${err.message}</pre>`);
    }
  }

  // Paso 1: Redirigir a Google para autorizar
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("login_hint", process.env.PROJECT_EMAIL || "");

  return res.redirect(authUrl.toString());
};
