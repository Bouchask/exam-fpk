from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import check_password_hash
from models import db, User, Professor, Department
from utils.helpers import success_response, error_response, validate_email
from config import config

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    data = request.get_json()
    
    if not data or 'username' not in data or 'password' not in data:
        return error_response('Username and password are required', 400)
    
    username = data.get('username')
    password = data.get('password')
    
    # Find user by username
    user = User.query.filter_by(username=username).first()
    
    if not user or not user.check_password(password):
        return error_response('Invalid username or password', 401)
    
    if not user.is_active:
        return error_response('Account is disabled', 403)
    
    # Create JWT token with role in claims
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={'role': user.role, 'username': user.username, 'email': user.email}
    )
    
    # Update professor quota if exists
    professor_data = None
    if user.role == 'professor':
        professor = Professor.query.filter_by(user_id=user.id).first()
        if professor:
            professor_data = {
                'quota': professor.quota_status,
                'completed_guards': professor.completed_guards,
                'max_guards': professor.max_guards
            }
    
    return success_response({
        'access_token': access_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role,
            'institutional_grade': user.institutional_grade
        },
        'professor_quota': professor_data
    }, 'Login successful')


@auth_bp.route('/register', methods=['POST'])
@jwt_required()
def register():
    """Register new user (admin only)"""
    claims = get_jwt()
    
    if claims.get('role') != 'admin':
        return error_response('Admin access required', 403)
    
    data = request.get_json()
    
    required_fields = ['username', 'password', 'email', 'first_name', 'last_name', 'role']
    for field in required_fields:
        if field not in data:
            return error_response(f'{field} is required', 400)
    
    username = data.get('username')
    email = data.get('email')
    
    # Check if username or email exists
    if User.query.filter_by(username=username).first():
        return error_response('Username already exists', 400)
    
    if User.query.filter_by(email=email).first():
        return error_response('Email already exists', 400)
    
    if not validate_email(email):
        return error_response('Invalid email format', 400)
    
    if data.get('role') not in ['admin', 'professor']:
        return error_response('Role must be admin or professor', 400)
    
    # Create user
    user = User(
        username=username,
        email=email,
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        role=data.get('role'),
        institutional_grade=data.get('institutional_grade', 'PES'),
        department_id=data.get('department_id')
    )
    user.set_password(data.get('password'))
    
    try:
        db.session.add(user)
        db.session.commit()
        
        # Create professor profile if role is professor
        if user.role == 'professor':
            professor = Professor(
                user_id=user.id,
                department_id=data.get('department_id'),
                academic_title=data.get('academic_title', 'PR'),
                max_guards=data.get('max_guards', 4)
            )
            db.session.add(professor)
            db.session.commit()
        
        return success_response({
            'user': user.to_dict()
        }, 'User registered successfully'), 201
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return error_response('User not found', 404)
    
    # Get professor data if applicable
    professor_data = None
    if user.role == 'professor':
        professor = Professor.query.filter_by(user_id=user.id).first()
        if professor:
            professor_data = professor.to_dict()
    
    return success_response({
        'user': user.to_dict(),
        'professor': professor_data
    })


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    """Refresh access token"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return error_response('User not found', 404)
    
    new_token = create_access_token(
        identity=str(user.id),
        additional_claims={'role': user.role, 'username': user.username, 'email': user.email}
    )
    
    return success_response({'access_token': new_token}, 'Token refreshed')


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout - Add token to blocklist"""
    # In a production app, you would add the token to a blocklist
    # For this implementation, we just return success
    return success_response(None, 'Logged out successfully')


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return error_response('User not found', 404)
    
    data = request.get_json()
    
    if not data or 'current_password' not in data or 'new_password' not in data:
        return error_response('Current and new password are required', 400)
    
    if not user.check_password(data.get('current_password')):
        return error_response('Current password is incorrect', 401)
    
    user.set_password(data.get('new_password'))
    
    try:
        db.session.commit()
        return success_response(None, 'Password changed successfully')
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@auth_bp.route('/users/<int:user_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_user(user_id):
    """Update user information (admin only)"""
    print(f'[DEBUG] User update request received for user_id: {user_id}')
    claims = get_jwt()
    
    if claims.get('role') != 'admin':
        print(f'[DEBUG] Admin access denied for user update')
        return error_response('Admin access required', 403)
    
    user = User.query.get(user_id)
    
    if not user:
        print(f'[DEBUG] User not found: {user_id}')
        return error_response('User not found', 404)
    
    data = request.get_json()
    print(f'[DEBUG] User update data: {data}')
    
    if not data:
        print(f'[DEBUG] No data provided for user update')
        return error_response('No data provided', 400)
    
    if 'username' in data:
        # Check if username already exists for another user
        existing_user = User.query.filter_by(username=data.get('username')).first()
        if existing_user and existing_user.id != user_id:
            return error_response('Username already exists', 400)
        user.username = data.get('username')
    
    if 'email' in data:
        # Validate email format
        if not validate_email(data.get('email')):
            return error_response('Invalid email format', 400)
        # Check if email already exists for another user
        existing_user = User.query.filter_by(email=data.get('email')).first()
        if existing_user and existing_user.id != user_id:
            return error_response('Email already exists', 400)
        user.email = data.get('email')
    
    if 'first_name' in data:
        user.first_name = data.get('first_name')
    
    if 'last_name' in data:
        user.last_name = data.get('last_name')
    
    if 'institutional_grade' in data:
        user.institutional_grade = data.get('institutional_grade')
    
    if 'department_id' in data:
        user.department_id = data.get('department_id')
    
    if 'is_active' in data:
        user.is_active = data.get('is_active')
    
    if 'password' in data:
        user.set_password(data.get('password'))
    
    try:
        db.session.commit()
        print(f'[DEBUG] User updated successfully: {user_id}')
        return success_response(user.to_dict(), 'User updated successfully')
    except Exception as e:
        print(f'[DEBUG] Error updating user: {str(e)}')
        db.session.rollback()
        return error_response(str(e), 500)
