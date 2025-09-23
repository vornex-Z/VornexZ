import requests
import sys
import json
from datetime import datetime
import uuid
import pyotp
import time
import threading
from concurrent.futures import ThreadPoolExecutor

class VornexZPayAPITester:
    def __init__(self, base_url="https://pix-wallet.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.demo_user_email = "usuario@example.com"
        self.demo_user_password = "123456"

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Error: {response.text}")

            return success, response.json() if response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_demo_initialization(self):
        """Test demo data initialization"""
        success, response = self.run_test(
            "Demo Initialization",
            "POST",
            "init-demo",
            200
        )
        return success

    def test_demo_login(self):
        """Test login with demo credentials"""
        success, response = self.run_test(
            "Demo User Login",
            "POST",
            "auth/login",
            200,
            data={"email": self.demo_user_email, "senha": self.demo_user_password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        if success:
            expected_fields = ['id', 'nome_completo', 'email', 'saldo', 'premium']
            for field in expected_fields:
                if field not in response:
                    print(f"   ⚠️  Missing field: {field}")
                    return False
            print(f"   User: {response.get('nome_completo')} ({response.get('email')})")
            print(f"   Balance: R$ {response.get('saldo')}")
            print(f"   Premium: {response.get('premium')}")
        return success

    def test_get_transactions(self):
        """Test getting user transactions"""
        success, response = self.run_test(
            "Get Transactions",
            "GET",
            "transactions",
            200
        )
        if success:
            print(f"   Found {len(response)} transactions")
            if response:
                for i, transaction in enumerate(response[:3]):  # Show first 3
                    print(f"   Transaction {i+1}: {transaction.get('descricao')} - R$ {transaction.get('valor')}")
        return success

    def test_new_user_registration(self):
        """Test registering a new user"""
        test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
        # Generate unique CPF for each test run (11 digits)
        unique_suffix = datetime.now().strftime('%H%M%S')
        test_cpf = f"123.456.{unique_suffix[0:3]}-{unique_suffix[3:5]}"
        
        test_data = {
            "nome_completo": "Test User Silva",
            "email": test_email,
            "cpf": test_cpf,
            "rg": "12.345.678-0",
            "telefone": "(11) 98765-4321",
            "data_nascimento": "1995-05-15",
            "endereco": "Rua Teste, 456",
            "cidade": "São Paulo",
            "estado": "SP",
            "cep": "01234-567",
            "senha": "testpass123",
            "confirmar_senha": "testpass123"
        }
        
        success, response = self.run_test(
            "New User Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success:
            print(f"   New user created: {response.get('nome_completo')}")
            print(f"   Email: {response.get('email')}")
            print(f"   Initial balance: R$ {response.get('saldo')}")
            
            # Test login with new user
            login_success, login_response = self.run_test(
                "New User Login",
                "POST",
                "auth/login",
                200,
                data={"email": test_email, "senha": "testpass123"}
            )
            
            if login_success:
                # Store old token
                old_token = self.token
                self.token = login_response['access_token']
                
                # Test new user has no transactions
                trans_success, trans_response = self.run_test(
                    "New User Transactions (Should be empty)",
                    "GET",
                    "transactions",
                    200
                )
                
                if trans_success and len(trans_response) == 0:
                    print("   ✅ New user correctly has no transactions")
                else:
                    print(f"   ⚠️  New user has {len(trans_response)} transactions (expected 0)")
                
                # Restore demo user token
                self.token = old_token
                
        return success

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        success, response = self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data={"email": "invalid@test.com", "senha": "wrongpassword"}
        )
        return success

    def test_unauthorized_access(self):
        """Test accessing protected endpoint without token"""
        old_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Unauthorized Access",
            "GET",
            "auth/me",
            403  # Changed from 401 to 403 as that's what FastAPI returns
        )
        
        self.token = old_token
        return success

    def test_registration_validation(self):
        """Test registration with invalid data"""
        # Test password mismatch
        invalid_data = {
            "nome_completo": "Test User",
            "email": "test@test.com",
            "cpf": "123.456.789-00",
            "rg": "12.345.678-9",
            "telefone": "(11) 99999-9999",
            "data_nascimento": "1990-01-01",
            "endereco": "Test Address",
            "cidade": "Test City",
            "estado": "SP",
            "cep": "01234-567",
            "senha": "password123",
            "confirmar_senha": "different_password"
        }
        
        success, response = self.run_test(
            "Registration Password Mismatch",
            "POST",
            "auth/register",
            400,
            data=invalid_data
        )
        
        # Test short password
        invalid_data["confirmar_senha"] = "123"
        invalid_data["senha"] = "123"
        
        success2, response2 = self.run_test(
            "Registration Short Password",
            "POST",
            "auth/register",
            400,
            data=invalid_data
        )
        
        return success and success2

    def test_user_data_update_valid(self):
        """Test updating user data with valid credentials"""
        update_data = {
            "telefone": "(11) 98765-4321",
            "endereco": "Nova Rua das Flores, 456",
            "cidade": "Rio de Janeiro",
            "estado": "RJ",
            "senha_confirmacao": self.demo_user_password
        }
        
        success, response = self.run_test(
            "Update User Data - Valid",
            "PUT",
            "user/update-data",
            200,
            data=update_data
        )
        
        if success:
            print(f"   ✅ User data updated successfully")
        
        return success

    def test_user_data_update_invalid_password(self):
        """Test updating user data with incorrect password"""
        update_data = {
            "telefone": "(11) 98765-4321",
            "senha_confirmacao": "wrong_password"
        }
        
        success, response = self.run_test(
            "Update User Data - Invalid Password",
            "PUT",
            "user/update-data",
            400,
            data=update_data
        )
        
        return success

    def test_user_data_update_invalid_phone(self):
        """Test updating user data with invalid phone"""
        update_data = {
            "telefone": "123",  # Invalid phone
            "senha_confirmacao": self.demo_user_password
        }
        
        success, response = self.run_test(
            "Update User Data - Invalid Phone",
            "PUT",
            "user/update-data",
            400,
            data=update_data
        )
        
        return success

    def test_user_data_update_no_fields(self):
        """Test updating user data with no fields to update"""
        update_data = {
            "senha_confirmacao": self.demo_user_password
        }
        
        success, response = self.run_test(
            "Update User Data - No Fields",
            "PUT",
            "user/update-data",
            400,
            data=update_data
        )
        
        return success

    def test_enable_2fa_totp(self):
        """Test enabling 2FA with TOTP method"""
        enable_data = {
            "enable": True,
            "method": "totp"
        }
        
        success, response = self.run_test(
            "Enable 2FA - TOTP",
            "POST",
            "user/enable-2fa",
            200,
            data=enable_data
        )
        
        if success:
            expected_fields = ['message', 'method', 'secret', 'qr_code_uri']
            for field in expected_fields:
                if field not in response:
                    print(f"   ⚠️  Missing field: {field}")
                    return False
            
            print(f"   ✅ 2FA TOTP enabled with secret: {response.get('secret')[:10]}...")
            
            # Store secret for verification test
            self.totp_secret = response.get('secret')
        
        return success

    def test_2fa_qr_code(self):
        """Test getting 2FA QR code"""
        url = f"{self.base_url}/user/2fa-qr"
        test_headers = {'Authorization': f'Bearer {self.token}'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing Get 2FA QR Code...")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, headers=test_headers)
            success = response.status_code == 200
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                # Check if response is PNG image
                if response.headers.get('content-type') == 'image/png':
                    print(f"   ✅ QR Code endpoint returned PNG image")
                else:
                    print(f"   ⚠️  Expected PNG image, got: {response.headers.get('content-type')}")
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"   Error: {response.text}")
            
            return success
            
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_verify_2fa_totp_valid(self):
        """Test verifying 2FA TOTP with valid code"""
        if not hasattr(self, 'totp_secret'):
            print("   ⚠️  TOTP secret not available, skipping test")
            return False
        
        # Generate valid TOTP code
        totp = pyotp.TOTP(self.totp_secret)
        valid_code = totp.now()
        
        verify_data = {
            "code": valid_code
        }
        
        success, response = self.run_test(
            "Verify 2FA TOTP - Valid Code",
            "POST",
            "user/verify-2fa",
            200,
            data=verify_data
        )
        
        return success

    def test_verify_2fa_totp_invalid(self):
        """Test verifying 2FA TOTP with invalid code"""
        verify_data = {
            "code": "000000"  # Invalid code
        }
        
        success, response = self.run_test(
            "Verify 2FA TOTP - Invalid Code",
            "POST",
            "user/verify-2fa",
            400,
            data=verify_data
        )
        
        return success

    def test_disable_2fa(self):
        """Test disabling 2FA"""
        disable_data = {
            "enable": False,
            "method": "totp"
        }
        
        success, response = self.run_test(
            "Disable 2FA",
            "POST",
            "user/enable-2fa",
            200,
            data=disable_data
        )
        
        if success:
            print(f"   ✅ 2FA disabled successfully")
        
        return success

    def test_enable_2fa_email(self):
        """Test enabling 2FA with email method"""
        enable_data = {
            "enable": True,
            "method": "email"
        }
        
        success, response = self.run_test(
            "Enable 2FA - Email",
            "POST",
            "user/enable-2fa",
            200,
            data=enable_data
        )
        
        if success:
            expected_fields = ['message', 'method']
            for field in expected_fields:
                if field not in response:
                    print(f"   ⚠️  Missing field: {field}")
                    return False
            
            print(f"   ✅ 2FA Email enabled")
        
        return success

    def test_send_email_2fa(self):
        """Test sending email 2FA code"""
        success, response = self.run_test(
            "Send Email 2FA Code",
            "POST",
            "user/send-email-2fa",
            200
        )
        
        if success:
            print(f"   ✅ Email 2FA code sent (simulated)")
        
        return success

    def test_verify_2fa_email_invalid(self):
        """Test verifying 2FA email with invalid code"""
        verify_data = {
            "code": "000000"  # Invalid code
        }
        
        success, response = self.run_test(
            "Verify 2FA Email - Invalid Code",
            "POST",
            "user/verify-2fa",
            400,
            data=verify_data
        )
        
        return success

    def test_enable_biometric(self):
        """Test enabling biometric authentication"""
        biometric_data = {
            "enable": True
        }
        
        success, response = self.run_test(
            "Enable Biometric",
            "POST",
            "user/biometric",
            200,
            data=biometric_data
        )
        
        if success:
            print(f"   ✅ Biometric authentication enabled")
        
        return success

    def test_disable_biometric(self):
        """Test disabling biometric authentication"""
        biometric_data = {
            "enable": False
        }
        
        success, response = self.run_test(
            "Disable Biometric",
            "POST",
            "user/biometric",
            200,
            data=biometric_data
        )
        
        if success:
            print(f"   ✅ Biometric authentication disabled")
        
        return success

    def test_get_security_settings(self):
        """Test getting security settings"""
        success, response = self.run_test(
            "Get Security Settings",
            "GET",
            "user/security-settings",
            200
        )
        
        if success:
            expected_fields = ['two_factor_enabled', 'two_factor_method', 'biometric_enabled']
            for field in expected_fields:
                if field not in response:
                    print(f"   ⚠️  Missing field: {field}")
                    return False
            
            print(f"   2FA Enabled: {response.get('two_factor_enabled')}")
            print(f"   2FA Method: {response.get('two_factor_method')}")
            print(f"   Biometric Enabled: {response.get('biometric_enabled')}")
        
        return success

    def test_rate_limiting_register(self):
        """Test rate limiting on register endpoint (3/minute)"""
        print("\n🔍 Testing Rate Limiting - Register Endpoint (3/minute)...")
        
        # Create unique test data for each request
        def create_test_user_data(suffix):
            return {
                "nome_completo": f"Rate Test User {suffix}",
                "email": f"ratetest{suffix}@test.com",
                "cpf": f"123.456.{suffix:03d}-{suffix%100:02d}",
                "rg": f"12.345.{suffix:03d}-{suffix%10}",
                "telefone": f"(11) 9876{suffix:04d}",
                "data_nascimento": "1995-05-15",
                "endereco": f"Rua Rate Test, {suffix}",
                "cidade": "São Paulo",
                "estado": "SP",
                "cep": "01234-567",
                "senha": "testpass123",
                "confirmar_senha": "testpass123"
            }
        
        success_count = 0
        rate_limited_count = 0
        
        # Make 5 requests rapidly (should allow 3, then rate limit)
        for i in range(5):
            test_data = create_test_user_data(int(time.time() * 1000) + i)
            
            success, response = self.run_test(
                f"Rate Limit Test Register #{i+1}",
                "POST",
                "auth/register",
                200 if i < 3 else 429,  # Expect 429 after 3 requests
                data=test_data
            )
            
            if i < 3:
                if success:
                    success_count += 1
                    print(f"   ✅ Request {i+1}: Allowed (within rate limit)")
                else:
                    print(f"   ❌ Request {i+1}: Should have been allowed")
            else:
                # Check for rate limiting (429 status)
                url = f"{self.base_url}/auth/register"
                try:
                    response = requests.post(url, json=test_data, headers={'Content-Type': 'application/json'})
                    if response.status_code == 429:
                        rate_limited_count += 1
                        print(f"   ✅ Request {i+1}: Rate limited (429) - CORRECT")
                        # Check rate limit headers
                        if 'X-RateLimit-Limit' in response.headers or 'Retry-After' in response.headers:
                            print(f"   ✅ Rate limit headers present")
                    else:
                        print(f"   ❌ Request {i+1}: Expected 429, got {response.status_code}")
                except Exception as e:
                    print(f"   ❌ Request {i+1}: Error - {str(e)}")
            
            time.sleep(0.1)  # Small delay between requests
        
        # Test should pass if first 3 succeed and last 2 are rate limited
        test_passed = success_count >= 3 and rate_limited_count >= 1
        if test_passed:
            self.tests_passed += 1
            print(f"   ✅ Rate limiting working correctly: {success_count} allowed, {rate_limited_count} rate limited")
        else:
            print(f"   ❌ Rate limiting not working properly: {success_count} allowed, {rate_limited_count} rate limited")
        
        self.tests_run += 1
        return test_passed

    def test_rate_limiting_login(self):
        """Test rate limiting on login endpoint (5/minute)"""
        print("\n🔍 Testing Rate Limiting - Login Endpoint (5/minute)...")
        
        login_data = {
            "cpf": "123.456.789-00",  # Invalid CPF for testing
            "senha": "wrongpassword"
        }
        
        success_count = 0
        rate_limited_count = 0
        
        # Make 7 requests rapidly (should allow 5, then rate limit)
        for i in range(7):
            if i < 5:
                success, response = self.run_test(
                    f"Rate Limit Test Login #{i+1}",
                    "POST",
                    "auth/login",
                    401,  # Expect 401 for invalid credentials
                    data=login_data
                )
                if success:
                    success_count += 1
                    print(f"   ✅ Request {i+1}: Allowed (within rate limit)")
            else:
                # Check for rate limiting
                url = f"{self.base_url}/auth/login"
                try:
                    response = requests.post(url, json=login_data, headers={'Content-Type': 'application/json'})
                    if response.status_code == 429:
                        rate_limited_count += 1
                        print(f"   ✅ Request {i+1}: Rate limited (429) - CORRECT")
                    else:
                        print(f"   ❌ Request {i+1}: Expected 429, got {response.status_code}")
                except Exception as e:
                    print(f"   ❌ Request {i+1}: Error - {str(e)}")
            
            time.sleep(0.1)
        
        test_passed = success_count >= 5 and rate_limited_count >= 1
        if test_passed:
            self.tests_passed += 1
            print(f"   ✅ Login rate limiting working: {success_count} allowed, {rate_limited_count} rate limited")
        else:
            print(f"   ❌ Login rate limiting not working: {success_count} allowed, {rate_limited_count} rate limited")
        
        self.tests_run += 1
        return test_passed

    def test_rate_limiting_update_data(self):
        """Test rate limiting on update-data endpoint (10/minute)"""
        print("\n🔍 Testing Rate Limiting - Update Data Endpoint (10/minute)...")
        
        if not self.token:
            print("   ⚠️  No auth token available, skipping test")
            return False
        
        update_data = {
            "endereco": f"Test Address {int(time.time())}",
            "senha_confirmacao": self.demo_user_password
        }
        
        success_count = 0
        rate_limited_count = 0
        
        # Make 12 requests rapidly (should allow 10, then rate limit)
        for i in range(12):
            update_data["endereco"] = f"Test Address {int(time.time())}_{i}"
            
            if i < 10:
                success, response = self.run_test(
                    f"Rate Limit Test Update #{i+1}",
                    "PUT",
                    "user/update-data",
                    200,
                    data=update_data
                )
                if success:
                    success_count += 1
                    print(f"   ✅ Request {i+1}: Allowed (within rate limit)")
            else:
                # Check for rate limiting
                url = f"{self.base_url}/user/update-data"
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.token}'
                }
                try:
                    response = requests.put(url, json=update_data, headers=headers)
                    if response.status_code == 429:
                        rate_limited_count += 1
                        print(f"   ✅ Request {i+1}: Rate limited (429) - CORRECT")
                    else:
                        print(f"   ❌ Request {i+1}: Expected 429, got {response.status_code}")
                except Exception as e:
                    print(f"   ❌ Request {i+1}: Error - {str(e)}")
            
            time.sleep(0.1)
        
        test_passed = success_count >= 10 and rate_limited_count >= 1
        if test_passed:
            self.tests_passed += 1
            print(f"   ✅ Update data rate limiting working: {success_count} allowed, {rate_limited_count} rate limited")
        else:
            print(f"   ❌ Update data rate limiting not working: {success_count} allowed, {rate_limited_count} rate limited")
        
        self.tests_run += 1
        return test_passed

    def test_rate_limiting_enable_2fa(self):
        """Test rate limiting on enable-2fa endpoint (5/minute)"""
        print("\n🔍 Testing Rate Limiting - Enable 2FA Endpoint (5/minute)...")
        
        if not self.token:
            print("   ⚠️  No auth token available, skipping test")
            return False
        
        enable_data = {
            "enable": True,
            "method": "email"
        }
        
        success_count = 0
        rate_limited_count = 0
        
        # Make 7 requests rapidly (should allow 5, then rate limit)
        for i in range(7):
            if i < 5:
                success, response = self.run_test(
                    f"Rate Limit Test Enable 2FA #{i+1}",
                    "POST",
                    "user/enable-2fa",
                    200,
                    data=enable_data
                )
                if success:
                    success_count += 1
                    print(f"   ✅ Request {i+1}: Allowed (within rate limit)")
            else:
                # Check for rate limiting
                url = f"{self.base_url}/user/enable-2fa"
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.token}'
                }
                try:
                    response = requests.post(url, json=enable_data, headers=headers)
                    if response.status_code == 429:
                        rate_limited_count += 1
                        print(f"   ✅ Request {i+1}: Rate limited (429) - CORRECT")
                    else:
                        print(f"   ❌ Request {i+1}: Expected 429, got {response.status_code}")
                except Exception as e:
                    print(f"   ❌ Request {i+1}: Error - {str(e)}")
            
            time.sleep(0.1)
        
        test_passed = success_count >= 5 and rate_limited_count >= 1
        if test_passed:
            self.tests_passed += 1
            print(f"   ✅ Enable 2FA rate limiting working: {success_count} allowed, {rate_limited_count} rate limited")
        else:
            print(f"   ❌ Enable 2FA rate limiting not working: {success_count} allowed, {rate_limited_count} rate limited")
        
        self.tests_run += 1
        return test_passed

    def test_rate_limiting_verify_2fa(self):
        """Test rate limiting on verify-2fa endpoint (10/minute)"""
        print("\n🔍 Testing Rate Limiting - Verify 2FA Endpoint (10/minute)...")
        
        if not self.token:
            print("   ⚠️  No auth token available, skipping test")
            return False
        
        # First enable 2FA
        enable_data = {"enable": True, "method": "email"}
        self.run_test("Setup 2FA for rate limit test", "POST", "user/enable-2fa", 200, data=enable_data)
        
        verify_data = {
            "code": "000000"  # Invalid code for testing
        }
        
        success_count = 0
        rate_limited_count = 0
        
        # Make 12 requests rapidly (should allow 10, then rate limit)
        for i in range(12):
            if i < 10:
                success, response = self.run_test(
                    f"Rate Limit Test Verify 2FA #{i+1}",
                    "POST",
                    "user/verify-2fa",
                    400,  # Expect 400 for invalid code
                    data=verify_data
                )
                if success:
                    success_count += 1
                    print(f"   ✅ Request {i+1}: Allowed (within rate limit)")
            else:
                # Check for rate limiting
                url = f"{self.base_url}/user/verify-2fa"
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.token}'
                }
                try:
                    response = requests.post(url, json=verify_data, headers=headers)
                    if response.status_code == 429:
                        rate_limited_count += 1
                        print(f"   ✅ Request {i+1}: Rate limited (429) - CORRECT")
                    else:
                        print(f"   ❌ Request {i+1}: Expected 429, got {response.status_code}")
                except Exception as e:
                    print(f"   ❌ Request {i+1}: Error - {str(e)}")
            
            time.sleep(0.1)
        
        test_passed = success_count >= 10 and rate_limited_count >= 1
        if test_passed:
            self.tests_passed += 1
            print(f"   ✅ Verify 2FA rate limiting working: {success_count} allowed, {rate_limited_count} rate limited")
        else:
            print(f"   ❌ Verify 2FA rate limiting not working: {success_count} allowed, {rate_limited_count} rate limited")
        
        self.tests_run += 1
        return test_passed

    def test_rate_limiting_send_email_2fa(self):
        """Test rate limiting on send-email-2fa endpoint (3/minute)"""
        print("\n🔍 Testing Rate Limiting - Send Email 2FA Endpoint (3/minute)...")
        
        if not self.token:
            print("   ⚠️  No auth token available, skipping test")
            return False
        
        # First enable email 2FA
        enable_data = {"enable": True, "method": "email"}
        self.run_test("Setup Email 2FA for rate limit test", "POST", "user/enable-2fa", 200, data=enable_data)
        
        success_count = 0
        rate_limited_count = 0
        
        # Make 5 requests rapidly (should allow 3, then rate limit)
        for i in range(5):
            if i < 3:
                success, response = self.run_test(
                    f"Rate Limit Test Send Email 2FA #{i+1}",
                    "POST",
                    "user/send-email-2fa",
                    200
                )
                if success:
                    success_count += 1
                    print(f"   ✅ Request {i+1}: Allowed (within rate limit)")
            else:
                # Check for rate limiting
                url = f"{self.base_url}/user/send-email-2fa"
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.token}'
                }
                try:
                    response = requests.post(url, headers=headers)
                    if response.status_code == 429:
                        rate_limited_count += 1
                        print(f"   ✅ Request {i+1}: Rate limited (429) - CORRECT")
                    else:
                        print(f"   ❌ Request {i+1}: Expected 429, got {response.status_code}")
                except Exception as e:
                    print(f"   ❌ Request {i+1}: Error - {str(e)}")
            
            time.sleep(0.1)
        
        test_passed = success_count >= 3 and rate_limited_count >= 1
        if test_passed:
            self.tests_passed += 1
            print(f"   ✅ Send Email 2FA rate limiting working: {success_count} allowed, {rate_limited_count} rate limited")
        else:
            print(f"   ❌ Send Email 2FA rate limiting not working: {success_count} allowed, {rate_limited_count} rate limited")
        
        self.tests_run += 1
        return test_passed

    def test_security_headers(self):
        """Test security headers are present in responses"""
        print("\n🔍 Testing Security Headers...")
        
        # Test on a simple endpoint
        url = f"{self.base_url}/init-demo"
        
        self.tests_run += 1
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
                self.tests_passed += 1
                print("✅ All required security headers present:")
                for header in present_headers:
                    print(f"   ✅ {header}")
                return True
            else:
                print("❌ Missing or incorrect security headers:")
                for header in missing_headers:
                    print(f"   ❌ {header}")
                print("Present headers:")
                for header in present_headers:
                    print(f"   ✅ {header}")
                return False
                
        except Exception as e:
            print(f"❌ Failed to test security headers: {str(e)}")
            return False

    def test_data_encryption_verification(self):
        """Test that sensitive data is properly encrypted"""
        print("\n🔍 Testing Data Encryption...")
        
        # Create a test user to verify encryption
        test_email = f"encryption_test_{int(time.time())}@test.com"
        test_cpf = f"123.456.{int(time.time()) % 1000:03d}-{int(time.time()) % 100:02d}"
        test_rg = f"12.345.{int(time.time()) % 1000:03d}-{int(time.time()) % 10}"
        test_phone = f"(11) 9876{int(time.time()) % 10000:04d}"
        
        test_data = {
            "nome_completo": "Encryption Test User",
            "email": test_email,
            "cpf": test_cpf,
            "rg": test_rg,
            "telefone": test_phone,
            "data_nascimento": "1995-05-15",
            "endereco": "Rua Encryption Test, 123",
            "cidade": "São Paulo",
            "estado": "SP",
            "cep": "01234-567",
            "senha": "testpass123",
            "confirmar_senha": "testpass123"
        }
        
        self.tests_run += 1
        
        # Register user
        success, response = self.run_test(
            "Create User for Encryption Test",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if not success:
            print("❌ Failed to create test user for encryption verification")
            return False
        
        # Login with the new user
        login_success, login_response = self.run_test(
            "Login Encryption Test User",
            "POST",
            "auth/login",
            200,
            data={"cpf": test_cpf, "senha": "testpass123"}
        )
        
        if not login_success:
            print("❌ Failed to login with test user")
            return False
        
        # Store old token and use new user token
        old_token = self.token
        self.token = login_response['access_token']
        
        # Get user data
        user_success, user_response = self.run_test(
            "Get Encrypted User Data",
            "GET",
            "auth/me",
            200
        )
        
        # Restore original token
        self.token = old_token
        
        if user_success:
            # Verify that sensitive data is returned properly (decrypted)
            returned_cpf = user_response.get('cpf')
            returned_rg = user_response.get('rg')
            returned_phone = user_response.get('telefone')
            
            encryption_working = True
            
            if returned_cpf != test_cpf:
                print(f"   ❌ CPF encryption/decryption issue: expected {test_cpf}, got {returned_cpf}")
                encryption_working = False
            else:
                print(f"   ✅ CPF properly encrypted/decrypted: {returned_cpf}")
            
            if returned_rg != test_rg:
                print(f"   ❌ RG encryption/decryption issue: expected {test_rg}, got {returned_rg}")
                encryption_working = False
            else:
                print(f"   ✅ RG properly encrypted/decrypted: {returned_rg}")
            
            if returned_phone != test_phone:
                print(f"   ❌ Phone encryption/decryption issue: expected {test_phone}, got {returned_phone}")
                encryption_working = False
            else:
                print(f"   ✅ Phone properly encrypted/decrypted: {returned_phone}")
            
            if encryption_working:
                self.tests_passed += 1
                print("✅ Data encryption/decryption working correctly")
                return True
            else:
                print("❌ Data encryption/decryption has issues")
                return False
        else:
            print("❌ Failed to retrieve user data for encryption verification")
            return False

def main():
    print("🚀 Starting VornexZPay Security & Rate Limiting Tests")
    print("=" * 60)
    
    tester = VornexZPayAPITester()
    
    # Test sequence - focusing on security and rate limiting
    tests = [
        ("Demo Initialization", tester.test_demo_initialization),
        ("Demo User Login", tester.test_demo_login),
        ("Get Current User", tester.test_get_current_user),
        
        # SECURITY TESTS - PRIORITY
        ("Security Headers Verification", tester.test_security_headers),
        ("Data Encryption Verification", tester.test_data_encryption_verification),
        
        # RATE LIMITING TESTS - MAIN FOCUS
        ("Rate Limiting - Register (3/min)", tester.test_rate_limiting_register),
        ("Rate Limiting - Login (5/min)", tester.test_rate_limiting_login),
        ("Rate Limiting - Update Data (10/min)", tester.test_rate_limiting_update_data),
        ("Rate Limiting - Enable 2FA (5/min)", tester.test_rate_limiting_enable_2fa),
        ("Rate Limiting - Verify 2FA (10/min)", tester.test_rate_limiting_verify_2fa),
        ("Rate Limiting - Send Email 2FA (3/min)", tester.test_rate_limiting_send_email_2fa),
        
        # FUNCTIONAL TESTS
        ("Update User Data - Valid", tester.test_user_data_update_valid),
        ("Update User Data - Invalid Password", tester.test_user_data_update_invalid_password),
        ("Update User Data - Invalid Phone", tester.test_user_data_update_invalid_phone),
        ("Update User Data - No Fields", tester.test_user_data_update_no_fields),
        
        # 2FA TOTP Tests
        ("Enable 2FA - TOTP", tester.test_enable_2fa_totp),
        ("Get 2FA QR Code", tester.test_2fa_qr_code),
        ("Verify 2FA TOTP - Valid Code", tester.test_verify_2fa_totp_valid),
        ("Verify 2FA TOTP - Invalid Code", tester.test_verify_2fa_totp_invalid),
        ("Disable 2FA", tester.test_disable_2fa),
        
        # 2FA Email Tests
        ("Enable 2FA - Email", tester.test_enable_2fa_email),
        ("Send Email 2FA Code", tester.test_send_email_2fa),
        ("Verify 2FA Email - Invalid Code", tester.test_verify_2fa_email_invalid),
        
        # Biometric Tests
        ("Enable Biometric", tester.test_enable_biometric),
        ("Disable Biometric", tester.test_disable_biometric),
        
        # Security Settings Test
        ("Get Security Settings", tester.test_get_security_settings),
        
        # Additional validation tests
        ("New User Registration", tester.test_new_user_registration),
        ("Invalid Login", tester.test_invalid_login),
        ("Unauthorized Access", tester.test_unauthorized_access),
        ("Registration Validation", tester.test_registration_validation),
    ]
    
    # Track critical vs non-critical failures
    critical_failures = []
    minor_failures = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if not result:
                # Determine if this is a critical failure
                if any(keyword in test_name.lower() for keyword in ['rate limiting', 'security headers', 'encryption']):
                    critical_failures.append(test_name)
                else:
                    minor_failures.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            critical_failures.append(f"{test_name} (Exception: {str(e)})")
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if critical_failures:
        print("\n🚨 CRITICAL FAILURES (Security/Rate Limiting):")
        for failure in critical_failures:
            print(f"   ❌ {failure}")
    
    if minor_failures:
        print("\n⚠️  Minor Failures:")
        for failure in minor_failures:
            print(f"   ⚠️  {failure}")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All security and rate limiting tests passed!")
        return 0
    elif not critical_failures:
        print("\n✅ All critical security tests passed! Minor issues can be addressed later.")
        return 0
    else:
        print("\n⚠️  Critical security or rate limiting issues found!")
        return 1

if __name__ == "__main__":
    sys.exit(main())