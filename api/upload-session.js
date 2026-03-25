/**
 * POST /api/upload-session
 * Crea una sesión de subida resumible en Google Drive
 * El frontend sube el archivo directamente a Google (sin pasar por Vercel)
 * Body: { pin, fileName, mimeType, folderId, docType }
 * Returns: { uploadUrl, sessionId }
 */
const { getAccessToken, setCors, verifyPin } = require("./_helpers");

module.exports = async (req, res) => {
  setCors(res, req);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const { pin, fileName, mimeType, folderId, docType } = req.body;

  if (!verifyPin(pin)) {
    return res.status(401).json({ error: "PIN incorrecto" });
  }

  if (!fileName || !folderId) {
    return res.status(400).json({ error: "fileName y folderId son requeridos" });
  }

  try {
    const token = await getAccessToken();

    // Nombre del archivo incluye tipo de documento como prefijo
    const finalName = docType ? `[${docType}] ${fileName}` : fileName;

    // Crear sesión de subida resumible
    const initRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,size,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": mimeType || "application/pdf"
        },
        body: JSON.stringify({
          name: finalName,
          mimeType: mimeType || "application/pdf",
          parents: [folderId]
        })
      }
    );

    if (!initRes.ok) {
      const errText = await initRes.text();
      throw new Error(`Error al crear sesión: ${initRes.status} ${errText}`);
    }

    const uploadUrl = initRes.headers.get("location");
    return res.status(200).json({ uploadUrl, finalName });

  } catch (err) {
    console.error("upload-session error:", err);
    return res.status(500).json({ error: err.message });
  }
};
