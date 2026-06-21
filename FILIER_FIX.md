# Filier Management Fix - Add Filier & Default Computer Science

## Problem Description

The user reported issues with the Filier management page (`#filieres`):
1. **"add filire"** - Adding a new filier (field of study) was not working properly
2. **"lier old filire dfault with compuser science"** - The default filier should be linked with the Computer Science department

## Root Causes

1. **No Default Computer Science Filier**: The database initialization script created departments (including Computer Science) but did NOT create any default filieres
2. **Department Defaults to 0**: When adding a new filier, the department_id form field defaulted to 0 ("Select Department") instead of defaulting to Computer Science
3. **No Form Reset**: When opening the "Add Filier" modal, the form wasn't being reset with proper defaults

## Solution Implemented

### Backend Changes

**File**: `backend/init_db.py`

1. **Added Filier import**:
   ```python
   from models import db, User, Professor, Department, Salle, Filier
   ```

2. **Added default Computer Science filier creation**:
   ```python
   # Create default filieres
   cs_dept = Department.query.filter_by(name='Computer Science').first()
   if cs_dept:
       # Create Computer Science filier if not exists
       cs_filier = Filier.query.filter_by(name='Computer Science').first()
       if not cs_filier:
           cs_filier = Filier(
               name='Computer Science',
               code='CS',
               department_id=cs_dept.id,
               max_modules=7,
               description='Computer Science and Engineering',
               is_active=True
           )
           db.session.add(cs_filier)
           db.session.commit()
           print("Default Computer Science filier created")
   ```

### Frontend Changes

**File**: `src/views/FilierModuleManagement.tsx`

1. **Added defaultDepartmentId state**:
   ```typescript
   const [defaultDepartmentId, setDefaultDepartmentId] = useState<number>(0);
   ```

2. **Modified fetchDepartments to find Computer Science**:
   ```typescript
   const fetchDepartments = useCallback(async () => {
     try {
       const response = await departmentService.getAll(1, 50);
       if (response.success && response.data) {
         setDepartments(response.data);
         // Set Computer Science as default department
         const csDept = response.data.find((d: any) => 
           d.name === 'Computer Science' || d.name === 'COMPUTER SCIENCE'
         );
         if (csDept) {
           setDefaultDepartmentId(csDept.id);
         }
       }
     } catch (err) {
       console.error('Failed to fetch departments:', err);
     }
   }, []);
   ```

3. **Updated filierForm initialization**:
   ```typescript
   const [filierForm, setFilierForm] = useState({
     name: '',
     code: '',
     department_id: defaultDepartmentId,
     max_modules: 7,
     description: '',
     is_active: true,
   });
   ```

4. **Added useEffect to update form when defaultDepartmentId changes**:
   ```typescript
   useEffect(() => {
     if (defaultDepartmentId > 0 && filierForm.department_id === 0 && !selectedFilier) {
       setFilierForm(prev => ({ ...prev, department_id: defaultDepartmentId }));
     }
   }, [defaultDepartmentId, selectedFilier]);
   ```

5. **Updated "Add Filier" button to reset form with defaults**:
   ```typescript
   onClick={() => {
     setActiveSubTab(activeSubTab === 'filieres' ? 'filieres' : 'modules');
     // Reset form with defaults for new entry
     if (activeSubTab === 'filieres') {
       setFilierForm({
         name: '',
         code: '',
         department_id: defaultDepartmentId,
         max_modules: 7,
         description: '',
         is_active: true,
       });
       setSelectedFilier(null);
     } else {
       // ... module form reset
     }
     setIsModalOpen(true);
   }}
   ```

6. **Updated form reset after successful creation**:
   ```typescript
   setFilierForm({ 
     name: '', 
     code: '', 
     department_id: defaultDepartmentId, 
     max_modules: 7, 
     description: '', 
     is_active: true 
   });
   ```

## What Changed

### Database Initialization
- Running `python init_db.py` now creates:
  - Computer Science department (already existed)
  - **NEW**: Computer Science filier linked to the Computer Science department
  - Other departments (Mathematics, Physics, Philosophy)

### Filier Management UI
- When opening the "Add Filier" modal:
  - Department field now defaults to **Computer Science** (instead of "Select Department")
  - Max modules defaults to 7
  - Active defaults to true
- Placeholder text suggests "COMPUTER SCIENCE" for name and "CS" for code

## Testing

### Method 1: Fresh Database Setup

1. **Reset your database**:
   ```bash
   cd backend
   rm -f instance/*.db  # If using SQLite
   python init_db.py
   ```

2. **Start the backend**:
   ```bash
   python run.py
   ```

3. **Start the frontend**:
   ```bash
   npm run dev
   ```

4. **Test in browser**:
   - Login as admin
   - Go to `http://localhost:5173/#filieres`
   - Verify a "Computer Science" filier exists in the list
   - Click "Add Filier" button
   - Verify department is pre-selected as "Computer Science"
   - Add a new filier (e.g., "Mathematics")
   - Verify it's created successfully

### Method 2: Manual Test with Existing Database

1. Run the database initialization to add the Computer Science filier:
   ```bash
   cd backend
   python -c "from app import create_app; from init_db import main; main()"
   ```

2. Refresh the page and check the Filieres list

## Expected Behavior

✅ Default Computer Science filier exists after database initialization
✅ Department field defaults to Computer Science when adding a new filier
✅ Form validation works (name and department are required)
✅ New filieres are properly saved to the database
✅ Filieres are linked to their respective departments

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/filieres` | List all filieres |
| POST | `/api/filieres` | Create a new filier |
| GET | `/api/departments` | List all departments |

## Data Flow

```
User clicks "Add Filier"
  ↓
Form opens with:
  - name: ""
  - code: ""
  - department_id: <Computer Science department ID>
  - max_modules: 7
  - description: ""
  - is_active: true
  ↓
User fills in details
  ↓
Form submitted to `/api/filieres`
  ↓
Backend validates and creates filier
  ↓
Filier list refreshed
```

## Files Modified

1. `backend/init_db.py` - Added default Computer Science filier creation
2. `src/views/FilierModuleManagement.tsx` - Improved form defaults and user experience

## Verification

- ✅ Backend Python code compiles without errors
- ✅ TypeScript compiles without errors
- ✅ Default Computer Science filier created on database initialization
- ✅ Form defaults to Computer Science department when adding new filier
