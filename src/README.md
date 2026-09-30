# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Teachers can sign students up for activities and unregister them
- Students can view activities and participant lists without signing in

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| POST   | `/auth/login`                                                      | Sign in as a teacher                                                |
| GET    | `/auth/status`                                                     | Check the current teacher session                                   |
| POST   | `/auth/logout`                                                     | Sign out                                                            |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Sign up a student (teacher session required)                        |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Unregister a student (teacher session required)                  |

## Teacher Access

Teacher accounts are stored in `src/teachers.json`. Passwords are stored as PBKDF2-SHA256 hashes, not plaintext. Generate a salt and hash with Python, then add the resulting values under the `teachers` object using the shown structure:

```python
import getpass
import hashlib
import secrets

username = input("Teacher username: ")
password = getpass.getpass("Teacher password: ")
salt = secrets.token_hex(16)
password_hash = hashlib.pbkdf2_hmac(
      "sha256", password.encode(), salt.encode(), 310_000
).hex()
print({"username": username, "salt": salt, "password_hash": password_hash})
```

Add the returned account to `teachers.json` like this:

```json
{
   "teachers": {
      "teacher-username": {
         "salt": "generated-salt",
         "password_hash": "generated-hash"
      }
   }
}
```

For a stable session across restarts, set `SESSION_SECRET` to a long random value. When serving over HTTPS, set `COOKIE_SECURE=1` so the browser only sends the teacher session cookie over HTTPS. The default settings are intended for local development.

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
