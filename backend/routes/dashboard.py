from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import User, Professor, Department, Exam, Salle, Assignment, Incident, AssignmentHistory
from utils.helpers import success_response, error_response, admin_required, professor_required
from datetime import datetime, timedelta
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_dashboard_overview():
    """Get dashboard overview statistics"""
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    
    if claims.get('role') == 'admin':
        return get_admin_overview()
    else:
        return get_professor_overview(current_user_id)


def get_admin_overview():
    """Admin dashboard overview"""
    # Count statistics
    active_professors = Professor.query.count()
    scheduled_exams = Exam.query.filter_by(status='SCHEDULED').count()
    total_salles = Salle.query.count()
    
    # Calculate allocation rate
    total_assignments = Assignment.query.count()
    total_exams = Exam.query.count()
    allocation_rate = (total_assignments / total_exams * 100) if total_exams > 0 else 0
    
    # Get professors by quota status
    quota_0 = Professor.query.filter_by(completed_guards=0).count()
    quota_1_2 = Professor.query.filter(
        Professor.completed_guards >= 1,
        Professor.completed_guards <= 2
    ).count()
    quota_3 = Professor.query.filter_by(completed_guards=3).count()
    quota_4 = Professor.query.filter_by(completed_guards=4).count()
    
    # Departmental exam load
    departments = Department.query.all()
    dept_exam_load = []
    for dept in departments:
        exam_count = dept.exams.count()
        if exam_count > 0:
            dept_exam_load.append({
                'name': dept.code if dept.code else dept.name[:4],
                'value': exam_count
            })
    
    # Recent exams
    today = datetime.utcnow().date()
    upcoming_exams = Exam.query.filter(
        Exam.date >= today,
        Exam.status != 'CANCELLED'
    ).order_by(Exam.date.asc()).limit(5).all()
    
    # Recent assignments
    recent_assignments = Assignment.query.order_by(Assignment.created_at.desc()).limit(5).all()
    
    return success_response({
        'stats': {
            'active_professors': active_professors,
            'scheduled_exams': scheduled_exams,
            'total_salles': total_salles,
            'allocation_rate': f"{allocation_rate:.0f}%"
        },
        'quota_distribution': {
            '0_guards': quota_0,
            '1_2_guards': quota_1_2,
            '3_guards': quota_3,
            'maxed_4': quota_4
        },
        'department_exam_load': dept_exam_load,
        'upcoming_exams': [e.to_dict() for e in upcoming_exams],
        'recent_assignments': [a.to_dict() for a in recent_assignments]
    })


def get_professor_overview(current_user_id):
    """Professor dashboard overview"""
    professor = Professor.query.filter_by(user_id=current_user_id).first()
    
    if not professor:
        return error_response('Professor profile not found', 404)
    
    # Get next duty
    today = datetime.utcnow().date()
    now = datetime.utcnow().time()
    
    next_assignment = Assignment.query.filter(
        Assignment.professor_id == professor.id,
        Assignment.status != 'CANCELLED'
    ).join(Exam).filter(
        Exam.date > today
    ).order_by(Exam.date.asc(), Exam.start_time.asc()).first()
    
    if not next_assignment:
        next_assignment = Assignment.query.filter(
            Assignment.professor_id == professor.id,
            Assignment.status != 'CANCELLED'
        ).join(Exam).filter(
            Exam.date == today,
            Exam.start_time >= now
        ).order_by(Exam.start_time.asc()).first()
    
    # Get active assignments
    active_assignments = Assignment.query.filter(
        Assignment.professor_id == professor.id,
        Assignment.status != 'CANCELLED'
    ).join(Exam).filter(
        Exam.date >= today
    ).order_by(Exam.date.asc()).all()
    
    # Get recent incidents
    recent_incidents = Incident.query.filter_by(
        professor_id=professor.id
    ).order_by(Incident.reported_date.desc()).limit(3).all()
    
    return success_response({
        'professor': {
            'id': professor.id,
            'name': professor.user.full_name if professor.user else None,
            'department': professor.department.name if professor.department else None,
            'institutional_grade': professor.user.institutional_grade if professor.user else None
        },
        'quota': {
            'status': professor.quota_status,
            'percentage': professor.quota_percentage,
            'is_full': professor.is_quota_full
        },
        'next_duty': next_assignment.to_dict() if next_assignment else None,
        'active_assignments_count': len(active_assignments),
        'active_assignments': [a.to_dict() for a in active_assignments],
        'recent_incidents': [i.to_dict() for i in recent_incidents],
        'system_status': 'SCHEDULE SYNCED'
    })


@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get detailed statistics"""
    claims = get_jwt()
    
    if claims.get('role') == 'admin':
        return get_admin_stats()
    else:
        return get_professor_stats()


def get_admin_stats():
    """Admin detailed statistics"""
    # Department statistics
    departments = Department.query.all()
    dept_stats = []
    for dept in departments:
        professors_count = Professor.query.filter_by(department_id=dept.id).count()
        exams_count = dept.exams.count()
        assignments_count = Assignment.query.filter(
            Assignment.professor_id.in_([p.id for p in Professor.query.filter_by(department_id=dept.id).all()])
        ).count()
        
        dept_stats.append({
            'department': dept.name,
            'professors': professors_count,
            'exams': exams_count,
            'assignments': assignments_count
        })
    
    # Exam type distribution
    exam_types = Exam.query.with_entities(Exam.exam_type, func.count(Exam.id)).group_by(Exam.exam_type).all()
    exam_type_dist = {et.exam_type: et.count for et in exam_types}
    
    # Salle type distribution
    salle_types = Salle.query.with_entities(Salle.type, func.count(Salle.id)).group_by(Salle.type).all()
    salle_type_dist = {st.type: st.count for st in salle_types}
    
    return success_response({
        'department_stats': dept_stats,
        'exam_type_distribution': exam_type_dist,
        'salle_type_distribution': salle_type_dist
    })


def get_professor_stats():
    """Professor detailed statistics"""
    current_user_id = get_jwt_identity()
    professor = Professor.query.filter_by(user_id=current_user_id).first()
    
    if not professor:
        return error_response('Professor profile not found', 404)
    
    # Completed assignments
    completed = AssignmentHistory.query.filter_by(professor_id=professor.id).count()
    
    # Upcoming assignments
    today = datetime.utcnow().date()
    upcoming = Assignment.query.filter(
        Assignment.professor_id == professor.id,
        Assignment.status != 'CANCELLED'
    ).join(Exam).filter(Exam.date >= today).count()
    
    # Incident statistics
    total_incidents = Incident.query.filter_by(professor_id=professor.id).count()
    resolved_incidents = Incident.query.filter_by(
        professor_id=professor.id,
        status='RESOLVED'
    ).count()
    pending_incidents = Incident.query.filter_by(
        professor_id=professor.id,
        status='UNDER REVIEW'
    ).count()
    
    return success_response({
        'completed_assignments': completed,
        'upcoming_assignments': upcoming,
        'incident_stats': {
            'total': total_incidents,
            'resolved': resolved_incidents,
            'pending': pending_incidents
        }
    })


@dashboard_bp.route('/exam-calendar', methods=['GET'])
@jwt_required()
def get_exam_calendar():
    """Get exam calendar data"""
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Exam.query.filter_by(status='SCHEDULED')
    
    # Professors can only see exams they are assigned to
    if claims.get('role') == 'professor':
        professor = Professor.query.filter_by(user_id=current_user_id).first()
        if professor:
            assigned_exam_ids = [a.exam_id for a in Assignment.query.filter_by(professor_id=professor.id).all()]
            query = query.filter(Exam.id.in_(assigned_exam_ids))
    
    if start_date:
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Exam.date >= start)
        except:
            pass
    
    if end_date:
        try:
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Exam.date <= end)
        except:
            pass
    
    exams = query.order_by(Exam.date.asc()).all()
    
    # Format for calendar
    calendar_data = []
    for exam in exams:
        assignments = Assignment.query.filter_by(exam_id=exam.id).all()
        professors = [a.professor.user.full_name for a in assignments if a.professor and a.professor.user]
        
        calendar_data.append({
            'id': exam.id,
            'title': exam.module,
            'start': datetime.combine(exam.date, exam.start_time).isoformat(),
            'end': datetime.combine(exam.date, exam.end_time).isoformat(),
            'room': exam.salle.name if exam.salle else None,
            'type': exam.exam_type,
            'professors': professors,
            'department': exam.department.name if exam.department else None
        })
    
    return success_response(calendar_data)


@dashboard_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get user notifications"""
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    
    if claims.get('role') == 'professor':
        professor = Professor.query.filter_by(user_id=current_user_id).first()
        if not professor:
            return error_response('Professor profile not found', 404)
        
        # Get recent incidents
        incidents = Incident.query.filter_by(
            professor_id=professor.id,
            status='UNDER REVIEW'
        ).order_by(Incident.reported_date.desc()).limit(5).all()
        
        # Get upcoming assignments
        today = datetime.utcnow().date()
        assignments = Assignment.query.filter(
            Assignment.professor_id == professor.id,
            Assignment.status != 'CANCELLED'
        ).join(Exam).filter(Exam.date >= today).order_by(Exam.date.asc()).limit(5).all()
        
        return success_response({
            'incidents': [i.to_dict() for i in incidents],
            'upcoming_assignments': [a.to_dict() for a in assignments]
        })
    else:
        # Admin notifications
        # Recent issues that need attention
        pending_incidents = Incident.query.filter_by(status='UNDER REVIEW').order_by(
            Incident.reported_date.desc()
        ).limit(5).all()
        
        exams_without_professors = Exam.query.filter(
            ~Exam.id.in_([a.exam_id for a in Assignment.query.all()])
        ).order_by(Exam.date.asc()).limit(5).all()
        
        return success_response({
            'pending_incidents': [i.to_dict() for i in pending_incidents],
            'exams_without_professors': [e.to_dict() for e in exams_without_professors]
        })
