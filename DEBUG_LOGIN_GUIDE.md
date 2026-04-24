## Supabase Integration - Debugging Guide

### ✓ Fixed Issues

#### 1. **Environment Variables Configuration**
**Problem**: Frontend `.env` had wrong key format
- Was using `SUPABASE_SERVICE_ROLE_KEY` instead of `VITE_SUPABASE_ANON_KEY`
- Missing `VITE_` prefix (required for Vite to expose vars to frontend)

**Solution**: Updated both `.env` files:
```
Backend (.env):
- SUPABASE_URL: ✓ Correct
- SUPABASE_SERVICE_ROLE_KEY: ✓ Updated with correct service role key
- PORT: ✓ Added 5001

Frontend (.env):
- VITE_SUPABASE_URL: ✓ Corrected with prefix
- VITE_SUPABASE_ANON_KEY: ✓ Updated with correct anon key
```

#### 2. **Supabase Connection Status**
```
[Supabase Init] URL: ✓ Set
[Supabase Init] Service Role Key: ✓ Set  
[Supabase Init] Client initialized successfully ✓
✓ Server is running on PORT:5001
✓ Database: Supabase (connected)
```

---

### 🔍 To Debug Login 400 Error

Now that Supabase is connected, the issue is likely one of these:

#### **Case 1: Profile Table Doesn't Exist**
- Login flow tries to fetch from `profiles` table after auth
- Error: Profile table missing

**Solution**: Create these tables in Supabase SQL Editor:

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  profile_pic TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT profiles_id_key UNIQUE (id)
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
```

#### **Case 2: Credentials Still Invalid**
- Backend logs will show: `[Login] Auth error: invalid_grant - Invalid login credentials`

**Check**: 
1. Verify the email/password you're testing with exists in Supabase Auth
2. Try creating a new account via signup first

---

### 📋 What to Check If Login Still Returns 400

The backend now logs every step:

**Check terminal output for:**
1. `[Login] Attempting login for email: ...` - Login attempt received
2. `[Login] Auth error: ...` - Supabase auth failed
3. `[Login] Auth successful, fetching profile` - Auth ok, profile issue
4. `[Login] Profile fetch error: ...` - Table/data missing

---

### ✅ Next Steps

1. **Create the tables** (see Case 1 SQL above)
2. **Try signing up first** to create a test user with profile
3. **Check backend logs** for exact error message
4. **Try login** - watch the [Login] logs in terminal

If you still get 400 after tables are created, share the exact log output and I'll debug further.
