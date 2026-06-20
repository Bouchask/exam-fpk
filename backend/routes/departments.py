from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import Department, User, Professor
from utils.helpers import success_response, error_response, admin_required, pagination_response

departments_bp = Blueprint('departments', __name__)


@departments_bp.route('/', methods=['GET'])
def get_departments():
    """Get all departments"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    departments = Department.query.order_by(Department.name.asc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    departments_list = [d.to_dict() for d in departments.items]
    
    return pagination_response(
        departments_list,
        page=departments.page,
        per_page=departments.per_page,
        total=departments.total
    )


@departments_bp.route('/<int:department_id>', methods=['GET'])
def get_department(department_id):
    """Get a specific department"""
    department = Department.query.get(department_id)
    
    if not department:
        return error_response('Department not found', 404)
    
    # Include professors in the response
    professors = Professor.query.filter_by(department_id=department_id).all()
    department_data = department.to_dict()
    department_data['professors'] = [p.to_dict() for p in professors]
    
    return success_response(department_data)


@departments_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_department():
    """Create a new department (admin only)"""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return error_response('Name is required', 400)
    
    name = data.get('name')
    
    if Department.query.filter_by(name=name).first():
        return error_response('Department with this name already exists', 400)
    
    head_id = data.get('head_id')
    if head_id:
        head = User.query.get(head_id)
        if not head:
            return error_response('Department head not found', 404)
    
    department = Department(
        name=name,
        code=data.get('code', name[:4].upper()),
        head_id=head_id,
        staff_count=data.get('staff_count', 0)
    )
    
    try:
        from app import db
        db.session.add(department)
        db.session.commit()
        return success_response(department.to_dict(), 'Department created successfully'), 201
    except Exception as e:
        from app import db
        db.session.rollback()
        return error_response(str(e), 500)


@departments_bp.route('/<int:department_id>', methods=['PUT', 'PATCH'])
@jwt_required()
@admin_required
def update_department(department_id):
    """Update a department (admin only)"""
    department = Department.query.get(department_id)
    
    if not department:
        return error_response('Department not found', 404)
    
    data = request.get_json()
    
    if not data:
        return error_response('No data provided', 400)
    
    if 'name' in data:
        if Department.query.filter(Department.id != department_id, Department.name == data.get('name')).first():
            return error_response('Department with this name already exists', 400)
        department.name = data.get('name')
    
    if 'code' in data:
        department.code = data.get('code')
    
    if 'head_id' in data:
        head_id = data.get('head_id')
        if head_id:
            head = User.query.get(head_id)
            if not head:
                return error_response('Department head not found', 404)
        department.head_id = head_id
    
    if 'staff_count' in data:
        department.staff_count = data.get('staff_count')
    
    try:
        from app import db
        db.session.commit()
        return success_response(department.to_dict(), 'Department updated successfully')
    except Exception as e:
        from app import db
        db.session.rollback()
        return error_response(str(e), 500)


@departments_bp.route('/<int:department_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_department(department_id):
    """Delete a department (admin only)"""
    department = Department.query.get(department_id)
    
    if not department:
        return error_response('Department not found', 404)
    
    try:
        from app import db
        db.session.delete(department)
        db.session.commit()
        return success_response(None, 'Department deleted successfully')
    except Exception as e:
        from app import db
        db.session.rollback()
        return error_response(str(e), 500)


@departments_bp.route('/<int:department_id>/professors', methods=['GET'])
def get_department_professors(department_id):
    """Get all professors in a department"""
    department = Department.query.get(department_id)
    
    if not department:
        return error_response('Department not found', 404)
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    professors = Professor.query.filter_by(department_id=department_id).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    professors_list = [p.to_dict() for p in professors.items]
    
    return pagination_response(
        professors_list,
        page=professors.page,
        per_page=professors.per_page,
        total=professors.total
    )


@departments_bp.route('/<int:department_id>/exams', methods=['GET'])
def get_department_exams(department_id):
    """Get all exams for a department"""
    department = Department.query.get(department_id)
    
    if not department:
        return error_response('Department not found', 404)
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    exams = department.exams.paginate(page=page, per_page=per_page, error_out=False)
    
    exams_list = [e.to_dict() for e in exams.items]
    
    return pagination_response(
        exams_list,
        page=exams.page,
        per_page=exams.per_page,
        total=exams.total
    )


@departments_bp.route('/stats', methods=['GET'])
def get_department_stats():
    """Get statistics for all departments"""
    departments = Department.query.all()
    
    stats = []
    for dept in departments:
        professors_count = Professor.query.filter_by(department_id=dept.id).count()
        exams_count = dept.exams.count()
        
        stats.append({
            'department_id': dept.id,
            'department_name': dept.name,
            'department_code': dept.code,
            'professors_count': professors_count,
            'exams_count': exams_count,
            'head': dept.head.full_name if dept.head else None
        })
    
    return success_response(stats)
