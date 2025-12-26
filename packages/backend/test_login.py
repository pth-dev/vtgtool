#!/usr/bin/env python3
"""
Test login functionality
"""
import asyncio
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import verify_password
from app.models.models import User

async def test_login():
    email = "admin@vtgtool.local"
    password = "admin123"
    
    async for db in get_db():
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ User not found: {email}")
            return
        
        print(f"✅ User found: {user.email}")
        print(f"   Full name: {user.full_name}")
        print(f"   Role: {user.role}")
        print(f"   Password hash: {user.password_hash[:50]}...")
        
        # Test password verification
        is_valid = verify_password(password, user.password_hash)
        
        if is_valid:
            print(f"✅ Password verification: SUCCESS")
            print(f"\n🎉 Login should work now!")
            print(f"   Email: {email}")
            print(f"   Password: {password}")
        else:
            print(f"❌ Password verification: FAILED")
        
        break

if __name__ == "__main__":
    asyncio.run(test_login())

