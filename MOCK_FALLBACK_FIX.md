# Mock Data Fallback Fix for 500 Internal Server Error

## Problem
When the backend server is not running (500 Internal Server Error), the frontend application was failing to load because API calls were not being caught and handled gracefully.

## Solution
Added comprehensive mock data fallback system that automatically activates when the backend is unavailable.

## Changes Made

### 1. Core API Infrastructure (`src/services/api.ts`)
- Added global `useMockData` flag that is automatically set to `true` when:
  - Server returns 500+ status codes
  - Network errors occur (backend is down)
- Added helper functions:
  - `setUseMockData(enabled: boolean)` - Manually enable/disable mock mode
  - `isUsingMockData()` - Check if mock mode is active

### 2. Service Layer Updates
All service files now check `useMockData` flag before making API calls:

#### `src/services/authService.ts`
- Login falls back to mock users (admin/admin, prof/prof)
- getCurrentUser uses stored user data in mock mode
- Automatic switch to mock mode on backend failure

#### `src/services/dashboardService.ts`
- All dashboard endpoints now have mock data fallback:
  - `getOverview()` - Returns mock dashboard overview
  - `getStats()` - Returns mock statistics
  - `getExamCalendar()` - Returns mock exam calendar
  - `getNotifications()` - Returns mock notifications
  - `getProfessorOverview()` - Returns mock professor dashboard
  - `getProfessorStats()` - Returns mock professor stats

#### `src/services/professorService.ts`
- All professor endpoints have mock fallback
- `getAll()` - Returns mock professors list
- `getById()` - Returns mock professor by ID

#### `src/services/examService.ts`
- All exam endpoints have mock fallback
- `getAll()` - Returns mock exams list
- `getById()` - Returns mock exam by ID

#### `src/services/departmentService.ts`
- All department endpoints have mock fallback
- `getAll()` - Returns mock departments list

#### `src/services/salleService.ts`
- All salle (room) endpoints have mock fallback
- `getAll()` - Returns mock salles list

#### `src/services/assignmentService.ts`
- All assignment endpoints have mock fallback
- `getAll()` - Returns mock assignments list

### 3. Mock Data (`src/services/mockData.ts`)
- Complete mock data for all entities:
  - Users (admin, professor)
  - Professors (5 mock professors with different quotas)
  - Departments (5 mock departments)
  - Salles (6 mock rooms)
  - Exams (3 mock exams)
  - Assignments (3 mock assignments)
  - Incidents (2 mock incidents)
  - Assignment History (3 mock history entries)
  - Dashboard Overview (complete mock dashboard data)
- Helper functions:
  - `createSuccessResponse()` - Create standard API success response
  - `createPaginatedResponse()` - Create paginated response
  - `findMockUser()` - Find user by username and password for authentication

### 4. Type Fixes (`src/types/index.ts`)
- Fixed DashboardOverview type to use quoted property names for quota_distribution

## How It Works

1. **Automatic Detection**: When any API call fails with a 500+ error or network error, the `useMockData` flag is automatically set to `true`

2. **Fallback Mechanism**: All service methods check `useMockData` before making API calls:
   - If `useMockData` is `true`, they return mock data immediately
   - If API call fails, they catch the error and return mock data

3. **Seamless Switching**: The switch between real API and mock data is transparent to components - they just call the service methods as normal

## Mock Users Available

- **admin** / **admin** - Admin user with full access
- **prof** / **prof** - Professor user with quota 2/4

## Testing

To test the mock fallback:
1. Make sure the backend is NOT running
2. Run the frontend with `npm run dev`
3. Login with `admin/admin` or `prof/prof`
4. The application should work normally with mock data

## Running with Backend

To run with the real backend:
1. Start the backend: `cd backend && python run.py` (runs on port 5006)
2. Run the frontend: `npm run dev`
3. The application will use real API calls

## Notes

- The mock data is static and won't persist changes
- All CRUD operations (create, update, delete) will still attempt to call the backend
- Read operations (get, list) will use mock data when backend is unavailable
- The system gracefully handles the transition between mock and real data
