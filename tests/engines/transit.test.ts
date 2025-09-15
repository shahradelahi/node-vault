import { expect } from 'chai';
import { expectType } from 'tsd';

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
  before(async function () {
    this.timeout(30000);
    vault = await createVaultContainer();
    vc = vault.client;
  });

  // Down
  after(async () => {
    await vault.stop();
  });

  it('should enable the transit engine', async () => {
    const enabled = await vc.transit.enable({
      mountPath,
      type: 'transit',
      description: 'Test transit engine'
    });

    expect(enabled).have.property('data').to.true;

    // Verify
    const { data: info, error } = await vc.transit.info({
      mountPath
    });

    if (error) {
      expectType<undefined>(info);
      return;
    }

    expectType<undefined>(error);
    expect(info).have.property('type', 'transit');
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

    expect(error).be.undefined;
    expect(data).have.property('data').have.property('name', 'test-key');
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
      expectType<undefined>(keyInfo);
      return;
    }

    expectType<undefined>(error);
    expect(keyInfo).have.property('data');
    expect(keyInfo?.data).have.property('type', 'aes256-gcm96');
    expect(keyInfo?.data).have.property('supports_encryption', true);
    expect(keyInfo?.data).have.property('supports_decryption', true);
    expect(keyInfo?.data).have.property('exportable', true);
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

    expect(error).be.undefined;
    expect(data?.data).have.property('min_decryption_version', 1);
    expect(data?.data).have.property('min_encryption_version', 1);
    expect(data?.data).have.property('deletion_allowed', true);
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
      expectType<undefined>(keys);
      return;
    }

    expectType<undefined>(error);
    expect(keys).have.property('data');
    expect(keys?.data).have.property('keys');
    expect(keys?.data.keys).to.include('test-key-1');
    expect(keys?.data.keys).to.include('test-key-2');
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

    expect(encryptError).be.undefined;
    expect(encryptResult).have.property('data');
    expect(encryptResult?.data).have.property('ciphertext');

    // Decrypt
    const { data: decryptResult, error: decryptError } = await vc.transit.decrypt({
      mountPath,
      name: 'test-key',
      ciphertext: encryptResult?.data.ciphertext || ''
    });

    expect(decryptError).be.undefined;
    expect(decryptResult).have.property('data');
    expect(decryptResult?.data).have.property('plaintext', plaintext);
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

    expect(rewrapError).be.undefined;
    expect(rewrapResult).have.property('data');
    expect(rewrapResult?.data).have.property('ciphertext');
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

    expect(wrappedError).be.undefined;
    expect(wrappedKey).have.property('data');
    expect(wrappedKey?.data).have.property('ciphertext');
    expect(wrappedKey?.data).have.property('key_version');

    // Generate plaintext data key
    const { data: plaintextKey, error: plaintextError } = await vc.transit.generateDataKey({
      mountPath,
      name: 'test-key',
      type: 'plaintext',
      bits: 256
    });

    expect(plaintextError).be.undefined;
    expect(plaintextKey).have.property('data');
    expect(plaintextKey?.data).have.property('plaintext');
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
      expectType<undefined>(randomBytes);
      return;
    }

    expectType<undefined>(error);
    expect(randomBytes).have.property('data');
    expect(randomBytes?.data).have.property('random_bytes');
    expect(randomBytes?.data.random_bytes).to.have.length(64); // 32 bytes = 64 hex chars
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
      expectType<undefined>(hashResult);
      return;
    }

    expectType<undefined>(error);
    expect(hashResult).have.property('data');
    expect(hashResult?.data).have.property('sum');
    expect(hashResult?.data.sum).to.be.a('string');
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

    expect(hmacError).be.undefined;
    expect(hmacResult).have.property('data');
    expect(hmacResult?.data).have.property('hmac');

    // Verify HMAC
    const { data: verifyResult, error: verifyError } = await vc.transit.verifyHmac({
      mountPath,
      name: 'test-key',
      algorithm: 'sha2-256',
      input,
      hmac: hmacResult?.data.hmac || ''
    });

    expect(verifyError).be.undefined;
    expect(verifyResult).have.property('data');
    expect(verifyResult?.data).have.property('valid', true);
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

    expect(signError).be.undefined;
    expect(signResult).have.property('data');
    expect(signResult?.data).have.property('signature');

    // Verify
    const { data: verifyResult, error: verifyError } = await vc.transit.verify({
      mountPath,
      name: 'test-key',
      algorithm: 'ed25519',
      input,
      signature: signResult?.data.signature || ''
    });

    if (verifyError) {
      expectType<undefined>(verifyResult);
      return;
    }

    expectType<undefined>(verifyError);
    expect(verifyResult).have.property('data');
    expect(verifyResult?.data).have.property('valid', true);
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
      expectType<undefined>(initialInfo);
      return;
    }

    const initialVersion = initialInfo?.data.latest_version || 0;

    // Rotate key
    const rotated = await vc.transit.rotateKey({
      mountPath,
      name: 'test-key'
    });

    expect(rotated?.data?.data).have.property('latest_version', 2);

    // Verify version increased
    const { data: rotatedInfo, error: rotatedError } = await vc.transit.readKey({
      mountPath,
      name: 'test-key'
    });

    if (rotatedError) {
      expectType<undefined>(rotatedInfo);
      return;
    }

    expect(rotatedInfo?.data.latest_version).to.be.greaterThan(initialVersion);
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
      expectType<undefined>(exportResult);
      return;
    }

    expectType<undefined>(error);
    expect(exportResult).have.property('data');
    expect(exportResult?.data).have.property('name', 'test-key');
    expect(exportResult?.data).have.property('type', 'aes256-gcm96');
    expect(exportResult?.data).have.property('keys');
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
      expectType<undefined>(backupResult);
      return;
    }

    expectType<undefined>(backupError);
    expect(backupResult).have.property('data');
    expect(backupResult?.data).have.property('backup');

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

    expect(restored).have.property('data').be.true;

    // Verify key exists
    const { data: keyInfo } = await vc.transit.readKey({
      mountPath,
      name: 'test-key'
    });

    expect(keyInfo?.data).have.property('type', 'aes256-gcm96');
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
      expectType<undefined>(trimmed);
      return;
    }

    expectType<undefined>(trimError);
    expect(trimmed).be.true;
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
      expectType<undefined>(deleted);
      return;
    }

    expectType<undefined>(deleteError);
    expect(deleted).be.true;

    // Verify key is deleted
    const { error } = await vc.transit.readKey({
      mountPath,
      name: 'test-key'
    });

    expect(error).to.exist;
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

    expect(batchEncryptError).be.undefined;
    expect(batchEncryptResult).have.property('data');
    expect(batchEncryptResult?.data).have.property('batch_results');
    expect(batchEncryptResult?.data.batch_results).to.have.length(2);

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

    expect(batchDecryptError).be.undefined;
    expect(batchDecryptResult).have.property('data');
    expect(batchDecryptResult?.data).have.property('batch_results');
    expect(batchDecryptResult?.data.batch_results).to.have.length(2);
    expect(batchDecryptResult?.data.batch_results![0]?.plaintext).to.equal(plaintext1);
    expect(batchDecryptResult?.data.batch_results![1]?.plaintext).to.equal(plaintext2);
  });
});
