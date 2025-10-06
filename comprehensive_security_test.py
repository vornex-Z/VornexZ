import requests
import time
import json
import pyotp
from datetime import datetime

class ComprehensiveSecurityTester:
    def __init__(self, base_url="https://vornex-pay.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, test_func):
        """Run a test and track results"""
        self.tests_run += 1
        print(f"\n🔍 {name}...")
        
        try:
            result = test_func()
            if result:
                self.tests_passed += 1
                print(f"✅ {name}: PASSED")
            else:
                print(f"❌ {name}: FAILED")
            return result
        except Exception as e:
            print(f"❌ {name}: FAILED with exception: {str(e)}")
            return False

    def test_security_headers(self):
        """Test all required security headers"""
        url = f"{self.base_url}/init-demo"
        response = requests.post(url, headers={'Content-Type': 'application/json'})
        
        required_headers = {
            'X-Screenshot-Block': '1',
            'X-Recording-Block': '1',
            'X-Print-Block': '1',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
        }
        
        for header, expected_value in required_headers.items():
            if header not in response.headers or response.headers[header] != expected_value:
                print(f"   ❌ Missing or incorrect header: {header}")
                return False
            print(f"   ✅ {header}: {response.headers[header]}")
        
        return True

    def test_demo_login_encryption(self):
        """Test demo login and data encryption/decryption"""
        # Initialize demo data
        init_response = requests.post(f"{self.base_url}/init-demo", 
                                    headers={'Content-Type': 'application/json'})
        if init_response.status_code != 200:
            print(f"   ❌ Demo init failed: {init_response.status_code}")
            return False
        
        # Login with demo credentials
        login_data = {"cpf": "123.456.789-00", "senha": "123456"}
        login_response = requests.post(f"{self.base_url}/auth/login", 
                                     json=login_data, 
                                     headers={'Content-Type': 'application/json'})
        
        if login_response.status_code != 200:
            print(f"   ❌ Login failed: {login_response.status_code}")
            return False
        
        self.token = login_response.json()['access_token']
        print(f"   ✅ Login successful")
        
        # Get user data to test encryption/decryption
        headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}
        me_response = requests.get(f"{self.base_url}/auth/me", headers=headers)
        
        if me_response.status_code != 200:
            print(f"   ❌ Get user data failed: {me_response.status_code}")
            return False
        
        user_data = me_response.json()
        expected_cpf = "123.456.789-00"
        expected_rg = "12.345.678-9"
        
        if user_data.get('cpf') != expected_cpf:
            print(f"   ❌ CPF decryption failed: expected {expected_cpf}, got {user_data.get('cpf')}")
            return False
        
        if user_data.get('rg') != expected_rg:
            print(f"   ❌ RG decryption failed: expected {expected_rg}, got {user_data.get('rg')}")
            return False
        
        print(f"   ✅ Data encryption/decryption working correctly")
        return True

    def test_rate_limiting_register(self):
        """Test rate limiting on register endpoint (3/minute)"""
        success_count = 0
        rate_limited_count = 0
        
        for i in range(6):  # Try 6 registrations
            test_data = {
                "nome_completo": f"Rate Test User {i}",
                "email": f"ratetest{int(time.time())}_{i}@test.com",
                "cpf": f"123.456.{(100+i):03d}-{(10+i):02d}",
                "rg": f"12.345.{(100+i):03d}-{i}",
                "telefone": f"(11) 9876{(1000+i):04d}",
                "data_nascimento": "1995-05-15",
                "endereco": f"Rua Rate Test, {i}",
                "cidade": "São Paulo",
                "estado": "SP",
                "cep": "01234-567",
                "senha": "testpass123",
                "confirmar_senha": "testpass123"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", 
                                   json=test_data, 
                                   headers={'Content-Type': 'application/json'})
            
            if response.status_code == 200:
                success_count += 1
            elif response.status_code == 429:
                rate_limited_count += 1
                print(f"   ✅ Request {i+1}: Rate limited (429)")
            else:
                print(f"   ⚠️  Request {i+1}: Status {response.status_code}")
            
            time.sleep(0.2)
        
        # Rate limiting should kick in after 3 successful requests
        if rate_limited_count > 0:
            print(f"   ✅ Rate limiting working: {success_count} allowed, {rate_limited_count} rate limited")
            return True
        else:
            print(f"   ❌ Rate limiting not detected: {success_count} allowed, {rate_limited_count} rate limited")
            return False

    def test_rate_limiting_login(self):
        """Test rate limiting on login endpoint (5/minute)"""
        login_data = {"cpf": "999.999.999-99", "senha": "wrongpassword"}
        
        success_count = 0
        rate_limited_count = 0
        
        for i in range(8):  # Try 8 login attempts
            response = requests.post(f"{self.base_url}/auth/login", 
                                   json=login_data, 
                                   headers={'Content-Type': 'application/json'})
            
            if response.status_code == 401:  # Expected for invalid credentials
                success_count += 1
            elif response.status_code == 429:
                rate_limited_count += 1
                print(f"   ✅ Request {i+1}: Rate limited (429)")
            
            time.sleep(0.1)
        
        if rate_limited_count > 0:
            print(f"   ✅ Rate limiting working: {success_count} allowed, {rate_limited_count} rate limited")
            return True
        else:
            print(f"   ❌ Rate limiting not detected: {success_count} allowed, {rate_limited_count} rate limited")
            return False

    def test_2fa_functionality(self):
        """Test 2FA TOTP functionality"""
        if not self.token:
            print("   ❌ No auth token available")
            return False
        
        headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}
        
        # Enable TOTP 2FA
        enable_data = {"enable": True, "method": "totp"}
        response = requests.post(f"{self.base_url}/user/enable-2fa", 
                               json=enable_data, headers=headers)
        
        if response.status_code != 200:
            print(f"   ❌ Failed to enable 2FA: {response.status_code}")
            return False
        
        response_data = response.json()
        if 'secret' not in response_data:
            print(f"   ❌ No TOTP secret in response")
            return False
        
        secret = response_data['secret']
        print(f"   ✅ 2FA enabled with secret")
        
        # Test QR code endpoint
        qr_response = requests.get(f"{self.base_url}/user/2fa-qr", headers=headers)
        if qr_response.status_code != 200:
            print(f"   ❌ QR code endpoint failed: {qr_response.status_code}")
            return False
        
        if qr_response.headers.get('content-type') != 'image/png':
            print(f"   ❌ QR code not PNG image")
            return False
        
        print(f"   ✅ QR code endpoint working")
        
        # Test TOTP verification
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()
        
        verify_data = {"code": valid_code}
        verify_response = requests.post(f"{self.base_url}/user/verify-2fa", 
                                      json=verify_data, headers=headers)
        
        if verify_response.status_code != 200:
            print(f"   ❌ TOTP verification failed: {verify_response.status_code}")
            return False
        
        print(f"   ✅ TOTP verification working")
        
        # Test invalid code
        invalid_verify_data = {"code": "000000"}
        invalid_response = requests.post(f"{self.base_url}/user/verify-2fa", 
                                       json=invalid_verify_data, headers=headers)
        
        if invalid_response.status_code != 400:
            print(f"   ❌ Invalid code should return 400, got {invalid_response.status_code}")
            return False
        
        print(f"   ✅ Invalid code properly rejected")
        return True

    def test_user_data_update(self):
        """Test user data update functionality"""
        if not self.token:
            print("   ❌ No auth token available")
            return False
        
        headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}
        
        # Test valid update
        update_data = {
            "telefone": "(11) 98765-4321",
            "endereco": "Nova Rua das Flores, 456",
            "cidade": "Rio de Janeiro",
            "estado": "RJ",
            "senha_confirmacao": "123456"
        }
        
        response = requests.put(f"{self.base_url}/user/update-data", 
                              json=update_data, headers=headers)
        
        if response.status_code != 200:
            print(f"   ❌ Valid update failed: {response.status_code}")
            return False
        
        print(f"   ✅ Valid data update working")
        
        # Test invalid password
        invalid_update_data = {
            "telefone": "(11) 98765-4321",
            "senha_confirmacao": "wrongpassword"
        }
        
        invalid_response = requests.put(f"{self.base_url}/user/update-data", 
                                      json=invalid_update_data, headers=headers)
        
        if invalid_response.status_code != 400:
            print(f"   ❌ Invalid password should return 400, got {invalid_response.status_code}")
            return False
        
        print(f"   ✅ Invalid password properly rejected")
        return True

    def test_biometric_functionality(self):
        """Test biometric authentication functionality"""
        if not self.token:
            print("   ❌ No auth token available")
            return False
        
        headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}
        
        # Enable biometric
        enable_data = {"enable": True}
        response = requests.post(f"{self.base_url}/user/biometric", 
                               json=enable_data, headers=headers)
        
        if response.status_code != 200:
            print(f"   ❌ Failed to enable biometric: {response.status_code}")
            return False
        
        print(f"   ✅ Biometric enabled")
        
        # Check security settings
        settings_response = requests.get(f"{self.base_url}/user/security-settings", headers=headers)
        
        if settings_response.status_code != 200:
            print(f"   ❌ Failed to get security settings: {settings_response.status_code}")
            return False
        
        settings = settings_response.json()
        if not settings.get('biometric_enabled'):
            print(f"   ❌ Biometric not enabled in settings")
            return False
        
        print(f"   ✅ Biometric status correctly reflected in settings")
        return True

def main():
    print("🚀 Comprehensive VornexZPay Security Test")
    print("=" * 60)
    
    tester = ComprehensiveSecurityTester()
    
    # Run all security tests
    tests = [
        ("Security Headers Verification", tester.test_security_headers),
        ("Demo Login & Data Encryption", tester.test_demo_login_encryption),
        ("Rate Limiting - Register Endpoint", tester.test_rate_limiting_register),
        ("Rate Limiting - Login Endpoint", tester.test_rate_limiting_login),
        ("2FA TOTP Functionality", tester.test_2fa_functionality),
        ("User Data Update", tester.test_user_data_update),
        ("Biometric Authentication", tester.test_biometric_functionality),
    ]
    
    critical_failures = []
    
    for test_name, test_func in tests:
        result = tester.run_test(test_name, test_func)
        if not result:
            # All tests are considered critical for security
            critical_failures.append(test_name)
    
    # Final results
    print("\n" + "=" * 60)
    print(f"📊 COMPREHENSIVE SECURITY TEST RESULTS")
    print(f"Tests Passed: {tester.tests_passed}/{tester.tests_run}")
    
    if critical_failures:
        print(f"\n🚨 CRITICAL FAILURES:")
        for failure in critical_failures:
            print(f"   ❌ {failure}")
    else:
        print(f"\n🎉 ALL SECURITY TESTS PASSED!")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"Success Rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 85 else 1

if __name__ == "__main__":
    exit(main())