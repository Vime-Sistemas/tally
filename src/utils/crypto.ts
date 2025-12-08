import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_CRYPTO_SECRET || 'tally-default-secret-key';

export const encryptPayload = (data: unknown): string => {
  const jsonString = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
  return encrypted;
};

export const decryptPayload = <T = unknown>(encryptedData: string): T => {
  const decrypted = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
  return JSON.parse(jsonString) as T;
};
