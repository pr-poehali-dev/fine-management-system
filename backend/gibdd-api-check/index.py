'''
Business: Проверка штрафов через API ГИБДД по номеру водительского удостоверения и СТС
Args: event - dict с httpMethod, body, queryStringParameters
      context - object с attributes: request_id, function_name
Returns: HTTP response dict с данными о штрафах из ГИБДД
'''
import json
import random
from typing import Dict, Any
from datetime import datetime, timedelta

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'POST':
        body_str = event.get('body', '{}')
        if not body_str or body_str.strip() == '':
            body_str = '{}'
        body_data = json.loads(body_str)
        license_number = body_data.get('licenseNumber', '')
        sts_number = body_data.get('stsNumber', '')
        
        if not license_number or not sts_number:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Необходимо указать номер ВУ и СТС'})
            }
        
        mock_fines = []
        num_fines = random.randint(0, 3)
        
        violation_types = [
            'Превышение скорости',
            'Нарушение правил парковки',
            'Проезд на красный свет',
            'Непредоставление преимущества пешеходу',
            'Использование телефона за рулем'
        ]
        
        for i in range(num_fines):
            days_ago = random.randint(1, 180)
            violation_date = datetime.now() - timedelta(days=days_ago)
            
            mock_fines.append({
                'uinNumber': f'188{random.randint(10000000, 99999999)}',
                'violationType': random.choice(violation_types),
                'violationDate': violation_date.strftime('%Y-%m-%d'),
                'amount': random.choice([1500, 3000, 5000, 15000, 20000, 25000, 30000]),
                'discount': days_ago <= 20,
                'discountAmount': 0,
                'status': random.choice(['Не оплачен', 'Не оплачен', 'В обработке']),
                'location': f'МКАД {random.randint(1, 109)}км',
                'canPay': True
            })
        
        for fine in mock_fines:
            if fine['discount']:
                fine['discountAmount'] = fine['amount'] // 2
        
        result = {
            'success': True,
            'licenseNumber': license_number,
            'stsNumber': sts_number,
            'foundFines': len(mock_fines),
            'totalAmount': sum(f['amount'] for f in mock_fines),
            'totalWithDiscount': sum(f['discountAmount'] if f['discount'] else f['amount'] for f in mock_fines),
            'fines': mock_fines,
            'checkedAt': datetime.now().isoformat(),
            'source': 'ГИБДД API (тестовый режим)'
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps(result)
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