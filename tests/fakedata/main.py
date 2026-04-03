import requests

login_data = {"email": "admin@admin.com", "password": "1111"}
login_response = requests.post("http://backend:8080/login", json=login_data)

if login_response.status_code == 200:
    token = login_response.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get("http://backend:8080/employees", headers=headers)
    print(response.json())
else:
    print(f"Login failed: {login_response.status_code} - {login_response.text}")