import requests
import sys
import json
from datetime import datetime
import uuid
import pyotp
import time

class VornexZPayAPITester:
    def __init__(self, base_url="https://account-manager-33.preview.emergentagent.com/api"):
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
        test_data = {
            "nome_completo": "Test User Silva",
            "email": test_email,
            "cpf": "123.456.789-01",
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
            401
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
        success, response = self.run_test(
            "Get 2FA QR Code",
            "GET",
            "user/2fa-qr",
            200
        )
        
        if success:
            print(f"   ✅ QR Code endpoint returned PNG image")
        
        return success

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

    def test_integrated_flow(self):
        """Test integrated flow of security features"""
        print("\n🔄 Testing Integrated Security Flow...")
        
        # 1. Enable TOTP 2FA
        enable_totp = {
            "enable": True,
            "method": "totp"
        }
        
        success1, response1 = self.run_test(
            "Flow Step 1: Enable TOTP",
            "POST",
            "user/enable-2fa",
            200,
            data=enable_totp
        )
        
        if not success1:
            return False
        
        # 2. Enable Biometric
        enable_bio = {
            "enable": True
        }
        
        success2, response2 = self.run_test(
            "Flow Step 2: Enable Biometric",
            "POST",
            "user/biometric",
            200,
            data=enable_bio
        )
        
        if not success2:
            return False
        
        # 3. Check security settings
        success3, response3 = self.run_test(
            "Flow Step 3: Check Settings",
            "GET",
            "user/security-settings",
            200
        )
        
        if success3:
            if (response3.get('two_factor_enabled') and 
                response3.get('two_factor_method') == 'totp' and 
                response3.get('biometric_enabled')):
                print("   ✅ Integrated flow completed successfully")
                return True
            else:
                print("   ❌ Security settings don't match expected state")
                return False
        
        return False

def main():
    print("🚀 Starting VornexZPay API Tests")
    print("=" * 50)
    
    tester = VornexZPayAPITester()
    
    # Test sequence
    tests = [
        ("Demo Initialization", tester.test_demo_initialization),
        ("Demo User Login", tester.test_demo_login),
        ("Get Current User", tester.test_get_current_user),
        ("Get Transactions", tester.test_get_transactions),
        
        # User Data Update Tests
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
        
        # Integrated Flow Test
        ("Integrated Security Flow", tester.test_integrated_flow),
        
        # Original Tests
        ("New User Registration", tester.test_new_user_registration),
        ("Invalid Login", tester.test_invalid_login),
        ("Unauthorized Access", tester.test_unauthorized_access),
        ("Registration Validation", tester.test_registration_validation),
    ]
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All API tests passed!")
        return 0
    else:
        print("⚠️  Some API tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())