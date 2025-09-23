import requests
import time
import json

class FocusedSecurityTester:
    def __init__(self, base_url="https://pix-wallet.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None

    def test_rate_limiting_login(self):
        """Test rate limiting on login endpoint (5/minute)"""
        print("🔍 Testing Rate Limiting - Login Endpoint (5/minute)...")
        
        login_data = {
            "cpf": "999.999.999-99",  # Invalid CPF for testing
            "senha": "wrongpassword"
        }
        
        success_count = 0
        rate_limited_count = 0
        
        # Make 7 requests rapidly (should allow 5, then rate limit)
        for i in range(7):
            url = f"{self.base_url}/auth/login"
            try:
                response = requests.post(url, json=login_data, headers={'Content-Type': 'application/json'})
                print(f"   Request {i+1}: Status {response.status_code}")
                
                if i < 5:
                    if response.status_code == 401:  # Expected for invalid credentials
                        success_count += 1
                        print(f"   ✅ Request {i+1}: Allowed (within rate limit)")
                    else:
                        print(f"   ❌ Request {i+1}: Expected 401, got {response.status_code}")
                else:
                    if response.status_code == 429:
                        rate_limited_count += 1
                        print(f"   ✅ Request {i+1}: Rate limited (429) - CORRECT")
                    else:
                        print(f"   ❌ Request {i+1}: Expected 429, got {response.status_code}")
                        
            except Exception as e:
                print(f"   ❌ Request {i+1}: Error - {str(e)}")
            
            time.sleep(0.2)  # Small delay between requests
        
        test_passed = success_count >= 5 and rate_limited_count >= 1
        if test_passed:
            print(f"   ✅ Login rate limiting working: {success_count} allowed, {rate_limited_count} rate limited")
        else:
            print(f"   ❌ Login rate limiting not working: {success_count} allowed, {rate_limited_count} rate limited")
        
        return test_passed

    def test_demo_login_and_encryption(self):
        """Test demo login and data encryption"""
        print("🔍 Testing Demo Login and Data Encryption...")
        
        # First initialize demo data
        init_url = f"{self.base_url}/init-demo"
        try:
            init_response = requests.post(init_url, headers={'Content-Type': 'application/json'})
            print(f"   Demo init: Status {init_response.status_code}")
        except Exception as e:
            print(f"   Demo init error: {e}")
        
        # Test login with demo credentials
        login_data = {
            "cpf": "123.456.789-00",
            "senha": "123456"
        }
        
        login_url = f"{self.base_url}/auth/login"
        try:
            response = requests.post(login_url, json=login_data, headers={'Content-Type': 'application/json'})
            print(f"   Login: Status {response.status_code}")
            
            if response.status_code == 200:
                response_data = response.json()
                if 'access_token' in response_data:
                    self.token = response_data['access_token']
                    print(f"   ✅ Login successful, token obtained")
                    
                    # Test getting user data (encryption test)
                    me_url = f"{self.base_url}/auth/me"
                    headers = {
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {self.token}'
                    }
                    
                    me_response = requests.get(me_url, headers=headers)
                    print(f"   Get user data: Status {me_response.status_code}")
                    
                    if me_response.status_code == 200:
                        user_data = me_response.json()
                        cpf = user_data.get('cpf')
                        rg = user_data.get('rg')
                        telefone = user_data.get('telefone')
                        
                        print(f"   ✅ User data retrieved:")
                        print(f"      CPF: {cpf}")
                        print(f"      RG: {rg}")
                        print(f"      Telefone: {telefone}")
                        
                        # Check if data is properly decrypted
                        if cpf == "123.456.789-00" and rg == "12.345.678-9":
                            print(f"   ✅ Data encryption/decryption working correctly")
                            return True
                        else:
                            print(f"   ❌ Data encryption/decryption issue")
                            return False
                    else:
                        print(f"   ❌ Failed to get user data: {me_response.text}")
                        return False
                else:
                    print(f"   ❌ No access token in response")
                    return False
            else:
                print(f"   ❌ Login failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Login error: {str(e)}")
            return False

    def test_security_headers(self):
        """Test security headers are present"""
        print("🔍 Testing Security Headers...")
        
        url = f"{self.base_url}/init-demo"
        
        try:
            response = requests.post(url, headers={'Content-Type': 'application/json'})
            
            # Check for required security headers
            required_headers = {
                'X-Screenshot-Block': '1',
                'X-Recording-Block': '1',
                'X-Print-Block': '1',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block'
            }
            
            missing_headers = []
            present_headers = []
            
            for header, expected_value in required_headers.items():
                if header in response.headers:
                    if response.headers[header] == expected_value:
                        present_headers.append(f"{header}: {response.headers[header]}")
                    else:
                        missing_headers.append(f"{header} (expected: {expected_value}, got: {response.headers[header]})")
                else:
                    missing_headers.append(f"{header} (missing)")
            
            if not missing_headers:
                print("   ✅ All required security headers present:")
                for header in present_headers:
                    print(f"      ✅ {header}")
                return True
            else:
                print("   ❌ Missing or incorrect security headers:")
                for header in missing_headers:
                    print(f"      ❌ {header}")
                return False
                
        except Exception as e:
            print(f"   ❌ Failed to test security headers: {str(e)}")
            return False

def main():
    print("🚀 Focused Security Testing - VornexZPay")
    print("=" * 50)
    
    tester = FocusedSecurityTester()
    
    tests = [
        ("Security Headers", tester.test_security_headers),
        ("Demo Login & Encryption", tester.test_demo_login_and_encryption),
        ("Rate Limiting - Login", tester.test_rate_limiting_login),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
            print()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            results.append((test_name, False))
            print()
    
    # Print final results
    print("=" * 50)
    print("📊 FOCUSED SECURITY TEST RESULTS:")
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        if result:
            print(f"✅ {test_name}: PASSED")
            passed += 1
        else:
            print(f"❌ {test_name}: FAILED")
    
    print(f"\n📊 Final Score: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All focused security tests passed!")
        return 0
    else:
        print("⚠️  Some security tests failed!")
        return 1

if __name__ == "__main__":
    main()