const SUPABASE_URL = 'https://hvwpdiyrqonuaomwkuxk.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2d3BkaXlycW9udWFvbXdrdXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzc5MDMsImV4cCI6MjA3NDk1MzkwM30.3YodCDzx5rrXk4Xky1hsvKJ3P--Fez4H1lO2-JJGMfM';

// Get auth token from localStorage (simulated)
const authToken = 'YOUR_AUTH_TOKEN_HERE';

fetch(`${SUPABASE_URL}/functions/v1/admin-get-users`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
    'apikey': ANON_KEY
  },
  body: JSON.stringify({})
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
