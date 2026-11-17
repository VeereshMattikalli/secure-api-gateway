
from datetime import datetime, timezone

from sqlalchemy import Integer
from datetime import timedelta

from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.database.db import Base


class Client(Base):

    __tablename__ = "clients"

    client_id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    key_hash: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(20),
        default="USER",
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
class UsedNonce(Base):
    __tablename__ = "used_nonces"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nonce: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )
