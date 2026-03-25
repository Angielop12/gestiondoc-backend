/**
 * POST /api/ensure-folder
 * Crea la carpeta del investigador en Drive si no existe
 * Body: { pin, folderName }
 * Returns: { folderId }
 */
const { getAccessToken, setCors, verifyPin } = require("./_helpers");

module.exports = async (req, res) => {
  setCors(res, req);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const { pin, folderName } = req.body;

  if (!verifyPin(pin)) {
    return res.status(401).json({ error: "PIN incorrecto" });
  }

  if (!folderName) {
    return res.status(400).json({ error: "folderName es requerido" });
  }

  const ROOT_ID = process.env.SHARED_FOLDER_ID;

  try {
    const token = await getAccessToken();

    // Buscar si la carpeta ya existe
    const q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${ROOT_ID}' in parents and trashed=false`;
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
      return res.status(200).json({ folderId: searchData.files[0].id });
    }

    // Crear la carpeta
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [ROOT_ID]
      })
    });

    const folder = await createRes.json();
    return res.status(200).json({ folderId: folder.id });

  } catch (err) {
    console.error("ensure-folder error:", err);
    return res.status(500).json({ error: err.message });
  }
};
