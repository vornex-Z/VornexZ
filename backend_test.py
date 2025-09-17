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