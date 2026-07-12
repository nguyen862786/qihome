import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'qihome-jwt-secret-key-32-characters-minimum-for-qr-logistics'
);

/**
 * Generates a unique secure QR code token for warehouse disbursement
 * containing project code, SKU, and quantity, valid for 60 minutes.
 */
export async function generateQRToken(projectCode, sku, quantity) {
  try {
    const token = await new SignJWT({
      projectCode,
      sku,
      quantity: Number(quantity)
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('60m') // 60 minutes TTL
      .sign(JWT_SECRET);
      
    return token;
  } catch (error) {
    console.error('Error generating QR Token:', error);
    throw error;
  }
}

/**
 * Verifies a QR code token, returns validity state and decrypted payload
 */
export async function verifyQRToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      valid: true,
      payload
    };
  } catch (error) {
    return {
      valid: false,
      error: error.name === 'JWTExpired' ? 'Mã QR đã hết hạn (chỉ có hiệu lực trong 60 phút)' : 'Mã QR không hợp lệ'
    };
  }
}
