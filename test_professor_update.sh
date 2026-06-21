#!/bin/bash

# Test script to verify professor update functionality

echo "=== Testing Professor Update Functionality ==="
echo ""

# Start the backend in the background
echo "1. Starting backend server..."
cd /Users/ggffghg/Desktop/exam-fpk/backend
source venv/bin/activate
python run.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
echo ""

# Wait for backend to start
sleep 5

# Check if backend is running
if ! curl -s http://localhost:5006/api/professors > /dev/null 2>&1; then
    echo "ERROR: Backend is not running or not accessible"
    echo "Check /tmp/backend.log for errors:"
    cat /tmp/backend.log
    kill $BACKEND_PID
    exit 1
fi

echo "2. Backend is running successfully"
echo ""

# Test user update endpoint
echo "3. Testing user update endpoint..."
TEST_USER_ID=1
TEST_DATA='{"first_name": "TestFirst", "last_name": "TestLast", "institutional_grade": "PR"}'
RESPONSE=$(curl -s -X PATCH \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token" \
    -d "$TEST_DATA" \
    http://localhost:5006/api/auth/users/$TEST_USER_ID 2>&1)
echo "   Response: $RESPONSE"
echo ""

# Test professor update endpoint
echo "4. Testing professor update endpoint..."
TEST_PROFESSOR_ID=1
TEST_DATA='{"department_id": 1, "max_guards": 4, "academic_title": "PR"}'
RESPONSE=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token" \
    -d "$TEST_DATA" \
    http://localhost:5006/api/professors/$TEST_PROFESSOR_ID 2>&1)
echo "   Response: $RESPONSE"
echo ""

# Test getting professors with user data
echo "5. Testing professor list (should include user data)..."
RESPONSE=$(curl -s -H "Authorization: Bearer test-token" http://localhost:5006/api/professors 2>&1)
echo "   Response (first 500 chars): ${RESPONSE:0:500}"
echo ""

# Clean up
echo "6. Stopping backend..."
kill $BACKEND_PID 2>/dev/null
wait $BACKEND_PID 2>/dev/null

echo ""
echo "=== Test Complete ==="
echo ""
echo "To manually test:"
echo "1. Start backend: cd backend && python run.py"
echo "2. Start frontend: npm run dev"
echo "3. Login as admin (admin/admin)"
echo "4. Go to Staff/Professors page"
echo "5. Edit a professor and save"
echo "6. Check browser console (F12) for logs"
echo "7. Check backend console for debug output"
