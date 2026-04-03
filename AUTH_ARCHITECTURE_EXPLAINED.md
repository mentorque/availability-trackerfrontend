# Authentication Architecture - Complete Explanation# Authentication Architecture - Complete Explanation



## 🎯 High-Level Overview## 🎯 High-Level Overview



The authentication system works in layers:The authentication system works in layers:



``````

┌─────────────────────────────────────────────────────────────────┐┌─────────────────────────────────────────────────────────────────┐

│                         BROWSER                                  ││                         BROWSER                                  │

├─────────────────────────────────────────────────────────────────┤├─────────────────────────────────────────────────────────────────┤

│  Layer 1: Routes (App.jsx)                                      ││  Layer 1: Routes (App.jsx)                                      │

│  ├─ Public: /login, /register                                   ││  ├─ Public: /login, /register                                   │

│  └─ Protected: /user/*, /mentor/*, /admin/*                     ││  └─ Protected: /user/*, /mentor/*, /admin/*                     │

│       └─ ProtectedRoute checks: auth state + role               ││       └─ ProtectedRoute checks: auth state + role               │

├─────────────────────────────────────────────────────────────────┤├─────────────────────────────────────────────────────────────────┤

│  Layer 2: Auth Context (AuthContext.jsx)                        ││  Layer 2: Auth Context (AuthContext.jsx)                        │

│  ├─ Stores: user object, loading state, token                   ││  ├─ Stores: user object, loading state, token                   │

│  ├─ Methods: login(), register(), logout(), refreshUser()       ││  ├─ Methods: login(), register(), logout(), refreshUser()       │

│  └─ Uses: localStorage for persistence                          ││  └─ Uses: localStorage for persistence                          │

├─────────────────────────────────────────────────────────────────┤├─────────────────────────────────────────────────────────────────┤

│  Layer 3: API Layer (api/auth.js + api/client.js)              ││  Layer 3: API Layer (api/auth.js + api/client.js)              │

│  ├─ login() → POST /api/auth/login                              ││  ├─ login() → POST /api/auth/login                              │

│  ├─ register() → POST /api/auth/register                        ││  ├─ register() → POST /api/auth/register                        │

│  ├─ me() → GET /api/auth/me                                     ││  ├─ me() → GET /api/auth/me                                     │

│  └─ All requests include: Authorization: Bearer <token>         ││  └─ All requests include: Authorization: Bearer <token>         │

├─────────────────────────────────────────────────────────────────┤├─────────────────────────────────────────────────────────────────┤

│  Layer 4: HTTP Client (api/client.js)                           ││  Layer 4: HTTP Client (api/client.js)                           │

│  ├─ Adds JWT token from localStorage to headers                 ││  ├─ Adds JWT token from localStorage to headers                 │

│  ├─ Handles 401/403 errors                                      ││  ├─ Handles 401/403 errors                                      │

│  └─ Uses skipAuthRedirect option for login/register             ││  └─ Uses skipAuthRedirect option for login/register             │

├─────────────────────────────────────────────────────────────────┤├─────────────────────────────────────────────────────────────────┤

│  Storage: localStorage                                           ││  Storage: localStorage                                           │

│  ├─ token: JWT token (sent with every API call)                ││  ├─ token: JWT token (sent with every API call)                │

│  └─ userEmail: User's email (for reference)                     ││  └─ userEmail: User's email (for reference)                     │

└─────────────────────────────────────────────────────────────────┘└─────────────────────────────────────────────────────────────────┘

``````



------



## 📊 Authentication Flow## 📊 Authentication Flow



### 1️⃣ **Initial App Load**### 1️⃣ **Initial App Load**



``````

App mountsApp mounts

  ↓  ↓

AuthProvider rendersAuthProvider renders

  ↓  ↓

useEffect in AuthProvider → calls loadUser()useEffect in AuthProvider → calls loadUser()

  ↓  ↓

loadUser() checks localStorage for tokenloadUser() checks localStorage for token

  ↓  ↓

  If token exists:  If token exists:

    ├─ Calls GET /api/auth/me with token    ├─ Calls GET /api/auth/me with token

    ├─ If success: Sets user state    ├─ If success: Sets user state

    └─ If fail: Clears token and redirects    └─ If fail: Clears token and redirects

    

  If no token:  If no token:

    └─ Sets user = null, loading = false    └─ Sets user = null, loading = false

  ↓  ↓

App routes render based on user stateApp routes render based on user state

``````



### 2️⃣ **Login Flow**### 2️⃣ **Login Flow**



``````

User enters email/password on /login pageUser enters email/password on /login page

  ↓  ↓

User clicks "Sign In"User clicks "Sign In"

  ↓  ↓

handleSubmit() in Login.jsxhandleSubmit() in Login.jsx

  ↓  ↓

Calls useAuth().login(email, password)Calls useAuth().login(email, password)

  ↓  ↓

AuthContext.login()AuthContext.login()

  ├─ Calls authApi.login({ email, password })  ├─ Calls authApi.login({ email, password })

  ├─ authApi.login() does: POST /api/auth/login  ├─ authApi.login() does: POST /api/auth/login

  ├─ client.js adds: Authorization header (empty, no token yet)  ├─ client.js adds: Authorization header (empty, no token yet)

  ↓  ↓

Backend validates credentialsBackend validates credentials

  ↓  ↓

  If valid:  If valid:

    ├─ Backend returns: { user: {...}, token: "jwt..." }    ├─ Backend returns: { user: {...}, token: "jwt..." }

    ├─ AuthContext stores token in localStorage    ├─ AuthContext stores token in localStorage

    ├─ AuthContext stores userEmail in localStorage    ├─ AuthContext stores userEmail in localStorage

    ├─ AuthContext sets user state    ├─ AuthContext sets user state

    ├─ handleSubmit() navigates to dashboard based on role    ├─ handleSubmit() navigates to dashboard based on role

    └─ ✅ User logged in    └─ ✅ User logged in

    

  If invalid:  If invalid:

    ├─ Backend returns: 401 error    ├─ Backend returns: 401 error

    ├─ client.js throws error (skipAuthRedirect: true)    ├─ client.js throws error (skipAuthRedirect: true)

    ├─ handleSubmit() catches error    ├─ handleSubmit() catches error

    ├─ handleSubmit() displays error message    ├─ handleSubmit() displays error message

    └─ User stays on login page, can retry    └─ User stays on login page, can retry

``````



### 3️⃣ **Protected Route Access**### 3️⃣ **Protected Route Access**



``````

User navigates to /admin (requires ADMIN role)User navigates to /admin (requires ADMIN role)

  ↓  ↓

ProtectedRoute component checks:ProtectedRoute component checks:

    

  1. Is loading?   1. Is loading? 

     → Show LoadingScreen (white page)     → Show LoadingScreen (white page)

    

  2. Is user = null?  2. Is user = null?

     → Navigate to /login     → Navigate to /login

    

  3. Does user.role in allowedRoles?  3. Does user.role in allowedRoles?

     ├─ YES: Render route component (AdminDashboard)     ├─ YES: Render route component (AdminDashboard)

     └─ NO: Navigate to fallback path (/login)     └─ NO: Navigate to fallback path (/login)

  ↓  ↓

If authorized, component renders with LayoutIf authorized, component renders with Layout

  └─ Layout includes: Header, Navigation, Footer  └─ Layout includes: Header, Navigation, Footer

``````



### 4️⃣ **Protected API Call**### 4️⃣ **Protected API Call**



``````

User makes API call from protected pageUser makes API call from protected page

  ├─ Example: GET /api/admin/users  ├─ Example: GET /api/admin/users

  ↓  ↓

client.js intercepts requestclient.js intercepts request

  ├─ Gets token from localStorage  ├─ Gets token from localStorage

  ├─ Adds: Authorization: Bearer <token>  ├─ Adds: Authorization: Bearer <token>

  ↓  ↓

Backend validates tokenBackend validates token

  ↓  ↓

  If valid:  If valid:

    ├─ Executes API call    ├─ Executes API call

    ├─ Returns success response    ├─ Returns success response

    └─ ✅ Data displayed    └─ ✅ Data displayed

    

  If invalid (401):  If invalid (401):

    ├─ Backend returns: 401 Unauthorized    ├─ Backend returns: 401 Unauthorized

    ├─ client.js catches 401    ├─ client.js catches 401

    ├─ skipAuthRedirect is false (default)    ├─ skipAuthRedirect is false (default)

    ├─ client.js calls clearAuthAndRedirectToLogin()    ├─ client.js calls clearAuthAndRedirectToLogin()

    ├─ localStorage cleared    ├─ localStorage cleared

    ├─ window.location.href = "/login?expired=1"    ├─ window.location.href = "/login?expired=1"

    └─ Page reloads to login with "expired" message    └─ Page reloads to login with "expired" message

``````



### 5️⃣ **Logout Flow**### 5️⃣ **Logout Flow**



``````

User clicks "Logout" buttonUser clicks "Logout" button

  ↓  ↓

handleLogout() in Layout.jsxhandleLogout() in Layout.jsx

  ↓  ↓

Calls useAuth().logout()Calls useAuth().logout()

  ↓  ↓

AuthContext.logout()AuthContext.logout()

  ├─ Clears localStorage token  ├─ Clears localStorage token

  ├─ Clears localStorage userEmail  ├─ Clears localStorage userEmail

  ├─ Sets user = null  ├─ Sets user = null

  ↓  ↓

useAuth() context listeners updateuseAuth() context listeners update

  ↓  ↓

Components re-render with user = nullComponents re-render with user = null

  ↓  ↓

ProtectedRoute sees user = nullProtectedRoute sees user = null

  ↓  ↓

Navigates to /loginNavigates to /login

  ↓  ↓

✅ User logged out✅ User logged out

``````



------



## 🔑 Key Components Explained## 🔑 Key Components Explained



### **1. AuthContext.jsx** (State Management)### **1. AuthContext.jsx** (State Management)



```javascript```javascript

// State// State

const [user, setUser] = useState(null);        // Current logged-in userconst [user, setUser] = useState(null);        // Current logged-in user

const [loading, setLoading] = useState(true);  // Loading during auth checkconst [loading, setLoading] = useState(true);  // Loading during auth check



// On mount: Validate token from localStorage// On mount: Validate token from localStorage

useEffect(() => {useEffect(() => {

  loadUser();  // Checks if stored token is still valid  loadUser();  // Checks if stored token is still valid

}, []);}, []);



// Methods provided to entire app// Methods provided to entire app

{{

  user,           // Current user object or null  user,           // Current user object or null

  loading,        // Is auth check in progress?  loading,        // Is auth check in progress?

  login,          // (email, password) → logs user in  login,          // (email, password) → logs user in

  register,       // (data) → creates account and logs in  register,       // (data) → creates account and logs in

  logout,         // () → clears everything  logout,         // () → clears everything

  refreshUser     // () → re-validates token  refreshUser     // () → re-validates token

}}

``````



### **2. ProtectedRoute Component** (Access Control)### **2. ProtectedRoute Component** (Access Control)



```javascript```javascript

function ProtectedRoute({ children, allowedRoles = [] }) {function ProtectedRoute({ children, allowedRoles = [] }) {

  const { user, loading } = useAuth();  const { user, loading } = useAuth();

    

  // Step 1: Show loading while checking auth  // Step 1: Show loading while checking auth

  if (loading) return <LoadingScreen />;  if (loading) return <LoadingScreen />;

    

  // Step 2: Redirect if not logged in  // Step 2: Redirect if not logged in

  if (!user) return <Navigate to="/login" />;  if (!user) return <Navigate to="/login" />;

    

  // Step 3: Check if user has required role  // Step 3: Check if user has required role

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {

    return <Navigate to="/login" />;    return <Navigate to="/login" />;

  }  }

    

  // Step 4: User is authorized  // Step 4: User is authorized

  return children;  return children;

}}

``````



### **3. HTTP Client** (Request Handling)### **3. HTTP Client** (Request Handling)



```javascript```javascript

export async function api(method, path, body, options = {}) {export async function api(method, path, body, options = {}) {

  // Add token to every request  // Add token to every request

  const token = localStorage.getItem("token");  const token = localStorage.getItem("token");

  if (token) {  if (token) {

    headers.Authorization = `Bearer ${token}`;    headers.Authorization = `Bearer ${token}`;

  }  }

    

  // Make request  // Make request

  const res = await fetch(url, { method, headers, body, ... });  const res = await fetch(url, { method, headers, body, ... });

    

  // Handle errors  // Handle errors

  if (!res.ok) {  if (!res.ok) {

    if (res.status === 401) {    if (res.status === 401) {

      // Two scenarios:      // Two scenarios:

      if (!options.skipAuthRedirect) {      if (!options.skipAuthRedirect) {

        // Case 1: Protected API call with expired token        // Case 1: Protected API call with expired token

        // → Clear auth and redirect to login        // → Clear auth and redirect to login

        clearAuthAndRedirectToLogin();        clearAuthAndRedirectToLogin();

      } else {      } else {

        // Case 2: Login/Register call with invalid credentials        // Case 2: Login/Register call with invalid credentials

        // → Just throw error, let component handle it        // → Just throw error, let component handle it

        throw error;        throw error;

      }      }

    }    }

  }  }

    

  return data;  return data;

}}

``````



### **4. API Wrapper** (Endpoints)### **4. API Wrapper** (Endpoints)



```javascript```javascript

// auth.js wraps backend endpoints// auth.js wraps backend endpoints



export async function login(data) {export async function login(data) {

  // Pass skipAuthRedirect so 401 doesn't redirect  // Pass skipAuthRedirect so 401 doesn't redirect

  return api("POST", "/api/auth/login", data, { skipAuthRedirect: true });  return api("POST", "/api/auth/login", data, { skipAuthRedirect: true });

}}



export async function me() {export async function me() {

  // Validate stored token is still good  // Validate stored token is still good

  return api("GET", "/api/auth/me", null, { skipAuthRedirect: true });  return api("GET", "/api/auth/me", null, { skipAuthRedirect: true });

}}

``````



------



## 💾 Data Storage## 💾 Data Storage



### **localStorage**### **localStorage**



```javascript```javascript

// What's stored:// What's stored:

localStorage.getItem("token")      // JWT token (string)localStorage.getItem("token")      // JWT token (string)

localStorage.getItem("userEmail")  // User's email (string)localStorage.getItem("userEmail")  // User's email (string)



// When stored:// When stored:

// → During login// → During login

// → During registration// → During registration

// → During initial load if token still valid// → During initial load if token still valid



// When cleared:// When cleared:

// → On logout// → On logout

// → On 401 (session expired)// → On 401 (session expired)

// → When /me endpoint fails// → When /me endpoint fails

``````



### **User Object Structure**### **User Object Structure**



```javascript```javascript

user = {user = {

  id: "uuid",  id: "uuid",

  email: "user@example.com",  email: "user@example.com",

  name: "John Doe",  name: "John Doe",

  role: "USER",  // or "MENTOR" or "ADMIN"  role: "USER",  // or "MENTOR" or "ADMIN"

  created_at: "2026-04-02T...",  created_at: "2026-04-02T...",

  ...otherFields  ...otherFields

}}

``````



------



## 🔐 Security Features## 🔐 Security Features



### ✅ **JWT Token in Authorization Header**### ✅ **JWT Token in Authorization Header**

```javascript```javascript

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sent with every request// Sent with every request

// Not in URL or body (safer)// Not in URL or body (safer)

``````



### ✅ **Role-Based Access Control (RBAC)**### ✅ **Role-Based Access Control (RBAC)**

```javascript```javascript

// Routes protected by role// Routes protected by role

<Route path="/admin/*" <Route path="/admin/*" 

  element={<ProtectedRoute allowedRoles={["ADMIN"]}>}  element={<ProtectedRoute allowedRoles={["ADMIN"]}>}

/>/>



// USER can't access /admin// USER can't access /admin

// MENTOR can't access /admin// MENTOR can't access /admin

// Only ADMIN can// Only ADMIN can

``````



### ✅ **Session Expiration Handling**### ✅ **Session Expiration Handling**

```javascript```javascript

// If token expires:// If token expires:

// 1. API returns 401// 1. API returns 401

// 2. client.js clears token// 2. client.js clears token

// 3. User redirected to login with ?expired=1// 3. User redirected to login with ?expired=1

// 4. Must log in again// 4. Must log in again

``````



### ✅ **No Token in localStorage Without HTTPS** (Note)### ✅ **No Token in localStorage Without HTTPS** (Note)

```javascript```javascript

// ⚠️ Currently: Token stored in localStorage// ⚠️ Currently: Token stored in localStorage

// This is not ideal for production// This is not ideal for production

// Better: Use httpOnly cookies// Better: Use httpOnly cookies



// Why httpOnly is better:// Why httpOnly is better:

// • JavaScript can't access cookies// • JavaScript can't access cookies

// • CSRF tokens can protect// • CSRF tokens can protect

// • But requires backend cookie support// • But requires backend cookie support

``````



------



## 🔄 Component Relationships## 🔄 Component Relationships



``````

App.jsx (Routes)App.jsx (Routes)

  ↓  ↓

AuthProvider (Context wrapper)AuthProvider (Context wrapper)

  ↓  ↓

Routes check:Routes check:

  ├─ /login, /register → Public (no auth needed)  ├─ /login, /register → Public (no auth needed)

  └─ /user/*, /mentor/*, /admin/* → Protected routes  └─ /user/*, /mentor/*, /admin/* → Protected routes

       ↓       ↓

       ProtectedRoute checks:       ProtectedRoute checks:

       ├─ Is loading? → LoadingScreen       ├─ Is loading? → LoadingScreen

       ├─ Is user null? → Redirect to /login       ├─ Is user null? → Redirect to /login

       ├─ Wrong role? → Redirect to /login       ├─ Wrong role? → Redirect to /login

       └─ Authorized? → Render component       └─ Authorized? → Render component

            ↓            ↓

            Component uses useAuth() to:            Component uses useAuth() to:

            ├─ Get user object            ├─ Get user object

            ├─ Make API calls            ├─ Make API calls

            ├─ Handle logout            ├─ Handle logout

            └─ Call refreshUser() to re-check token            └─ Call refreshUser() to re-check token

``````



------



## 📋 Request/Response Flow## 📋 Request/Response Flow



### **Login Request**### **Login Request**



``````

Frontend:Frontend:

POST /api/auth/loginPOST /api/auth/login

Content-Type: application/jsonContent-Type: application/json



{{

  "email": "admin@example.com",  "email": "admin@example.com",

  "password": "admin123"  "password": "admin123"

}}



Backend Response (Success):Backend Response (Success):

200 OK200 OK



{{

  "user": {  "user": {

    "id": "123",    "id": "123",

    "email": "admin@example.com",    "email": "admin@example.com",

    "role": "ADMIN",    "role": "ADMIN",

    ...    ...

  },  },

  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

}}



Backend Response (Failure):Backend Response (Failure):

401 Unauthorized401 Unauthorized



{{

  "error": "Invalid credentials"  "error": "Invalid credentials"

}}

``````



### **Protected API Request**### **Protected API Request**



``````

Frontend:Frontend:

GET /api/admin/usersGET /api/admin/users

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Content-Type: application/jsonContent-Type: application/json



Backend Response (Valid Token):Backend Response (Valid Token):

200 OK200 OK



[[

  { "id": "1", "email": "user1@example.com", "role": "USER" },  { "id": "1", "email": "user1@example.com", "role": "USER" },

  { "id": "2", "email": "user2@example.com", "role": "MENTOR" }  { "id": "2", "email": "user2@example.com", "role": "MENTOR" }

]]



Backend Response (Expired Token):Backend Response (Expired Token):

401 Unauthorized401 Unauthorized



{{

  "error": "Token expired"  "error": "Token expired"

}}



→ Frontend clears localStorage and redirects to /login→ Frontend clears localStorage and redirects to /login

``````



------



## 🚨 Common Auth Issues & Solutions## 🚨 Common Auth Issues & Solutions



### **Issue: Getting 401 on Login**### **Issue: Getting 401 on Login**



**Problem:** Backend returns 401 with "Invalid credentials"**Problem:** Backend returns 401 with "Invalid credentials"



**Solution:****Solution:**

- Check credentials are correct- Check credentials are correct

- Make sure user exists in backend- Make sure user exists in backend

- Backend might not be running- Backend might not be running



**Code Impact:****Code Impact:**

```javascript```javascript

// skipAuthRedirect: true prevents redirect// skipAuthRedirect: true prevents redirect

// So error shows to user instead of page reload// So error shows to user instead of page reload

``````



------



### **Issue: Getting 401 on Protected Route**### **Issue: Getting 401 on Protected Route**



**Problem:** Token expired, backend returns 401**Problem:** Token expired, backend returns 401



**Solution:****Solution:**

- Auto-clear token- Auto-clear token

- Redirect to login- Redirect to login

- User needs to re-authenticate- User needs to re-authenticate



**Code Impact:****Code Impact:**

```javascript```javascript

// skipAuthRedirect is false (default)// skipAuthRedirect is false (default)

// So 401 triggers clearAuthAndRedirectToLogin()// So 401 triggers clearAuthAndRedirectToLogin()

``````



------



### **Issue: User Persists After Logout**### **Issue: User Persists After Logout**



**Problem:** localStorage not cleared**Problem:** localStorage not cleared



**Solution:****Solution:**

```javascript```javascript

const logout = () => {const logout = () => {

  localStorage.removeItem("token");  localStorage.removeItem("token");

  localStorage.removeItem("userEmail");  localStorage.removeItem("userEmail");

  setUser(null);  // ← Must do this  setUser(null);  // ← Must do this

}}

``````



------



### **Issue: CORS Errors on Login**### **Issue: CORS Errors on Login**



**Problem:** Browser blocks cross-origin requests**Problem:** Browser blocks cross-origin requests



**Solution:****Solution:**

- Backend must enable CORS- Backend must enable CORS

- Must allow origin: http://127.0.0.1:5173- Must allow origin: http://127.0.0.1:5173

- Must allow credentials- Must allow credentials



**Fixed in:** src/api/client.js (removed problematic headers)**Fixed in:** src/api/client.js (removed problematic headers)



------



## 📈 Authentication Lifecycle## 📈 Authentication Lifecycle



``````

┌──────────────────────────────────────────────────────────┐┌──────────────────────────────────────────────────────────┐

│ 1. App Loads                                              ││ 1. App Loads                                              │

│    loadUser() checks localStorage for token              ││    loadUser() checks localStorage for token              │

└──────────────────────────────────────────────────────────┘└──────────────────────────────────────────────────────────┘

            ↓            ↓

        ┌─────────────────┐        ┌─────────────────┐

        │ Has token?      │        │ Has token?      │

        └────────┬────────┘        └────────┬────────┘

            Yes ↓ No            Yes ↓ No

            │   └─→ user = null → Show Login            │   └─→ user = null → Show Login

            ↓            ↓

        ┌──────────────────────────┐        ┌──────────────────────────┐

        │ Call GET /api/auth/me    │        │ Call GET /api/auth/me    │

        └────────┬─────────────────┘        └────────┬─────────────────┘

            ↓            ↓

        ┌─────────────────┐        ┌─────────────────┐

        │ Token valid?    │        │ Token valid?    │

        └────────┬────────┘        └────────┬────────┘

        Yes ↓    ↓ No        Yes ↓    ↓ No

        │        └─→ Clear token → Show Login        │        └─→ Clear token → Show Login

        ↓        ↓

    user = {...} → Show Dashboard    user = {...} → Show Dashboard

        ↓        ↓

┌──────────────────────────────────────────────────────────┐┌──────────────────────────────────────────────────────────┐

│ 2. User Navigates                                         ││ 2. User Navigates                                         │

│    ProtectedRoute checks user role                       ││    ProtectedRoute checks user role                       │

└──────────────────────────────────────────────────────────┘└──────────────────────────────────────────────────────────┘

        ↓        ↓

    Allow or Deny based on role    Allow or Deny based on role

        ↓        ↓

┌──────────────────────────────────────────────────────────┐┌──────────────────────────────────────────────────────────┐

│ 3. User Makes API Call                                    ││ 3. User Makes API Call                                    │

│    client.js adds Authorization header with token        ││    client.js adds Authorization header with token        │

└──────────────────────────────────────────────────────────┘└──────────────────────────────────────────────────────────┘

        ↓        ↓

    Backend validates token    Backend validates token

        ↓        ↓

    Success or 401    Success or 401

        ↓        ↓

┌──────────────────────────────────────────────────────────┐┌──────────────────────────────────────────────────────────┐

│ 4. User Logs Out                                          ││ 4. User Logs Out                                          │

│    localStorage cleared                                  ││    localStorage cleared                                  │

│    user = null                                           ││    user = null                                           │

│    Redirect to /login                                    ││    Redirect to /login                                    │

└──────────────────────────────────────────────────────────┘└──────────────────────────────────────────────────────────┘

``````



------



## ✅ Summary## ✅ Summary



**The auth system works by:****The auth system works by:**



1. **Storing a JWT token** in localStorage after login1. **Storing a JWT token** in localStorage after login

2. **Adding the token** to every API request header2. **Adding the token** to every API request header

3. **Checking the token** on app load (GET /me)3. **Checking the token** on app load (GET /me)

4. **Protecting routes** with ProtectedRoute component4. **Protecting routes** with ProtectedRoute component

5. **Handling 401 errors** differently based on context:5. **Handling 401 errors** differently based on context:

   - During login → show error message   - During login → show error message

   - During API calls → redirect to login   - During API calls → redirect to login

6. **Persisting auth state** across page reloads via localStorage6. **Persisting auth state** across page reloads via localStorage

7. **Clearing everything** on logout or session expiry7. **Clearing everything** on logout or session expiry



**The flow is:****The flow is:**



``````

Login Form → POST /api/auth/login → Get TokenLogin Form → POST /api/auth/login → Get Token

            ↓            ↓

Store in localStorageStore in localStorage

            ↓            ↓

Add to every API request headerAdd to every API request header

            ↓            ↓

Backend validates token on each requestBackend validates token on each request

            ↓            ↓

If expired → 401 → Redirect to loginIf expired → 401 → Redirect to login

If valid → Allow accessIf valid → Allow access

            ↓            ↓

On logout → Clear token → Redirect to loginOn logout → Clear token → Redirect to login

``````



