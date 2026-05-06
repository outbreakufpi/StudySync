Routes for API v1:

- GET /api/v1/ - API info
- GET /api/v1/subjects - list subjects (auth required)
- POST /api/v1/subjects - create subject (auth required)
- GET /api/v1/tasks - list tasks (auth required)
- POST /api/v1/tasks - create task (auth required)
- GET /api/v1/sessions - list sessions (auth required)
- POST /api/v1/sessions - create session (auth required)
- POST /api/v1/auth/signup - create account
- POST /api/v1/auth/login - login and get session
- POST /api/v1/auth/logout - logout current token
- POST /api/v1/auth/reset-password - send reset password email
- GET /api/v1/auth/validate-session - validate bearer token
