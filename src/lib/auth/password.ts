import argon2 from 'argon2';

const OPTIONS = { type: argon2.argon2id, memoryCost: 2 ** 16, timeCost: 3, parallelism: 1 };

export const hashPassword = (plain: string) => argon2.hash(plain, OPTIONS);
export const verifyPassword = (hash: string, plain: string) => argon2.verify(hash, plain);
