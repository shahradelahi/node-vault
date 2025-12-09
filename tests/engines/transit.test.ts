import { afterAll, beforeAll, describe, expect, expectTypeOf, it } from 'vitest';

import { Client } from '@/index';
import { createVaultContainer, type VaultContainer } from '@/tests/container';
import { sleep } from '@/tests/utils';

describe('Transit Secrets Engine', () => {
  let vault: VaultContainer;
  let vc: Client;
  const mountPath = 'transit-test';

  const createEngine = async () => {
    try {
      await vc.unmount({ mountPath });
    } catch (e) {
      // ignore
    }

    await sleep(100);

    await vc.transit.enable({
      mountPath,
      type: 'transit',
      description: 'Test transit engine'
    });

    await sleep(100);
  };

  // Launch
  beforeAll(async function () {
    vault = await createVaultContainer();
    vc = vault.client;
  });

  // Down
  afterAll(async () => {
    await vault.stop();
  });

  it('should enable the transit engine', async () => {
    const enabled = await vc.transit.enable({
      mountPath,
      type: 'transit',
      description: 'Test transit engine'
    });

    expect(enabled.data).toBe(true);

    // Verify
    const { data: info, error } = await vc.transit.info({
      mountPath
    });

    if (error) {
      expectTypeOf<undefined>(info);
      return;
    }

    expectTypeOf<undefined>(error);
    expect(info.type).toBe('transit');
  });

  it('should create an encryption key', async () => {
    await createEngine();

    const { data, error } = await vc.transit.createKey({
      mountPath,
      name: 'test-key',
      type: 'aes256-gcm96',
      exportable: true,
      allow_plaintext_backup: true
    });

    expect(error).toBeUndefined();
    if (error) {
      throw error;
    }
    expect(data?.data?.name).toBe('test-key');
  });

  it('should read key configuration', async () => {
    await createEngine();

    await vc.transit.createKey({
      mountPath,
      name: 'test-key',
      exportable: true
    });

    const { data: keyInfo, error } = await vc.transit.readKey({
      mountPath,
      name: 'test-key'
    });

    if (error) {
      expectTypeOf<undefined>(keyInfo);
      return;
    }

    expectTypeOf<undefined>(error);
    expect(keyInfo?.data).toBeDefined();
    expect(keyInfo?.data.type).toBe('aes256-gcm96');
    expect(keyInfo?.data.supports_encryption).toBe(true);
    expect(keyInfo?.data.supports_decryption).toBe(true);
    expect(keyInfo?.data.exportable).toBe(true);
  });

  it('should update key configuration', async () => {
    await createEngine();

    await vc.transit.createKey({
      mountPath,
      name: 'test-key'
    });

    const { data, error } = await vc.transit.updateKey(
      {
        mountPath,
        name: 'test-key',
        min_decryption_version: 1,
        min_encryption_version: 1,
        deletion_allowed: true
      },
      { strictSchema: false }
    );

    expect(error).toBeUndefined();
    expect(data?.data.min_decryption_version).toBe(1);
    expect(data?.data.min_encryption_version).toBe(1);
    expect(data?.data.deletion_allowed).toBe(true);
  });

  it('should list keys', async () => {
    await createEngine();

    await vc.transit.createKey({
      mountPath,
      name: 'test-key-1'
    });

    await vc.transit.createKey({
      mountPath,
      name: 'test-key-2'
    });

    const { data: keys, error } = await vc.transit.listKeys({
      mountPath
    });

    if (error) {
      expectTypeOf<undefined>(keys);
      return;
    }

    expectTypeOf<undefined>(error);
    expect(keys?.data).toBeDefined();
    expect(keys?.data.keys).toBeDefined();
    expect(keys?.data.keys).toContain('test-key-1');
    expect(keys?.data.keys).toContain('test-key-2');
  });

  it('should encrypt and decrypt data', async () => {
    await createEngine();

    await vc.transit.createKey({
      mountPath,
      name: 'test-key'
    });

    const plaintext = Buffer.from('Hello, World!').toString('base64');

    // Encrypt
    const { data: encryptResult, error: encryptError } = await vc.transit.encrypt({
      mountPath,
      name: 'test-key',
      plaintext
    });

    expect(encryptError).toBeUndefined();
    expect(encryptResult).toBeDefined();
    expect(encryptResult?.data).toBeDefined();
    expect(encryptResult?.data.ciphertext).toBeDefined();

    // Decrypt
    const { data: decryptResult, error: decryptError } = await vc.transit.decrypt({
      mountPath,
      name: 'test-key',
      ciphertext: encryptResult?.data.ciphertext || ''
    });

    expect(decryptError).toBeUndefined();
    expect(decryptResult).toBeDefined();
    expect(decryptResult?.data).toBeDefined();
    expect(decryptResult?.data.plaintext).toBe(plaintext);
  });

  it('should rewrap data', async () => {
    await createEngine();

    await vc.transit.createKey({
      mountPath,
      name: 'test-key'
    });

    const plaintext = Buffer.from('Hello, World!').toString('base64');

    // Encrypt
    const { data: encryptResult } = await vc.transit.encrypt({
      mountPath,
      name: 'test-key',
      plaintext
    });

    // Rewrap
    const { data: rewrapResult, error: rewrapError } = await vc.transit.rewrap({
      mountPath,
      name: 'test-key',
      ciphertext: encryptResult?.data.ciphertext || ''
    });

    expect(rewrapError).toBeUndefined();
    expect(rewrapResult).toBeDefined();
    expect(rewrapResult?.data).toBeDefined();
    expect(rewrapResult?.data.ciphertext).toBeDefined();
  });

  it('should generate data key', async () => {
    await createEngine();

    await vc.transit.createKey({
      mountPath,
      name: 'test-key'
    });

    // Generate wrapped data key
    const { data: wrappedKey, error: wrappedError } = await vc.transit.generateDataKey({
      mountPath,
      name: 'test-key',
      type: 'wrapped',
      bits: 256
    });

    expect(wrappedError).toBeUndefined();
    expect(wrappedKey).toBeDefined();
    expect(wrappedKey?.data).toBeDefined();
    expect(wrappedKey?.data.ciphertext).toBeDefined();
    expect(wrappedKey?.data.key_version).toBeDefined();

    // Generate plaintext data key
    const { data: plaintextKey, error: plaintextError } = await vc.transit.generateDataKey({
      mountPath,
      name: 'test-key',
      type: 'plaintext',
      bits: 256
    });

    expect(plaintextError).toBeUndefined();
    expect(plaintextKey).toBeDefined();
    expect(plaintextKey?.data).toBeDefined();
    expect(plaintextKey?.data.plaintext).toBeDefined();
  });

  it('should generate random bytes', async () => {
    await createEngine();

    const { data: randomBytes, error } = await vc.transit.generateRandom({
      mountPath,
      source: 'platform',
      bytes: 32,
      format: 'hex'
    });

    if (error) {
      expectTypeOf<undefined>(randomBytes);
      return;
    }

    expectTypeOf<undefined>(error);
    expect(randomBytes).toBeDefined();
    expect(randomBytes?.data).toBeDefined();
    expect(randomBytes?.data.random_bytes).toHaveLength(64);
  });

  it('should hash data', async () => {
    await createEngine();

    const input = Buffer.from('Hello, World!').toString('base64');

    const { data: hashResult, error } = await vc.transit.hash({
      mountPath,
      algorithm: 'sha2-256',
      input,
      format: 'hex'
    });

    if (error) {
      expectTypeOf<undefined>(hashResult);
      return;
    }

    expectTypeOf<undefined>(error);
    expect(hashResult).toBeDefined();
    expect(hashResult?.data).toBeDefined();
    expect(hashResult?.data.sum).toBeTypeOf('string');
  });

  it('should generate and verify HMAC', async () => {
    await createEngine();

    await vc.transit.createKey({
      mountPath,
      name: 'test-key'
    });

    const input = Buffer.from('Hello, World!').toString('base64');

    // Generate HMAC
    const { data: hmacResult, error: hmacError } = await vc.transit.hmac({
      mountPath,
      name: 'test-key',
      input
    });

    expect(hmacError).toBeUndefined();
    expect(hmacResult).toBeDefined();
    expect(hmacResult?.data).toBeDefined();
    expect(hmacResult?.data.hmac).toBeDefined();

    // Verify HMAC
    const { data: verifyResult } = await vc.transit.verifyHmac({
      mountPath,
      name: 'test-key',
      algorithm: 'sha2-256',
      input,
      hmac: hmacResult?.data.hmac || ''
    });

    expect(verifyResult).toBeDefined();
    expect(verifyResult?.data).toBeDefined();
    expect(verifyResult?.data.valid).toBe(true);
  });

  it('should sign and verify data', async () => {
    await createEngine();

    await vc.transit.createKey({
      mountPath,
      name: 'test-key',
      type: 'ed25519'
    });

    const input = Buffer.from('Hello, World!').toString('base64');

    // Sign
    const { data: signResult, error: signError } = await vc.transit.sign({
      mountPath,
      name: 'test-key',
      input
    });

    expect(signError).toBeUndefined();
    expect(signResult).toBeDefined();
    expect(signResult?.data).toBeDefined();
    expect(signResult?.data.signature).toBeDefined();

    // Verify
    const { data: verifyResult, error: verifyError } = await vc.transit.verify({
      mountPath,
      name: 'test-key',
      algorithm: 'ed25519',
      input,
      signature: signResult?.data.signature || ''
    });

    if (verifyError) {
      expectTypeOf<undefined>(verifyResult);
      return;
    }

    expectTypeOf<undefined>(verifyError);
    expect(verifyResult).toBeDefined();
    expect(verifyResult?.data).toBeDefined();
    expect(verifyResult?.data.valid).toBe(true);
  });

  it('should rotate key', async () => {
    await createEngine();

    await vc.transit.createKey({
      mountPath,
      name: 'test-key'
    });

    // Get initial key info
    const { data: initialInfo, error: initialError } = await vc.transit.readKey({
      mountPath,
      name: 'test-key'
    });

    if (initialError) {
      expectTypeOf<undefined>(initialInfo);
      return;
    }

    const initialVersion = initialInfo?.data.latest_version || 0;

    // Rotate key
    const rotated = await vc.transit.rotateKey({
      mountPath,
      name: 'test-key'
    });

    expect(rotated?.data?.data.latest_version).toBe(2);

    // Verify version increased
    const { data: rotatedInfo, error: rotatedError } = await vc.transit.readKey({
      mountPath,
      name: 'test-key'
    });

    if (rotatedError) {
      expectTypeOf<undefined>(rotatedInfo);
      return;
    }

    expect(rotatedInfo?.data.latest_version).toBeGreaterThan(initialVersion);
  });

  it('should export key', async () => {
    await createEngine();

    await vc.transit.createKey({
      mountPath,
      name: 'test-key',
      exportable: true
    });

    const { data: exportResult, error } = await vc.transit.exportKey({
      mountPath,
      name: 'test-key',
      type: 'encryption-key'
    });

    if (error) {
      expectTypeOf<undefined>(exportResult);
      return;
    }

    expectTypeOf<undefined>(error);
    expect(exportResult).toBeDefined();
    expect(exportResult?.data).toBeDefined();
    expect(exportResult?.data.name).toBe('test-key');
    expect(exportResult?.data.type).toBe('aes256-gcm96');
    expect(exportResult?.data.keys).toBeDefined();
  });

  it('should backup and restore key', async () => {
    await createEngine();

    await vc.transit.createKey({
      mountPath,
      name: 'test-key',
      allow_plaintext_backup: true
    });

    // Backup
    const { data: backupResult, error: backupError } = await vc.transit.backupKey({
      mountPath,
      name: 'test-key'
    });

    if (backupError) {
      expectTypeOf<undefined>(backupResult);
      return;
    }

    expectTypeOf<undefined>(backupError);
    expect(backupResult).toBeDefined();
    expect(backupResult?.data).toBeDefined();
    expect(backupResult?.data.backup).toBeDefined();

    // Delete original key
    await vc.transit.deleteKey({
      mountPath,
      name: 'test-key'
    });

    // Restore
    const restored = await vc.transit.restoreKey({
      mountPath,
      name: 'test-key',
      backup: backupResult?.data.backup || ''
    });

    expect(restored.data).toBe(true);

    // Verify key exists
    const { data: keyInfo } = await vc.transit.readKey({
      mountPath,
      name: 'test-key'
    });

    expect(keyInfo?.data.type).toBe('aes256-gcm96');
  });

  it('should trim key versions', async () => {
    await createEngine();

    await vc.transit.createKey({
      mountPath,
      name: 'test-key'
    });

    // Set min_encryption_version to allow trimming
    await vc.transit.updateKey({
      mountPath,
      name: 'test-key',
      min_encryption_version: 1,
      min_decryption_version: 1
    });

    // Rotate key to create multiple versions
    await vc.transit.rotateKey({
      mountPath,
      name: 'test-key'
    });

    await vc.transit.rotateKey({
      mountPath,
      name: 'test-key'
    });

    // Get current version
    const { data: keyInfo } = await vc.transit.readKey({
      mountPath,
      name: 'test-key'
    });

    const currentVersion = keyInfo?.data.latest_version || 1;

    // Trim to keep only the latest version
    const { data: trimmed, error: trimError } = await vc.transit.trimKey({
      mountPath,
      name: 'test-key',
      min_available_version: currentVersion
    });

    if (trimError) {
      expectTypeOf<undefined>(trimmed);
      return;
    }

    expectTypeOf<undefined>(trimError);
    expect(trimmed).toBe(true);
  });

  it('should delete key', async () => {
    await createEngine();

    await vc.transit.createKey({
      mountPath,
      name: 'test-key'
    });

    // Update key configuration to allow deletion
    await vc.transit.updateKey({
      mountPath,
      name: 'test-key',
      deletion_allowed: true
    });

    const { data: deleted, error: deleteError } = await vc.transit.deleteKey({
      mountPath,
      name: 'test-key'
    });

    if (deleteError) {
      expectTypeOf<undefined>(deleted);
      return;
    }

    expectTypeOf<undefined>(deleteError);
    expect(deleted).toBe(true);

    // Verify key is deleted
    const { error } = await vc.transit.readKey({
      mountPath,
      name: 'test-key'
    });

    expect(error).toBeDefined();
  });

  it('should handle batch operations', async () => {
    await createEngine();

    await vc.transit.createKey({
      mountPath,
      name: 'test-key'
    });

    const plaintext1 = Buffer.from('Hello, World!').toString('base64');
    const plaintext2 = Buffer.from('Goodbye, World!').toString('base64');

    // Batch encrypt
    const { data: batchEncryptResult, error: batchEncryptError } = await vc.transit.encrypt({
      mountPath,
      name: 'test-key',
      plaintext: '', // Required field for single operation
      batch_input: [{ plaintext: plaintext1 }, { plaintext: plaintext2 }]
    });

    expect(batchEncryptError).toBeUndefined();
    expect(batchEncryptResult).toBeDefined();
    expect(batchEncryptResult?.data).toBeDefined();
    expect(batchEncryptResult?.data.batch_results).toHaveLength(2);

    // Batch decrypt
    const { data: batchDecryptResult, error: batchDecryptError } = await vc.transit.decrypt({
      mountPath,
      name: 'test-key',
      ciphertext: '', // Required field for single operation
      batch_input: [
        { ciphertext: batchEncryptResult?.data.batch_results?.[0]?.ciphertext || '' },
        { ciphertext: batchEncryptResult?.data.batch_results?.[1]?.ciphertext || '' }
      ]
    });

    expect(batchDecryptError).toBeUndefined();
    expect(batchDecryptResult).toBeDefined();
    expect(batchDecryptResult?.data).toBeDefined();
    expect(batchDecryptResult?.data.batch_results).toHaveLength(2);
    expect(batchDecryptResult?.data.batch_results![0]?.plaintext).toBe(plaintext1);
    expect(batchDecryptResult?.data.batch_results![1]?.plaintext).toBe(plaintext2);
  });
});
