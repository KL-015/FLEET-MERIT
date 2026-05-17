let _db = null;
let _session = null;
let _isEncoder = false;
let _isAdmin = false;

function getDB() {
  if (!_db) _db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _db;
}

async function initAuth() {
  const db = getDB();
  const { data: { session } } = await db.auth.getSession();
  _session = session;
  if (!session) return { session: null, isAdmin: false, isEncoder: false };
  const email = session.user.email.toLowerCase();
  const [{ data: enc }, { data: adm }] = await Promise.all([
    db.from('allowed_encoders').select('email').eq('email', email).maybeSingle(),
    db.from('allowed_admins').select('email').eq('email', email).maybeSingle()
  ]);
  _isEncoder = !!enc || !!adm;
  _isAdmin = !!adm;
  return { session, isAdmin: _isAdmin, isEncoder: _isEncoder };
}

async function signInWithGoogle() {
  const db = getDB();
  const redirectUrl = window.location.origin + window.location.pathname;
  await db.auth.signInWithOAuth({ 
    provider: 'google', 
    options: { redirectTo: redirectUrl } 
  });
}

async function signOut() {
  await getDB().auth.signOut();
  window.location.href = '/index.html';
}

function currentUser() { return _session?.user || null; }
function isAdmin() { return _isAdmin; }
function isEncoder() { return _isEncoder; }
