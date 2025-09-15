# Transit Secrets Engine

The Transit Secrets Engine provides cryptographic operations as a service, allowing you to encrypt, decrypt, sign, verify, and generate data keys without exposing the underlying cryptographic keys to your application.

### Key Management

- **Create Keys**: Generate encryption keys with various algorithms
- **Read Key Configuration**: Retrieve key metadata and configuration
- **Update Key Configuration**: Modify key settings like rotation periods
- **List Keys**: Get all keys in the transit engine
- **Delete Keys**: Remove keys (when deletion is allowed)
- **Rotate Keys**: Generate new key versions
- **Export Keys**: Export keys for backup (when exportable)
- **Backup/Restore Keys**: Create and restore key backups

### Cryptographic Operations

- **Encrypt/Decrypt**: Symmetric encryption and decryption
- **Rewrap**: Re-encrypt data with a new key version
- **Sign/Verify**: Digital signatures with various algorithms
- **HMAC Generation/Verification**: Hash-based message authentication
- **Data Key Generation**: Generate wrapped or plaintext data keys
- **Random Generation**: Generate cryptographically secure random bytes
- **Hashing**: Generate hashes with various algorithms

### Advanced Features

- **Batch Operations**: Process multiple items in a single request
- **Key Trimming**: Remove old key versions to save space
- **Convergent Encryption**: Enable deterministic encryption
- **Key Derivation**: Enable key derivation for context-based encryption

## Supported Key Types

### Symmetric Keys

- `aes256-gcm96` - AES-256 in GCM mode with 96-bit IV
- `chacha20-poly1305` - ChaCha20-Poly1305 AEAD

### Asymmetric Keys

- `ed25519` - Ed25519 digital signature algorithm
- `ecdsa-p256` - ECDSA with P-256 curve
- `ecdsa-p384` - ECDSA with P-384 curve
- `ecdsa-p521` - ECDSA with P-521 curve
- `rsa-2048` - RSA with 2048-bit keys
- `rsa-3072` - RSA with 3072-bit keys
- `rsa-4096` - RSA with 4096-bit keys

## Quick Start

### Enable Transit Engine

```typescript
await vc.transit.enable({
  mountPath: 'transit',
  type: 'transit',
  description: 'Transit secrets engine'
});
```

### Create Key

```typescript
await vc.transit.createKey({
  mountPath: 'transit',
  name: 'my-key',
  type: 'aes256-gcm96',
  exportable: true,
  allow_plaintext_backup: true,
  deletion_allowed: true
});
```

### Encrypt/Decrypt Data

```typescript
// Encrypt
const plaintext = Buffer.from('Hello World').toString('base64');
const { data: encrypted } = await vc.transit.encrypt({
  mountPath: 'transit',
  name: 'my-key',
  plaintext
});

// Decrypt
const { data: decrypted } = await vc.transit.decrypt({
  mountPath: 'transit',
  name: 'my-key',
  ciphertext: encrypted.ciphertext
});

const originalData = Buffer.from(decrypted.plaintext, 'base64').toString();
```

### Sign/Verify Data

```typescript
// Sign
const input = Buffer.from('Hello World').toString('base64');
const { data: signed } = await vc.transit.sign({
  mountPath: 'transit',
  name: 'my-key',
  input
});

// Verify
const { data: verified } = await vc.transit.verify({
  mountPath: 'transit',
  name: 'my-key',
  algorithm: 'ed25519',
  input,
  signature: signed.signature
});
```

### Key Management

#### Create Key

```typescript
await vc.transit.createKey({
  mountPath: 'transit',
  name: 'my-key',
  type: 'aes256-gcm96',
  exportable: true,
  allow_plaintext_backup: true,
  deletion_allowed: true
});
```

#### Read Key Configuration

```typescript
const { data: keyInfo, error } = await vc.transit.readKey({
  mountPath: 'transit',
  name: 'my-key'
});
```

#### Update Key Configuration

```typescript
await vc.transit.updateKey({
  mountPath: 'transit',
  name: 'my-key',
  min_decryption_version: 1,
  min_encryption_version: 1,
  deletion_allowed: true,
  auto_rotate_period: '24h'
});
```

#### Rotate Key

```typescript
await vc.transit.rotateKey({
  mountPath: 'transit',
  name: 'my-key'
});
```

### Encryption Operations

#### Encrypt Data

```typescript
const { data: result, error } = await vc.transit.encrypt({
  mountPath: 'transit',
  name: 'my-key',
  plaintext: Buffer.from('Hello World').toString('base64')
});
```

#### Decrypt Data

```typescript
const { data: result, error } = await vc.transit.decrypt({
  mountPath: 'transit',
  name: 'my-key',
  ciphertext: result.data.ciphertext
});
```

#### Batch Encrypt

```typescript
const { data: result, error } = await vc.transit.encrypt({
  mountPath: 'transit',
  name: 'my-key',
  plaintext: '', // Required for single operation
  batch_input: [
    { plaintext: Buffer.from('Message 1').toString('base64') },
    { plaintext: Buffer.from('Message 2').toString('base64') }
  ]
});
```

### Digital Signatures

#### Sign Data

```typescript
const { data: result, error } = await vc.transit.sign({
  mountPath: 'transit',
  name: 'my-key',
  input: Buffer.from('Hello World').toString('base64')
});
```

#### Verify Signature

```typescript
const { data: result, error } = await vc.transit.verify({
  mountPath: 'transit',
  name: 'my-key',
  algorithm: 'ed25519',
  input: Buffer.from('Hello World').toString('base64'),
  signature: result.data.signature
});
```

### HMAC Operations

#### Generate HMAC

```typescript
const { data: result, error } = await vc.transit.hmac({
  mountPath: 'transit',
  name: 'my-key',
  input: Buffer.from('Hello World').toString('base64'),
  algorithm: 'sha2-256'
});
```

#### Verify HMAC

```typescript
const { data: result, error } = await vc.transit.verifyHmac({
  mountPath: 'transit',
  name: 'my-key',
  algorithm: 'sha2-256',
  input: Buffer.from('Hello World').toString('base64'),
  hmac: result.data.hmac
});
```

### Data Key Generation

#### Generate Wrapped Data Key

```typescript
const { data: result, error } = await vc.transit.generateDataKey({
  mountPath: 'transit',
  name: 'my-key',
  type: 'wrapped',
  bits: 256
});
```

#### Generate Plaintext Data Key

```typescript
const { data: result, error } = await vc.transit.generateDataKey({
  mountPath: 'transit',
  name: 'my-key',
  type: 'plaintext',
  bits: 256
});
```

### Utility Operations

#### Generate Random Bytes

```typescript
const { data: result, error } = await vc.transit.generateRandom({
  mountPath: 'transit',
  source: 'platform',
  bytes: 32,
  format: 'hex'
});
```

#### Hash Data

```typescript
const { data: result, error } = await vc.transit.hash({
  mountPath: 'transit',
  algorithm: 'sha2-256',
  input: Buffer.from('Hello World').toString('base64'),
  format: 'hex'
});
```

### Key Export and Backup

#### Export Key

```typescript
const { data: result, error } = await vc.transit.exportKey({
  mountPath: 'transit',
  name: 'my-key',
  type: 'encryption-key'
});
```

#### Backup Key

```typescript
const { data: result, error } = await vc.transit.backupKey({
  mountPath: 'transit',
  name: 'my-key'
});
```

#### Restore Key

```typescript
await vc.transit.restoreKey({
  mountPath: 'transit',
  name: 'my-key',
  backup: result.data.backup
});
```

### Advanced Operations

#### Trim Key Versions

```typescript
await vc.transit.trimKey({
  mountPath: 'transit',
  name: 'my-key',
  min_available_version: 2
});
```

## Configuration Options

### Key Creation Options

- `type`: Key algorithm type
- `exportable`: Allow key export (default: false)
- `allow_plaintext_backup`: Allow plaintext backup (default: false)
- `deletion_allowed`: Allow key deletion (default: false)
- `convergent_encryption`: Enable convergent encryption (default: false)
- `derived`: Enable key derivation (default: false)
- `auto_rotate_period`: Automatic rotation period

### Key Update Options

- `min_decryption_version`: Minimum version for decryption
- `min_encryption_version`: Minimum version for encryption
- `deletion_allowed`: Allow key deletion
- `exportable`: Allow key export
- `allow_plaintext_backup`: Allow plaintext backup
- `auto_rotate_period`: Automatic rotation period

## Security Considerations

1. **Key Rotation**: Regularly rotate keys to limit exposure
2. **Access Control**: Use Vault policies to control access to transit operations
3. **Audit Logging**: Enable audit logging for all transit operations
4. **Key Export**: Only enable key export when necessary
5. **Backup Security**: Secure key backups with proper encryption
6. **Version Management**: Use appropriate minimum versions for encryption/decryption

## Performance Tips

1. **Batch Operations**: Use batch operations for multiple items
2. **Key Caching**: Vault caches keys for better performance
3. **Connection Pooling**: Reuse client connections
4. **Async Operations**: Use async/await for non-blocking operations

## Complete Workflow Example

```typescript
async function transitWorkflow() {
  try {
    // 1. Enable transit engine
    await vc.transit.enable({
      mountPath: 'transit',
      type: 'transit',
      description: 'My transit engine'
    });

    // 2. Create a key
    await vc.transit.createKey({
      mountPath: 'transit',
      name: 'my-key',
      type: 'aes256-gcm96',
      exportable: true
    });

    // 3. Encrypt some data
    const plaintext = Buffer.from('Sensitive data').toString('base64');
    const { data: encrypted } = await vc.transit.encrypt({
      mountPath: 'transit',
      name: 'my-key',
      plaintext
    });

    console.log('Encrypted:', encrypted.ciphertext);

    // 4. Decrypt the data
    const { data: decrypted } = await vc.transit.decrypt({
      mountPath: 'transit',
      name: 'my-key',
      ciphertext: encrypted.ciphertext
    });

    const originalData = Buffer.from(decrypted.plaintext, 'base64').toString();
    console.log('Decrypted:', originalData);

    // 5. Rotate the key
    await vc.transit.rotateKey({
      mountPath: 'transit',
      name: 'my-key'
    });

    console.log('Key rotated successfully');
  } catch (error) {
    console.error('Transit workflow failed:', error);
  }
}
```

## Reference

- [Vault Transit API Documentation](https://developer.hashicorp.com/vault/api-docs/secret/transit)
