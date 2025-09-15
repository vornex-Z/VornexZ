import requests
import sys
import json
from datetime import datetime

class VornexZPayAPITester:
    def __init__(self, base_url="https://tech-horizon-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_email = "vornexz@hotmail.com"
        self.admin_password = "Corinthians12Mortalkombat10@@@"

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
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
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

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
                print(f"   Response: {response.text[:300]}...")

            return success, response.json() if response.text and success else {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_public_endpoints(self):
        """Test public endpoints that don't require authentication"""
        print("\n" + "="*50)
        print("TESTING PUBLIC ENDPOINTS")
        print("="*50)
        
        # Test site config
        success, config = self.run_test(
            "Get Site Config",
            "GET",
            "config",
            200
        )
        
        # Test site content
        success, content = self.run_test(
            "Get Site Content",
            "GET", 
            "content",
            200
        )
        
        # Test companies list
        success, companies = self.run_test(
            "Get Companies List",
            "GET",
            "companies", 
            200
        )
        
        return companies

    def test_admin_login(self):
        """Test admin authentication"""
        print("\n" + "="*50)
        print("TESTING ADMIN AUTHENTICATION")
        print("="*50)
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": self.admin_email, "password": self.admin_password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"✅ Token obtained: {self.token[:20]}...")
            
            # Test token verification
            success, user_data = self.run_test(
                "Verify Token",
                "GET",
                "auth/me",
                200
            )
            
            return True
        else:
            print("❌ Failed to get access token")
            return False

    def test_company_crud(self, existing_companies):
        """Test company CRUD operations"""
        print("\n" + "="*50)
        print("TESTING COMPANY CRUD OPERATIONS")
        print("="*50)
        
        if not self.token:
            print("❌ No authentication token available")
            return None
            
        # Test creating a new company
        test_company_data = {
            "name": "VornexZ Test Company",
            "description": "Test company for API testing",
            "category": "Testing",
            "website": "https://test.vornexz.com"
        }
        
        success, created_company = self.run_test(
            "Create Company",
            "POST",
            "companies",
            200,
            data=test_company_data
        )
        
        if not success or not created_company:
            print("❌ Failed to create test company")
            return None
            
        company_id = created_company.get('id')
        print(f"✅ Created company with ID: {company_id}")
        
        # Test getting specific company
        success, company = self.run_test(
            "Get Specific Company",
            "GET",
            f"companies/{company_id}",
            200
        )
        
        # Test updating company
        update_data = {
            "name": "VornexZ Updated Test Company",
            "description": "Updated test company description"
        }
        
        success, updated_company = self.run_test(
            "Update Company",
            "PUT",
            f"companies/{company_id}",
            200,
            data=update_data
        )
        
        # Test deleting company
        success, delete_response = self.run_test(
            "Delete Company",
            "DELETE",
            f"companies/{company_id}",
            200
        )
        
        return company_id

    def test_content_management(self):
        """Test content management operations"""
        print("\n" + "="*50)
        print("TESTING CONTENT MANAGEMENT")
        print("="*50)
        
        if not self.token:
            print("❌ No authentication token available")
            return False
            
        # Test getting specific section content
        success, hero_content = self.run_test(
            "Get Hero Section Content",
            "GET",
            "content/hero",
            200
        )
        
        # Test updating content
        update_data = {
            "title": "VornexZPay - Test Updated",
            "content": "Test content update from API testing"
        }
        
        success, updated_content = self.run_test(
            "Update Hero Content",
            "PUT",
            "content/hero",
            200,
            data=update_data
        )
        
        # Restore original content
        if hero_content:
            success, restored_content = self.run_test(
                "Restore Original Hero Content",
                "PUT",
                "content/hero",
                200,
                data={
                    "title": hero_content.get('title', 'VornexZPay'),
                    "content": hero_content.get('content', 'O Futuro dos Pagamentos Começa Aqui')
                }
            )
        
        return True

    def test_file_upload_endpoints(self):
        """Test file upload endpoints (without actual file)"""
        print("\n" + "="*50)
        print("TESTING FILE UPLOAD ENDPOINTS")
        print("="*50)
        
        if not self.token:
            print("❌ No authentication token available")
            return False
            
        # Test logo upload endpoint (expect 422 without file)
        success, response = self.run_test(
            "Logo Upload Endpoint (No File)",
            "POST",
            "upload/logo",
            422  # Expected to fail without file
        )
        
        # Test company logo upload endpoint (expect 422 without file)
        success, response = self.run_test(
            "Company Logo Upload Endpoint (No File)",
            "POST",
            "upload/company-logo", 
            422  # Expected to fail without file
        )
        
        return True

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting VornexZPay API Tests")
        print(f"🌐 Base URL: {self.base_url}")
        print(f"📡 API URL: {self.api_url}")
        
        # Test public endpoints first
        companies = self.test_public_endpoints()
        
        # Test admin authentication
        auth_success = self.test_admin_login()
        
        if auth_success:
            # Test protected endpoints
            self.test_company_crud(companies)
            self.test_content_management()
            self.test_file_upload_endpoints()
        else:
            print("❌ Skipping protected endpoint tests due to authentication failure")
        
        # Print final results
        print("\n" + "="*60)
        print("📊 FINAL TEST RESULTS")
        print("="*60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed!")
            return 1

def main():
    tester = VornexZPayAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())