'''
Business: CRUD API для управления штрафами ГИБДД с PostgreSQL
Args: event - dict с httpMethod, body, queryStringParameters, pathParams
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с данными штрафов
'''

import json
import os
from typing import Dict, Any
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            fine_id = event.get('pathParams', {}).get('id')
            
            if fine_id:
                cur.execute('''
                    SELECT id, violation_number, driver_id, vehicle_id, 
                           driver_name, license_plate, violation_type, 
                           violation_date, amount, status, location, 
                           description, payment_date, created_at
                    FROM gibdd_fines WHERE id = %s
                ''', (fine_id,))
                fine = cur.fetchone()
                
                if not fine:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Штраф не найден'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(fine), default=str),
                    'isBase64Encoded': False
                }
            
            params = event.get('queryStringParameters', {}) or {}
            status_filter = params.get('status')
            search = params.get('search')
            
            query = '''
                SELECT id, violation_number, driver_id, vehicle_id, 
                       driver_name, license_plate, violation_type, 
                       violation_date, amount, status, location, 
                       description, payment_date, created_at
                FROM gibdd_fines WHERE 1=1
            '''
            query_params = []
            
            if status_filter:
                query += ' AND status = %s'
                query_params.append(status_filter)
            
            if search:
                query += ''' AND (
                    driver_name ILIKE %s OR 
                    license_plate ILIKE %s OR 
                    violation_number ILIKE %s
                )'''
                search_pattern = f'%{search}%'
                query_params.extend([search_pattern, search_pattern, search_pattern])
            
            query += ' ORDER BY violation_date DESC LIMIT 1000'
            
            cur.execute(query, query_params)
            fines = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(f) for f in fines], default=str),
                'isBase64Encoded': False
            }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            cur.execute('''
                INSERT INTO gibdd_fines (
                    violation_number, driver_id, vehicle_id, driver_name,
                    license_plate, violation_type, violation_date, amount,
                    status, location, description
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, violation_number, driver_name, license_plate,
                          violation_type, violation_date, amount, status,
                          location, description, created_at
            ''', (
                body_data.get('violation_number'),
                body_data.get('driver_id'),
                body_data.get('vehicle_id'),
                body_data.get('driver_name'),
                body_data.get('license_plate'),
                body_data.get('violation_type'),
                body_data.get('violation_date'),
                body_data.get('amount'),
                body_data.get('status', 'Не оплачен'),
                body_data.get('location'),
                body_data.get('description')
            ))
            
            new_fine = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(new_fine), default=str),
                'isBase64Encoded': False
            }
        
        if method == 'PUT':
            fine_id = event.get('pathParams', {}).get('id')
            if not fine_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID штрафа не указан'}),
                    'isBase64Encoded': False
                }
            
            body_data = json.loads(event.get('body', '{}'))
            
            update_fields = []
            update_values = []
            
            for field in ['status', 'amount', 'description', 'payment_date']:
                if field in body_data:
                    update_fields.append(f'{field} = %s')
                    update_values.append(body_data[field])
            
            if not update_fields:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нет полей для обновления'}),
                    'isBase64Encoded': False
                }
            
            update_fields.append('updated_at = CURRENT_TIMESTAMP')
            update_values.append(fine_id)
            
            query = f'''
                UPDATE gibdd_fines 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING id, violation_number, driver_name, license_plate,
                          violation_type, violation_date, amount, status,
                          location, description, payment_date, updated_at
            '''
            
            cur.execute(query, update_values)
            updated_fine = cur.fetchone()
            conn.commit()
            
            if not updated_fine:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Штраф не найден'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(updated_fine), default=str),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
