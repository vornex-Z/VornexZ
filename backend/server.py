from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
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
    email: EmailStr
    senha: str

class UserUpdateData(BaseModel):
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    senha_confirmacao: str

class Enable2FARequest(BaseModel):
    enable: bool
    method: str  # "totp" ou "email"

class Verify2FARequest(BaseModel):
    code: str

class BiometricRequest(BaseModel):
    enable: bool

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
    saldo: float
    premium: bool

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
    return User(**user)

def validate_cpf(cpf: str) -> bool:
    cpf = re.sub(r'[^0-9]', '', cpf)
    return len(cpf) == 11

def validate_phone(phone: str) -> bool:
    phone = re.sub(r'[^0-9]', '', phone)
    return len(phone) >= 10

# Routes
@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserRegister):
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
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    existing_cpf = await db.users.find_one({"cpf": user_data.cpf})
    if existing_cpf:
        raise HTTPException(status_code=400, detail="CPF já cadastrado")
    
    # Create user
    hashed_password = get_password_hash(user_data.senha)
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
    await db.users.insert_one(user_dict)
    
    return UserResponse(
        id=user.id,
        nome_completo=user.nome_completo,
        email=user.email,
        saldo=user.saldo,
        premium=user.premium
    )

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.senha, user["senha"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        nome_completo=current_user.nome_completo,
        email=current_user.email,
        saldo=current_user.saldo,
        premium=current_user.premium
    )

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(current_user: User = Depends(get_current_user)):
    transactions = await db.transactions.find({"user_id": current_user.id}).sort("created_at", -1).to_list(100)
    return [Transaction(**transaction) for transaction in transactions]

@api_router.put("/user/update-data")
async def update_user_data(update_data: UserUpdateData, current_user: User = Depends(get_current_user)):
    # Verificar senha antes de permitir alterações
    user_db = await db.users.find_one({"email": current_user.email})
    if not verify_password(update_data.senha_confirmacao, user_db["senha"]):
        raise HTTPException(status_code=400, detail="Senha incorreta")
    
    # Preparar dados para atualização
    update_fields = {}
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
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    # Atualizar no banco
    await db.users.update_one(
        {"email": current_user.email},
        {"$set": update_fields}
    )
    
    return {"message": "Dados atualizados com sucesso"}

@api_router.post("/user/enable-2fa")
async def enable_2fa(request: Enable2FARequest, current_user: User = Depends(get_current_user)):
    if request.enable:
        if request.method == "totp":
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
        
        elif request.method == "email":
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
async def verify_2fa(request: Verify2FARequest, current_user: User = Depends(get_current_user)):
    user_db = await db.users.find_one({"email": current_user.email})
    
    if user_db.get("two_factor_method") == "totp":
        totp = pyotp.TOTP(user_db["totp_secret"])
        if totp.verify(request.code):
            return {"message": "Código verificado com sucesso"}
        else:
            raise HTTPException(status_code=400, detail="Código inválido")
    
    elif user_db.get("two_factor_method") == "email":
        codes = user_db.get("email_verification_codes", {})
        current_time = datetime.now(timezone.utc).timestamp()
        
        # Verificar se o código existe e não expirou
        if request.code in codes:
            if codes[request.code] > current_time:
                # Remover código usado
                await db.users.update_one(
                    {"email": current_user.email},
                    {"$unset": {f"email_verification_codes.{request.code}": ""}}
                )
                return {"message": "Código verificado com sucesso"}
            else:
                # Código expirado
                await db.users.update_one(
                    {"email": current_user.email},
                    {"$unset": {f"email_verification_codes.{request.code}": ""}}
                )
                raise HTTPException(status_code=400, detail="Código expirado")
        else:
            raise HTTPException(status_code=400, detail="Código inválido")

@api_router.post("/user/send-email-2fa")
async def send_email_2fa(current_user: User = Depends(get_current_user)):
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

# Initialize demo user and transactions
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
            "cpf": "123.456.789-00",
            "rg": "12.345.678-9",
            "telefone": "(11) 99999-9999",
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()