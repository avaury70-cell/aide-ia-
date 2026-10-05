from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models import User, UserRole
from ..schemas import LoginIn, RegisterIn, TokenOut, UserOut
from ..security import create_access_token, current_user, hash_password, user_from_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut, status_code=201)
async def register(body: RegisterIn, request: Request, db: AsyncSession = Depends(get_db)) -> TokenOut:
    """Le premier compte créé devient administrateur ; ensuite seul un admin peut inviter."""
    user_count = await db.scalar(select(func.count()).select_from(User))
    if user_count:
        creds = await HTTPBearer(auto_error=False)(request)
        if creds is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Seul un administrateur peut créer un compte")
        inviter = await user_from_token(creds.credentials, db)
        if inviter.role != UserRole.admin:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Seul un administrateur peut créer un compte")
        role = UserRole(body.role)
    else:
        role = UserRole.admin
    if await db.scalar(select(User).where(User.email == body.email.lower())):
        raise HTTPException(status.HTTP_409_CONFLICT, "Adresse déjà utilisée")
    user = User(email=body.email.lower(), password_hash=hash_password(body.password),
                display_name=body.display_name, role=role)
    db.add(user)
    await db.commit()
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)) -> TokenOut:
    user = await db.scalar(select(User).where(User.email == body.email.lower()))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Identifiants invalides")
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(current_user)) -> User:
    return user
