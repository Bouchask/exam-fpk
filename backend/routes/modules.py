from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Module, Filier, Professor
from utils.helpers import success_response, error_response, admin_required

modules_bp = Blueprint('modules', __name__)


@modules_bp.route('/', methods=['GET'])
def get_modules():
    """Get all modules"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    filier_id = request.args.get('filier_id', type=int)
    is_active = request.args.get('is_active', type=bool)
    
    query = Module.query
    
    if filier_id:
        query = query.filter_by(filier_id=filier_id)
    
    if is_active is not None:
        query = query.filter_by(is_active=is_active)
    
    modules = query.order_by(Module.name.asc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    modules_list = [m.to_dict() for m in modules.items]
    
    return {
        'success': True,
        'data': modules_list,
        'pagination': {
            'page': modules.page,
            'per_page': modules.per_page,
            'total': modules.total,
            'total_pages': modules.pages
        }
    }


@modules_bp.route('/<int:module_id>', methods=['GET'])
def get_module(module_id):
    """Get a specific module"""
    module = Module.query.get(module_id)
    
    if not module:
        return error_response('Module not found', 404)
    
    return success_response(module.to_dict())


@modules_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_module():
    """Create a new module (admin only)"""
    data = request.get_json()
    
    required_fields = ['name', 'filier_id', 'professor_id']
    for field in required_fields:
        if field not in data:
            return error_response(f'{field} is required', 400)
    
    name = data.get('name')
    filier_id = data.get('filier_id')
    professor_id = data.get('professor_id')
    
    # Check if filier exists
    filier = Filier.query.get(filier_id)
    if not filier:
        return error_response('Filier not found', 404)
    
    # Check if professor exists
    professor = Professor.query.get(professor_id)
    if not professor:
        return error_response('Professor not found', 404)
    
    # Check if professor and filier are in the same department
    if professor.department_id != filier.department_id:
        return error_response('Professor and Filier must be in the same department', 400)
    
    # Check if module with this name already exists
    if Module.query.filter_by(name=name).first():
        return error_response('Module with this name already exists', 400)
    
    # Check if module with this code already exists
    code = data.get('code')
    if code and Module.query.filter_by(code=code).first():
        return error_response('Module with this code already exists', 400)
    
    # Check if filier has reached max modules
    module_count = Module.query.filter_by(filier_id=filier_id).count()
    if module_count >= filier.max_modules:
        return error_response(
            f'Filier has reached maximum of {filier.max_modules} modules',
            400
        )
    
    # Check if professor has reached max 3 modules
    professor_module_count = Module.query.filter_by(professor_id=professor_id).count()
    if professor_module_count >= 3:
        return error_response('Professor has reached maximum of 3 modules', 400)
    
    module = Module(
        name=name,
        code=code,
        filier_id=filier_id,
        professor_id=professor_id,
        hours=data.get('hours', 45),
        description=data.get('description'),
        is_active=data.get('is_active', True)
    )
    
    try:
        db.session.add(module)
        db.session.commit()
        return success_response(module.to_dict(), 'Module created successfully'), 201
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@modules_bp.route('/<int:module_id>', methods=['PUT', 'PATCH'])
@jwt_required()
@admin_required
def update_module(module_id):
    """Update a module (admin only)"""
    module = Module.query.get(module_id)
    
    if not module:
        return error_response('Module not found', 404)
    
    data = request.get_json()
    
    if not data:
        return error_response('No data provided', 400)
    
    if 'name' in data:
        if Module.query.filter(Module.id != module_id, Module.name == data.get('name')).first():
            return error_response('Module with this name already exists', 400)
        module.name = data.get('name')
    
    if 'code' in data:
        if data.get('code') and Module.query.filter(Module.id != module_id, Module.code == data.get('code')).first():
            return error_response('Module with this code already exists', 400)
        module.code = data.get('code')
    
    if 'filier_id' in data:
        filier = Filier.query.get(data.get('filier_id'))
        if not filier:
            return error_response('Filier not found', 404)
        module.filier_id = data.get('filier_id')
    
    if 'professor_id' in data:
        professor = Professor.query.get(data.get('professor_id'))
        if not professor:
            return error_response('Professor not found', 404)
        
        # Check if professor and filier are in the same department
        # Get the filier_id (either existing or being updated in this request)
        target_filier_id = data.get('filier_id') if 'filier_id' in data else module.filier_id
        if target_filier_id:
            filier = Filier.query.get(target_filier_id)
            if filier and professor.department_id != filier.department_id:
                return error_response('Professor and Filier must be in the same department', 400)
        
        module.professor_id = data.get('professor_id')
    
    if 'hours' in data:
        module.hours = data.get('hours')
    
    if 'description' in data:
        module.description = data.get('description')
    
    if 'is_active' in data:
        module.is_active = data.get('is_active')
    
    try:
        db.session.commit()
        return success_response(module.to_dict(), 'Module updated successfully')
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@modules_bp.route('/<int:module_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_module(module_id):
    """Delete a module (admin only)"""
    module = Module.query.get(module_id)
    
    if not module:
        return error_response('Module not found', 404)
    
    try:
        db.session.delete(module)
        db.session.commit()
        return success_response(None, 'Module deleted successfully')
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@modules_bp.route('/filier/<int:filier_id>', methods=['GET'])
def get_modules_by_filier(filier_id):
    """Get all modules for a specific filier"""
    filier = Filier.query.get(filier_id)
    
    if not filier:
        return error_response('Filier not found', 404)
    
    modules = Module.query.filter_by(filier_id=filier_id).order_by(Module.name.asc()).all()
    
    modules_list = [m.to_dict() for m in modules]
    
    return success_response(modules_list)


@modules_bp.route('/professor/<int:professor_id>', methods=['GET'])
def get_modules_by_professor(professor_id):
    """Get all modules taught by a professor"""
    # Get all filieres the professor is assigned to
    from models import ProfessorFilier
    
    professor = Filier.query.join(
        ProfessorFilier, ProfessorFilier.filier_id == Filier.id
    ).filter(ProfessorFilier.professor_id == professor_id).all()
    
    # Get all modules from those filieres
    filier_ids = [f.id for f in professor]
    modules = Module.query.filter(Module.filier_id.in_(filier_ids)).order_by(Module.name.asc()).all()
    
    modules_list = [m.to_dict() for m in modules]
    
    return success_response(modules_list)
