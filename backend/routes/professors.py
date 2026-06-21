from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, User, Professor, Department, Assignment, Exam
from utils.helpers import success_response, error_response, admin_required, professor_required, pagination_response
from config import config

professors_bp = Blueprint('professors', __name__)


@professors_bp.route('/', methods=['GET'])
@professors_bp.route('', methods=['GET'])
@jwt_required()
def get_professors():
    """Get all professors (admin only)"""
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    
    # Only admin can see all professors
    if claims.get('role') != 'admin':
        # Professors can only see themselves
        professor = Professor.query.filter_by(user_id=current_user_id).first()
        if not professor:
            return error_response('Professor not found', 404)
        return success_response([professor.to_dict()])
    
    # Admin: Get all professors with pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    department_id = request.args.get('department_id', type=int)
    
    query = Professor.query
    
    if department_id:
        query = query.filter_by(department_id=department_id)
    
    professors = query.paginate(page=page, per_page=per_page, error_out=False)
    
    professors_list = [p.to_dict() for p in professors.items]
    
    return pagination_response(
        professors_list,
        page=professors.page,
        per_page=professors.per_page,
        total=professors.total
    )


@professors_bp.route('/<int:professor_id>', methods=['GET'])
@jwt_required()
def get_professor(professor_id):
    """Get a specific professor"""
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    
    professor = Professor.query.get(professor_id)
    
    if not professor:
        return error_response('Professor not found', 404)
    
    # Check access: admin can see all, professor can only see themselves
    if claims.get('role') != 'admin' and professor.user_id != current_user_id:
        return error_response('Access denied', 403)
    
    return success_response(professor.to_dict())


@professors_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_professor():
    """Create a new professor (admin only)"""
    data = request.get_json()
    
    required_fields = ['user_id', 'department_id']
    for field in required_fields:
        if field not in data:
            return error_response(f'{field} is required', 400)
    
    user_id = data.get('user_id')
    user = User.query.get(user_id)
    
    if not user:
        return error_response('User not found', 404)
    
    if user.role != 'professor':
        return error_response('User must have professor role', 400)
    
    if Professor.query.filter_by(user_id=user_id).first():
        return error_response('Professor profile already exists for this user', 400)
    
    department_id = data.get('department_id')
    department = Department.query.get(department_id)
    
    if not department:
        return error_response('Department not found', 404)
    
    professor = Professor(
        user_id=user_id,
        department_id=department_id,
        academic_title=data.get('academic_title', 'PR'),
        max_guards=data.get('max_guards', 4),
        completed_guards=data.get('completed_guards', 0)
    )
    
    try:
        db.session.add(professor)
        db.session.commit()
        return success_response(professor.to_dict(), 'Professor created successfully'), 201
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@professors_bp.route('/<int:professor_id>', methods=['PUT', 'PATCH'])
@jwt_required()
@admin_required
def update_professor(professor_id):
    """Update a professor (admin only)"""
    print(f'[DEBUG] Professor update request received for professor_id: {professor_id}')
    professor = Professor.query.get(professor_id)
    
    if not professor:
        print(f'[DEBUG] Professor not found: {professor_id}')
        return error_response('Professor not found', 404)
    
    data = request.get_json()
    print(f'[DEBUG] Professor update data: {data}')
    
    if not data:
        print(f'[DEBUG] No data provided for professor update')
        return error_response('No data provided', 400)
    
    if 'department_id' in data:
        department = Department.query.get(data.get('department_id'))
        if not department:
            return error_response('Department not found', 404)
        professor.department_id = data.get('department_id')
    
    if 'academic_title' in data:
        professor.academic_title = data.get('academic_title')
    
    if 'max_guards' in data:
        professor.max_guards = data.get('max_guards')
    
    if 'completed_guards' in data:
        professor.completed_guards = data.get('completed_guards')
    
    try:
        db.session.commit()
        return success_response(professor.to_dict(), 'Professor updated successfully')
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@professors_bp.route('/<int:professor_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_professor(professor_id):
    """Delete a professor (admin only)"""
    professor = Professor.query.get(professor_id)
    
    if not professor:
        return error_response('Professor not found', 404)
    
    try:
        db.session.delete(professor)
        db.session.commit()
        return success_response(None, 'Professor deleted successfully')
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@professors_bp.route('/<int:professor_id>/assignments', methods=['GET'])
@jwt_required()
def get_professor_assignments(professor_id):
    """Get all assignments for a professor"""
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    
    professor = Professor.query.get(professor_id)
    
    if not professor:
        return error_response('Professor not found', 404)
    
    # Check access
    if claims.get('role') != 'admin' and professor.user_id != current_user_id:
        return error_response('Access denied', 403)
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status')
    
    query = Assignment.query.filter_by(professor_id=professor_id)
    
    if status:
        query = query.filter_by(status=status)
    
    assignments = query.paginate(page=page, per_page=per_page, error_out=False)
    
    assignments_list = [a.to_dict() for a in assignments.items]
    
    return pagination_response(
        assignments_list,
        page=assignments.page,
        per_page=assignments.per_page,
        total=assignments.total
    )


@professors_bp.route('/<int:professor_id>/quota', methods=['GET'])
@jwt_required()
def get_professor_quota(professor_id):
    """Get quota information for a professor"""
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    
    professor = Professor.query.get(professor_id)
    
    if not professor:
        return error_response('Professor not found', 404)
    
    # Check access
    if claims.get('role') != 'admin' and professor.user_id != current_user_id:
        return error_response('Access denied', 403)
    
    return success_response({
        'professor_id': professor.id,
        'name': professor.user.full_name if professor.user else None,
        'max_guards': professor.max_guards,
        'completed_guards': professor.completed_guards,
        'quota_status': professor.quota_status,
        'quota_percentage': professor.quota_percentage,
        'is_quota_full': professor.is_quota_full
    })


@professors_bp.route('/<int:professor_id>/quota/reset', methods=['POST'])
@jwt_required()
@admin_required
def reset_professor_quota(professor_id):
    """Reset professor quota (admin only)"""
    professor = Professor.query.get(professor_id)
    
    if not professor:
        return error_response('Professor not found', 404)
    
    professor.completed_guards = 0
    
    try:
        db.session.commit()
        return success_response({
            'message': 'Quota reset successfully',
            'new_quota': professor.quota_status
        })
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@professors_bp.route('/me/assignments', methods=['GET'])
@jwt_required()
@professor_required
def get_my_assignments():
    """Get current user's assignments"""
    current_user_id = get_jwt_identity()
    professor = Professor.query.filter_by(user_id=current_user_id).first()
    
    if not professor:
        return error_response('Professor profile not found', 404)
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status')
    
    query = Assignment.query.filter_by(professor_id=professor.id)
    
    if status:
        query = query.filter_by(status=status)
    
    assignments = query.order_by(Exam.date.asc()).paginate(page=page, per_page=per_page, error_out=False)
    
    assignments_list = [a.to_dict() for a in assignments.items]
    
    return pagination_response(
        assignments_list,
        page=assignments.page,
        per_page=assignments.per_page,
        total=assignments.total
    )
