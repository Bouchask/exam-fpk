from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import Assignment, Professor, Exam, Incident, AssignmentHistory
from utils.helpers import success_response, error_response, admin_required, professor_required, pagination_response
from datetime import datetime

assignments_bp = Blueprint('assignments', __name__)


@assignments_bp.route('/', methods=['GET'])
@jwt_required()
def get_assignments():
    """Get all assignments"""
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status')
    professor_id = request.args.get('professor_id', type=int)
    exam_id = request.args.get('exam_id', type=int)
    
    query = Assignment.query
    
    # Professors can only see their own assignments
    if claims.get('role') == 'professor':
        professor = Professor.query.filter_by(user_id=current_user_id).first()
        if professor:
            query = query.filter_by(professor_id=professor.id)
        else:
            return error_response('Professor profile not found', 404)
    
    if status:
        query = query.filter_by(status=status)
    
    if professor_id:
        query = query.filter_by(professor_id=professor_id)
    
    if exam_id:
        query = query.filter_by(exam_id=exam_id)
    
    assignments = query.order_by(Exam.date.asc(), Exam.start_time.asc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    assignments_list = [a.to_dict() for a in assignments.items]
    
    return pagination_response(
        assignments_list,
        page=assignments.page,
        per_page=assignments.per_page,
        total=assignments.total
    )


@assignments_bp.route('/<int:assignment_id>', methods=['GET'])
@jwt_required()
def get_assignment(assignment_id):
    """Get a specific assignment"""
    assignment = Assignment.query.get(assignment_id)
    
    if not assignment:
        return error_response('Assignment not found', 404)
    
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    
    # Check access for professors
    if claims.get('role') == 'professor':
        if assignment.professor.user_id != current_user_id:
            return error_response('Access denied', 403)
    
    # Include incidents for this assignment
    incidents = Incident.query.filter_by(assignment_id=assignment_id).all()
    assignment_data = assignment.to_dict()
    assignment_data['incidents'] = [i.to_dict() for i in incidents]
    
    return success_response(assignment_data)


@assignments_bp.route('/<int:assignment_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_assignment(assignment_id):
    """Update an assignment"""
    assignment = Assignment.query.get(assignment_id)
    
    if not assignment:
        return error_response('Assignment not found', 404)
    
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    
    # Check access
    if claims.get('role') == 'professor':
        if assignment.professor.user_id != current_user_id:
            return error_response('Access denied', 403)
    
    data = request.get_json()
    
    if not data:
        return error_response('No data provided', 400)
    
    # Only admin or the professor can update status
    if 'status' in data:
        if claims.get('role') != 'admin' and data.get('status') != 'CONFIRMED':
            return error_response('Only admin can change status from CONFIRMED', 403)
        assignment.status = data.get('status')
    
    if 'notes' in data:
        assignment.notes = data.get('notes')
    
    try:
        from app import db
        db.session.commit()
        return success_response(assignment.to_dict(), 'Assignment updated successfully')
    except Exception as e:
        from app import db
        db.session.rollback()
        return error_response(str(e), 500)


@assignments_bp.route('/<int:assignment_id>/complete', methods=['POST'])
@jwt_required()
@professor_required
def complete_assignment(assignment_id):
    """Mark an assignment as completed by professor"""
    assignment = Assignment.query.get(assignment_id)
    
    if not assignment:
        return error_response('Assignment not found', 404)
    
    current_user_id = get_jwt_identity()
    
    if assignment.professor.user_id != current_user_id:
        return error_response('Access denied', 403)
    
    # Create history record
    history = AssignmentHistory(
        assignment_id=assignment_id,
        professor_id=assignment.professor_id,
        exam_id=assignment.exam_id,
        completion_date=datetime.utcnow(),
        status='COMPLETED',
        notes=f'Completed by {assignment.professor.user.full_name}'
    )
    
    try:
        from app import db
        db.session.add(history)
        db.session.commit()
        
        return success_response({
            'assignment': assignment.to_dict(),
            'history': history.to_dict()
        }, 'Assignment marked as completed')
    except Exception as e:
        from app import db
        db.session.rollback()
        return error_response(str(e), 500)


@assignments_bp.route('/<int:assignment_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_assignment(assignment_id):
    """Delete an assignment (admin only)"""
    assignment = Assignment.query.get(assignment_id)
    
    if not assignment:
        return error_response('Assignment not found', 404)
    
    try:
        from app import db
        
        # Decrement professor's completed guards
        professor = Professor.query.get(assignment.professor_id)
        if professor:
            professor.completed_guards = max(0, professor.completed_guards - 1)
        
        db.session.delete(assignment)
        db.session.commit()
        
        return success_response(None, 'Assignment deleted successfully')
    except Exception as e:
        from app import db
        db.session.rollback()
        return error_response(str(e), 500)


@assignments_bp.route('/<int:assignment_id>/incidents', methods=['GET'])
@jwt_required()
def get_assignment_incidents(assignment_id):
    """Get all incidents for an assignment"""
    assignment = Assignment.query.get(assignment_id)
    
    if not assignment:
        return error_response('Assignment not found', 404)
    
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    
    # Check access
    if claims.get('role') == 'professor':
        if assignment.professor.user_id != current_user_id:
            return error_response('Access denied', 403)
    
    incidents = Incident.query.filter_by(assignment_id=assignment_id).all()
    
    incidents_list = [i.to_dict() for i in incidents]
    
    return success_response(incidents_list)


@assignments_bp.route('/<int:assignment_id>/incidents', methods=['POST'])
@jwt_required()
@professor_required
def create_incident(assignment_id):
    """Create an incident for an assignment"""
    assignment = Assignment.query.get(assignment_id)
    
    if not assignment:
        return error_response('Assignment not found', 404)
    
    current_user_id = get_jwt_identity()
    
    if assignment.professor.user_id != current_user_id:
        return error_response('Access denied', 403)
    
    data = request.get_json()
    
    if not data or 'incident_type' not in data or 'description' not in data:
        return error_response('incident_type and description are required', 400)
    
    incident = Incident(
        professor_id=assignment.professor_id,
        assignment_id=assignment_id,
        incident_type=data.get('incident_type'),
        description=data.get('description'),
        severity=data.get('severity', 'MEDIUM'),
        related_exam_id=assignment.exam_id
    )
    
    try:
        from app import db
        db.session.add(incident)
        db.session.commit()
        return success_response(incident.to_dict(), 'Incident reported successfully'), 201
    except Exception as e:
        from app import db
        db.session.rollback()
        return error_response(str(e), 500)


@assignments_bp.route('/my/upcoming', methods=['GET'])
@jwt_required()
@professor_required
def get_my_upcoming_assignments():
    """Get current user's upcoming assignments"""
    current_user_id = get_jwt_identity()
    professor = Professor.query.filter_by(user_id=current_user_id).first()
    
    if not professor:
        return error_response('Professor profile not found', 404)
    
    today = datetime.utcnow().date()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    assignments = Assignment.query.filter(
        Assignment.professor_id == professor.id,
        Assignment.status != 'CANCELLED'
    ).join(Exam).filter(
        Exam.date >= today
    ).order_by(Exam.date.asc(), Exam.start_time.asc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    assignments_list = [a.to_dict() for a in assignments.items]
    
    return pagination_response(
        assignments_list,
        page=assignments.page,
        per_page=assignments.per_page,
        total=assignments.total
    )


@assignments_bp.route('/my/history', methods=['GET'])
@jwt_required()
@professor_required
def get_my_assignment_history():
    """Get current user's assignment history"""
    current_user_id = get_jwt_identity()
    professor = Professor.query.filter_by(user_id=current_user_id).first()
    
    if not professor:
        return error_response('Professor profile not found', 404)
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    history = AssignmentHistory.query.filter_by(professor_id=professor.id).order_by(
        AssignmentHistory.completion_date.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)
    
    history_list = [h.to_dict() for h in history.items]
    
    return pagination_response(
        history_list,
        page=history.page,
        per_page=history.per_page,
        total=history.total
    )


@assignments_bp.route('/my/next', methods=['GET'])
@jwt_required()
@professor_required
def get_my_next_assignment():
    """Get the next upcoming assignment for current user"""
    current_user_id = get_jwt_identity()
    professor = Professor.query.filter_by(user_id=current_user_id).first()
    
    if not professor:
        return error_response('Professor profile not found', 404)
    
    today = datetime.utcnow().date()
    now = datetime.utcnow().time()
    
    next_assignment = Assignment.query.filter(
        Assignment.professor_id == professor.id,
        Assignment.status != 'CANCELLED'
    ).join(Exam).filter(
        Exam.date > today
    ).order_by(Exam.date.asc(), Exam.start_time.asc()).first()
    
    if not next_assignment:
        # Check for today's assignments
        next_assignment = Assignment.query.filter(
            Assignment.professor_id == professor.id,
            Assignment.status != 'CANCELLED'
        ).join(Exam).filter(
            Exam.date == today,
            Exam.start_time >= now
        ).order_by(Exam.start_time.asc()).first()
    
    if next_assignment:
        return success_response(next_assignment.to_dict())
    else:
        return success_response(None, 'No upcoming assignments')
