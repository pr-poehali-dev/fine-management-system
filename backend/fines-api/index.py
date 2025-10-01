'''
Business: API для управления штрафами ГИБДД (получение, удаление)
Args: event - dict с httpMethod, body, queryStringParameters
      context - object с attributes: request_id, function_name
Returns: HTTP response dict с данными штрафов
'''
import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        if method == 'GET':
            cur.execute("""
                SELECT id, violation_number, driver_name, license_plate, 
                       violation_type, violation_date, amount, status, 
                       location, description, created_at
                FROM fines
                ORDER BY violation_date DESC
            """)
            
            rows = cur.fetchall()
            fines = []
            for row in rows:
                fines.append({
                    'id': row[0],
                    'violationNumber': row[1],
                    'driverName': row[2],
                    'licensePlate': row[3],
                    'violationType': row[4],
                    'violationDate': row[5].isoformat() if row[5] else None,
                    'amount': float(row[6]),
                    'status': row[7],
                    'location': row[8],
                    'description': row[9],
                    'createdAt': row[10].isoformat() if row[10] else None
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'fines': fines})
            }
        
        if method == 'DELETE':
            params = event.get('queryStringParameters', {})
            fine_id = params.get('id')
            
            if not fine_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'ID штрафа обязателен'})
                }
            
            cur.execute("DELETE FROM fines WHERE id = %s", (fine_id,))
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'success': True, 'message': 'Штраф удален'})
            }
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }
