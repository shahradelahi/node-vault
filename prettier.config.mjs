import DEFAULT_CONFIG from '@shahrad/prettier-config';

/** @type {import('prettier').Config} */
const config = Object.assign(DEFAULT_CONFIG, {
  trailingComma: 'none'
});

export default config;
