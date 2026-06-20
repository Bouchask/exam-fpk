from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import Exam, Salle, Department, Assignment, Professor
from utils.helpers import success_response, error_response, admin_required, pagination_response, validate_date_format, validate_time_format
from datetime import datetime, time

exams_bp = Blueprint('exams', __name__)


@exams_bp.route('/', methods=['GET'])
@jwt_required()
def get_exams():
    """Get all exams"""
    claims = get_jwt()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    salle_id = request.args.get('salle_id', type=int)
    department_id = request.args.get('department_id', type=int)
    exam_type = request.args.get('exam_type')
    status = request.args.get('status')
    
    query = Exam.query
    
    # Professors can only see exams they are assigned to
    if claims.get('role') == 'professor':
        current_user_id = get_jwt_identity()
        professor = Professor.query.filter_by(user_id=current_user_id).first()
        if professor:
            assigned_exam_ids = [a.exam_id for a in Assignment.query.filter_by(professor_id=professor.id).all()]
            query = query.filter(Exam.id.in_(assigned_exam_ids))
    
    if date_from and validate_date_format(date_from):
        query = query.filter(Exam.date >= datetime.strptime(date_from, '%Y-%m-%d').date())
    
    if date_to and validate_date_format(date_to):
        query = query.filter(Exam.date <= datetime.strptime(date_to, '%Y-%m-%d').date())
    
    if salle_id:
        query = query.filter_by(salle_id=salle_id)
    
    if department_id:
        query = query.filter_by(department_id=department_id)
    
    if exam_type:
        query = query.filter_by(exam_type=exam_type)
    
    if status:
        query = query.filter_by(status=status)
    
    exams = query.order_by(Exam.date.asc(), Exam.start_time.asc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    exams_list = [e.to_dict() for e in exams.items]
    
    return pagination_response(
        exams_list,
        page=exams.page,
        per_page=exams.per_page,
        total=exams.total
    )


@exams_bp.route('/<int:exam_id>', methods=['GET'])
@jwt_required()
def get_exam(exam_id):
    """Get a specific exam"""
    exam = Exam.query.get(exam_id)
    
    if not exam:
        return error_response('Exam not found', 404)
    
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    
    # Check access for professors
    if claims.get('role') == 'professor':
        professor = Professor.query.filter_by(user_id=current_user_id).first()
        if not professor:
            return error_response('Professor profile not found', 404)
        
        # Check if professor is assigned to this exam
        assignment = Assignment.query.filter_by(
            professor_id=professor.id, exam_id=exam_id
        ).first()
        
        if not assignment:
            return error_response('Access denied', 403)
    
    # Get assignments for this exam
    assignments = Assignment.query.filter_by(exam_id=exam_id).all()
    exam_data = exam.to_dict()
    exam_data['assignments'] = [a.to_dict() for a in assignments]
    
    return success_response(exam_data)


@exams_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_exam():
    """Create a new exam (admin only)"""
    data = request.get_json()
    
    required_fields = ['module', 'date', 'start_time', 'end_time', 'exam_type', 'salle_id', 'department_id']
    for field in required_fields:
        if field not in data:
            return error_response(f'{field} is required', 400)
    
    # Validate date and time formats
    if not validate_date_format(data.get('date')):
        return error_response('Invalid date format. Use YYYY-MM-DD', 400)
    
    if not validate_time_format(data.get('start_time')):
        return error_response('Invalid start_time format. Use HH:MM', 400)
    
    if not validate_time_format(data.get('end_time')):
        return error_response('Invalid end_time format. Use HH:MM', 400)
    
    salle_id = data.get('salle_id')
    salle = Salle.query.get(salle_id)
    
    if not salle:
        return error_response('Salle not found', 404)
    
    department_id = data.get('department_id')
    department = Department.query.get(department_id)
    
    if not department:
        return error_response('Department not found', 404)
    
    # Parse date and time
    date_obj = datetime.strptime(data.get('date'), '%Y-%m-%d').date()
    start_time = datetime.strptime(data.get('start_time'), '%H:%M').time()
    end_time = datetime.strptime(data.get('end_time'), '%H:%M').time()
    
    # Calculate duration
    start_dt = datetime.combine(date_obj, start_time)
    end_dt = datetime.combine(date_obj, end_time)
    duration_minutes = int((end_dt - start_dt).total_seconds() / 60)
    
    exam = Exam(
        module=data.get('module'),
        module_code=data.get('module_code', ''),
        exam_type=data.get('exam_type'),
        date=date_obj,
        start_time=start_time,
        end_time=end_time,
        duration_minutes=duration_minutes,
        salle_id=salle_id,
        department_id=department_id,
        academic_year=data.get('academic_year', '2025-2026'),
        semester=data.get('semester', 'S2'),
        status=data.get('status', 'SCHEDULED'),
        notes=data.get('notes', '')
    )
    
    try:
        from app import db
        db.session.add(exam)
        db.session.commit()
        return success_response(exam.to_dict(), 'Exam created successfully'), 201
    except Exception as e:
        from app import db
        db.session.rollback()
        return error_response(str(e), 500)


@exams_bp.route('/<int:exam_id>', methods=['PUT', 'PATCH'])
@jwt_required()
@admin_required
def update_exam(exam_id):
    """Update an exam (admin only)"""
    exam = Exam.query.get(exam_id)
    
    if not exam:
        return error_response('Exam not found', 404)
    
    data = request.get_json()
    
    if not data:
        return error_response('No data provided', 400)
    
    if 'module' in data:
        exam.module = data.get('module')
    
    if 'module_code' in data:
        exam.module_code = data.get('module_code')
    
    if 'exam_type' in data:
        exam.exam_type = data.get('exam_type')
    
    if 'date' in data:
        if validate_date_format(data.get('date')):
            exam.date = datetime.strptime(data.get('date'), '%Y-%m-%d').date()
        else:
            return error_response('Invalid date format. Use YYYY-MM-DD', 400)
    
    if 'start_time' in data:
        if validate_time_format(data.get('start_time')):
            exam.start_time = datetime.strptime(data.get('start_time'), '%H:%M').time()
        else:
            return error_response('Invalid start_time format. Use HH:MM', 400)
    
    if 'end_time' in data:
        if validate_time_format(data.get('end_time')):
            exam.end_time = datetime.strptime(data.get('end_time'), '%H:%M').time()
        else:
            return error_response('Invalid end_time format. Use HH:MM', 400)
    
    # Recalculate duration if time changed
    if ('start_time' in data or 'end_time' in data) and exam.date:
        start_dt = datetime.combine(exam.date, exam.start_time)
        end_dt = datetime.combine(exam.date, exam.end_time)
        exam.duration_minutes = int((end_dt - start_dt).total_seconds() / 60)
    
    if 'salle_id' in data:
        salle = Salle.query.get(data.get('salle_id'))
        if not salle:
            return error_response('Salle not found', 404)
        exam.salle_id = data.get('salle_id')
    
    if 'department_id' in data:
        department = Department.query.get(data.get('department_id'))
        if not department:
            return error_response('Department not found', 404)
        exam.department_id = data.get('department_id')
    
    if 'academic_year' in data:
        exam.academic_year = data.get('academic_year')
    
    if 'semester' in data:
        exam.semester = data.get('semester')
    
    if 'status' in data:
        exam.status = data.get('status')
    
    if 'notes' in data:
        exam.notes = data.get('notes')
    
    try:
        from app import db
        db.session.commit()
        return success_response(exam.to_dict(), 'Exam updated successfully')
    except Exception as e:
        from app import db
        db.session.rollback()
        return error_response(str(e), 500)


@exams_bp.route('/<int:exam_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_exam(exam_id):
    """Delete an exam (admin only)"""
    exam = Exam.query.get(exam_id)
    
    if not exam:
        return error_response('Exam not found', 404)
    
    try:
        from app import db
        db.session.delete(exam)
        db.session.commit()
        return success_response(None, 'Exam deleted successfully')
    except Exception as e:
        from app import db
        db.session.rollback()
        return error_response(str(e), 500)


@exams_bp.route('/<int:exam_id>/assign', methods=['POST'])
@jwt_required()
@admin_required
def assign_professor_to_exam(exam_id):
    """Assign a professor to an exam (admin only)"""
    exam = Exam.query.get(exam_id)
    
    if not exam:
        return error_response('Exam not found', 404)
    
    data = request.get_json()
    
    if not data or 'professor_id' not in data:
        return error_response('professor_id is required', 400)
    
    professor_id = data.get('professor_id')
    professor = Professor.query.get(professor_id)
    
    if not professor:
        return error_response('Professor not found', 404)
    
    # Check if already assigned
    existing = Assignment.query.filter_by(
        professor_id=professor_id, exam_id=exam_id
    ).first()
    
    if existing:
        return error_response('Professor already assigned to this exam', 400)
    
    # Check professor quota
    if professor.is_quota_full:
        return error_response('Professor quota is full', 400)
    
    # Check for time conflicts
    professor_assignments = Assignment.query.filter_by(professor_id=professor_id).all()
    for assignment in professor_assignments:
        other_exam = assignment.exam
        if (other_exam.date == exam.date and 
            other_exam.start_time < exam.end_time and 
            other_exam.end_time > exam.start_time):
            return error_response(
                f'Time conflict with exam: {other_exam.module} on {other_exam.date} at {other_exam.time_range}',
                400
            )
    
    assignment = Assignment(
        professor_id=professor_id,
        exam_id=exam_id,
        status=data.get('status', 'CONFIRMED'),
        notes=data.get('notes', '')
    )
    
    try:
        from app import db
        db.session.add(assignment)
        
        # Increment professor's completed guards
        professor.completed_guards += 1
        
        db.session.commit()
        return success_response(
            assignment.to_dict(),
            'Professor assigned to exam successfully'
        ), 201
    except Exception as e:
        from app import db
        db.session.rollback()
        return error_response(str(e), 500)


@exams_bp.route('/<int:exam_id>/assignments', methods=['GET'])
@jwt_required()
def get_exam_assignments(exam_id):
    """Get all professors assigned to an exam"""
    exam = Exam.query.get(exam_id)
    
    if not exam:
        return error_response('Exam not found', 404)
    
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    
    # Check access for professors
    if claims.get('role') == 'professor':
        professor = Professor.query.filter_by(user_id=current_user_id).first()
        if not professor:
            return error_response('Professor profile not found', 404)
        
        # Check if professor is assigned to this exam
        assignment = Assignment.query.filter_by(
            professor_id=professor.id, exam_id=exam_id
        ).first()
        
        if not assignment:
            return error_response('Access denied', 403)
    
    assignments = Assignment.query.filter_by(exam_id=exam_id).all()
    
    assignments_list = [a.to_dict() for a in assignments]
    
    return success_response(assignments_list)


@exams_bp.route('/<int:exam_id>/unassign/<int:professor_id>', methods=['POST'])
@jwt_required()
@admin_required
def unassign_professor(exam_id, professor_id):
    """Remove professor from exam assignment (admin only)"""
    assignment = Assignment.query.filter_by(
        exam_id=exam_id, professor_id=professor_id
    ).first()
    
    if not assignment:
        return error_response('Assignment not found', 404)
    
    try:
        from app import db
        
        # Decrement professor's completed guards
        professor = Professor.query.get(professor_id)
        if professor:
            professor.completed_guards = max(0, professor.completed_guards - 1)
        
        db.session.delete(assignment)
        db.session.commit()
        
        return success_response(None, 'Professor unassigned from exam successfully')
    except Exception as e:
        from app import db
        db.session.rollback()
        return error_response(str(e), 500)


@exams_bp.route('/upcoming', methods=['GET'])
@jwt_required()
def get_upcoming_exams():
    """Get upcoming exams"""
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    today = datetime.utcnow().date()
    
    query = Exam.query.filter(
        Exam.date >= today,
        Exam.status != 'CANCELLED'
    ).order_by(Exam.date.asc(), Exam.start_time.asc())
    
    # Professors can only see exams they are assigned to
    if claims.get('role') == 'professor':
        professor = Professor.query.filter_by(user_id=current_user_id).first()
        if professor:
            assigned_exam_ids = [a.exam_id for a in Assignment.query.filter_by(professor_id=professor.id).all()]
            query = query.filter(Exam.id.in_(assigned_exam_ids))
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    exams = query.paginate(page=page, per_page=per_page, error_out=False)
    
    exams_list = [e.to_dict() for e in exams.items]
    
    return pagination_response(
        exams_list,
        page=exams.page,
        per_page=exams.per_page,
        total=exams.total
    )
