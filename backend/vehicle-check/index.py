'''
Business: API проверки транспортных средств по госномеру и VIN через внешний сервис
Args: event - dict с httpMethod, queryStringParameters (license_plate, vin)
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с данными о ТС
'''

import json
import os
from typing import Dict, Any
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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Только GET метод'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters', {}) or {}
    license_plate = params.get('license_plate')
    vin = params.get('vin')
    
    if not license_plate and not vin:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите license_plate или vin'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        query = '''
            SELECT v.id, v.license_plate, v.brand, v.model, v.year, 
                   v.color, v.vin, v.owner_id, v.created_at,
                   d.name as owner_name, d.license_number as owner_license,
                   d.phone as owner_phone,
                   COUNT(f.id) as fines_count,
                   COALESCE(SUM(CASE WHEN f.status = 'Не оплачен' THEN f.amount ELSE 0 END), 0) as unpaid_amount
            FROM vehicles v
            LEFT JOIN drivers d ON v.owner_id = d.id
            LEFT JOIN gibdd_fines f ON v.id = f.vehicle_id
            WHERE 1=1
        '''
        query_params = []
        
        if license_plate:
            query += ' AND v.license_plate ILIKE %s'
            query_params.append(license_plate)
        
        if vin:
            query += ' AND v.vin = %s'
            query_params.append(vin)
        
        query += '''
            GROUP BY v.id, v.license_plate, v.brand, v.model, v.year, 
                     v.color, v.vin, v.owner_id, v.created_at,
                     d.name, d.license_number, d.phone
        '''
        
        cur.execute(query, query_params)
        vehicle = cur.fetchone()
        
        if not vehicle:
            mock_data = {
                'found': False,
                'message': 'ТС не найдено в базе',
                'license_plate': license_plate or None,
                'vin': vin or None,
                'suggestion': 'Добавьте ТС вручную'
            }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(mock_data),
                'isBase64Encoded': False
            }
        
        result = {
            'found': True,
            'id': vehicle['id'],
            'license_plate': vehicle['license_plate'],
            'brand': vehicle['brand'],
            'model': vehicle['model'],
            'year': vehicle['year'],
            'color': vehicle['color'],
            'vin': vehicle['vin'],
            'owner': {
                'id': vehicle['owner_id'],
                'name': vehicle['owner_name'],
                'license_number': vehicle['owner_license'],
                'phone': vehicle['owner_phone']
            } if vehicle['owner_id'] else None,
            'fines': {
                'count': int(vehicle['fines_count']),
                'unpaid_amount': float(vehicle['unpaid_amount'])
            },
            'created_at': str(vehicle['created_at'])
        }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result, default=str),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()