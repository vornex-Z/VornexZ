import requests
import json

base_url = "https://pix-wallet.preview.emergentagent.com/api"

print("🔍 Testing Demo User Setup and Login...")

# 1. Initialize demo data
print("\n1. Initializing demo data...")
response = requests.post(f"{base_url}/init-demo", headers={'Content-Type': 'application/json'})
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

# 2. Try different CPF formats for login
cpf_formats = [
    "123.456.789-00",
    "12345678900",
    "123456789-00"
]

for cpf in cpf_formats:
    print(f"\n2. Trying login with CPF: {cpf}")
    login_data = {"cpf": cpf, "senha": "123456"}
    response = requests.post(f"{base_url}/auth/login", json=login_data, headers={'Content-Type': 'application/json'})
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"✅ Login successful with CPF: {cpf}")
        token = response.json().get('access_token')
        
        # Get user info
        print("\n3. Getting user info...")
        headers = {'Authorization': f'Bearer {token}'}
        user_response = requests.get(f"{base_url}/auth/me", headers=headers)
        print(f"User info: {user_response.json()}")
        break
    else:
        print(f"❌ Login failed: {response.json()}")