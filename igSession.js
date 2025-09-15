import { promises as fs } from 'fs';
import path from 'path';

const sessionPath = process.env.SESSION_FILE || './ig-session.json';

/**
 * Menyimpan data session ke file JSON.
 * @param {object} data - Data session dari instagram-private-api.
 */
export const saveSession = async (data) => {
  try {
    await fs.writeFile(sessionPath, JSON.stringify(data));
    console.log('✅ Session berhasil disimpan ke', sessionPath);
  } catch (error) {
    console.error('❌ Gagal menyimpan session:', error);
  }
};

/**
 * Memuat data session dari file JSON.
 * @returns {Promise<object|null>} Data session atau null jika tidak ada.
 */
export const loadSession = async () => {
  try {
    const data = await fs.readFile(sessionPath, 'utf8');
    console.log('✅ Session berhasil dimuat dari', sessionPath);
    return JSON.parse(data);
  } catch (error) {
    // Jika file tidak ada, itu normal pada run pertama.
    if (error.code === 'ENOENT') {
      console.log('ℹ️ File session tidak ditemukan, akan login baru.');
      return null;
    }
    // Jika ada error lain (misal: JSON tidak valid), log errornya.
    console.error('❌ Gagal memuat session:', error);
    return null;
  }
};