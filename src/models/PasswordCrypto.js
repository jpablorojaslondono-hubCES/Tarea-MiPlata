const ITERATIONS = 210000;

function toHex(bytes) {
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function fromHex(value) {
  if (typeof value !== 'string' || !/^(?:[\da-f]{2})+$/i.test(value)) {
    throw new Error('Stored password data is invalid.');
  }
  return Uint8Array.from(value.match(/.{2}/g), byte => Number.parseInt(byte, 16));
}

async function deriveHash(password, salt) {
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  return new Uint8Array(await globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
    key,
    256
  ));
}

export async function hashPassword(password) {
  if (!globalThis.crypto?.subtle) throw new Error('Secure password hashing is not available in this browser.');
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return { salt: toHex(salt), hash: toHex(await deriveHash(password, salt)) };
}

export async function verifyPassword(password, record) {
  if (!globalThis.crypto?.subtle) throw new Error('Secure password hashing is not available in this browser.');
  const expected = fromHex(record.hash);
  const actual = await deriveHash(password, fromHex(record.salt));
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index++) difference |= actual[index] ^ expected[index];
  return difference === 0;
}