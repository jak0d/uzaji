// Encryption utilities using Web Crypto API
export class EncryptionService {
  private static instance: EncryptionService;
  private key: CryptoKey | null = null;
  private salt: Uint8Array | null = null;
  private userCredentials: { email: string; password: string } | null = null;

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  // Store user credentials for automatic encryption
  setUserCredentials(email: string, password: string): void {
    this.userCredentials = { email, password };
  }

  // Get stored user credentials
  getUserCredentials(): { email: string; password: string } | null {
    return this.userCredentials;
  }

  // Generate or retrieve salt
  private async getSalt(): Promise<Uint8Array> {
    if (this.salt) return this.salt;
    
    const storedSalt = localStorage.getItem('bookkeeper-salt');
    if (storedSalt) {
      this.salt = new Uint8Array(JSON.parse(storedSalt));
      return this.salt;
    }

    this.salt = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem('bookkeeper-salt', JSON.stringify(Array.from(this.salt)));
    return this.salt;
  }

  // Derive key from password
  async deriveKey(password: string): Promise<CryptoKey> {
    if (this.key) return this.key;

    const salt = await this.getSalt();
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Derive actual encryption key
    this.key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return this.key;
  }

  // Encrypt data with stored credentials or provided password
  async encrypt(data: any, password?: string): Promise<string> {
    try {
      let encryptionPassword = password;
      
      // If no password provided, use stored credentials
      if (!encryptionPassword && this.userCredentials) {
        encryptionPassword = this.userCredentials.password;
      }
      
      if (!encryptionPassword) {
        throw new Error('No password available for encryption');
      }

      const key = await this.deriveKey(encryptionPassword);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data with stored credentials or provided password
  async decrypt(encryptedData: string, password?: string): Promise<any> {
    try {
      let decryptionPassword = password;
      
      // If no password provided, use stored credentials
      if (!decryptionPassword && this.userCredentials) {
        decryptionPassword = this.userCredentials.password;
      }
      
      if (!decryptionPassword) {
        throw new Error('No password available for decryption');
      }

      const key = await this.deriveKey(decryptionPassword);
      
      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      const decryptedText = decoder.decode(decryptedBuffer);
      return JSON.parse(decryptedText);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Clear stored key and credentials (for logout)
  clearKey(): void {
    this.key = null;
    this.userCredentials = null;
  }

  // Check if user is authenticated (has key)
  isAuthenticated(): boolean {
    return this.key !== null;
  }

  // Check if credentials are available for automatic encryption
  hasCredentials(): boolean {
    return this.userCredentials !== null;
  }
}

export const encryption = EncryptionService.getInstance();