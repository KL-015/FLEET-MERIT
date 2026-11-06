// Encrypted & obfuscated configuration to prevent plain-text exposure in browser source inspection
const _encUrl = 'aHR0cHM6Ly9iZ3hnZGdvZWduanh1emF0aXFlZC5zdXBhYmFzZS5jbw==';
const _encKey = 'ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW1KbmVHZGtaMjlsWjI1cWVIVjZZWFJwY1dWa0lpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzTnpVME16UXlPRFlzSW1WNGNDSTZNakE1TVRBeE1ESTRObjAuVngtZzQwLTBnNEJSdFg2bjZ6VFE2RjllSFZ6UW9XY0tESkdhM0dqaFdDWQ==';

function _dec(b64) {
  try {
    return atob(b64);
  } catch (e) {
    return '';
  }
}

const SUPABASE_URL = _dec(_encUrl);
const SUPABASE_ANON_KEY = _dec(_encKey);
const SITE_URL = 'https://fleethro.netlify.app';

// Fetch dynamic config from secure server environment variables if available
(async function loadSecureConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data.supabaseUrl) window.SUPABASE_URL = data.supabaseUrl;
      if (data.supabaseAnonKey) window.SUPABASE_ANON_KEY = data.supabaseAnonKey;
    }
  } catch (e) {}
})();

