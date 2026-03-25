/**
 * POST /api/verify-pin
 * Verifica el PIN de acceso
 */
const { setCors, verifyPin } = require("./_helpers");

module.exports = async (req, res) => {
  setCors(res, req);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const { pin } = req.body;

  if (!verifyPin(pin)) {
    return res.status(401).json({ ok: false, error: "PIN incorrecto" });
  }

  return res.status(200).json({ ok: true });
};
