/**
 * Crypto Module
 * Handles encryption/decryption of cycle data using AES
 */

import CryptoJS from 'crypto-js';
const AES = CryptoJS.AES;
const enc = CryptoJS.enc;

export function encryptData(data, passphrase) {
  if (!passphrase) throw new Error('Passphrase required for encryption');
  
  // Convert data to string format
  const dataStr = JSON.stringify(data);
  
  // Encrypt using AES
  const encrypted = AES.encrypt(dataStr, passphrase).toString();
  
  // Create downloadable file
  const blob = new Blob([encrypted], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cycle_data-${new Date().toISOString().split('T')[0]}.qcycle`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return encrypted;
}

export function decryptData(fileContent, passphrase) {
  if (!fileContent || !passphrase) throw new Error('Missing encrypted data or passphrase');
  
  // Decrypt using AES
  const decrypted = AES.decrypt(fileContent, passphrase);
  
  // Convert from ciphertext to plaintext
  const originalText = decrypted.toString(enc.Utf8);
  
  // Parse JSON
  try {
    return JSON.parse(originalText);
  } catch (e) {
    throw new Error('Invalid encrypted file format');
  }
}
