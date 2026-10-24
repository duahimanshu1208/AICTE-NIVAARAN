const crypto = require("crypto");
const SECRET = process.env.SESSION_SECRET || process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
const b64 = (s) => Buffer.from(s).toString("base64url");
const mac = (p) => crypto.createHmac("sha256", SECRET).update(p).digest("base64url");

exports.sign = (user) => {
  const p = b64(JSON.stringify({ ...user, exp: Date.now() + 12 * 3600000 }));   // valid for 12 hours
  return p + "." + mac(p);
};

exports.verify = (token) => {
  if (!SECRET || !token || !token.includes(".")) return null;
  const [p, sig] = token.split(".");
  const good = mac(p);
  if (!sig || sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  const user = JSON.parse(Buffer.from(p, "base64url").toString());
  return user.exp > Date.now() ? user : null;
};
