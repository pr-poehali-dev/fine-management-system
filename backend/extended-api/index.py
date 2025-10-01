'''
Business: Расширенный API для управления историей удалений, парковками и VIN-проверкой
Args: event - dict с httpMethod, body, queryStringParameters, pathParameters
      context - object с attributes: request_id, function_name
Returns: HTTP response dict с данными
'''
import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters', {})
    action = query_params.get('action', 'history') if query_params else 'history'
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        if action == 'history' and method == 'GET':
            try:
                cur.execute("""
                    SELECT id, fine_id, violation_number, driver_name, license_plate,
                           violation_type, violation_date, amount, status, location,
                           description, deleted_by, deleted_at, reason
                    FROM deleted_fines_history
                    ORDER BY deleted_at DESC
                    LIMIT 100
                """)
            except:
                cur.execute("CREATE TABLE IF NOT EXISTS deleted_fines_history (id SERIAL PRIMARY KEY, fine_id INTEGER, violation_number VARCHAR(50), driver_name VARCHAR(255), license_plate VARCHAR(20), violation_type VARCHAR(100), violation_date TIMESTAMP, amount DECIMAL(10, 2), status VARCHAR(50), location VARCHAR(255), description TEXT, deleted_by VARCHAR(100) DEFAULT 'admin', deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, reason VARCHAR(255) DEFAULT 'Удалено через систему')")
                conn.commit()
                cur.execute("SELECT id, fine_id, violation_number, driver_name, license_plate, violation_type, violation_date, amount, status, location, description, deleted_by, deleted_at, reason FROM deleted_fines_history ORDER BY deleted_at DESC LIMIT 100")
            
            rows = cur.fetchall()
            history = []
            for row in rows:
                history.append({
                    'id': row[0],
                    'fineId': row[1],
                    'violationNumber': row[2],
                    'driverName': row[3],
                    'licensePlate': row[4],
                    'violationType': row[5],
                    'violationDate': row[6].isoformat() if row[6] else None,
                    'amount': float(row[7]) if row[7] else 0,
                    'status': row[8],
                    'location': row[9],
                    'description': row[10],
                    'deletedBy': row[11],
                    'deletedAt': row[12].isoformat() if row[12] else None,
                    'reason': row[13]
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'history': history, 'total': len(history)})
            }
        
        if action == 'parking' and method == 'GET':
            try:
                cur.execute("""
                    SELECT id, pass_number, license_plate, driver_name, driver_phone,
                           valid_from, valid_until, parking_zones, status, issued_by, issued_at, notes
                    FROM parking_passes
                    ORDER BY issued_at DESC
                """)
            except:
                cur.execute("CREATE TABLE IF NOT EXISTS parking_passes (id SERIAL PRIMARY KEY, pass_number VARCHAR(50) UNIQUE NOT NULL, license_plate VARCHAR(20) NOT NULL, driver_name VARCHAR(255) NOT NULL, driver_phone VARCHAR(20), valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP, valid_until TIMESTAMP NOT NULL, parking_zones TEXT, status VARCHAR(50) DEFAULT 'Активен', issued_by VARCHAR(100) DEFAULT 'admin', issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, notes TEXT)")
                conn.commit()
                cur.execute("SELECT id, pass_number, license_plate, driver_name, driver_phone, valid_from, valid_until, parking_zones, status, issued_by, issued_at, notes FROM parking_passes ORDER BY issued_at DESC")
            
            rows = cur.fetchall()
            passes = []
            for row in rows:
                passes.append({
                    'id': row[0],
                    'passNumber': row[1],
                    'licensePlate': row[2],
                    'driverName': row[3],
                    'driverPhone': row[4],
                    'validFrom': row[5].isoformat() if row[5] else None,
                    'validUntil': row[6].isoformat() if row[6] else None,
                    'parkingZones': row[7],
                    'status': row[8],
                    'issuedBy': row[9],
                    'issuedAt': row[10].isoformat() if row[10] else None,
                    'notes': row[11]
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'passes': passes, 'total': len(passes)})
            }
        
        if action == 'parking' and method == 'POST':
            body_str = event.get('body', '{}')
            if not body_str or body_str.strip() == '':
                body_str = '{}'
            body_data = json.loads(body_str)
            
            try:
                cur.execute("SELECT 1 FROM parking_passes LIMIT 1")
            except:
                cur.execute("CREATE TABLE IF NOT EXISTS parking_passes (id SERIAL PRIMARY KEY, pass_number VARCHAR(50) UNIQUE NOT NULL, license_plate VARCHAR(20) NOT NULL, driver_name VARCHAR(255) NOT NULL, driver_phone VARCHAR(20), valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP, valid_until TIMESTAMP NOT NULL, parking_zones TEXT, status VARCHAR(50) DEFAULT 'Активен', issued_by VARCHAR(100) DEFAULT 'admin', issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, notes TEXT)")
                conn.commit()
            
            pass_number = body_data.get('passNumber', f"PP{datetime.now().strftime('%Y%m%d%H%M%S')}")
            cur.execute("""
                INSERT INTO parking_passes (pass_number, license_plate, driver_name, driver_phone, valid_until, parking_zones, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                pass_number,
                body_data.get('licensePlate'),
                body_data.get('driverName'),
                body_data.get('driverPhone', ''),
                body_data.get('validUntil'),
                body_data.get('parkingZones', 'Все зоны'),
                body_data.get('notes', '')
            ))
            
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True, 'id': new_id, 'passNumber': pass_number})
            }
        
        if action == 'vin' and method == 'POST':
            body_str = event.get('body', '{}')
            if not body_str or body_str.strip() == '':
                body_str = '{}'
            body_data = json.loads(body_str)
            vin_code = body_data.get('vinCode', '')
            
            try:
                cur.execute("SELECT 1 FROM vehicle_info LIMIT 1")
            except:
                cur.execute("CREATE TABLE IF NOT EXISTS vehicle_info (id SERIAL PRIMARY KEY, vin_code VARCHAR(17) UNIQUE NOT NULL, license_plate VARCHAR(20) NOT NULL, brand VARCHAR(100), model VARCHAR(100), year INTEGER, color VARCHAR(50), owner_name VARCHAR(255), registration_date TIMESTAMP, last_inspection TIMESTAMP, insurance_valid_until TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
                conn.commit()
                cur.execute("INSERT INTO vehicle_info (vin_code, license_plate, brand, model, year, color, owner_name, registration_date, last_inspection, insurance_valid_until) VALUES ('XTA21703050123456', 'А123ВВ777', 'LADA', 'Vesta', 2023, 'Синий', 'Петров Петр Петрович', '2023-03-15', '2024-09-20', '2025-03-15'), ('Z8T4DNFVC8S123789', 'В456СС199', 'Toyota', 'Camry', 2022, 'Черный', 'Иванов Иван Иванович', '2022-05-20', '2024-08-15', '2025-05-20')")
                conn.commit()
            
            cur.execute("""
                SELECT vin_code, license_plate, brand, model, year, color, owner_name,
                       registration_date, last_inspection, insurance_valid_until
                FROM vehicle_info
                WHERE vin_code = %s
            """, (vin_code,))
            
            row = cur.fetchone()
            
            if row:
                vehicle = {
                    'found': True,
                    'vinCode': row[0],
                    'licensePlate': row[1],
                    'brand': row[2],
                    'model': row[3],
                    'year': row[4],
                    'color': row[5],
                    'ownerName': row[6],
                    'registrationDate': row[7].isoformat() if row[7] else None,
                    'lastInspection': row[8].isoformat() if row[8] else None,
                    'insuranceValidUntil': row[9].isoformat() if row[9] else None
                }
            else:
                vehicle = {'found': False, 'message': 'Автомобиль не найден'}
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps(vehicle)
            }
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Invalid action or method'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }