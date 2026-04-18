const path = require('path');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
}

const config = require('../config/runtime');

function mask_url_credentials(url) {
  try {
    const parsed = new URL(url);

    if (parsed.username)
      parsed.username = '***';

    if (parsed.password)
      parsed.password = '***';

    return parsed.toString();
  } catch (error) {
    return url;
  }
}

module.exports = {
  config,
  mask_url_credentials
};
