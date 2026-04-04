import requests
import random
from datetime import datetime, timedelta, timezone
from faker import Faker

random.seed(42)
Faker.seed(42)

fake_uk = Faker('uk_UA')
fake_en = Faker('en_US')

BASE_URL = "http://backend:8080"


lviv_companies = {
    "Наша Логістика (Склади)": {"email": "main@logistics.ua", "phone": "+380320000000"},
    "SoftServe": {"email": "office@softserveinc.com", "phone": "+380322409070"},
    "Nestlé Business Services": {"email": "contact@ua.nestle.com", "phone": "+380322978000"},
    "Холдинг !FEST": {"email": "info@fest.lviv.ua", "phone": "+380504306030"},
    "Компанія Ензим": {"email": "office@enzym.com.ua", "phone": "+380322989100"},
    "Шувар (ринок)": {"email": "info@shuvar.com", "phone": "+380322950505"},
    "ОККО": {"email": "office@gng.com.ua", "phone": "+380800501101"},
    "АТБ-Маркет": {"email": "info@atbmarket.com", "phone": "+380800500415"},
    "Сім23": {"email": "office@sim23.ua", "phone": "+380332784400"},
    "Близенько": {"email": "info@blyzenko.ua", "phone": "+380322424242"},
    "Рукавичка": {"email": "office@rukavychka.ua", "phone": "+380800505105"},
    "Сільпо": {"email": "help@silpo.ua", "phone": "+380800301707"}
}

LVIV_WAREHOUSES = [
    {"name": "Склад Рясне-Пром", "address": "вул. Шевченка, 317, Львів", "h": 600, "w": 2000, "l": 5000},
    {"name": "Логістичний центр Захід", "address": "вул. Городоцька, 355, Львів", "h": 800, "w": 3000, "l": 8000},
    {"name": "Склад Сихів-Термінал", "address": "вул. Зелена, 153, Львів", "h": 500, "w": 1500, "l": 4000}
]

LVIV_PROVIDERS = [
    {"name": "МЕТРО Львів", "address": "вул. Джорджа Вашингтона, 8"},
    {"name": "Епіцентр К2", "address": "вул. Б. Хмельницького, 188"},
    {"name": "База Львів-Холод", "address": "вул. Стрийська, 45"}
]

LVIV_STREETS = [
    "вул. Коперника, 15", "вул. Личаківська, 33", "вул. Наукова, 7а",
    "вул. Кульпарківська, 226", "вул. Чорновола, 45", "вул. Сахарова, 42"
]

LVIV_VEHICLES = [
    {"name": "Volvo FH16", "fuel_type": "diesel", "fuel_consumption": 32, "max_weight": 22000, "max_height": 400, "max_width": 250, "max_length": 1360},
    {"name": "MAN TGX", "fuel_type": "diesel", "fuel_consumption": 30, "max_weight": 24000, "max_height": 400, "max_width": 250, "max_length": 1360},
    {"name": "Scania R500", "fuel_type": "diesel", "fuel_consumption": 29, "max_weight": 20000, "max_height": 400, "max_width": 250, "max_length": 1360},
    {"name": "DAF XF 480", "fuel_type": "diesel", "fuel_consumption": 31, "max_weight": 21000, "max_height": 400, "max_width": 250, "max_length": 1360},
    {"name": "Mercedes-Benz Actros", "fuel_type": "diesel", "fuel_consumption": 28, "max_weight": 20500, "max_height": 400, "max_width": 250, "max_length": 1360},
    {"name": "Mercedes-Benz Atego", "fuel_type": "diesel", "fuel_consumption": 18, "max_weight": 5000, "max_height": 350, "max_width": 240, "max_length": 600},
    {"name": "Isuzu NQR", "fuel_type": "diesel", "fuel_consumption": 16, "max_weight": 4500, "max_height": 320, "max_width": 220, "max_length": 550},
    {"name": "TATA LPT 613", "fuel_type": "diesel", "fuel_consumption": 15, "max_weight": 3500, "max_height": 300, "max_width": 210, "max_length": 500},
    {"name": "Iveco Eurocargo", "fuel_type": "diesel", "fuel_consumption": 17, "max_weight": 6000, "max_height": 340, "max_width": 230, "max_length": 650},
    {"name": "Hyundai Mighty", "fuel_type": "diesel", "fuel_consumption": 14, "max_weight": 3000, "max_height": 290, "max_width": 200, "max_length": 480},
    {"name": "Mercedes-Benz Sprinter", "fuel_type": "diesel", "fuel_consumption": 11, "max_weight": 2000, "max_height": 270, "max_width": 175, "max_length": 330},
    {"name": "Volkswagen Crafter", "fuel_type": "diesel", "fuel_consumption": 10, "max_weight": 1800, "max_height": 260, "max_width": 170, "max_length": 320},
    {"name": "Ford Transit", "fuel_type": "gasoline", "fuel_consumption": 12, "max_weight": 1500, "max_height": 250, "max_width": 170, "max_length": 300},
    {"name": "Renault Master", "fuel_type": "diesel", "fuel_consumption": 9, "max_weight": 1600, "max_height": 255, "max_width": 170, "max_length": 310},
    {"name": "Fiat Ducato", "fuel_type": "diesel", "fuel_consumption": 10, "max_weight": 1700, "max_height": 260, "max_width": 175, "max_length": 315},
    {"name": "Renault Kangoo Z.E.", "fuel_type": "electric", "fuel_consumption": 18, "max_weight": 650, "max_height": 180, "max_width": 150, "max_length": 220},
    {"name": "Nissan e-NV200", "fuel_type": "electric", "fuel_consumption": 20, "max_weight": 700, "max_height": 185, "max_width": 150, "max_length": 210},
    {"name": "Ford E-Transit", "fuel_type": "electric", "fuel_consumption": 25, "max_weight": 1200, "max_height": 250, "max_width": 170, "max_length": 300},
    {"name": "Peugeot e-Expert", "fuel_type": "electric", "fuel_consumption": 22, "max_weight": 1000, "max_height": 190, "max_width": 160, "max_length": 250},
    {"name": "Mercedes-Benz eSprinter", "fuel_type": "electric", "fuel_consumption": 35, "max_weight": 1000, "max_height": 260, "max_width": 170, "max_length": 320}
]

LVIV_PRODUCTS = [
    {"name": "Пральний порошок 3кг", "weight": 3000, "h": 30, "w": 20, "l": 10, "cat": "home"},
    {"name": "Мило рідке 5л", "weight": 5000, "h": 28, "w": 18, "l": 15, "cat": "home"},
    {"name": "Засіб для миття посуду", "weight": 12000, "h": 25, "w": 30, "l": 40, "cat": "home"},
    {"name": "Туалетний папір (палета)", "weight": 45000, "h": 180, "w": 80, "l": 120, "cat": "home"},
    {"name": "Шампунь в асортименті (короб)", "weight": 8000, "h": 25, "w": 25, "l": 35, "cat": "home"},
    {"name": "Засіб для підлоги 10л", "weight": 10000, "h": 32, "w": 22, "l": 22, "cat": "home"},
    {"name": "Макаронні вироби (мішок 10кг)", "weight": 10000, "h": 15, "w": 40, "l": 60, "cat": "food"},
    {"name": "Олія соняшникова (ящик 15шт)", "weight": 14000, "h": 30, "w": 25, "l": 38, "cat": "food"},
    {"name": "Гречка 1кг (упаковка 10шт)", "weight": 10000, "h": 18, "w": 25, "l": 35, "cat": "food"},
    {"name": "Борошно вищого ґатунку 25кг", "weight": 25000, "h": 15, "w": 45, "l": 75, "cat": "food"},
    {"name": "Консерви м'ясні (ящик 24шт)", "weight": 12000, "h": 12, "w": 30, "l": 40, "cat": "food"},
    {"name": "Горошок зелений (ящик 12шт)", "weight": 6000, "h": 10, "w": 25, "l": 35, "cat": "food"},
    {"name": "Мінеральна вода 0.5л (пак 12шт)", "weight": 7000, "h": 22, "w": 20, "l": 28, "cat": "drinks"},
    {"name": "Сік яблучний 1л (ящик 10шт)", "weight": 11000, "h": 25, "w": 15, "l": 38, "cat": "drinks"},
    {"name": "Вино ігристо (ящик 6шт)", "weight": 9000, "h": 32, "w": 18, "l": 25, "cat": "drinks"},
    {"name": "Горілка 0.5л (ящик 20шт)", "weight": 18000, "h": 28, "w": 28, "l": 35, "cat": "drinks"},
    {"name": "Напій енергетичний (уп 24шт)", "weight": 7000, "h": 14, "w": 22, "l": 35, "cat": "drinks"},
    {"name": "Фарба інтер'єрна (відро 10л)", "weight": 15000, "h": 28, "w": 28, "l": 28, "cat": "build"},
    {"name": "Клей для плитки 25кг", "weight": 25000, "h": 12, "w": 35, "l": 55, "cat": "build"},
    {"name": "Ламінат (пачка)", "weight": 18000, "h": 7, "w": 20, "l": 128, "cat": "build"},
    {"name": "Радіатор опалення 10 секцій", "weight": 12000, "h": 58, "w": 10, "l": 80, "cat": "build"},
    {"name": "Інструменти (набір в кейсі)", "weight": 5000, "h": 12, "w": 30, "l": 40, "cat": "build"},
    {"name": "Драбина алюмінієва 3м", "weight": 10000, "h": 15, "w": 45, "l": 300, "cat": "build"},
    {"name": "Газоблок (палета)", "weight": 950000, "h": 120, "w": 100, "l": 120, "cat": "build"},
    {"name": "Принтер офісний", "weight": 12000, "h": 35, "w": 42, "l": 40, "cat": "tech"},
    {"name": "Джерело безперебійного живлення", "weight": 25000, "h": 22, "w": 15, "l": 45, "cat": "tech"},
    {"name": "Кабель мережевий (бухта 305м)", "weight": 10000, "h": 20, "w": 35, "l": 35, "cat": "tech"},
    {"name": "Клавіатури (ящик 10шт)", "weight": 7000, "h": 20, "w": 25, "l": 48, "cat": "tech"},
    {"name": "Мікрохвильова піч", "weight": 14000, "h": 30, "w": 48, "l": 38, "cat": "tech"},
    {"name": "Антифриз 5л (пак 4шт)", "weight": 21000, "h": 28, "w": 30, "l": 38, "cat": "auto"},
    {"name": "Омивач скла літній 5л", "weight": 5000, "h": 28, "w": 18, "l": 15, "cat": "auto"},
    {"name": "Фільтр масляний (ящик 50шт)", "weight": 15000, "h": 25, "w": 35, "l": 50, "cat": "auto"},
    {"name": "Акумулятор 60Ah", "weight": 16000, "h": 19, "w": 17, "l": 24, "cat": "auto"},
    {"name": "Заморожені напівфабрикати", "weight": 10000, "h": 20, "w": 28, "l": 38, "cat": "food"},
    {"name": "Сир твердий (голова 8кг)", "weight": 8000, "h": 12, "w": 28, "l": 28, "cat": "food"},
    {"name": "Ковбаски гриль (!FEST)", "weight": 5000, "h": 10, "w": 22, "l": 32, "cat": "food"},
    {"name": "Дріжджі сухі (мішок 15кг)", "weight": 15000, "h": 15, "w": 35, "l": 55, "cat": "food"},
    {"name": "Шоколадні цукерки (короб)", "weight": 4000, "h": 15, "w": 25, "l": 35, "cat": "food"},
    {"name": "Хлібці зернові (ящик)", "weight": 3000, "h": 25, "w": 28, "l": 45, "cat": "food"},
    {"name": "Кетчуп/Майонез (упаковка)", "weight": 6000, "h": 18, "w": 22, "l": 30, "cat": "food"},
    {"name": "Ноутбук Dell Latitude", "weight": 2500, "h": 5, "w": 35, "l": 25, "cat": "tech"},
    {"name": "Монітор 27 дюймів", "weight": 6000, "h": 45, "w": 65, "l": 15, "cat": "tech"},
    {"name": "Мишка бездротова (короб 20шт)", "weight": 3000, "h": 20, "w": 20, "l": 30, "cat": "tech"},
    {"name": "Смартфон Samsung S23", "weight": 400, "h": 18, "w": 10, "l": 5, "cat": "tech"},
    {"name": "Планшет iPad Air", "weight": 800, "h": 26, "w": 19, "l": 6, "cat": "tech"},
    {"name": "Wi-Fi Роутер Gigabit", "weight": 1200, "h": 15, "w": 25, "l": 10, "cat": "tech"},
    {"name": "Навушники Bluetooth (ящик)", "weight": 5000, "h": 30, "w": 40, "l": 30, "cat": "tech"},
    {"name": "Powerbank 20000mAh", "weight": 600, "h": 16, "w": 8, "l": 4, "cat": "tech"},
    {"name": "Смарт-годинник", "weight": 300, "h": 12, "w": 12, "l": 12, "cat": "tech"},
    {"name": "Телевізор 55 дюймів", "weight": 15000, "h": 80, "w": 130, "l": 15, "cat": "tech"},
    {"name": "Яблука Голден (ящик)", "weight": 15000, "h": 20, "w": 40, "l": 60, "cat": "food"},
    {"name": "Картопля (мішок)", "weight": 20000, "h": 15, "w": 35, "l": 65, "cat": "food"},
    {"name": "Кава в зернах 1кг", "weight": 1100, "h": 25, "w": 15, "l": 10, "cat": "food"},
    {"name": "Чай чорний (короб 50уп)", "weight": 5000, "h": 30, "w": 40, "l": 40, "cat": "food"},
    {"name": "Шоколад молочний (блок)", "weight": 2000, "h": 10, "w": 20, "l": 30, "cat": "food"},
    {"name": "Цукор пісок (мішок)", "weight": 50000, "h": 20, "w": 50, "l": 80, "cat": "food"},
    {"name": "Сіль кухонна (пак 10кг)", "weight": 10000, "h": 15, "w": 20, "l": 40, "cat": "food"},
    {"name": "Масло вершкове (ящик)", "weight": 8000, "h": 15, "w": 25, "l": 35, "cat": "food"},
    {"name": "Лосось охолоджений (ящик)", "weight": 12000, "h": 20, "w": 40, "l": 80, "cat": "food"},
    {"name": "Банани Еквадор (короб)", "weight": 19000, "h": 25, "w": 40, "l": 50, "cat": "food"},
    {"name": "Лампочка LED (уп 10шт)", "weight": 1500, "h": 15, "w": 15, "l": 35, "cat": "home"},
    {"name": "Батарейки АА (блок)", "weight": 2000, "h": 10, "w": 20, "l": 20, "cat": "home"},
    {"name": "Пакети для сміття (ящик)", "weight": 8000, "h": 25, "w": 30, "l": 40, "cat": "home"},
    {"name": "Губки для посуду (мішок)", "weight": 3000, "h": 40, "w": 40, "l": 60, "cat": "home"},
    {"name": "Зубна паста (короб 50шт)", "weight": 6000, "h": 20, "w": 30, "l": 35, "cat": "home"},
    {"name": "Рушники паперові (спайка)", "weight": 4000, "h": 30, "w": 40, "l": 60, "cat": "home"},
    {"name": "Цемент М500 (мішок)", "weight": 25000, "h": 15, "w": 40, "l": 60, "cat": "build"},
    {"name": "Цвяхи 100мм (ящик 10кг)", "weight": 10000, "h": 15, "w": 20, "l": 30, "cat": "build"},
    {"name": "Монтажна піна (ящик 12шт)", "weight": 11000, "h": 35, "w": 25, "l": 35, "cat": "build"},
    {"name": "Рулетка 5м (короб)", "weight": 3000, "h": 15, "w": 25, "l": 30, "cat": "build"}
]

def clear_before_seed(headers):
    for endpoint in ["arrivals", "requests", "sku", "products", "vehicles", "delivery-points", "employees", "clients"]:
        resp = requests.get(f"{BASE_URL}/{endpoint}", headers=headers, params={"limit": 1000})
        if resp.status_code == 200:
            data_json = resp.json()
            if data_json and isinstance(data_json, dict):
                items = data_json.get("data")
                if isinstance(items, list):
                    for item in items:
                        if item.get("role") != "admin":
                            requests.delete(f"{BASE_URL}/{endpoint}/{item.get('id')}", headers=headers)
    print("Database cleared.")

def seed_requests(headers, product_ids, point_ids):
    emergency_levels = ["default", "high", "critical"]
    req_count = 0
    for i in range(100):
        payload = {
            "product_id": random.choice(product_ids),
            "delivery_point_id": random.choice(point_ids),
            "quantity": random.randint(1, 100),
            "emergency": emergency_levels[i % 3] 
        }
        res = requests.post(f"{BASE_URL}/requests", json=payload, headers=headers)
        if res.status_code in (200, 201):
            req_count += 1
    print(f"Requests (Orders) generated: {req_count}.")

def seed_arrivals(headers, vehicle_ids, driver_ids):
    arrival_count = 0
    if not vehicle_ids or not driver_ids:
        return
    for i in range(10):
        arrival_time = (datetime.now(timezone.utc) + timedelta(days=random.randint(1, 10), hours=random.randint(0, 23))).strftime("%Y-%m-%dT%H:%M:%SZ")
        payload = {
            "transport_id": random.choice(vehicle_ids),
            "driver_id": random.choice(driver_ids),
            "time_to_arrival": arrival_time
        }
        res = requests.post(f"{BASE_URL}/arrivals", json=payload, headers=headers)
        if res.status_code in (200, 201):
            arrival_count += 1
    print(f"Arrivals generated: {arrival_count}.")

def run_setup():
    login_data = {"email": "admin@admin.com", "password": "1111"}
    login_resp = requests.post(f"{BASE_URL}/login", json=login_data)
    
    if login_resp.status_code != 200:
        print("Login error!")
        return
    
    token = login_resp.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}
    print("Authorization successful.")

    clear_before_seed(headers)

    dist = {"logistician": 5, "driver": 20, "warehouse_manager": 20}
    emp_count = 0
    driver_ids = []
    for role, count in dist.items():
        for _ in range(count):
            payload = {
                "fullname": fake_uk.name(),
                "email": f"{fake_en.unique.user_name()}@gmail.com",
                "password": "password123",
                "phone": f"+380{random.randint(100000000, 999999999)}",
                "role": role
            }
            res = requests.post(f"{BASE_URL}/employees", json=payload, headers=headers)
            if res.status_code in (200, 201):
                emp_count += 1
                if role == "driver":
                    driver_ids.append(res.json().get("id"))
    print(f"Employees generated: {emp_count}.")

    saved_clients = []
    for name, info in lviv_companies.items():
        payload = {
            "name": name,
            "password": "password123",
            "email": info["email"],
            "phone": info["phone"]
        }
        res = requests.post(f"{BASE_URL}/clients", json=payload, headers=headers)
        if res.status_code in (200, 201):
            client_id = res.json().get("id")
            saved_clients.append({"id": client_id, "name": name})
            
    print(f"Clients generated: {len(saved_clients) - 1}.")

    main_owner_id = saved_clients[0]["id"]
    our_logistics_points = []
    points_eligible_for_requests = []
    dp_count = 0

    for wh in LVIV_WAREHOUSES:
        payload = {
            "name": wh["name"],
            "address": wh["address"],
            "owner_id": main_owner_id,
            "type": "warehouse",
            "height": wh["h"],
            "width": wh["w"],
            "length": wh["l"]
        }
        res = requests.post(f"{BASE_URL}/delivery-points", json=payload, headers=headers)
        if res.status_code in (200, 201):
            p_id = res.json().get("id")
            our_logistics_points.append({"id": p_id, "name": wh["name"]})
            points_eligible_for_requests.append(p_id)
            dp_count += 1

    for prov in LVIV_PROVIDERS:
        payload = {
            "name": prov["name"],
            "address": prov["address"],
            "owner_id": main_owner_id,
            "type": "provider"
        }
        res = requests.post(f"{BASE_URL}/delivery-points", json=payload, headers=headers)
        if res.status_code in (200, 201):
            our_logistics_points.append({"id": res.json().get("id"), "name": prov["name"]})
            dp_count += 1

    for cli in saved_clients[1:]:
        for i in range(2):
            payload = {
                "name": f"Філія {cli['name']} #{i+1}",
                "address": random.choice(LVIV_STREETS),
                "owner_id": cli["id"],
                "type": "client_point"
            }
            res = requests.post(f"{BASE_URL}/delivery-points", json=payload, headers=headers)
            if res.status_code in (200, 201):
                p_id = res.json().get("id")
                points_eligible_for_requests.append(p_id)
                dp_count += 1
    print(f"Delivery points generated: {dp_count}.")

    vehicle_count = 0
    vehicle_ids = []
    warehouse_addresses = [wh["address"] for wh in LVIV_WAREHOUSES]
    
    for v in LVIV_VEHICLES:
        for i in range(1, 3):
            payload = {
                "name": f"{v['name']} #{i}",
                "fuel_type": v["fuel_type"],
                "fuel_consumption": v["fuel_consumption"],
                "max_weight": v["max_weight"],
                "max_height": v["max_height"],
                "max_width": v["max_width"],
                "max_length": v["max_length"],
                "address": random.choice(warehouse_addresses)
            }
            res = requests.post(f"{BASE_URL}/vehicles", json=payload, headers=headers)
            if res.status_code in (200, 201):
                vehicle_count += 1
                vehicle_ids.append(res.json().get("id"))
    print(f"Vehicles generated: {vehicle_count}.")

    sku_count = 0
    prod_count = 0
    all_product_ids = []

    for prod in LVIV_PRODUCTS:
        payload = {
            "name": prod["name"],
            "weight": prod["weight"],
            "height": prod["h"],
            "width": prod["w"],
            "length": prod["l"]
        }
        res = requests.post(f"{BASE_URL}/products", json=payload, headers=headers)
        
        if res.status_code in (200, 201):
            prod_count += 1
            p_id = res.json().get("id")
            all_product_ids.append(p_id)
            cat = prod["cat"]

            valid_destinations = []
            for point in our_logistics_points:
                name = point["name"]
                
                if cat == "tech" and ("Епіцентр" in name or "Захід" in name or "Рясне" in name):
                    valid_destinations.append(point["id"])
                elif cat in ["food", "drinks"] and ("Холод" in name or "МЕТРО" in name or "Сихів" in name):
                    valid_destinations.append(point["id"])
                elif cat in ["build", "home", "auto"] and ("Епіцентр" in name or "МЕТРО" in name or "Рясне" in name):
                    valid_destinations.append(point["id"])

            for dp_id in valid_destinations:
                for _ in range(random.randint(1, 3)):
                    sku_payload = {
                        "product_id": p_id,
                        "delivery_point_id": dp_id
                    }
                    sku_res = requests.post(f"{BASE_URL}/sku", json=sku_payload, headers=headers)
                    if sku_res.status_code in (200, 201):
                        sku_count += 1
                        
    print(f"Products generated: {prod_count}.")
    print(f"SKUs generated: {sku_count}.")
    
    
    if all_product_ids and points_eligible_for_requests:
        seed_requests(headers, all_product_ids, points_eligible_for_requests)
        
    if vehicle_ids and driver_ids:
        seed_arrivals(headers, vehicle_ids, driver_ids)
        
    print("Database successfully seeded with data.")

if __name__ == "__main__":
    run_setup()