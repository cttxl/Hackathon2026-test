import requests
import random
from faker import Faker

# Фіксуємо "зерно" для ідентичних результатів при кожному запуску
random.seed(42)
Faker.seed(42)

fake_uk = Faker('uk_UA')
fake_en = Faker('en_US')

BASE_URL = "http://backend:8080"

# --- ДАНІ ДЛЯ ГЕНЕРАЦІЇ ---
lviv_companies = {
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
    {"name": "Склад Рясне-Пром", "address": "вул. Шевченка, 317, Львів", "h": 500, "w": 1000, "l": 2500},
    {"name": "Логістичний центр Захід", "address": "вул. Городоцька, 355, Львів", "h": 600, "w": 1200, "l": 3000},
    {"name": "Склад Сихів-Термінал", "address": "вул. Зелена, 153, Львів", "h": 400, "w": 800, "l": 1500}
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

LVIV_PRODUCTS = [
    # --- РІТЕЙЛ: Побутова хімія та Гігієна (АТБ, Близенько, Рукавичка) ---
    {"name": "Пральний порошок 3кг", "weight": 3, "h": 40, "w": 25, "l": 15},
    {"name": "Мило рідке 5л (каністра)", "weight": 5, "h": 30, "w": 20, "l": 15},
    {"name": "Засіб для миття посуду (ящик)", "weight": 12, "h": 25, "w": 35, "l": 45},
    {"name": "Туалетний папір (палета 40 пак)", "weight": 45, "h": 160, "w": 80, "l": 120},
    {"name": "Шампунь в асортименті (короб)", "weight": 8, "h": 20, "w": 30, "l": 40},
    {"name": "Засіб для підлоги 10л", "weight": 10, "h": 35, "w": 25, "l": 20},

    # --- РІТЕЙЛ: Бакалія та Консерви (Сільпо, АТБ, Сім23) ---
    {"name": "Макаронні вироби (мішок 10кг)", "weight": 10, "h": 15, "w": 35, "l": 55},
    {"name": "Олія соняшникова (ящик 15шт)", "weight": 14, "h": 32, "w": 28, "l": 42},
    {"name": "Гречка 1кг (упаковка 10шт)", "weight": 10, "h": 20, "w": 30, "l": 40},
    {"name": "Борошно вищого ґатунку 25кг", "weight": 25, "h": 15, "w": 40, "l": 65},
    {"name": "Консерви м'ясні (ящик 24шт)", "weight": 12, "h": 15, "w": 30, "l": 45},
    {"name": "Горошок зелений (ящик 12шт)", "weight": 6, "h": 12, "w": 25, "l": 35},

    # --- НАПОЇ ТА АЛКОГОЛЬ (Львівська пивоварня, Сільпо, МЕТРО) ---
    {"name": "Мінеральна вода 0.5л (пак 12шт)", "weight": 7, "h": 25, "w": 20, "l": 30},
    {"name": "Сік яблучний 1л (ящик 10шт)", "weight": 11, "h": 25, "w": 20, "l": 40},
    {"name": "Вино ігристо (ящик 6шт)", "weight": 9, "h": 35, "w": 20, "l": 30},
    {"name": "Горілка 0.5л (ящик 20шт)", "weight": 18, "h": 30, "w": 30, "l": 45},
    {"name": "Напій енергетичний (уп 24шт)", "weight": 7, "h": 15, "w": 25, "l": 40},

    # --- БУДІВНИЦТВО ТА ДІМ (Епіцентр, МЕТРО) ---
    {"name": "Фарба інтер'єрна (відро 10л)", "weight": 15, "h": 30, "w": 30, "l": 30},
    {"name": "Клей для плитки 25кг", "weight": 25, "h": 12, "w": 35, "l": 55},
    {"name": "Ламінат (пачка)", "weight": 18, "h": 8, "w": 20, "l": 130},
    {"name": "Радіатор опалення 10 секцій", "weight": 12, "h": 60, "w": 10, "l": 85},
    {"name": "Інструменти (набір в кейсі)", "weight": 5, "h": 15, "w": 35, "l": 45},
    {"name": "Драбина алюмінієва 3м", "weight": 10, "h": 15, "w": 45, "l": 300},
    {"name": "Газоблок (палета)", "weight": 950, "h": 110, "w": 100, "l": 120},

    # --- ТЕХНІКА ТА ІТ (SoftServe, Епіцентр) ---
    {"name": "Принтер офісний", "weight": 12, "h": 40, "w": 45, "l": 45},
    {"name": "Джерело безперебійного живлення", "weight": 25, "h": 30, "w": 20, "l": 50},
    {"name": "Кабель мережевий (бухта 305м)", "weight": 10, "h": 25, "w": 35, "l": 35},
    {"name": "Клавіатури (ящик 10шт)", "weight": 7, "h": 25, "w": 30, "l": 55},
    {"name": "Мікрохвильова піч", "weight": 14, "h": 35, "w": 50, "l": 40},

    # --- АВТО ТА ПАЛИВО (ОККО) ---
    {"name": "Антифриз 5л (пак 4шт)", "weight": 21, "h": 30, "w": 35, "l": 40},
    {"name": "Омивач скла літній 5л", "weight": 5, "h": 30, "w": 20, "l": 15},
    {"name": "Фільтр масляний (ящик 50шт)", "weight": 15, "h": 30, "w": 40, "l": 60},
    {"name": "Акумулятор 60Ah", "weight": 16, "h": 20, "w": 18, "l": 25},

    # --- ПРОДУКТИ (Ензим, !FEST, Сільпо) ---
    {"name": "Заморожені напівфабрикати", "weight": 10, "h": 25, "w": 30, "l": 40},
    {"name": "Сир твердий (голова 8кг)", "weight": 8, "h": 15, "w": 30, "l": 30},
    {"name": "Ковбаски гриль (!FEST)", "weight": 5, "h": 15, "w": 25, "l": 35},
    {"name": "Дріжджі сухі (мішок 15кг)", "weight": 15, "h": 15, "w": 30, "l": 50},
    {"name": "Шоколадні цукерки (короб)", "weight": 4, "h": 20, "w": 30, "l": 40},
    {"name": "Хлібці зернові (ящик)", "weight": 3, "h": 30, "w": 30, "l": 50},
    {"name": "Кетчуп/Майонез (упаковка)", "weight": 6, "h": 20, "w": 25, "l": 35}
]

def clear_before_seed(headers):
    print("🧹 Починаємо очищення бази...")
    for endpoint in ["products", "delivery-points", "employees", "clients"]:
        resp = requests.get(f"{BASE_URL}/{endpoint}", headers=headers, params={"limit": 1000})
        if resp.status_code == 200:
            data_json = resp.json()
            if data_json and isinstance(data_json, dict):
                items = data_json.get("data")
                if isinstance(items, list):
                    for item in items:
                        if item.get("role") != "admin":
                            requests.delete(f"{BASE_URL}/{endpoint}/{item.get('id')}", headers=headers)
    print("✨ База очищена.")

def run_setup():
    print("🔐 Авторизація...")
    login_data = {"email": "admin@admin.com", "password": "1111"}
    login_resp = requests.post(f"{BASE_URL}/login", json=login_data)
    
    if login_resp.status_code != 200:
        print("❌ Помилка входу!")
        return
    
    # Витягуємо ID адміна та токен
    admin_id = login_resp.json().get("id")
    token = login_resp.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Очищення
    clear_before_seed(headers)

    # 2. Створення працівників
    print("\n👷 Створюємо працівників (45 осіб)...")
    dist = {"logistician": 5, "driver": 20, "warehouse_manager": 20}
    for role, count in dist.items():
        for _ in range(count):
            payload = {
                "fullname": fake_uk.name(),
                "email": f"{fake_en.unique.user_name()}@gmail.com",
                "password": "password123",
                "phone": f"+380{random.randint(100000000, 999999999)}",
                "role": role
            }
            requests.post(f"{BASE_URL}/employees", json=payload, headers=headers)

    # 3. Створення клієнтів
    print("\n🏢 Додаємо львівські компанії...")
    for name, info in lviv_companies.items():
        payload = {
            "name": name,
            "password": "password123",
            "email": info["email"],
            "phone": info["phone"]
        }
        requests.post(f"{BASE_URL}/clients", json=payload, headers=headers)

    # 4. Створення точок доставки (Delivery Points)
    clients_resp = requests.get(f"{BASE_URL}/clients", headers=headers, params={"limit": 100})
    clients = clients_resp.json().get("data", [])

    print("\n📦 Створюємо точки доставки (Delivery Points)...")

    # Власні склади
    for wh in LVIV_WAREHOUSES:
        payload = {
            "name": wh["name"], "address": wh["address"], "owner_id": admin_id,
            "type": "warehouse", "height": wh["h"], "width": wh["w"], "length": wh["l"]
        }
        requests.post(f"{BASE_URL}/delivery-points", json=payload, headers=headers)

    # Постачальники
    for prov in LVIV_PROVIDERS:
        payload = {
            "name": prov["name"], "address": prov["address"], "owner_id": admin_id,
            "type": "provider"
        }
        requests.post(f"{BASE_URL}/delivery-points", json=payload, headers=headers)

    # Точки клієнтів
    for cli in clients:
        for i in range(2):
            payload = {
                "name": f"Філія {cli['name']} #{i+1}",
                "address": random.choice(LVIV_STREETS),
                "owner_id": cli["id"],
                "type": "client_point"
            }
            requests.post(f"{BASE_URL}/delivery-points", json=payload, headers=headers)
    
    print(f"✅ Створено {len(LVIV_WAREHOUSES)} складів, {len(LVIV_PROVIDERS)} постачальників та {len(clients)*2} точок.")
    print("\n📦 Створюємо різноманітні товари (Products)...")
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
            print(f"✅ Товар додано: {prod['name']}")
        elif res.status_code == 409:
            print(f"⚠️ Товар '{prod['name']}' вже існує")
        else:
            print(f"❌ Помилка при створенні '{prod['name']}': {res.status_code}")
    print("\n🎉 УСПІХ! База наповнена стабільними даними.")

if __name__ == "__main__":
    run_setup()