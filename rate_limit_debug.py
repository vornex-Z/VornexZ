import requests
import time
import threading
from concurrent.futures import ThreadPoolExecutor

def test_single_request(url, data, headers, request_id):
    """Make a single request and return the result"""
    try:
        response = requests.post(url, json=data, headers=headers)
        return {
            'id': request_id,
            'status': response.status_code,
            'headers': dict(response.headers),
            'text': response.text[:200] if response.text else ''
        }
    except Exception as e:
        return {
            'id': request_id,
            'status': 'ERROR',
            'error': str(e)
        }

def test_concurrent_rate_limiting():
    """Test rate limiting with concurrent requests"""
    print("🔍 Testing Rate Limiting with Concurrent Requests...")
    
    base_url = "https://vornex-pay.preview.emergentagent.com/api"
    login_url = f"{base_url}/auth/login"
    
    login_data = {
        "cpf": "999.999.999-99",
        "senha": "wrongpassword"
    }
    
    headers = {'Content-Type': 'application/json'}
    
    # Make 10 concurrent requests
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        for i in range(10):
            future = executor.submit(test_single_request, login_url, login_data, headers, i+1)
            futures.append(future)
        
        results = []
        for future in futures:
            result = future.result()
            results.append(result)
    
    # Analyze results
    status_counts = {}
    for result in results:
        status = result['status']
        if status in status_counts:
            status_counts[status] += 1
        else:
            status_counts[status] = 1
        
        print(f"   Request {result['id']}: Status {status}")
        if 'X-RateLimit' in str(result.get('headers', {})):
            print(f"      Rate limit headers found")
    
    print(f"\n   Status Code Summary: {status_counts}")
    
    if 429 in status_counts:
        print(f"   ✅ Rate limiting working: {status_counts.get(429, 0)} requests rate limited")
        return True
    else:
        print(f"   ❌ Rate limiting not working: No 429 responses")
        return False

def test_sequential_rate_limiting():
    """Test rate limiting with sequential requests"""
    print("🔍 Testing Rate Limiting with Sequential Requests...")
    
    base_url = "https://vornex-pay.preview.emergentagent.com/api"
    login_url = f"{base_url}/auth/login"
    
    login_data = {
        "cpf": "999.999.999-99",
        "senha": "wrongpassword"
    }
    
    headers = {'Content-Type': 'application/json'}
    
    results = []
    for i in range(8):  # Test with 8 requests (limit is 5/minute)
        try:
            response = requests.post(login_url, json=login_data, headers=headers)
            result = {
                'id': i+1,
                'status': response.status_code,
                'headers': dict(response.headers),
                'text': response.text[:100] if response.text else ''
            }
            results.append(result)
            print(f"   Request {i+1}: Status {response.status_code}")
            
            # Check for rate limit headers
            rate_limit_headers = [h for h in response.headers.keys() if 'rate' in h.lower() or 'limit' in h.lower()]
            if rate_limit_headers:
                print(f"      Rate limit headers: {rate_limit_headers}")
            
        except Exception as e:
            print(f"   Request {i+1}: Error - {str(e)}")
        
        time.sleep(0.1)  # Small delay
    
    # Analyze results
    status_counts = {}
    for result in results:
        status = result['status']
        status_counts[status] = status_counts.get(status, 0) + 1
    
    print(f"\n   Status Code Summary: {status_counts}")
    
    if 429 in status_counts:
        print(f"   ✅ Rate limiting working: {status_counts.get(429, 0)} requests rate limited")
        return True
    else:
        print(f"   ❌ Rate limiting not working: No 429 responses")
        return False

def main():
    print("🚀 Rate Limiting Debug Test")
    print("=" * 40)
    
    # Test both approaches
    sequential_result = test_sequential_rate_limiting()
    print()
    concurrent_result = test_concurrent_rate_limiting()
    
    print("\n" + "=" * 40)
    print("📊 DEBUG RESULTS:")
    print(f"Sequential test: {'PASSED' if sequential_result else 'FAILED'}")
    print(f"Concurrent test: {'PASSED' if concurrent_result else 'FAILED'}")

if __name__ == "__main__":
    main()