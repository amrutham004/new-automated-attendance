import sqlite3
from pathlib import Path

db_path = Path('backend/data/attendance.db')
if db_path.exists():
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # List tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print('Tables:', [table[0] for table in tables])
    
    # Check students table
    cursor.execute('SELECT COUNT(*) as count FROM students')
    student_count = cursor.fetchone()
    print(f'Students count: {student_count[0]}')
    
    # Check attendance table
    cursor.execute('SELECT COUNT(*) as count FROM attendance')
    attendance_count = cursor.fetchone()
    print(f'Attendance records count: {attendance_count[0]}')
    
    # Sample attendance records
    cursor.execute('SELECT student_id, student_name, date, check_in_time FROM attendance LIMIT 5')
    records = cursor.fetchall()
    print('Recent attendance records:')
    for record in records:
        print(f'  {record}')
    
    conn.close()
else:
    print('Database file does not exist')
