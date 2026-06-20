from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import Salle, Exam
from utils.helpers import success_response, error_response, admin_required, pagination_response

salles_bp = Blueprint('salles', __name__)


@salles_bp.route('/', methods=['GET'])
def get_salles():
    """Get all salles/rooms"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    type_filter = request.args.get('type')
    building = request.args.get('building')
    is_active = request.args.get('is_active', type=bool)
    
    query = Salle.query
    
    if type_filter:
        query = query.filter_by(type=type_filter)
    
    if building:
        query = query.filter_by(building=building)
    
    if is_active is not None:
        query = query.filter_by(is_active=is_active)
    
    salles = query.order_by(Salle.name.asc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    salles_list = [s.to_dict() for s in salles.items]
    
    return pagination_response(
        salles_list,
        page=salles.page,
        per_page=salles.per_page,
        total=salles.total
    )


@salles_bp.route('/<int:salle_id>', methods=['GET'])
def get_salle(salle_id):
    """Get a specific salle"""
    salle = Salle.query.get(salle_id)
    
    if not salle:
        return error_response('Salle not found', 404)
    
    # Include exams in this salle
    exams = Exam.query.filter_by(salle_id=salle_id).all()
    salle_data = salle.to_dict()
    salle_data['exams'] = [e.to_dict() for e in exams]
    
    return success_response(salle_data)


@salles_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_salle():
    """Create a new salle (admin only)"""
    data = request.get_json()
    
    required_fields = ['name', 'code']
    for field in required_fields:
        if field not in data:
            return error_response(f'{field} is required', 400)
    
    name = data.get('name')
    code = data.get('code')
    
    if Salle.query.filter_by(name=name).first():
        return error_response('Salle with this name already exists', 400)
    
    if Salle.query.filter_by(code=code).first():
        return error_response('Salle with this code already exists', 400)
    
    salle = Salle(
        name=name,
        code=code,
        capacity=data.get('capacity', 50),
        type=data.get('type', 'SALLE'),
        floor=data.get('floor', '1'),
        building=data.get('building', 'Main'),
        is_active=data.get('is_active', True)
    )
    
    try:
        from app import db
        db.session.add(salle)
        db.session.commit()
        return success_response(salle.to_dict(), 'Salle created successfully'), 201
    except Exception as e:
        from app import db
        db.session.rollback()
        return error_response(str(e), 500)


@salles_bp.route('/<int:salle_id>', methods=['PUT', 'PATCH'])
@jwt_required()
@admin_required
def update_salle(salle_id):
    """Update a salle (admin only)"""
    salle = Salle.query.get(salle_id)
    
    if not salle:
        return error_response('Salle not found', 404)
    
    data = request.get_json()
    
    if not data:
        return error_response('No data provided', 400)
    
    if 'name' in data:
        if Salle.query.filter(Salle.id != salle_id, Salle.name == data.get('name')).first():
            return error_response('Salle with this name already exists', 400)
        salle.name = data.get('name')
    
    if 'code' in data:
        if Salle.query.filter(Salle.id != salle_id, Salle.code == data.get('code')).first():
            return error_response('Salle with this code already exists', 400)
        salle.code = data.get('code')
    
    if 'capacity' in data:
        salle.capacity = data.get('capacity')
    
    if 'type' in data:
        salle.type = data.get('type')
    
    if 'floor' in data:
        salle.floor = data.get('floor')
    
    if 'building' in data:
        salle.building = data.get('building')
    
    if 'is_active' in data:
        salle.is_active = data.get('is_active')
    
    try:
        from app import db
        db.session.commit()
        return success_response(salle.to_dict(), 'Salle updated successfully')
    except Exception as e:
        from app import db
        db.session.rollback()
        return error_response(str(e), 500)


@salles_bp.route('/<int:salle_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_salle(salle_id):
    """Delete a salle (admin only)"""
    salle = Salle.query.get(salle_id)
    
    if not salle:
        return error_response('Salle not found', 404)
    
    try:
        from app import db
        db.session.delete(salle)
        db.session.commit()
        return success_response(None, 'Salle deleted successfully')
    except Exception as e:
        from app import db
        db.session.rollback()
        return error_response(str(e), 500)


@salles_bp.route('/<int:salle_id>/exams', methods=['GET'])
def get_salle_exams(salle_id):
    """Get all exams in a salle"""
    salle = Salle.query.get(salle_id)
    
    if not salle:
        return error_response('Salle not found', 404)
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    exams = Exam.query.filter_by(salle_id=salle_id).order_by(Exam.date.asc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    exams_list = [e.to_dict() for e in exams.items]
    
    return pagination_response(
        exams_list,
        page=exams.page,
        per_page=exams.per_page,
        total=exams.total
    )


@salles_bp.route('/types', methods=['GET'])
def get_salle_types():
    """Get all unique salle types"""
    types = Salle.query.with_entities(Salle.type).distinct().all()
    return success_response([t.type for t in types if t.type])


@salles_bp.route('/buildings', methods=['GET'])
def get_buildings():
    """Get all unique buildings"""
    buildings = Salle.query.with_entities(Salle.building).distinct().all()
    return success_response([b.building for b in buildings if b.building])
