from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Incident, Professor, Assignment, Exam, User
from utils.helpers import success_response, error_response, admin_required, professor_required, pagination_response
from datetime import datetime

incidents_bp = Blueprint('incidents', __name__)


@incidents_bp.route('/', methods=['GET'])
@jwt_required()
def get_incidents():
    """Get all incidents"""
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status')
    severity = request.args.get('severity')
    professor_id = request.args.get('professor_id', type=int)
    incident_type = request.args.get('incident_type')
    
    query = Incident.query
    
    # Professors can only see their own incidents
    if claims.get('role') == 'professor':
        professor = Professor.query.filter_by(user_id=current_user_id).first()
        if professor:
            query = query.filter_by(professor_id=professor.id)
        else:
            return error_response('Professor profile not found', 404)
    
    if status:
        query = query.filter_by(status=status)
    
    if severity:
        query = query.filter_by(severity=severity)
    
    if professor_id:
        query = query.filter_by(professor_id=professor_id)
    
    if incident_type:
        query = query.filter_by(incident_type=incident_type)
    
    incidents = query.order_by(Incident.reported_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    incidents_list = [i.to_dict() for i in incidents.items]
    
    return pagination_response(
        incidents_list,
        page=incidents.page,
        per_page=incidents.per_page,
        total=incidents.total
    )


@incidents_bp.route('/<int:incident_id>', methods=['GET'])
@jwt_required()
def get_incident(incident_id):
    """Get a specific incident"""
    incident = Incident.query.get(incident_id)
    
    if not incident:
        return error_response('Incident not found', 404)
    
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    
    # Check access
    if claims.get('role') == 'professor':
        if incident.professor.user_id != current_user_id:
            return error_response('Access denied', 403)
    
    return success_response(incident.to_dict())


@incidents_bp.route('/', methods=['POST'])
@jwt_required()
@professor_required
def create_incident():
    """Create a new incident"""
    current_user_id = get_jwt_identity()
    professor = Professor.query.filter_by(user_id=current_user_id).first()
    
    if not professor:
        return error_response('Professor profile not found', 404)
    
    data = request.get_json()
    
    required_fields = ['incident_type', 'description']
    for field in required_fields:
        if field not in data:
            return error_response(f'{field} is required', 400)
    
    incident = Incident(
        professor_id=professor.id,
        assignment_id=data.get('assignment_id'),
        incident_type=data.get('incident_type'),
        description=data.get('description'),
        severity=data.get('severity', 'MEDIUM'),
        related_exam_id=data.get('related_exam_id')
    )
    
    try:
        db.session.add(incident)
        db.session.commit()
        return success_response(incident.to_dict(), 'Incident reported successfully'), 201
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@incidents_bp.route('/<int:incident_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_incident(incident_id):
    """Update an incident"""
    incident = Incident.query.get(incident_id)
    
    if not incident:
        return error_response('Incident not found', 404)
    
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    
    # Only admin or the professor can update
    if claims.get('role') == 'professor':
        if incident.professor.user_id != current_user_id:
            return error_response('Access denied', 403)
    
    data = request.get_json()
    
    if not data:
        return error_response('No data provided', 400)
    
    if 'incident_type' in data:
        incident.incident_type = data.get('incident_type')
    
    if 'description' in data:
        incident.description = data.get('description')
    
    if 'severity' in data:
        incident.severity = data.get('severity')
    
    # Only admin can resolve incidents
    if claims.get('role') == 'admin':
        if 'status' in data:
            incident.status = data.get('status')
        if 'resolved_by' in data:
            incident.resolved_by = data.get('resolved_by')
        if 'resolution_notes' in data:
            incident.resolution_notes = data.get('resolution_notes')
        if data.get('status') == 'RESOLVED':
            incident.resolved_date = datetime.utcnow()
            incident.resolved_by = current_user_id
    
    try:
        db.session.commit()
        return success_response(incident.to_dict(), 'Incident updated successfully')
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@incidents_bp.route('/<int:incident_id>/resolve', methods=['POST'])
@jwt_required()
@admin_required
def resolve_incident(incident_id):
    """Resolve an incident (admin only)"""
    incident = Incident.query.get(incident_id)
    
    if not incident:
        return error_response('Incident not found', 404)
    
    data = request.get_json()
    
    incident.status = 'RESOLVED'
    incident.resolved_date = datetime.utcnow()
    incident.resolved_by = get_jwt_identity()
    
    if data and 'resolution_notes' in data:
        incident.resolution_notes = data.get('resolution_notes')
    
    try:
        db.session.commit()
        return success_response(incident.to_dict(), 'Incident resolved successfully')
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@incidents_bp.route('/<int:incident_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_incident(incident_id):
    """Delete an incident (admin only)"""
    incident = Incident.query.get(incident_id)
    
    if not incident:
        return error_response('Incident not found', 404)
    
    try:
        db.session.delete(incident)
        db.session.commit()
        return success_response(None, 'Incident deleted successfully')
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@incidents_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_incident_stats():
    """Get incident statistics"""
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    
    query = Incident.query
    
    # Professors can only see their own stats
    if claims.get('role') == 'professor':
        professor = Professor.query.filter_by(user_id=current_user_id).first()
        if professor:
            query = query.filter_by(professor_id=professor.id)
    
    total = query.count()
    pending = query.filter_by(status='UNDER REVIEW').count()
    resolved = query.filter_by(status='RESOLVED').count()
    critical = query.filter_by(severity='CRITICAL').count()
    high = query.filter_by(severity='HIGH').count()
    medium = query.filter_by(severity='MEDIUM').count()
    low = query.filter_by(severity='LOW').count()
    
    # Get recent incidents
    recent = query.order_by(Incident.reported_date.desc()).limit(5).all()
    
    return success_response({
        'total': total,
        'pending': pending,
        'resolved': resolved,
        'critical': critical,
        'high': high,
        'medium': medium,
        'low': low,
        'recent': [i.to_dict() for i in recent]
    })


@incidents_bp.route('/types', methods=['GET'])
def get_incident_types():
    """Get all unique incident types"""
    types = Incident.query.with_entities(Incident.incident_type).distinct().all()
    return success_response([t.incident_type for t in types if t.incident_type])


@incidents_bp.route('/my', methods=['GET'])
@jwt_required()
@professor_required
def get_my_incidents():
    """Get current user's incidents"""
    current_user_id = get_jwt_identity()
    professor = Professor.query.filter_by(user_id=current_user_id).first()
    
    if not professor:
        return error_response('Professor profile not found', 404)
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status')
    
    query = Incident.query.filter_by(professor_id=professor.id)
    
    if status:
        query = query.filter_by(status=status)
    
    incidents = query.order_by(Incident.reported_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    incidents_list = [i.to_dict() for i in incidents.items]
    
    return pagination_response(
        incidents_list,
        page=incidents.page,
        per_page=incidents.per_page,
        total=incidents.total
    )
