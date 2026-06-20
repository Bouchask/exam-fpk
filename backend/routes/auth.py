from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import check_password_hash
from models import User, Professor, Department
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
        identity=user.id,
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
        from app import db
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
        from app import db
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
        identity=user.id,
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
        from app import db
        db.session.commit()
        return success_response(None, 'Password changed successfully')
    except Exception as e:
        from app import db
        db.session.rollback()
        return error_response(str(e), 500)
