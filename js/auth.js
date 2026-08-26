let _db = null;
let _session = null;
let _isEncoder = false;
let _isAdmin = false;

function getDB() {
  if (!_db) _db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _db;
}

// Check if running inside an iframe (like AI Studio preview)
function isInIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

// Open the current page in a standalone desktop browser tab
function openInDesktopTab() {
  window.open(window.location.href, '_blank');
}

// Handle OAuth callback inside popup window
(function handleOAuthPopupCallback() {
  if (window.opener && window.opener !== window) {
    // If this window is a popup and contains auth tokens in hash or code
    if (window.location.hash.includes('access_token=') || window.location.search.includes('code=')) {
      setTimeout(() => {
        try {
          window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
        } catch (e) {}
        window.close();
      }, 800);
    }
  }
})();

// Listen for cross-window auth completion
if (typeof window !== 'undefined') {
  window.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'SUPABASE_AUTH_SUCCESS') {
      await initAuth();
      if (typeof boot === 'function') {
        boot();
      } else {
        window.location.reload();
      }
    }
  });
}

async function initAuth() {
  const db = getDB();
  
  // 1. Check Supabase session
  const { data: { session } } = await db.auth.getSession();
  _session = session;

  let email = session?.user?.email?.toLowerCase() || '';

  // 2. Fallback to authorized local session if signed in via authorized email
  if (!email) {
    try {
      const stored = localStorage.getItem('fleet_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          email = parsed.email.toLowerCase();
          _session = { user: { email: email, id: parsed.id || email } };
        }
      }
    } catch (e) {}
  }

  if (!email) {
    _isAdmin = false;
    _isEncoder = false;
    return { session: null, isAdmin: false, isEncoder: false };
  }

  try {
    const [{ data: enc }, { data: adm }] = await Promise.all([
      db.from('allowed_encoders').select('email').eq('email', email).maybeSingle(),
      db.from('allowed_admins').select('email').eq('email', email).maybeSingle()
    ]);
    _isEncoder = !!enc || !!adm;
    _isAdmin = !!adm;

    // If local email is no longer in allowed list, clear it
    if (!_isEncoder && !_isAdmin && !_session?.access_token) {
      localStorage.removeItem('fleet_auth_user');
      _session = null;
      return { session: null, isAdmin: false, isEncoder: false };
    }

    return { session: _session, isAdmin: _isAdmin, isEncoder: _isEncoder, email: email };
  } catch (err) {
    console.error('Error verifying auth permissions:', err);
    return { session: _session, isAdmin: _isAdmin, isEncoder: _isEncoder, email: email };
  }
}

async function signInWithGoogle() {
  const db = getDB();
  const redirectUrl = window.location.origin + window.location.pathname;

  try {
    // If in iframe, we MUST use popup with skipBrowserRedirect to avoid X-Frame-Options blocks
    const { data, error } = await db.auth.signInWithOAuth({ 
      provider: 'google', 
      options: { 
        redirectTo: redirectUrl,
        skipBrowserRedirect: true
      } 
    });

    if (error) {
      console.warn('OAuth initialization failed, trying direct redirect:', error);
      // Fallback
      await db.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl }
      });
      return;
    }

    if (data?.url) {
      const width = 540, height = 680;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(
        data.url,
        'supabase_google_auth',
        `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Popup blocked: open in new tab
        window.open(data.url, '_blank');
      } else {
        // Poll popup state
        const checkTimer = setInterval(async () => {
          if (popup.closed) {
            clearInterval(checkTimer);
            const { session } = await initAuth();
            if (session) {
              if (typeof boot === 'function') boot();
              else window.location.reload();
            }
          }
        }, 1000);
      }
    }
  } catch (err) {
    console.error('Sign in error:', err);
    alert('Could not start Google Sign-In: ' + (err.message || err));
  }
}

// Fast and reliable direct login for verified admin / encoder emails
async function signInWithAuthorizedEmail(inputEmail) {
  const email = (inputEmail || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const db = getDB();
  try {
    const [{ data: enc }, { data: adm }] = await Promise.all([
      db.from('allowed_encoders').select('email').eq('email', email).maybeSingle(),
      db.from('allowed_admins').select('email').eq('email', email).maybeSingle()
    ]);

    if (!enc && !adm) {
      return { 
        success: false, 
        error: 'Access Denied: Email "' + email + '" is not registered in the Allowed Admins or Allowed Encoders database.' 
      };
    }

    // Save authorized user session
    const userObj = {
      email: email,
      role: adm ? 'admin' : 'encoder',
      loggedInAt: new Date().toISOString()
    };
    localStorage.setItem('fleet_auth_user', JSON.stringify(userObj));
    _session = { user: { email: email, id: email } };
    _isAdmin = !!adm;
    _isEncoder = true;

    return { success: true, isAdmin: _isAdmin, isEncoder: _isEncoder, email: email };
  } catch (err) {
    console.error('Email verification error:', err);
    return { success: false, error: 'Database connection failed. Please try again.' };
  }
}

async function signOut() {
  try {
    localStorage.removeItem('fleet_auth_user');
    await getDB().auth.signOut();
  } catch (e) {}
  window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
}

function currentUser() { return _session?.user || null; }
function isAdmin() { return _isAdmin; }
function isEncoder() { return _isEncoder; }
