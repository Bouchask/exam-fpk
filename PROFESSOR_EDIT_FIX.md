# Professor Edit Fix - Complete Solution

## Problem Description

When editing a professor in the Staff/Professors page (`#staff`), changes to user information (username, email, first name, last name, institutional grade) were not being saved to the database.

## Root Causes

1. **Separate Models**: User and Professor are separate database models with a one-to-one relationship
2. **Missing Endpoint**: There was no backend endpoint to update user information
3. **Wrong Data Structure**: Frontend was trying to send user data in a nested `user` object to the professor update endpoint
4. **Backend Ignored User Data**: The professor update endpoint only accepted professor-specific fields (department_id, academic_title, max_guards, completed_guards)
5. **Missing User in Response**: The professor's `to_dict()` method didn't include the user object

## Solution Implemented

### Backend Changes

#### 1. Added User Update Endpoint (`backend/routes/auth.py`)

```python
@auth_bp.route('/users/<int:user_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_user(user_id):
    """Update user information (admin only)"""
    # Validates admin access
    # Updates: username, email, first_name, last_name, institutional_grade, department_id, is_active, password
    # Validates email format and checks for duplicate username/email
    # Hashes password using set_password()
```

**Endpoint**: `PATCH /api/auth/users/<user_id>`

#### 2. Modified Professor Model (`backend/models.py`)

Added user object to professor's `to_dict()` method:

```python
def to_dict(self):
    return {
        # ... existing fields ...
        'user': self.user.to_dict() if self.user else None
    }
```

This ensures the frontend receives the user object when fetching professors.

#### 3. Enhanced Professor Update Endpoint (`backend/routes/professors.py`)

Added debug logging to help troubleshoot issues.

### Frontend Changes

#### 1. Added User Update Service Method (`src/services/authService.ts`)

```typescript
const AUTH_ENDPOINTS = {
  // ... existing endpoints ...
  UPDATE_USER: (userId: number) => `/auth/users/${userId}`,
};

async updateUser(userId: number, userData: Partial<User>): Promise<ApiResponse<User>> {
  try {
    const response = await api.put<ApiResponse<User>>(AUTH_ENDPOINTS.UPDATE_USER(userId), userData);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as Error));
  }
}
```

#### 2. Fixed Professor Update Logic (`src/views/AdminDashboard.tsx`)

**Key Changes:**
- Separated user and professor updates into two separate API calls
- User data is sent to `/api/auth/users/<user_id>` via `authService.updateUser()`
- Professor data is sent to `/api/professors/<professor_id>` via `professorService.update()`
- Only sends fields that each endpoint accepts
- Improved department lookup (falls back to existing department_id when editing)
- Added console logs for debugging

**Data Flow:**
```
Frontend Form Submission
  │
  ├── User Data (username, email, first_name, last_name, institutional_grade, password)
  │     └── PATCH /api/auth/users/<user_id>
  │
  └── Professor Data (department_id, max_guards, academic_title)
        └── PUT /api/professors/<professor_id>
```

## API Endpoints

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| PATCH | `/api/auth/users/<user_id>` | Update user information | Admin |
| PUT | `/api/professors/<professor_id>` | Update professor information | Admin |

## Testing

### Method 1: Manual Testing

1. Start the backend:
   ```bash
   cd backend
   python run.py
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. Open browser to `http://localhost:5173`

4. Login as admin (username: `admin`, password: `admin`)

5. Navigate to Staff/Professors page

6. Click edit on a professor

7. Make changes to any field (username, email, first name, last name, grade, department)

8. Click "UPDATE PROFESSOR"

9. Verify:
   - Success message appears
   - Changes persist after page refresh
   - Check backend console for debug output
   - Check browser console (F12) for frontend logs

### Method 2: Run Test Script

```bash
chmod +x test_professor_update.sh
./test_professor_update.sh
```

### Method 3: API Testing with curl

```bash
# Get JWT token first (login as admin)
curl -X POST http://localhost:5006/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'

# Then use the token to update a user (replace TOKEN and USER_ID)
curl -X PATCH http://localhost:5006/api/auth/users/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"first_name": "John", "last_name": "Doe", "institutional_grade": "PR"}'

# Update a professor (replace TOKEN and PROFESSOR_ID)
curl -X PUT http://localhost:5006/api/professors/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"department_id": 1, "max_guards": 4, "academic_title": "PR"}'
```

## Debugging

### Frontend Debugging

Open browser developer tools (F12) and check:

1. **Console**: Look for console.log output from the update handlers
2. **Network**: Check the XHR requests to see what data is being sent
3. **Response**: Verify the API responses are successful

### Backend Debugging

Check the backend console for debug output:
- `[DEBUG] User update request received for user_id: X`
- `[DEBUG] User update data: {...}`
- `[DEBUG] User updated successfully: X`
- `[DEBUG] Professor update request received for professor_id: X`
- `[DEBUG] Professor update data: {...}`

If you see errors, check:
1. Database connection
2. JWT authentication
3. Model field names match the data being sent

## Common Issues and Solutions

### Issue: Backend not running
**Symptom**: Updates appear to work in UI but don't persist to database
**Solution**: Make sure backend is running and accessible at `http://localhost:5006`

### Issue: useMockData is true
**Symptom**: Console shows mock data being used
**Cause**: Backend returned 500 error or network error, triggering mock mode
**Solution**: 
- Check backend is running
- Check for errors in backend console
- Fix any backend issues
- Refresh the page to reset mock mode

### Issue: Department not found
**Symptom**: Error message "Department not found"
**Cause**: Department name in form doesn't match any department in database
**Solution**: The code now falls back to using the existing professor's department_id

### Issue: User not found
**Symptom**: Error message "User not found" or "User not found: X"
**Cause**: The selected professor doesn't have a user object
**Solution**: Check that the professor data includes a user object (backend fix should handle this)

## Files Modified

1. `backend/routes/auth.py` - Added user update endpoint
2. `backend/routes/professors.py` - Added debug logging
3. `backend/models.py` - Modified Professor.to_dict() to include user
4. `src/services/authService.ts` - Added updateUser service method
5. `src/views/AdminDashboard.tsx` - Fixed professor update logic

## Verification

- ✅ Backend Python code compiles without errors
- ✅ TypeScript compiles without errors
- ✅ All API endpoints properly defined
- ✅ Data flow correctly separates user and professor updates
