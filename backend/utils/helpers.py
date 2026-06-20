from flask import jsonify
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
import re


def admin_required(fn):
    """Decorator to ensure user is admin"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user = get_jwt_identity()
        claims = get_jwt()
        
        if claims.get('role') != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        return fn(*args, **kwargs)
    return wrapper


def professor_required(fn):
    """Decorator to ensure user is professor"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user = get_jwt_identity()
        claims = get_jwt()
        
        if claims.get('role') not in ['admin', 'professor']:
            return jsonify({'message': 'Professor access required'}), 403
        
        return fn(*args, **kwargs)
    return wrapper


def role_required(*roles):
    """Decorator to check for specific roles"""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get('role')
            
            if user_role not in roles:
                return jsonify({'message': f'Requires one of: {', '.join(roles)}'}), 403
            
            return fn(*args, **kwargs)
        return decorator
    return wrapper


def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_time_format(time_str):
    """Validate HH:MM time format"""
    pattern = r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
    return re.match(pattern, time_str) is not None


def validate_date_format(date_str):
    """Validate YYYY-MM-DD date format"""
    pattern = r'^\d{4}-\d{2}-\d{2}$'
    return re.match(pattern, date_str) is not None


def success_response(data=None, message='Success'):
    """Standard success response"""
    response = {'success': True, 'message': message}
    if data is not None:
        response['data'] = data
    return jsonify(response)


def error_response(message='Error', status_code=400):
    """Standard error response"""
    return jsonify({'success': False, 'message': message}), status_code


def pagination_response(data, page, per_page, total):
    """Paginated response with metadata"""
    return jsonify({
        'success': True,
        'data': data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': (total + per_page - 1) // per_page
        }
    })
