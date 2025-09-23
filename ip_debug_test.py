import requests
import time

def test_ip_detection():
    """Test what IP addresses are being detected by the rate limiter"""
    print("🔍 Testing IP Detection for Rate Limiting...")
    
    base_url = "https://pix-wallet.preview.emergentagent.com/api"
    
    # Make several requests and see if we can detect patterns
    for i in range(5):
        try:
            response = requests.post(f"{base_url}/auth/login", 
                                   json={"cpf": "999.999.999-99", "senha": "wrong"}, 
                                   headers={'Content-Type': 'application/json'})
            
            print(f"Request {i+1}: Status {response.status_code}")
            
            # Check for any rate limiting headers
            for header, value in response.headers.items():
                if any(keyword in header.lower() for keyword in ['rate', 'limit', 'retry']):
                    print(f"   Rate limit header: {header}: {value}")
            
            # Check response content for any rate limit info
            if response.status_code == 429:
                print(f"   Rate limited! Response: {response.text}")
            
        except Exception as e:
            print(f"Request {i+1}: Error - {str(e)}")
        
        time.sleep(0.5)  # Wait between requests

def test_rapid_requests():
    """Test with very rapid requests to trigger rate limiting"""
    print("\n🔍 Testing Rapid Requests...")
    
    base_url = "https://pix-wallet.preview.emergentagent.com/api"
    
    # Make 10 very rapid requests
    for i in range(10):
        try:
            response = requests.post(f"{base_url}/auth/login", 
                                   json={"cpf": "999.999.999-99", "senha": "wrong"}, 
                                   headers={'Content-Type': 'application/json'})
            
            print(f"Rapid request {i+1}: Status {response.status_code}")
            
            if response.status_code == 429:
                print(f"   ✅ Rate limited at request {i+1}")
                return True
            
        except Exception as e:
            print(f"Rapid request {i+1}: Error - {str(e)}")
        
        # No delay for rapid testing
    
    print("   ❌ No rate limiting detected in rapid requests")
    return False

def main():
    print("🚀 IP Detection and Rate Limiting Debug")
    print("=" * 50)
    
    test_ip_detection()
    rapid_result = test_rapid_requests()
    
    print("\n" + "=" * 50)
    print(f"Rapid request test: {'PASSED' if rapid_result else 'FAILED'}")

if __name__ == "__main__":
    main()