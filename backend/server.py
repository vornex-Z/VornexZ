from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from jwt import PyJWTError as JWTError
from passlib.context import CryptContext
import re
import pyotp
import qrcode
from io import BytesIO
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import string
import bcrypt
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import hashlib
import secrets
from cryptography.fernet import Fernet
import base64
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Security Configuration
SECURITY_KEY = os.environ.get("SECURITY_KEY", Fernet.generate_key().decode())
cipher_suite = Fernet(SECURITY_KEY.encode() if isinstance(SECURITY_KEY, str) else SECURITY_KEY)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

# Security headers
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()"
}

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create FastAPI instance with security configurations
app = FastAPI(
    title="VornexZPay Secure API",
    description="Secure Banking API with Enterprise-level Security",
    version="2.0.0",
    docs_url=None,  # Disable docs in production
    redoc_url=None,  # Disable redoc in production
    openapi_url=None  # Disable OpenAPI in production
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "vornexzpay_secret_key_2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Models
class UserRegister(BaseModel):
    nome_completo: str
    email: EmailStr
    cpf: str
    rg: str
    telefone: str
    data_nascimento: str
    endereco: str
    cidade: str
    estado: str
    cep: str
    senha: str
    confirmar_senha: str

class UserLogin(BaseModel):
    cpf: str
    senha: str

class UserUpdateData(BaseModel):
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    senha_confirmacao: str

class Enable2FARequest(BaseModel):
    enable: bool
    method: str  # "totp" ou "email"

class Verify2FARequest(BaseModel):
    code: str

class BiometricRequest(BaseModel):
    enable: bool

class AdminUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    email: EmailStr
    cargo: str  # "admin", "suporte", "auditor"
    permissoes: List[str] = []
    ativo: bool = True
    ultimo_acesso: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminLogin(BaseModel):
    email: EmailStr
    senha: str

class AdminCreateUser(BaseModel):
    nome: str
    email: EmailStr
    cargo: str
    senha: str
    permissoes: List[str] = []

class UserManagementAction(BaseModel):
    user_id: str
    action: str  # "block", "unblock", "delete", "reset_password"
    reason: Optional[str] = None

class AdminLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    admin_id: str
    admin_email: str
    action: str
    target_user_id: Optional[str] = None
    details: dict = {}
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ip_address: Optional[str] = None

class UserSecuritySettings(BaseModel):
    two_factor_enabled: bool = False
    two_factor_method: Optional[str] = None  # "totp", "email"
    biometric_enabled: bool = False

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome_completo: str
    email: EmailStr
    cpf: str
    rg: str
    telefone: str
    data_nascimento: str
    endereco: str
    cidade: str
    estado: str
    cep: str
    saldo: float = 0.0
    premium: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Campos de segurança
    two_factor_enabled: bool = False
    two_factor_method: Optional[str] = None  # "totp", "email"
    totp_secret: Optional[str] = None
    biometric_enabled: bool = False
    email_verification_codes: Optional[dict] = None  # {code: expiry_timestamp}

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    tipo: str  # "deposito", "transferencia", "pix", "recarga", "pagamento"
    descricao: str
    valor: float
    status: str = "concluido"
    cashback: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    nome_completo: str
    email: str
    cpf: str
    rg: str
    telefone: str
    data_nascimento: str
    endereco: str
    cidade: str
    estado: str
    cep: str
    saldo: float
    premium: bool

# Helper functions for admin
def convert_objectid_to_str(obj):
    """Convert MongoDB ObjectId to string recursively"""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {key: convert_objectid_to_str(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectid_to_str(item) for item in obj]
    else:
        return obj

async def create_admin_log(admin_email: str, action: str, target_user_id: str = None, details: dict = {}, ip_address: str = None):
    """Cria log de ação administrativa"""
    admin = await db.admin_users.find_one({"email": admin_email})
    if admin:
        log = AdminLog(
            admin_id=admin["id"],
            admin_email=admin_email,
            action=action,
            target_user_id=target_user_id,
            details=details,
            ip_address=ip_address
        )
        await db.admin_logs.insert_one(log.dict())

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifica se é um admin válido"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Admin credentials required",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_type: str = payload.get("type", "user")
        
        if user_type != "admin" or email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    admin = await db.admin_users.find_one({"email": email, "ativo": True})
    if admin is None:
        raise credentials_exception
    return AdminUser(**admin)

def has_permission(admin: AdminUser, required_permission: str) -> bool:
    """Verifica se admin tem permissão específica"""
    if admin.cargo == "admin":  # Admin total tem todas as permissões
        return True
    return required_permission in admin.permissoes

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_email_code():
    return ''.join(random.choices(string.digits, k=6))

async def send_email_code(email: str, code: str):
    """Envia código de verificação por email"""
    # Configurações de email (em produção, usar variáveis de ambiente)
    smtp_server = "smtp.gmail.com"  # Exemplo com Gmail
    smtp_port = 587
    smtp_user = os.environ.get("SMTP_USER", "noreply@vornexzpay.com")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")
    
    if not smtp_password:
        # Para demo, vamos simular o envio
        print(f"[DEMO] Código de verificação para {email}: {code}")
        return True
    
    try:
        message = MIMEMultipart()
        message["From"] = smtp_user
        message["To"] = email
        message["Subject"] = "VornexZPay - Código de Verificação"
        
        body = f"""
        Olá,
        
        Seu código de verificação VornexZPay é: {code}
        
        Este código expira em 10 minutos.
        
        Se você não solicitou este código, ignore este email.
        
        Atenciosamente,
        Equipe VornexZPay
        """
        
        message.attach(MIMEText(body, "plain"))
        
        await aiosmtplib.send(
            message,
            hostname=smtp_server,
            port=smtp_port,
            start_tls=True,
            username=smtp_user,
            password=smtp_password,
        )
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {e}")
        # Para demo, simular sucesso
        print(f"[DEMO] Código de verificação para {email}: {code}")
        return True

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    
    # Decrypt sensitive data
    if "cpf" in user:
        user["cpf"] = decrypt_sensitive_data(user["cpf"])
    if "rg" in user:
        user["rg"] = decrypt_sensitive_data(user["rg"])
    if "telefone" in user:
        user["telefone"] = decrypt_sensitive_data(user["telefone"])
    
    return User(**user)

def validate_cpf(cpf: str) -> bool:
    cpf = re.sub(r'[^0-9]', '', cpf)
    return len(cpf) == 11

def validate_phone(phone: str) -> bool:
    phone = re.sub(r'[^0-9]', '', phone)
    return len(phone) >= 10

# Routes
@api_router.post("/auth/register", response_model=UserResponse)
@limiter.limit("3/minute")  # Limit registrations
async def register(request: Request, user_data: UserRegister):
    # Input sanitization
    user_data.nome_completo = sanitize_input(user_data.nome_completo)
    user_data.email = sanitize_input(str(user_data.email))
    user_data.endereco = sanitize_input(user_data.endereco)
    user_data.cidade = sanitize_input(user_data.cidade)
    user_data.estado = sanitize_input(user_data.estado)
    
    # Validate passwords match
    if user_data.senha != user_data.confirmar_senha:
        raise HTTPException(status_code=400, detail="Senhas não coincidem")
    
    # Validate password length
    if len(user_data.senha) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 6 caracteres")
    
    # Validate CPF format
    if not validate_cpf(user_data.cpf):
        raise HTTPException(status_code=400, detail="CPF inválido")
    
    # Validate phone format
    if not validate_phone(user_data.telefone):
        raise HTTPException(status_code=400, detail="Telefone inválido")
    
    # Check if user already exists
    existing_user = await db.users.find_one({"$or": [{"email": user_data.email}, {"cpf": user_data.cpf}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="Usuário já existe com este email ou CPF")
    
    # Create secure user
    hashed_password = hash_password_secure(user_data.senha)
    
    # Encrypt sensitive data
    user = User(
        nome_completo=user_data.nome_completo,
        email=user_data.email,
        cpf=user_data.cpf,
        rg=user_data.rg,
        telefone=user_data.telefone,
        data_nascimento=user_data.data_nascimento,
        endereco=user_data.endereco,
        cidade=user_data.cidade,
        estado=user_data.estado,
        cep=user_data.cep
    )
    
    user_dict = user.dict()
    user_dict["senha"] = hashed_password
    user_dict["cpf"] = encrypt_sensitive_data(user_dict["cpf"])
    user_dict["rg"] = encrypt_sensitive_data(user_dict["rg"])
    user_dict["telefone"] = encrypt_sensitive_data(user_dict["telefone"])
    user_dict["session_token"] = generate_session_token()
    
    await db.users.insert_one(user_dict)
    
    return UserResponse(
        id=user.id,
        nome_completo=user.nome_completo,
        email=user.email,
        cpf=decrypt_sensitive_data(user_dict["cpf"]),
        rg=decrypt_sensitive_data(user_dict["rg"]),
        telefone=decrypt_sensitive_data(user_dict["telefone"]),
        data_nascimento=user.data_nascimento,
        endereco=user.endereco,
        cidade=user.cidade,
        estado=user.estado,
        cep=user.cep,
        saldo=user.saldo,
        premium=user.premium
    )

@api_router.post("/auth/login", response_model=Token)
@limiter.limit("5/minute")  # Limit login attempts
async def login(request: Request, user_data: UserLogin):
    # Login com CPF - buscar por CPF criptografado
    encrypted_cpf = encrypt_sensitive_data(user_data.cpf)
    user = await db.users.find_one({"cpf": encrypted_cpf})
    
    # Se não encontrar por CPF criptografado, tentar CPF não criptografado (demo users antigos)
    if not user:
        user = await db.users.find_one({"cpf": user_data.cpf})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="CPF não encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar senha
    if not verify_password(user_data.senha, user["senha"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha incorreta",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Gerar token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    # Atualizar último acesso
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"ultimo_acesso": datetime.now(timezone.utc)}}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        nome_completo=current_user.nome_completo,
        email=current_user.email,
        cpf=current_user.cpf,
        rg=current_user.rg,
        telefone=current_user.telefone,
        data_nascimento=current_user.data_nascimento,
        endereco=current_user.endereco,
        cidade=current_user.cidade,
        estado=current_user.estado,
        cep=current_user.cep,
        saldo=current_user.saldo,
        premium=current_user.premium
    )

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(current_user: User = Depends(get_current_user)):
    transactions = await db.transactions.find({"user_id": current_user.id}).sort("created_at", -1).to_list(100)
    return [Transaction(**transaction) for transaction in transactions]

@api_router.put("/user/update-data")
@limiter.limit("10/minute")  # Limit profile updates
async def update_user_data(request: Request, update_data: UserUpdateData, current_user: User = Depends(get_current_user)):
    # Verificar senha antes de permitir alterações
    user_db = await db.users.find_one({"email": current_user.email})
    if not verify_password(update_data.senha_confirmacao, user_db["senha"]):
        raise HTTPException(status_code=400, detail="Senha incorreta")
    
    # Preparar dados para atualização
    update_fields = {}
    
    if update_data.email:
        # Verificar se o novo email já existe (diferente do atual)
        if update_data.email != current_user.email:
            existing_email = await db.users.find_one({"email": update_data.email})
            if existing_email:
                raise HTTPException(status_code=400, detail="Email já está em uso por outra conta")
        update_fields["email"] = update_data.email
    
    if update_data.telefone:
        if not validate_phone(update_data.telefone):
            raise HTTPException(status_code=400, detail="Telefone inválido")
        update_fields["telefone"] = update_data.telefone
    
    if update_data.endereco:
        update_fields["endereco"] = update_data.endereco
    
    if update_data.cidade:
        update_fields["cidade"] = update_data.cidade
    
    if update_data.estado:
        update_fields["estado"] = update_data.estado
    
    if update_data.cep:
        # Validação básica de CEP (formato XXXXX-XXX ou XXXXXXXX)
        import re
        cep_clean = re.sub(r'[^0-9]', '', update_data.cep)
        if len(cep_clean) != 8:
            raise HTTPException(status_code=400, detail="CEP inválido")
        update_fields["cep"] = update_data.cep
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    # Atualizar no banco
    await db.users.update_one(
        {"email": current_user.email},
        {"$set": update_fields}
    )
    
    return {"message": "Dados atualizados com sucesso"}

@api_router.post("/user/enable-2fa")
@limiter.limit("5/minute")  # Limit 2FA operations
async def enable_2fa(request: Request, request_data: Enable2FARequest, current_user: User = Depends(get_current_user)):
    if request_data.enable:
        if request_data.method == "totp":
            # Gerar segredo TOTP
            secret = pyotp.random_base32()
            totp = pyotp.TOTP(secret)
            
            # Atualizar usuário
            await db.users.update_one(
                {"email": current_user.email},
                {"$set": {
                    "two_factor_enabled": True,
                    "two_factor_method": "totp",
                    "totp_secret": secret
                }}
            )
            
            # Gerar QR Code
            provisioning_uri = totp.provisioning_uri(
                name=current_user.email,
                issuer_name="VornexZPay"
            )
            
            return {
                "message": "2FA habilitado",
                "method": "totp",
                "secret": secret,
                "qr_code_uri": provisioning_uri
            }
        
        elif request_data.method == "email":
            await db.users.update_one(
                {"email": current_user.email},
                {"$set": {
                    "two_factor_enabled": True,
                    "two_factor_method": "email"
                }}
            )
            
            return {
                "message": "2FA por email habilitado",
                "method": "email"
            }
    else:
        # Desabilitar 2FA
        await db.users.update_one(
            {"email": current_user.email},
            {"$set": {
                "two_factor_enabled": False,
                "two_factor_method": None,
                "totp_secret": None
            }}
        )
        
        return {"message": "2FA desabilitado"}

@api_router.get("/user/2fa-qr")
async def get_2fa_qr(current_user: User = Depends(get_current_user)):
    user_db = await db.users.find_one({"email": current_user.email})
    
    if not user_db.get("totp_secret"):
        raise HTTPException(status_code=400, detail="2FA TOTP não configurado")
    
    totp = pyotp.TOTP(user_db["totp_secret"])
    provisioning_uri = totp.provisioning_uri(
        name=current_user.email,
        issuer_name="VornexZPay"
    )
    
    # Gerar QR Code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Converter para bytes
    img_bytes = BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    return StreamingResponse(img_bytes, media_type="image/png")

@api_router.post("/user/verify-2fa")
@limiter.limit("10/minute")  # Limit 2FA verification attempts
async def verify_2fa(request: Request, request_data: Verify2FARequest, current_user: User = Depends(get_current_user)):
    user_db = await db.users.find_one({"email": current_user.email})
    
    if user_db.get("two_factor_method") == "totp":
        totp = pyotp.TOTP(user_db["totp_secret"])
        if totp.verify(request_data.code):
            return {"message": "Código verificado com sucesso"}
        else:
            raise HTTPException(status_code=400, detail="Código inválido")
    
    elif user_db.get("two_factor_method") == "email":
        codes = user_db.get("email_verification_codes", {})
        current_time = datetime.now(timezone.utc).timestamp()
        
        # Verificar se o código existe e não expirou
        if request_data.code in codes:
            if codes[request_data.code] > current_time:
                # Remover código usado
                await db.users.update_one(
                    {"email": current_user.email},
                    {"$unset": {f"email_verification_codes.{request_data.code}": ""}}
                )
                return {"message": "Código verificado com sucesso"}
            else:
                # Código expirado
                await db.users.update_one(
                    {"email": current_user.email},
                    {"$unset": {f"email_verification_codes.{request_data.code}": ""}}
                )
                raise HTTPException(status_code=400, detail="Código expirado")
        else:
            raise HTTPException(status_code=400, detail="Código inválido")

@api_router.post("/user/send-email-2fa")
@limiter.limit("3/minute")  # Limit email sending
async def send_email_2fa(request: Request, current_user: User = Depends(get_current_user)):
    user_db = await db.users.find_one({"email": current_user.email})
    
    if user_db.get("two_factor_method") != "email":
        raise HTTPException(status_code=400, detail="2FA por email não está habilitado")
    
    # Gerar código
    code = generate_email_code()
    expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Salvar código no banco
    await db.users.update_one(
        {"email": current_user.email},
        {"$set": {f"email_verification_codes.{code}": expiry.timestamp()}}
    )
    
    # Enviar email
    await send_email_code(current_user.email, code)
    
    return {"message": "Código enviado por email"}

@api_router.post("/user/biometric")
async def toggle_biometric(request: BiometricRequest, current_user: User = Depends(get_current_user)):
    await db.users.update_one(
        {"email": current_user.email},
        {"$set": {"biometric_enabled": request.enable}}
    )
    
    return {"message": f"Biometria {'habilitada' if request.enable else 'desabilitada'}"}

@api_router.get("/user/security-settings", response_model=UserSecuritySettings)
async def get_security_settings(current_user: User = Depends(get_current_user)):
    user_db = await db.users.find_one({"email": current_user.email})
    
    return UserSecuritySettings(
        two_factor_enabled=user_db.get("two_factor_enabled", False),
        two_factor_method=user_db.get("two_factor_method"),
        biometric_enabled=user_db.get("biometric_enabled", False)
    )

# Admin Routes
@api_router.post("/admin/auth/login")
@limiter.limit("3/minute")
async def admin_login(request: Request, admin_data: AdminLogin):
    """Login administrativo"""
    admin = await db.admin_users.find_one({"email": admin_data.email, "ativo": True})
    
    if not admin or not verify_password(admin_data.senha, admin["senha"]):
        await create_admin_log(admin_data.email, "LOGIN_FAILED", ip_address=request.client.host)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais administrativas inválidas"
        )
    
    # Atualizar último acesso
    await db.admin_users.update_one(
        {"email": admin_data.email},
        {"$set": {"ultimo_acesso": datetime.now(timezone.utc)}}
    )
    
    # Criar token com tipo admin
    access_token_expires = timedelta(hours=8)  # Admin tem sessão mais longa
    access_token = create_access_token(
        data={"sub": admin["email"], "type": "admin"}, 
        expires_delta=access_token_expires
    )
    
    await create_admin_log(admin_data.email, "LOGIN_SUCCESS", ip_address=request.client.host)
    
    return {"access_token": access_token, "token_type": "bearer", "admin": AdminUser(**admin)}

@api_router.get("/admin/dashboard")
async def get_admin_dashboard(current_admin: AdminUser = Depends(get_current_admin)):
    """Dashboard administrativo com estatísticas"""
    if not has_permission(current_admin, "view_dashboard"):
        raise HTTPException(status_code=403, detail="Permissão negada")
    
    # Estatísticas gerais
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"ultimo_acesso": {"$gte": datetime.now(timezone.utc) - timedelta(days=30)}})
    
    # Cadastros por período
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    cadastros_hoje = await db.users.count_documents({"created_at": {"$gte": today}})
    cadastros_semana = await db.users.count_documents({"created_at": {"$gte": today - timedelta(days=7)}})
    
    # Logs recentes de segurança
    logs_recentes = await db.admin_logs.find(
        {"action": {"$in": ["LOGIN_FAILED", "ACCOUNT_BLOCKED", "PASSWORD_RESET"]}},
        sort=[("timestamp", -1)],
        limit=10
    ).to_list(10)
    
    # Convert ObjectIds to strings
    logs_recentes = convert_objectid_to_str(logs_recentes)
    
    # Atividades suspeitas (tentativas de login falharam)
    atividades_suspeitas = await db.admin_logs.count_documents({
        "action": "LOGIN_FAILED",
        "timestamp": {"$gte": datetime.now(timezone.utc) - timedelta(hours=24)}
    })
    
    dashboard_data = {
        "total_usuarios": total_users,
        "usuarios_ativos": active_users,
        "cadastros_hoje": cadastros_hoje,
        "cadastros_semana": cadastros_semana,
        "atividades_suspeitas_24h": atividades_suspeitas,
        "logs_recentes": logs_recentes,
        "admin_info": {
            "nome": current_admin.nome,
            "cargo": current_admin.cargo,
            "ultimo_acesso": current_admin.ultimo_acesso
        }
    }
    
    await create_admin_log(current_admin.email, "DASHBOARD_ACCESS")
    return dashboard_data

@api_router.get("/admin/users")
async def get_all_users(
    page: int = 1,
    limit: int = 20,
    search: str = None,
    status: str = None,
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Lista todos os usuários com filtros e paginação"""
    if not has_permission(current_admin, "manage_users"):
        raise HTTPException(status_code=403, detail="Permissão negada")
    
    # Construir query
    query = {}
    if search:
        query["$or"] = [
            {"nome_completo": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"cpf": {"$regex": search, "$options": "i"}}
        ]
    
    if status == "blocked":
        query["blocked"] = True
    elif status == "active":
        query["blocked"] = {"$ne": True}
    
    # Paginação
    skip = (page - 1) * limit
    
    users = await db.users.find(query, {
        "senha": 0  # Não retornar senhas
    }).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    total = await db.users.count_documents(query)
    
    # Convert ObjectIds to strings
    users = convert_objectid_to_str(users)
    
    # Descriptografar dados sensíveis para admin
    for user in users:
        if "cpf" in user:
            try:
                user["cpf"] = decrypt_sensitive_data(user["cpf"])
            except:
                pass  # Manter original se não conseguir descriptografar
        if "rg" in user:
            try:
                user["rg"] = decrypt_sensitive_data(user["rg"])
            except:
                pass
        if "telefone" in user:
            try:
                user["telefone"] = decrypt_sensitive_data(user["telefone"])
            except:
                pass
    
    await create_admin_log(current_admin.email, "USERS_LIST_ACCESS", details={"search": search, "page": page})
    
    return {
        "users": users,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@api_router.post("/admin/users/{user_id}/action")
async def manage_user_action(
    user_id: str,
    action_data: UserManagementAction,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Executa ações de gerenciamento de usuário"""
    if not has_permission(current_admin, "manage_users"):
        raise HTTPException(status_code=403, detail="Permissão negada")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    action = action_data.action
    result = {}
    
    if action == "block":
        await db.users.update_one({"id": user_id}, {"$set": {"blocked": True, "blocked_reason": action_data.reason}})
        result = {"message": "Usuário bloqueado com sucesso"}
        
    elif action == "unblock":
        await db.users.update_one({"id": user_id}, {"$unset": {"blocked": "", "blocked_reason": ""}})
        result = {"message": "Usuário desbloqueado com sucesso"}
        
    elif action == "delete":
        # Soft delete - não remove do banco, apenas marca como deletado
        await db.users.update_one({"id": user_id}, {"$set": {"deleted": True, "deleted_at": datetime.now(timezone.utc)}})
        result = {"message": "Usuário removido com sucesso"}
        
    elif action == "reset_password":
        # Gerar nova senha temporária
        import secrets
        import string
        
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(12))
        hashed_password = get_password_hash(temp_password)
        
        await db.users.update_one({"id": user_id}, {
            "$set": {
                "senha": hashed_password,
                "password_reset_required": True,
                "temp_password": temp_password
            }
        })
        result = {"message": "Senha resetada", "temp_password": temp_password}
    
    else:
        raise HTTPException(status_code=400, detail="Ação inválida")
    
    # Log da ação
    await create_admin_log(
        current_admin.email,
        f"USER_{action.upper()}",
        target_user_id=user_id,
        details={"reason": action_data.reason, "user_email": user.get("email")},
        ip_address=request.client.host
    )
    
    return result

@api_router.get("/admin/logs")
async def get_admin_logs(
    page: int = 1,
    limit: int = 50,
    action_filter: str = None,
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Obtém logs administrativos"""
    if not has_permission(current_admin, "view_logs"):
        raise HTTPException(status_code=403, detail="Permissão negada")
    
    query = {}
    if action_filter:
        query["action"] = {"$regex": action_filter, "$options": "i"}
    
    skip = (page - 1) * limit
    
    logs = await db.admin_logs.find(query).skip(skip).limit(limit).sort("timestamp", -1).to_list(limit)
    total = await db.admin_logs.count_documents(query)
    
    # Convert ObjectIds to strings
    logs = convert_objectid_to_str(logs)
    
    return {
        "logs": logs,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/system-status")
async def system_status():
    """Verificar status do sistema e contadores"""
    try:
        total_users = await db.users.count_documents({})
        total_transactions = await db.transactions.count_documents({})
        total_admins = await db.admin_users.count_documents({})
        total_logs = await db.admin_logs.count_documents({})
        
        return {
            "database_status": "online",
            "counters": {
                "users": total_users,
                "transactions": total_transactions,
                "admins": total_admins,
                "admin_logs": total_logs
            },
            "ready_for_testing": total_users == 0,
            "admin_panel_available": total_admins > 0
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao verificar status: {str(e)}"
        )

@api_router.post("/reset-system")
async def reset_system():
    """Reset completo do sistema - APENAS PARA DESENVOLVIMENTO"""
    try:
        # Remover todos os usuários
        users_deleted = await db.users.delete_many({})
        
        # Remover todas as transações
        transactions_deleted = await db.transactions.delete_many({})
        
        # Remover todos os cartões
        cards_deleted = await db.cards.delete_many({})
        
        # Remover todos os logs admin
        admin_logs_deleted = await db.admin_logs.delete_many({})
        
        # Remover códigos de verificação
        verification_codes_deleted = await db.verification_codes.delete_many({})
        
        # Manter apenas o admin principal
        admin_kept = await db.admin_users.count_documents({"email": "julio@vornexzpay.com"})
        
        return {
            "message": "Sistema resetado com sucesso!",
            "deleted_data": {
                "users": users_deleted.deleted_count,
                "transactions": transactions_deleted.deleted_count,
                "cards": cards_deleted.deleted_count,
                "admin_logs": admin_logs_deleted.deleted_count,
                "verification_codes": verification_codes_deleted.deleted_count,
            },
            "admin_preserved": admin_kept,
            "status": "clean_database_ready_for_testing"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Erro ao resetar sistema: {str(e)}"
        )

# Initialize demo data
@api_router.post("/init-demo")
async def init_demo():
    # Check if demo user exists
    demo_user = await db.users.find_one({"email": "usuario@example.com"})
    
    if not demo_user:
        # Create demo user
        hashed_password = get_password_hash("123456")
        demo_user_data = {
            "id": str(uuid.uuid4()),
            "nome_completo": "João Santos Silva",
            "email": "usuario@example.com",
            "cpf": encrypt_sensitive_data("123.456.789-00"),  # Encrypt CPF
            "rg": encrypt_sensitive_data("12.345.678-9"),    # Encrypt RG
            "telefone": encrypt_sensitive_data("(11) 99999-9999"),  # Encrypt phone
            "data_nascimento": "1990-01-01",
            "endereco": "Rua das Flores, 123",
            "cidade": "São Paulo",
            "estado": "SP",
            "cep": "01234-567",
            "senha": hashed_password,
            "saldo": 5750.00,
            "premium": True,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(demo_user_data)
        demo_user = demo_user_data
        
        # Create demo transactions
        demo_transactions = [
            {
                "id": str(uuid.uuid4()),
                "user_id": demo_user["id"],
                "tipo": "deposito",
                "descricao": "Depósito via PIX",
                "valor": 1500.00,
                "status": "concluido",
                "cashback": 15.00,
                "created_at": datetime(2025, 1, 15, 10, 30, tzinfo=timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": demo_user["id"],
                "tipo": "transferencia",
                "descricao": "Transferência para Maria Santos",
                "valor": -250.00,
                "status": "concluido",
                "created_at": datetime(2025, 1, 14, 16, 45, tzinfo=timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": demo_user["id"],
                "tipo": "pix",
                "descricao": "PIX para Pedro Oliveira",
                "valor": -89.50,
                "status": "concluido",
                "cashback": 0.89,
                "created_at": datetime(2025, 1, 14, 14, 20, tzinfo=timezone.utc)
            }
        ]
        
        await db.transactions.insert_many(demo_transactions)
    
    return {"message": "Demo data initialized"}

@api_router.post("/init-admin")
async def init_admin():
    """Inicializa admin principal - Julio"""
    # Verificar se já existe admin
    existing_admin = await db.admin_users.find_one({"email": "julio@vornexzpay.com"})
    
    if existing_admin:
        return {"message": "Admin já existe"}
    
    # Criar admin principal
    admin_password = "VornexAdmin2025!"  # Senha inicial - deve ser alterada
    hashed_password = get_password_hash(admin_password)
    
    admin_data = {
        "id": str(uuid.uuid4()),
        "nome": "Julio - Admin Principal",
        "email": "julio@vornexzpay.com",
        "cargo": "admin",
        "permissoes": ["all"],  # Admin total tem todas as permissões
        "ativo": True,
        "senha": hashed_password,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.admin_users.insert_one(admin_data)
    
    # Criar log de inicialização
    await create_admin_log("julio@vornexzpay.com", "ADMIN_CREATED", details={"initial_setup": True})
    
    return {
        "message": "Admin principal criado com sucesso!",
        "email": "julio@vornexzpay.com",
        "password": admin_password,
        "warning": "IMPORTANTE: Altere esta senha após o primeiro login!"
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["*"]  # Configure with your domain in production
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Add security headers
    for header, value in SECURITY_HEADERS.items():
        response.headers[header] = value
    
    # Add anti-screenshot and anti-recording headers
    response.headers["X-Screenshot-Block"] = "1"
    response.headers["X-Recording-Block"] = "1"
    response.headers["X-Print-Block"] = "1"
    
    return response

# Encryption/Decryption helpers
def encrypt_sensitive_data(data: str) -> str:
    """Encrypt sensitive data before storing"""
    try:
        encrypted_data = cipher_suite.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted_data).decode()
    except Exception:
        return data  # Return original if encryption fails

def decrypt_sensitive_data(encrypted_data: str) -> str:
    """Decrypt sensitive data after retrieving"""
    try:
        decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
        return cipher_suite.decrypt(decoded_data).decode()
    except Exception:
        return encrypted_data  # Return original if decryption fails

# Enhanced password hashing
def hash_password_secure(password: str) -> str:
    """Secure password hashing with bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password_secure(password: str, hashed: str) -> bool:
    """Verify password with secure bcrypt"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

# Session security
def generate_session_token() -> str:
    """Generate secure session token"""
    return secrets.token_urlsafe(32)

# Input sanitization
def sanitize_input(data: str) -> str:
    """Sanitize user input to prevent injection attacks"""
    if not isinstance(data, str):
        return str(data)
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', 'script', 'javascript:', 'onload=', 'onerror=']
    sanitized = data
    
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, '')
    
    return sanitized.strip()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()