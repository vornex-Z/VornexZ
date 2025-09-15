from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr  
from typing import List, Optional
import uuid
from datetime import datetime, timedelta, timezone
import jwt
import hashlib
import json
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
JWT_SECRET = "vornexz_secret_key_2025_cyberpunk"
JWT_ALGORITHM = "HS256"

# Static files for uploads
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Models
class Admin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class AdminResponse(BaseModel):
    id: str
    email: str
    access_token: str

class Company(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    logo_url: Optional[str] = None
    website: Optional[str] = None
    category: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompanyCreate(BaseModel):
    name: str
    description: str
    logo_url: Optional[str] = None
    website: Optional[str] = None
    category: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    category: Optional[str] = None

class SiteContent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    section: str  # "hero", "about", "differentials", "footer"
    title: Optional[str] = None
    content: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SiteContentUpdate(BaseModel):
    title: Optional[str] = None
    content: str

class SiteConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    logo_url: Optional[str] = None
    primary_color: str = "#8B5CF6"  # Purple
    secondary_color: str = "#06B6D4"  # Cyan
    accent_color: str = "#14B8A6"  # Teal
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Utility Functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash

def create_access_token(email: str) -> str:
    payload = {
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("email")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        admin = await db.admins.find_one({"email": email})
        if not admin:
            raise HTTPException(status_code=401, detail="Admin not found")
        
        return Admin(**admin)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Initialize default data
async def init_default_data():
    # Create default admin if not exists
    admin_exists = await db.admins.find_one({"email": "vornexz@hotmail.com"})
    if not admin_exists:
        admin = Admin(
            email="vornexz@hotmail.com",
            password_hash=hash_password("Corinthians12Mortalkombat10@@@")
        )
        await db.admins.insert_one(admin.dict())
        print("Default admin created")
    
    # Create default site content
    default_contents = [
        {"section": "hero", "title": "VornexZPay", "content": "O Futuro dos Pagamentos Começa Aqui"},
        {"section": "about", "title": "Sobre a VornexZ", "content": "A VornexZ é uma holding criada para acumular empresas inovadoras em diferentes áreas, todas unidas por uma visão futurista e disruptiva."},
        {"section": "differentials", "title": "Nossos Diferenciais", "content": "Inovação • Acessibilidade • Tecnologia • Futuro Sustentável"},
        {"section": "footer", "title": "VornexZ", "content": "© 2025 VornexZ — Construindo o futuro, empresa por empresa."}
    ]
    
    for content_data in default_contents:
        exists = await db.site_content.find_one({"section": content_data["section"]})
        if not exists:
            content = SiteContent(**content_data)
            await db.site_content.insert_one(content.dict())
    
    # Create default site config
    config_exists = await db.site_config.find_one()
    if not config_exists:
        config = SiteConfig()
        await db.site_config.insert_one(config.dict())
        print("Default site config created")

# Authentication Routes
@api_router.post("/auth/login", response_model=AdminResponse)
async def login(admin_data: AdminLogin):
    admin = await db.admins.find_one({"email": admin_data.email})
    if not admin or not verify_password(admin_data.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(admin_data.email)
    return AdminResponse(
        id=admin["id"],
        email=admin["email"],
        access_token=access_token
    )

@api_router.get("/auth/me", response_model=Admin)
async def get_current_user(current_admin: Admin = Depends(get_current_admin)):
    return current_admin

# Company Routes
@api_router.get("/companies", response_model=List[Company])
async def get_companies():
    companies = await db.companies.find().to_list(length=None)
    return [Company(**company) for company in companies]

@api_router.post("/companies", response_model=Company)
async def create_company(company_data: CompanyCreate, current_admin: Admin = Depends(get_current_admin)):
    company = Company(**company_data.dict())
    await db.companies.insert_one(company.dict())
    return company

@api_router.get("/companies/{company_id}", response_model=Company)
async def get_company(company_id: str):
    company = await db.companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return Company(**company)

@api_router.put("/companies/{company_id}", response_model=Company)
async def update_company(company_id: str, company_data: CompanyUpdate, current_admin: Admin = Depends(get_current_admin)):
    company = await db.companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    update_data = {k: v for k, v in company_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.companies.update_one({"id": company_id}, {"$set": update_data})
    updated_company = await db.companies.find_one({"id": company_id})
    return Company(**updated_company)

@api_router.delete("/companies/{company_id}")
async def delete_company(company_id: str, current_admin: Admin = Depends(get_current_admin)):
    result = await db.companies.delete_one({"id": company_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"message": "Company deleted successfully"}

# Site Content Routes
@api_router.get("/content", response_model=List[SiteContent])
async def get_site_content():
    content = await db.site_content.find().to_list(length=None)
    return [SiteContent(**item) for item in content]

@api_router.get("/content/{section}", response_model=SiteContent)
async def get_section_content(section: str):
    content = await db.site_content.find_one({"section": section})
    if not content:
        raise HTTPException(status_code=404, detail="Content section not found")
    return SiteContent(**content)

@api_router.put("/content/{section}", response_model=SiteContent)
async def update_section_content(section: str, content_data: SiteContentUpdate, current_admin: Admin = Depends(get_current_admin)):
    existing = await db.site_content.find_one({"section": section})
    if not existing:
        # Create new section
        new_content = SiteContent(section=section, **content_data.dict())
        await db.site_content.insert_one(new_content.dict())
        return new_content
    
    update_data = content_data.dict()
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.site_content.update_one({"section": section}, {"$set": update_data})
    updated_content = await db.site_content.find_one({"section": section})
    return SiteContent(**updated_content)

# Site Config Routes
@api_router.get("/config", response_model=SiteConfig)
async def get_site_config():
    config = await db.site_config.find_one()
    if not config:
        # Create default config
        default_config = SiteConfig()
        await db.site_config.insert_one(default_config.dict())
        return default_config
    return SiteConfig(**config)

@api_router.put("/config", response_model=SiteConfig)
async def update_site_config(config_data: dict, current_admin: Admin = Depends(get_current_admin)):
    config_data["updated_at"] = datetime.now(timezone.utc)
    
    existing = await db.site_config.find_one()
    if existing:
        await db.site_config.update_one({}, {"$set": config_data})
        updated_config = await db.site_config.find_one()
        return SiteConfig(**updated_config)
    else:
        new_config = SiteConfig(**config_data)
        await db.site_config.insert_one(new_config.dict())
        return new_config

# File Upload Routes
@api_router.post("/upload/logo")
async def upload_logo(file: UploadFile = File(...), current_admin: Admin = Depends(get_current_admin)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1]
    filename = f"logo_{uuid.uuid4()}.{file_extension}"
    file_path = uploads_dir / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update site config with new logo URL
    logo_url = f"/uploads/{filename}"
    await db.site_config.update_one({}, {"$set": {"logo_url": logo_url, "updated_at": datetime.now(timezone.utc)}})
    
    return {"logo_url": logo_url}

@api_router.post("/upload/company-logo")
async def upload_company_logo(file: UploadFile = File(...), current_admin: Admin = Depends(get_current_admin)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1]
    filename = f"company_{uuid.uuid4()}.{file_extension}"
    file_path = uploads_dir / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    logo_url = f"/uploads/{filename}"
    return {"logo_url": logo_url}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await init_default_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()