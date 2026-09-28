/**
 * Shared constants for NetEase Cloud Music request encryption.
 *
 * Byte-exact port of the module-level constants in
 * music-api-audit/repos/api-enhanced/util/crypto.js.
 * Algorithm code is copied verbatim; only JS -> TS necessities changed.
 */

// weapi AES-CBC IV (ASCII)
export const iv = "0102030405060708";
// weapi AES-CBC preset key (ASCII)
export const presetKey = "0CoJUm6Qyw8W8jud";
// linuxapi AES-ECB key (ASCII)
export const linuxapiKey = "rFgB&h#%2?^eDg:Q";
// eapi AES-ECB key (ASCII). NOTE: decrypt() passes this as a *string* to the
// KDF instead of raw bytes (see eapi.ts) - that quirk is preserved on purpose.
export const eapiKey = "e82ckenh8dichen8";

export const base62 =
	"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgtQn2JZ34ZC28NWYpAUd98iZ37BUrX/aKzmFbt7clFSs6sXqHauqKWqdtLkF2KexO40H1YTX8z2lSgBBOAxLsvaklV8k4cBFK9snQXE9/DDaFt6Rr7iVZMldczhC0JNgTz+SHXT6CBHuX3e9SdB1Ua44oncaTWz7OBGLbCiK45wIDAQAB
-----END PUBLIC KEY-----`;

// xeapi: static 32-byte AES key (AES-256-ECB)
export const xeapiStaticKey = Buffer.from(
	"ab1d5a430f6bb04a3f01e81ddd72bd916d5ce591248ac128714806d7f8fb1b84",
	"hex",
);

// xeapiSign HMAC-SHA256 key (base64 *string* used directly, not decoded)
export const xeapiSignKey =
	"mUHCwVNWJbunMqAHf5MImuirT6plvs6VSFW62MGHstFQxhBGdEoIhLItH3djc4+FB/OKty3+lL2rGeoFBpVe5g==";

// DER prefix for a raw 32-byte X25519 public key (SPKI header)
export const x25519SpkiPrefix = Buffer.from("302a300506032b656e032100", "hex");
