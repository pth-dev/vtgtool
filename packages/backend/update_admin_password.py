#!/usr/bin/env python3
"""
Script to update admin password with correct bcrypt hash
"""
import asyncio
import bcrypt
from sqlalchemy import select, update
from app.core.database import get_db
from app.models.models import User

async def update_password():
    # Generate new password hash for "admin123"
    password = "admin123"
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    
    print(f"New password hash: {password_hash}")
    
    # Update in database
    async for db in get_db():
        result = await db.execute(
            update(User)
            .where(User.email == "admin@vtgtool.local")
            .values(password_hash=password_hash)
        )
        await db.commit()
        print(f"✅ Password updated for admin@vtgtool.local")
        print(f"   Email: admin@vtgtool.local")
        print(f"   Password: {password}")
        break

if __name__ == "__main__":
    asyncio.run(update_password())

