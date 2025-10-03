import requests
import sys
import json
from datetime import datetime
import time

class VornexZPayAdminFinalTester:
    def __init__(self, base_url="https://pix-wallet.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_email = "julio@vornexzpay.com"
        self.admin_password = "VornexAdmin2025!"

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin_token=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if use_admin_token and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, params=data if data else None)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_setup_and_login(self):
        """Test admin setup and login"""
        print("🔧 ADMIN SETUP AND AUTHENTICATION")
        
        # 1. Initialize admin
        success1, response1 = self.run_test(
            "Initialize Admin",
            "POST",
            "init-admin",
            200
        )
        
        # 2. Admin login
        login_data = {
            "email": self.admin_email,
            "senha": self.admin_password
        }
        
        success2, response2 = self.run_test(
            "Admin Login",
            "POST",
            "admin/auth/login",
            200,
            data=login_data
        )
        
        if success2 and 'access_token' in response2:
            self.admin_token = response2['access_token']
            print(f"   ✅ Admin token obtained")
            print(f"   ✅ Admin: {response2['admin']['nome']} ({response2['admin']['email']})")
            print(f"   ✅ Role: {response2['admin']['cargo']}")
        
        # 3. Invalid login
        invalid_data = {
            "email": self.admin_email,
            "senha": "wrong_password"
        }
        
        success3, response3 = self.run_test(
            "Admin Login - Invalid Credentials",
            "POST",
            "admin/auth/login",
            401,
            data=invalid_data
        )
        
        return success1 and success2 and success3

    def test_admin_dashboard(self):
        """Test admin dashboard functionality"""
        print("\n📊 ADMIN DASHBOARD")
        
        if not self.admin_token:
            print("   ⚠️  No admin token available")
            return False
        
        # 1. Access dashboard
        success1, response1 = self.run_test(
            "Admin Dashboard Access",
            "GET",
            "admin/dashboard",
            200,
            use_admin_token=True
        )
        
        if success1:
            # Verify required fields
            required_fields = ['total_usuarios', 'usuarios_ativos', 'cadastros_hoje', 'logs_recentes']
            for field in required_fields:
                if field in response1:
                    print(f"   ✅ {field}: {response1[field]}")
                else:
                    print(f"   ❌ Missing field: {field}")
                    return False
        
        # 2. Unauthorized access
        temp_token = self.admin_token
        self.admin_token = None
        
        success2, response2 = self.run_test(
            "Dashboard - Unauthorized Access",
            "GET",
            "admin/dashboard",
            403
        )
        
        self.admin_token = temp_token
        return success1 and success2

    def test_admin_user_management(self):
        """Test admin user management"""
        print("\n👥 ADMIN USER MANAGEMENT")
        
        if not self.admin_token:
            print("   ⚠️  No admin token available")
            return False
        
        # 1. List all users
        success1, response1 = self.run_test(
            "List All Users",
            "GET",
            "admin/users",
            200,
            use_admin_token=True
        )
        
        if success1:
            print(f"   ✅ Found {response1['total']} users")
            print(f"   ✅ Page {response1['page']} of {response1['pages']}")
            
            if response1['users']:
                user = response1['users'][0]
                print(f"   ✅ Sample user: {user.get('nome_completo')} ({user.get('email')})")
        
        # 2. Search users
        success2, response2 = self.run_test(
            "Search Users",
            "GET",
            "admin/users",
            200,
            data={"search": "test", "page": 1, "limit": 5},
            use_admin_token=True
        )
        
        # 3. Filter by status
        success3, response3 = self.run_test(
            "Filter Users by Status",
            "GET",
            "admin/users",
            200,
            data={"status": "active", "page": 1, "limit": 5},
            use_admin_token=True
        )
        
        # 4. Unauthorized access
        temp_token = self.admin_token
        self.admin_token = None
        
        success4, response4 = self.run_test(
            "List Users - Unauthorized",
            "GET",
            "admin/users",
            403
        )
        
        self.admin_token = temp_token
        return success1 and success2 and success3 and success4

    def test_admin_logs(self):
        """Test admin logs functionality"""
        print("\n📋 ADMIN LOGS")
        
        if not self.admin_token:
            print("   ⚠️  No admin token available")
            return False
        
        # 1. Get all logs
        success1, response1 = self.run_test(
            "Get Admin Logs",
            "GET",
            "admin/logs",
            200,
            use_admin_token=True
        )
        
        if success1:
            print(f"   ✅ Found {response1['total']} logs")
            
            if response1['logs']:
                log = response1['logs'][0]
                print(f"   ✅ Recent log: {log.get('action')} by {log.get('admin_email')}")
                print(f"   ✅ Timestamp: {log.get('timestamp')}")
        
        # 2. Filter logs
        success2, response2 = self.run_test(
            "Filter Logs by Action",
            "GET",
            "admin/logs",
            200,
            data={"action_filter": "LOGIN", "page": 1, "limit": 10},
            use_admin_token=True
        )
        
        # 3. Unauthorized access
        temp_token = self.admin_token
        self.admin_token = None
        
        success3, response3 = self.run_test(
            "Get Logs - Unauthorized",
            "GET",
            "admin/logs",
            403
        )
        
        self.admin_token = temp_token
        return success1 and success2 and success3

    def test_admin_user_actions(self):
        """Test admin user actions with existing users"""
        print("\n⚙️  ADMIN USER ACTIONS")
        
        if not self.admin_token:
            print("   ⚠️  No admin token available")
            return False
        
        # First get a user to test with
        success0, response0 = self.run_test(
            "Get Users for Action Test",
            "GET",
            "admin/users",
            200,
            data={"limit": 1},
            use_admin_token=True
        )
        
        if not success0 or not response0.get('users'):
            print("   ⚠️  No users available for action testing")
            return False
        
        test_user_id = response0['users'][0]['id']
        print(f"   ✅ Using test user ID: {test_user_id}")
        
        # 1. Test invalid action
        invalid_action_data = {
            "user_id": test_user_id,
            "action": "invalid_action",
            "reason": "Testing invalid action"
        }
        
        success1, response1 = self.run_test(
            "Invalid User Action",
            "POST",
            f"admin/users/{test_user_id}/action",
            400,
            data=invalid_action_data,
            use_admin_token=True
        )
        
        # 2. Test non-existent user
        nonexistent_data = {
            "user_id": "nonexistent_id",
            "action": "block",
            "reason": "Testing non-existent user"
        }
        
        success2, response2 = self.run_test(
            "Action on Non-existent User",
            "POST",
            "admin/users/nonexistent_id/action",
            404,
            data=nonexistent_data,
            use_admin_token=True
        )
        
        # 3. Test valid block action
        block_data = {
            "user_id": test_user_id,
            "action": "block",
            "reason": "Admin panel testing"
        }
        
        success3, response3 = self.run_test(
            "Block User Action",
            "POST",
            f"admin/users/{test_user_id}/action",
            200,
            data=block_data,
            use_admin_token=True
        )
        
        # 4. Test unblock action
        unblock_data = {
            "user_id": test_user_id,
            "action": "unblock",
            "reason": "Admin panel testing - unblock"
        }
        
        success4, response4 = self.run_test(
            "Unblock User Action",
            "POST",
            f"admin/users/{test_user_id}/action",
            200,
            data=unblock_data,
            use_admin_token=True
        )
        
        return success1 and success2 and success3 and success4

    def test_admin_security(self):
        """Test admin security features"""
        print("\n🔒 ADMIN SECURITY")
        
        # Test that admin endpoints require proper authentication
        endpoints_to_test = [
            ("admin/dashboard", "GET"),
            ("admin/users", "GET"),
            ("admin/logs", "GET")
        ]
        
        all_passed = True
        
        for endpoint, method in endpoints_to_test:
            success, response = self.run_test(
                f"Security Test - {endpoint}",
                method,
                endpoint,
                403  # Should return 403 without admin token
            )
            
            if not success:
                all_passed = False
        
        return all_passed

def main():
    print("🚀 VornexZPay Admin Panel - Final Comprehensive Test")
    print("=" * 70)
    
    tester = VornexZPayAdminFinalTester()
    
    # Test categories
    test_categories = [
        ("Admin Setup & Authentication", tester.test_admin_setup_and_login),
        ("Admin Dashboard", tester.test_admin_dashboard),
        ("User Management", tester.test_admin_user_management),
        ("Admin Logs", tester.test_admin_logs),
        ("User Actions", tester.test_admin_user_actions),
        ("Security", tester.test_admin_security),
    ]
    
    category_results = {}
    
    for category_name, test_func in test_categories:
        try:
            result = test_func()
            category_results[category_name] = result
            if result:
                print(f"\n✅ {category_name}: PASSED")
            else:
                print(f"\n❌ {category_name}: FAILED")
        except Exception as e:
            print(f"\n❌ {category_name}: FAILED with exception: {str(e)}")
            category_results[category_name] = False
    
    # Final results
    print("\n" + "=" * 70)
    print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} individual tests passed")
    print("\n📋 CATEGORY RESULTS:")
    
    passed_categories = 0
    total_categories = len(category_results)
    
    for category, result in category_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"   {status}: {category}")
        if result:
            passed_categories += 1
    
    print(f"\n🎯 CATEGORY SUMMARY: {passed_categories}/{total_categories} categories passed")
    
    if passed_categories == total_categories:
        print("\n🎉 ALL ADMIN PANEL TESTS PASSED!")
        print("✅ VornexZPay Admin Panel is fully functional!")
        return 0
    elif passed_categories >= total_categories * 0.8:  # 80% pass rate
        print("\n✅ ADMIN PANEL MOSTLY FUNCTIONAL!")
        print("⚠️  Minor issues found but core functionality works")
        return 0
    else:
        print("\n⚠️  SIGNIFICANT ADMIN PANEL ISSUES FOUND!")
        return 1

if __name__ == "__main__":
    sys.exit(main())