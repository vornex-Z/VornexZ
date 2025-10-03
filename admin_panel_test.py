import requests
import sys
import json
from datetime import datetime
import time

class VornexZPayAdminTester:
    def __init__(self, base_url="https://pix-wallet.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_email = "julio@vornexzpay.com"
        self.admin_password = "VornexAdmin2025!"
        self.demo_user_id = None
        self.demo_user_email = "usuario@example.com"

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin_token=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if use_admin_token and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        elif not use_admin_token and self.user_token:
            test_headers['Authorization'] = f'Bearer {self.user_token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, params=data if data else None)
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
                    print(f"   Response: {json.dumps(response_data, indent=2, default=str)[:300]}...")
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

    def test_init_admin(self):
        """Test admin initialization - should work multiple times"""
        print("\n🔧 Testing Admin Initialization...")
        
        # Test first call
        success1, response1 = self.run_test(
            "Initialize Admin - First Call",
            "POST",
            "init-admin",
            200
        )
        
        # Test second call (should handle existing admin)
        success2, response2 = self.run_test(
            "Initialize Admin - Second Call",
            "POST", 
            "init-admin",
            200
        )
        
        if success1 and success2:
            print("✅ Admin initialization works correctly for multiple calls")
            return True
        return False

    def test_admin_login(self):
        """Test admin login with correct credentials"""
        login_data = {
            "email": self.admin_email,
            "senha": self.admin_password
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   ✅ Admin token obtained: {self.admin_token[:20]}...")
            
            # Verify admin data is returned
            if 'admin' in response:
                admin_data = response['admin']
                print(f"   ✅ Admin data: {admin_data.get('nome')} ({admin_data.get('email')})")
                print(f"   ✅ Admin role: {admin_data.get('cargo')}")
            
            return True
        return False

    def test_admin_login_invalid(self):
        """Test admin login with invalid credentials"""
        login_data = {
            "email": self.admin_email,
            "senha": "wrong_password"
        }
        
        success, response = self.run_test(
            "Admin Login - Invalid Credentials",
            "POST",
            "admin/auth/login",
            401,
            data=login_data
        )
        
        return success

    def test_admin_dashboard(self):
        """Test admin dashboard access"""
        if not self.admin_token:
            print("   ⚠️  No admin token available, skipping test")
            return False
        
        success, response = self.run_test(
            "Admin Dashboard",
            "GET",
            "admin/dashboard",
            200,
            use_admin_token=True
        )
        
        if success:
            # Verify required dashboard fields
            required_fields = ['total_usuarios', 'usuarios_ativos', 'cadastros_hoje', 'logs_recentes']
            missing_fields = []
            
            for field in required_fields:
                if field not in response:
                    missing_fields.append(field)
                else:
                    print(f"   ✅ {field}: {response[field]}")
            
            if missing_fields:
                print(f"   ❌ Missing dashboard fields: {missing_fields}")
                return False
            
            print("   ✅ All required dashboard statistics present")
            return True
        
        return False

    def test_admin_dashboard_unauthorized(self):
        """Test admin dashboard without admin token"""
        # Save admin token and clear it
        temp_token = self.admin_token
        self.admin_token = None
        
        success, response = self.run_test(
            "Admin Dashboard - Unauthorized",
            "GET",
            "admin/dashboard",
            403,  # Should return 403 for missing admin credentials
            use_admin_token=False
        )
        
        # Restore admin token
        self.admin_token = temp_token
        return success

    def test_setup_demo_user(self):
        """Setup demo user for admin testing"""
        # Initialize demo data
        success1, response1 = self.run_test(
            "Initialize Demo Data",
            "POST",
            "init-demo",
            200
        )
        
        if not success1:
            return False
        
        # Login as demo user to get user ID
        login_data = {
            "cpf": "123.456.789-00",
            "senha": "123456"
        }
        
        success2, response2 = self.run_test(
            "Demo User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success2 and 'access_token' in response2:
            self.user_token = response2['access_token']
            
            # Get user info to extract user ID
            success3, response3 = self.run_test(
                "Get Demo User Info",
                "GET",
                "auth/me",
                200
            )
            
            if success3 and 'id' in response3:
                self.demo_user_id = response3['id']
                print(f"   ✅ Demo user ID: {self.demo_user_id}")
                return True
        
        return False

    def test_admin_list_users(self):
        """Test admin user listing with pagination and filters"""
        if not self.admin_token:
            print("   ⚠️  No admin token available, skipping test")
            return False
        
        # Test basic user listing
        success1, response1 = self.run_test(
            "Admin List Users - Basic",
            "GET",
            "admin/users",
            200,
            use_admin_token=True
        )
        
        if not success1:
            return False
        
        # Verify response structure
        required_fields = ['users', 'total', 'page', 'limit', 'pages']
        for field in required_fields:
            if field not in response1:
                print(f"   ❌ Missing field: {field}")
                return False
        
        print(f"   ✅ Found {response1['total']} users, page {response1['page']}")
        
        # Test with search filter
        success2, response2 = self.run_test(
            "Admin List Users - Search Filter",
            "GET",
            "admin/users",
            200,
            data={"search": "João", "page": 1, "limit": 10},
            use_admin_token=True
        )
        
        # Test with status filter
        success3, response3 = self.run_test(
            "Admin List Users - Status Filter",
            "GET", 
            "admin/users",
            200,
            data={"status": "active", "page": 1, "limit": 10},
            use_admin_token=True
        )
        
        # Verify sensitive data is decrypted for admin
        if success1 and response1['users']:
            user = response1['users'][0]
            if 'cpf' in user and 'rg' in user and 'telefone' in user:
                print(f"   ✅ Sensitive data decrypted: CPF={user['cpf'][:3]}***, RG={user['rg'][:2]}***, Phone={user['telefone'][:4]}***")
            else:
                print(f"   ⚠️  Some sensitive fields missing in user data")
        
        return success1 and success2 and success3

    def test_admin_list_users_unauthorized(self):
        """Test admin user listing without admin token"""
        temp_token = self.admin_token
        self.admin_token = None
        
        success, response = self.run_test(
            "Admin List Users - Unauthorized",
            "GET",
            "admin/users",
            403,
            use_admin_token=False
        )
        
        self.admin_token = temp_token
        return success

    def test_admin_user_actions(self):
        """Test admin user management actions"""
        if not self.admin_token or not self.demo_user_id:
            print("   ⚠️  No admin token or demo user ID available, skipping test")
            return False
        
        # Test block user
        block_data = {
            "user_id": self.demo_user_id,
            "action": "block",
            "reason": "Test blocking for admin panel testing"
        }
        
        success1, response1 = self.run_test(
            "Admin Action - Block User",
            "POST",
            f"admin/users/{self.demo_user_id}/action",
            200,
            data=block_data,
            use_admin_token=True
        )
        
        if not success1:
            return False
        
        print(f"   ✅ User blocked successfully")
        
        # Test unblock user
        unblock_data = {
            "user_id": self.demo_user_id,
            "action": "unblock",
            "reason": "Test unblocking for admin panel testing"
        }
        
        success2, response2 = self.run_test(
            "Admin Action - Unblock User",
            "POST",
            f"admin/users/{self.demo_user_id}/action",
            200,
            data=unblock_data,
            use_admin_token=True
        )
        
        if not success2:
            return False
        
        print(f"   ✅ User unblocked successfully")
        
        # Test reset password
        reset_data = {
            "user_id": self.demo_user_id,
            "action": "reset_password",
            "reason": "Test password reset for admin panel testing"
        }
        
        success3, response3 = self.run_test(
            "Admin Action - Reset Password",
            "POST",
            f"admin/users/{self.demo_user_id}/action",
            200,
            data=reset_data,
            use_admin_token=True
        )
        
        if success3 and 'temp_password' in response3:
            print(f"   ✅ Password reset, temp password: {response3['temp_password']}")
        
        return success1 and success2 and success3

    def test_admin_user_actions_invalid(self):
        """Test admin user actions with invalid data"""
        if not self.admin_token:
            print("   ⚠️  No admin token available, skipping test")
            return False
        
        # Test invalid action
        invalid_data = {
            "user_id": self.demo_user_id or "test_id",
            "action": "invalid_action",
            "reason": "Testing invalid action"
        }
        
        success1, response1 = self.run_test(
            "Admin Action - Invalid Action",
            "POST",
            f"admin/users/{self.demo_user_id or 'test_id'}/action",
            400,
            data=invalid_data,
            use_admin_token=True
        )
        
        # Test non-existent user
        nonexistent_data = {
            "user_id": "nonexistent_user_id",
            "action": "block",
            "reason": "Testing non-existent user"
        }
        
        success2, response2 = self.run_test(
            "Admin Action - Non-existent User",
            "POST",
            "admin/users/nonexistent_user_id/action",
            404,
            data=nonexistent_data,
            use_admin_token=True
        )
        
        return success1 and success2

    def test_admin_logs(self):
        """Test admin logs access"""
        if not self.admin_token:
            print("   ⚠️  No admin token available, skipping test")
            return False
        
        # Test basic logs access
        success1, response1 = self.run_test(
            "Admin Logs - Basic",
            "GET",
            "admin/logs",
            200,
            use_admin_token=True
        )
        
        if not success1:
            return False
        
        # Verify response structure
        required_fields = ['logs', 'total', 'page', 'limit', 'pages']
        for field in required_fields:
            if field not in response1:
                print(f"   ❌ Missing field: {field}")
                return False
        
        print(f"   ✅ Found {response1['total']} logs, page {response1['page']}")
        
        # Test with action filter
        success2, response2 = self.run_test(
            "Admin Logs - Action Filter",
            "GET",
            "admin/logs",
            200,
            data={"action_filter": "LOGIN", "page": 1, "limit": 20},
            use_admin_token=True
        )
        
        # Verify log entries have required fields
        if response1['logs']:
            log = response1['logs'][0]
            log_fields = ['admin_email', 'action', 'timestamp']
            for field in log_fields:
                if field not in log:
                    print(f"   ⚠️  Missing log field: {field}")
                else:
                    print(f"   ✅ Log field {field}: {log[field]}")
        
        return success1 and success2

    def test_admin_logs_unauthorized(self):
        """Test admin logs without admin token"""
        temp_token = self.admin_token
        self.admin_token = None
        
        success, response = self.run_test(
            "Admin Logs - Unauthorized",
            "GET",
            "admin/logs",
            403,
            use_admin_token=False
        )
        
        self.admin_token = temp_token
        return success

    def test_admin_rate_limiting(self):
        """Test rate limiting on admin endpoints"""
        if not self.admin_token:
            print("   ⚠️  No admin token available, skipping test")
            return False
        
        print("\n🔍 Testing Admin Rate Limiting - Login Endpoint (3/minute)...")
        
        login_data = {
            "email": "wrong@email.com",
            "senha": "wrongpassword"
        }
        
        success_count = 0
        rate_limited_count = 0
        
        # Make 5 requests rapidly (should allow 3, then rate limit)
        for i in range(5):
            if i < 3:
                success, response = self.run_test(
                    f"Rate Limit Test Admin Login #{i+1}",
                    "POST",
                    "admin/auth/login",
                    401,  # Expect 401 for invalid credentials
                    data=login_data
                )
                if success:
                    success_count += 1
                    print(f"   ✅ Request {i+1}: Allowed (within rate limit)")
            else:
                # Check for rate limiting
                url = f"{self.base_url}/admin/auth/login"
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
        
        test_passed = success_count >= 3 and rate_limited_count >= 1
        if test_passed:
            self.tests_passed += 1
            print(f"   ✅ Admin login rate limiting working: {success_count} allowed, {rate_limited_count} rate limited")
        else:
            print(f"   ❌ Admin login rate limiting not working: {success_count} allowed, {rate_limited_count} rate limited")
        
        self.tests_run += 1
        return test_passed

    def test_admin_permissions(self):
        """Test admin permissions and access control"""
        if not self.admin_token:
            print("   ⚠️  No admin token available, skipping test")
            return False
        
        # Test that admin can access all endpoints
        endpoints_to_test = [
            ("admin/dashboard", "GET"),
            ("admin/users", "GET"),
            ("admin/logs", "GET")
        ]
        
        all_passed = True
        
        for endpoint, method in endpoints_to_test:
            success, response = self.run_test(
                f"Admin Permission - {endpoint}",
                method,
                endpoint,
                200,
                use_admin_token=True
            )
            
            if not success:
                all_passed = False
                print(f"   ❌ Admin cannot access {endpoint}")
            else:
                print(f"   ✅ Admin can access {endpoint}")
        
        return all_passed

    def test_log_creation(self):
        """Test that admin actions create proper logs"""
        if not self.admin_token or not self.demo_user_id:
            print("   ⚠️  No admin token or demo user ID available, skipping test")
            return False
        
        # Get current log count
        success1, response1 = self.run_test(
            "Get Initial Log Count",
            "GET",
            "admin/logs",
            200,
            data={"limit": 1},
            use_admin_token=True
        )
        
        if not success1:
            return False
        
        initial_count = response1['total']
        
        # Perform an admin action
        action_data = {
            "user_id": self.demo_user_id,
            "action": "block",
            "reason": "Testing log creation"
        }
        
        success2, response2 = self.run_test(
            "Admin Action for Log Test",
            "POST",
            f"admin/users/{self.demo_user_id}/action",
            200,
            data=action_data,
            use_admin_token=True
        )
        
        if not success2:
            return False
        
        # Wait a moment for log to be created
        time.sleep(1)
        
        # Check if log count increased
        success3, response3 = self.run_test(
            "Get Updated Log Count",
            "GET",
            "admin/logs",
            200,
            data={"limit": 1},
            use_admin_token=True
        )
        
        if success3:
            new_count = response3['total']
            if new_count > initial_count:
                print(f"   ✅ Log created successfully: {initial_count} -> {new_count}")
                return True
            else:
                print(f"   ❌ Log not created: count remained {initial_count}")
                return False
        
        return False

def main():
    print("🚀 Starting VornexZPay Admin Panel Tests")
    print("=" * 60)
    
    tester = VornexZPayAdminTester()
    
    # Test sequence for admin panel
    tests = [
        # Setup and Authentication
        ("Admin Initialization", tester.test_init_admin),
        ("Admin Login", tester.test_admin_login),
        ("Admin Login - Invalid Credentials", tester.test_admin_login_invalid),
        
        # Setup demo user for testing
        ("Setup Demo User", tester.test_setup_demo_user),
        
        # Dashboard Tests
        ("Admin Dashboard", tester.test_admin_dashboard),
        ("Admin Dashboard - Unauthorized", tester.test_admin_dashboard_unauthorized),
        
        # User Management Tests
        ("Admin List Users", tester.test_admin_list_users),
        ("Admin List Users - Unauthorized", tester.test_admin_list_users_unauthorized),
        ("Admin User Actions", tester.test_admin_user_actions),
        ("Admin User Actions - Invalid", tester.test_admin_user_actions_invalid),
        
        # Logs Tests
        ("Admin Logs", tester.test_admin_logs),
        ("Admin Logs - Unauthorized", tester.test_admin_logs_unauthorized),
        ("Log Creation Test", tester.test_log_creation),
        
        # Security Tests
        ("Admin Rate Limiting", tester.test_admin_rate_limiting),
        ("Admin Permissions", tester.test_admin_permissions),
    ]
    
    # Track critical vs minor failures
    critical_failures = []
    minor_failures = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if not result:
                # Determine if this is a critical failure
                if any(keyword in test_name.lower() for keyword in ['login', 'dashboard', 'unauthorized', 'rate limiting']):
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
        print("\n🚨 CRITICAL FAILURES (Admin Panel Core Functions):")
        for failure in critical_failures:
            print(f"   ❌ {failure}")
    
    if minor_failures:
        print("\n⚠️  Minor Failures:")
        for failure in minor_failures:
            print(f"   ⚠️  {failure}")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All admin panel tests passed!")
        return 0
    elif not critical_failures:
        print("\n✅ All critical admin panel tests passed! Minor issues can be addressed later.")
        return 0
    else:
        print("\n⚠️  Critical admin panel issues found!")
        return 1

if __name__ == "__main__":
    sys.exit(main())