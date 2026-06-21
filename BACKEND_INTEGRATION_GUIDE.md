# Backend Integration Guide - FPK Exam Guard

## Overview

This guide documents the changes made to integrate the React frontend with the Flask backend API.

## Changes Made

### 1. New Files Created

#### TypeScript Types (`src/types/index.ts`)
- Complete type definitions for all backend API responses
- Includes: User, Professor, Department, Salle, Exam, Assignment, Incident, etc.
- Request and response types for all endpoints

#### API Service Layer (`src/services/`)
- **`api.ts`**: Base axios configuration with interceptors
  - Automatic token injection
  - Token refresh handling
  - Error handling
  
- **`authService.ts`**: Authentication services
  - login(), register(), logout()
  - getCurrentUser(), refreshToken()
  - Token management (localStorage)
  
- **`dashboardService.ts`**: Dashboard data services
  - getOverview(), getStats()
  - getExamCalendar(), getNotifications()
  
- **`professorService.ts`**: Professor management
  - getAll(), getById(), create(), update(), delete()
  - getAssignments(), getQuota(), resetQuota()
  
- **`examService.ts`**: Exam management
  - getAll(), getById(), create(), update(), delete()
  - assignProfessor(), unassignProfessor()
  - getUpcoming(), getByDepartment(), getBySalle()
  
- **`departmentService.ts`**: Department management
  - getAll(), getById(), create(), update(), delete()
  - getProfessors(), getExams(), getStats()
  
- **`salleService.ts`**: Salle/Room management
  - getAll(), getById(), create(), update(), delete()
  - getExams(), getTypes(), getBuildings()
  
- **`assignmentService.ts`**: Assignment management
  - getAll(), getById(), update(), delete()
  - complete(), getIncidents(), createIncident()
  - getMyUpcoming(), getMyHistory(), getMyNext()

#### Contexts (`src/contexts/`)
- **`AuthContext.tsx`**: Authentication state management
  - Manages user, token, isAuthenticated
  - Provides login(), logout(), refreshToken() functions
  - Role checking with hasRole()

#### Hooks (`src/hooks/`)
- **`useApi.ts`**: Custom hooks for data fetching
  - useApi(): Generic data fetching with loading/error states
  - usePaginatedApi(): For paginated data
  - useMutation(): For POST/PUT/DELETE operations

#### Utilities (`src/utils/`)
- **`dataTransformers.ts`**: Data transformation functions
  - Converts backend API responses to frontend format
  - Handles professors, exams, departments, salles, assignments, incidents
  - Chart data transformations

### 2. Files Modified

#### `package.json`
- Added `axios` dependency

#### `.env.example`
- Added `VITE_API_URL` configuration

#### `main.tsx`
- Wrapped app with AuthProvider

#### `App.tsx`
- Replaced local user state with AuthContext
- Added loading state while checking authentication
- Updated to use `isAuthenticated` and `user` from auth
- Passes user to Layout component

#### `Login.tsx`
- Replaced mock authentication with real API calls
- Uses `useAuth()` hook for login
- Shows auth errors from context
- Handles loading state

#### `Layout.tsx`
- Added user prop
- Passes user to Topbar

#### `Topbar.tsx`
- Updated to accept user prop
- Shows dynamic user information (name, initials, department)
- Uses actual user data instead of hardcoded values

## Remaining Tasks

### Views to Update

The following view files still use mock data and need to be updated to use the API services:

1. **`AdminDashboard.tsx`** - Replace mock data with API calls
2. **`AssignmentEngine.tsx`** - Connect to assignment endpoints
3. **`ProfessorPortal.tsx`** - Fetch real user data and assignments
4. **`ProfessorHistory.tsx`** - Fetch real history data
5. **`ProfessorIncidents.tsx`** - Fetch real incident data

### How to Update Views

#### Pattern for AdminDashboard.tsx

Replace:
```typescript
const professors = [
  { id: 1, name: "DR. SARAH CONNOR", dept: "COMPUTER SCIENCE", guards: 1 },
  // ...
];
```

With:
```typescript
const { data: professors, isLoading, error } = useApi<Professor[]>(() => 
  professorService.getAll().then(res => res.data)
);

// Transform to frontend format
const frontendProfessors = professors ? transformProfessors(professors) : [];
```

#### Pattern for Dashboard Overview

Replace:
```typescript
const stats = [
  { label: "Active Professors", value: "48", icon: Users, trend: "+2" },
  // ...
];
```

With:
```typescript
const { data: overview, isLoading } = useApi<DashboardOverview>(() => 
  dashboardService.getOverview()
);

const stats = overview ? transformStatsToCards(overview.stats) : [];
```

### Loading States

Add loading states to all views:
```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-primary"></div>
    </div>
  );
}
```

### Error Handling

Add error handling:
```typescript
if (error) {
  return (
    <div className="p-4 bg-red-900 text-white text-center">
      {error}
    </div>
  );
}
```

## API Endpoints Reference

### Authentication
- POST `/api/auth/login` - Login
- POST `/api/auth/register` - Register (admin only)
- GET `/api/auth/me` - Get current user
- POST `/api/auth/refresh` - Refresh token
- POST `/api/auth/logout` - Logout

### Dashboard
- GET `/api/dashboard/overview` - Overview stats
- GET `/api/dashboard/stats` - Detailed stats
- GET `/api/dashboard/exam-calendar` - Calendar data
- GET `/api/dashboard/notifications` - Notifications

### Professors
- GET `/api/professors` - List all
- GET `/api/professors/<id>` - Get one
- POST `/api/professors` - Create (admin only)
- PUT `/api/professors/<id>` - Update (admin only)
- DELETE `/api/professors/<id>` - Delete (admin only)
- GET `/api/professors/<id>/assignments` - Get assignments
- GET `/api/professors/<id>/quota` - Get quota
- POST `/api/professors/<id>/quota/reset` - Reset quota (admin only)
- GET `/api/professors/me/assignments` - My assignments

### Exams
- GET `/api/exams` - List all
- GET `/api/exams/<id>` - Get one
- POST `/api/exams` - Create (admin only)
- PUT `/api/exams/<id>` - Update (admin only)
- DELETE `/api/exams/<id>` - Delete (admin only)
- POST `/api/exams/<id>/assign` - Assign professor
- GET `/api/exams/<id>/assignments` - Get assignments
- POST `/api/exams/<id>/unassign/<professor_id>` - Unassign
- GET `/api/exams/upcoming` - Upcoming exams

### Departments
- GET `/api/departments` - List all
- GET `/api/departments/<id>` - Get one
- POST `/api/departments` - Create (admin only)
- PUT `/api/departments/<id>` - Update (admin only)
- DELETE `/api/departments/<id>` - Delete (admin only)
- GET `/api/departments/<id>/professors` - Get professors
- GET `/api/departments/<id>/exams` - Get exams
- GET `/api/departments/stats` - Get stats

### Salles
- GET `/api/salles` - List all
- GET `/api/salles/<id>` - Get one
- POST `/api/salles` - Create (admin only)
- PUT `/api/salles/<id>` - Update (admin only)
- DELETE `/api/salles/<id>` - Delete (admin only)
- GET `/api/salles/<id>/exams` - Get exams
- GET `/api/salles/types` - Get types
- GET `/api/salles/buildings` - Get buildings

### Assignments
- GET `/api/assignments` - List all
- GET `/api/assignments/<id>` - Get one
- PUT `/api/assignments/<id>` - Update
- DELETE `/api/assignments/<id>` - Delete (admin only)
- POST `/api/assignments/<id>/complete` - Mark complete
- GET `/api/assignments/<id>/incidents` - Get incidents
- POST `/api/assignments/<id>/incidents` - Create incident
- GET `/api/assignments/my/upcoming` - My upcoming
- GET `/api/assignments/my/history` - My history
- GET `/api/assignments/my/next` - My next

### Incidents
- GET `/api/incidents` - List all
- GET `/api/incidents/<id>` - Get one
- POST `/api/incidents` - Create
- PUT `/api/incidents/<id>` - Update
- DELETE `/api/incidents/<id>` - Delete (admin only)
- POST `/api/incidents/<id>/resolve` - Resolve (admin only)
- GET `/api/incidents/stats` - Get stats
- GET `/api/incidents/types` - Get types
- GET `/api/incidents/my` - My incidents

## Testing the Integration

### 1. Start the Backend
```bash
cd backend
python init_db.py  # Initialize database with sample data
python run.py     # Start the Flask server (runs on port 5006)
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install axios
```

### 3. Start the Frontend
```bash
npm run dev
```

### 4. Test Login
- Use credentials: `admin/admin` or `prof/prof`
- Verify that login works and token is stored
- Verify that user data is displayed in Topbar

## Configuration

Create a `.env` file in the project root:
```env
VITE_API_URL=http://localhost:5006/api
```

Or set it in `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5006',
        changeOrigin: true,
      },
    },
  },
});
```

## Notes

1. **Token Storage**: Tokens are stored in localStorage. For production, consider using httpOnly cookies for better security.

2. **Token Refresh**: The API interceptor automatically handles token refresh when 401 errors occur.

3. **Error Handling**: All services include try/catch blocks and throw errors that can be caught by components.

4. **Loading States**: Use the `isLoading` state from hooks to show loading indicators.

5. **Fallback to Mock Data**: For development without a backend, you can add fallback to mock data in the services.

## Troubleshooting

### CORS Issues
If you get CORS errors:
1. Make sure the backend is running
2. Verify that Flask-CORS is enabled in the backend (it is in `backend/app.py`)
3. Check that the frontend is using the correct API URL

### 401 Errors
1. Verify that you're logged in (token exists in localStorage)
2. Check that the token is being sent with requests (via interceptor)
3. Try refreshing the token manually

### 403 Errors
1. Check that the user has the correct role
2. Verify that the endpoint requires the role you have
3. Check the backend route decorators

## Next Steps

1. Update the remaining view files to use API data
2. Add loading states to all views
3. Add error handling UI
4. Test all endpoints
5. Add form validation
6. Implement real-time updates (optional)
7. Add caching for better performance
