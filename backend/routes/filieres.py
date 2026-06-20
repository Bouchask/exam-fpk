from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Filier, Department, Module, Professor, ProfessorFilier
from utils.helpers import success_response, error_response, admin_required

filieres_bp = Blueprint('filieres', __name__)


@filieres_bp.route('/', methods=['GET'])
def get_filieres():
    """Get all filieres (fields of study)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    department_id = request.args.get('department_id', type=int)
    is_active = request.args.get('is_active', type=bool)
    
    query = Filier.query
    
    if department_id:
        query = query.filter_by(department_id=department_id)
    
    if is_active is not None:
        query = query.filter_by(is_active=is_active)
    
    filieres = query.order_by(Filier.name.asc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    filieres_list = [f.to_dict() for f in filieres.items]
    
    return {
        'success': True,
        'data': filieres_list,
        'pagination': {
            'page': filieres.page,
            'per_page': filieres.per_page,
            'total': filieres.total,
            'total_pages': filieres.pages
        }
    }


@filieres_bp.route('/<int:filier_id>', methods=['GET'])
def get_filier(filier_id):
    """Get a specific filier"""
    filier = Filier.query.get(filier_id)
    
    if not filier:
        return error_response('Filier not found', 404)
    
    return success_response(filier.to_dict())


@filieres_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_filier():
    """Create a new filier (admin only)"""
    data = request.get_json()
    
    required_fields = ['name', 'department_id']
    for field in required_fields:
        if field not in data:
            return error_response(f'{field} is required', 400)
    
    name = data.get('name')
    department_id = data.get('department_id')
    
    # Check if department exists
    department = Department.query.get(department_id)
    if not department:
        return error_response('Department not found', 404)
    
    # Check if filier with this name already exists
    if Filier.query.filter_by(name=name).first():
        return error_response('Filier with this name already exists', 400)
    
    # Check if filier with this code already exists
    code = data.get('code')
    if code and Filier.query.filter_by(code=code).first():
        return error_response('Filier with this code already exists', 400)
    
    filier = Filier(
        name=name,
        code=code,
        department_id=department_id,
        max_modules=data.get('max_modules', 7),
        description=data.get('description'),
        is_active=data.get('is_active', True)
    )
    
    try:
        db.session.add(filier)
        db.session.commit()
        return success_response(filier.to_dict(), 'Filier created successfully'), 201
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@filieres_bp.route('/<int:filier_id>', methods=['PUT', 'PATCH'])
@jwt_required()
@admin_required
def update_filier(filier_id):
    """Update a filier (admin only)"""
    filier = Filier.query.get(filier_id)
    
    if not filier:
        return error_response('Filier not found', 404)
    
    data = request.get_json()
    
    if not data:
        return error_response('No data provided', 400)
    
    if 'name' in data:
        if Filier.query.filter(Filier.id != filier_id, Filier.name == data.get('name')).first():
            return error_response('Filier with this name already exists', 400)
        filier.name = data.get('name')
    
    if 'code' in data:
        if data.get('code') and Filier.query.filter(Filier.id != filier_id, Filier.code == data.get('code')).first():
            return error_response('Filier with this code already exists', 400)
        filier.code = data.get('code')
    
    if 'department_id' in data:
        department = Department.query.get(data.get('department_id'))
        if not department:
            return error_response('Department not found', 404)
        filier.department_id = data.get('department_id')
    
    if 'max_modules' in data:
        filier.max_modules = data.get('max_modules')
    
    if 'description' in data:
        filier.description = data.get('description')
    
    if 'is_active' in data:
        filier.is_active = data.get('is_active')
    
    try:
        db.session.commit()
        return success_response(filier.to_dict(), 'Filier updated successfully')
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@filieres_bp.route('/<int:filier_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_filier(filier_id):
    """Delete a filier (admin only)"""
    filier = Filier.query.get(filier_id)
    
    if not filier:
        return error_response('Filier not found', 404)
    
    try:
        db.session.delete(filier)
        db.session.commit()
        return success_response(None, 'Filier deleted successfully')
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@filieres_bp.route('/department/<int:department_id>', methods=['GET'])
def get_filieres_by_department(department_id):
    """Get all filieres for a department"""
    department = Department.query.get(department_id)
    
    if not department:
        return error_response('Department not found', 404)
    
    filieres = Filier.query.filter_by(department_id=department_id).order_by(Filier.name.asc()).all()
    
    filieres_list = [f.to_dict() for f in filieres]
    
    return success_response(filieres_list)


@filieres_bp.route('/<int:filier_id>/modules', methods=['GET'])
def get_filier_modules(filier_id):
    """Get all modules for a filier"""
    filier = Filier.query.get(filier_id)
    
    if not filier:
        return error_response('Filier not found', 404)
    
    modules = Module.query.filter_by(filier_id=filier_id).order_by(Module.name.asc()).all()
    
    modules_list = [m.to_dict() for m in modules]
    
    return success_response(modules_list)


@filieres_bp.route('/<int:filier_id>/professors', methods=['GET'])
def get_filier_professors(filier_id):
    """Get all professors assigned to a filier"""
    filier = Filier.query.get(filier_id)
    
    if not filier:
        return error_response('Filier not found', 404)
    
    # Get professors through the association table
    professors = Professor.query.join(
        ProfessorFilier, (ProfessorFilier.professor_id == Professor.id) & (ProfessorFilier.filier_id == filier_id)
    ).all()
    
    professors_list = [{
        'id': p.id,
        'name': p.user.full_name if p.user else None,
        'email': p.user.email if p.user else None,
        'institutional_grade': p.user.institutional_grade if p.user else None
    } for p in professors]
    
    return success_response(professors_list)


@filieres_bp.route('/<int:filier_id>/professors', methods=['POST'])
@jwt_required()
@admin_required
def assign_professor_to_filier(filier_id):
    """Assign a professor to a filier (admin only)"""
    filier = Filier.query.get(filier_id)
    
    if not filier:
        return error_response('Filier not found', 404)
    
    data = request.get_json()
    professor_id = data.get('professor_id')
    
    if not professor_id:
        return error_response('professor_id is required', 400)
    
    professor = Professor.query.get(professor_id)
    
    if not professor:
        return error_response('Professor not found', 404)
    
    # Check if already assigned
    existing = ProfessorFilier.query.filter_by(
        professor_id=professor_id,
        filier_id=filier_id
    ).first()
    
    if existing:
        return error_response('Professor already assigned to this filier', 400)
    
    assignment = ProfessorFilier(
        professor_id=professor_id,
        filier_id=filier_id
    )
    
    try:
        db.session.add(assignment)
        db.session.commit()
        return success_response(None, 'Professor assigned to filier successfully'), 201
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@filieres_bp.route('/<int:filier_id>/professors/<int:professor_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def remove_professor_from_filier(filier_id, professor_id):
    """Remove a professor from a filier (admin only)"""
    assignment = ProfessorFilier.query.filter_by(
        professor_id=professor_id,
        filier_id=filier_id
    ).first()
    
    if not assignment:
        return error_response('Professor not assigned to this filier', 404)
    
    try:
        db.session.delete(assignment)
        db.session.commit()
        return success_response(None, 'Professor removed from filier successfully')
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)
