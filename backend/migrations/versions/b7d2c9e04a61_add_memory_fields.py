"""Create structured user memories, preserving an existing legacy memory table.

Revision ID: b7d2c9e04a61
Revises: 5684b53e7fea
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


revision = "b7d2c9e04a61"
down_revision = "5684b53e7fea"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The legacy model existed without a migration; some installations may
    # already have created its table manually.
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table("memory"):
        timestamp = sa.DateTime(timezone=True).with_variant(
            mysql.DATETIME(fsp=6), "mysql"
        )
        op.create_table(
            "memory",
            sa.Column("id", sa.String(64), nullable=False),
            sa.Column("user_id", sa.String(64), nullable=False),
            sa.Column("key", sa.String(191), nullable=True),
            sa.Column("value", sa.Text(), nullable=False),
            sa.Column("source_message_id", sa.String(64), nullable=True),
            sa.Column("confidence", sa.Float(), nullable=True),
            sa.Column("status", sa.String(20), server_default="active", nullable=False),
            sa.Column("created_at", timestamp, server_default=sa.text("CURRENT_TIMESTAMP(6)"), nullable=False),
            sa.Column("updated_at", timestamp, server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["source_message_id"], ["message.id"], name="fk_memory_source_message", ondelete="SET NULL"),
            sa.UniqueConstraint("user_id", "key", name="uq_memory_user_key"),
            sa.CheckConstraint("confidence >= 0 AND confidence <= 1", name="ck_memory_confidence"),
            sa.CheckConstraint("status IN ('active', 'inactive')", name="ck_memory_status"),
        )
        op.create_index("ix_memory_id", "memory", ["id"])
        op.create_index("ix_memory_user_id", "memory", ["user_id"])
    else:
        with op.batch_alter_table("memory") as batch:
            batch.alter_column("content", new_column_name="value", existing_type=sa.Text(), existing_nullable=False)
            batch.add_column(sa.Column("key", sa.String(191), nullable=True))
            batch.add_column(sa.Column("source_message_id", sa.String(64), nullable=True))
            batch.add_column(sa.Column("confidence", sa.Float(), nullable=True))
            batch.add_column(sa.Column("status", sa.String(20), server_default="active", nullable=False))
            batch.create_foreign_key("fk_memory_source_message", "message", ["source_message_id"], ["id"], ondelete="SET NULL")
            batch.create_unique_constraint("uq_memory_user_key", ["user_id", "key"])
            batch.create_check_constraint("ck_memory_confidence", "confidence >= 0 AND confidence <= 1")
            batch.create_check_constraint("ck_memory_status", "status IN ('active', 'inactive')")
    op.create_index("ix_memory_source_message_id", "memory", ["source_message_id"])


def downgrade() -> None:
    # Restore the legacy shape and retain saved memories on either upgrade path.
    op.drop_index("ix_memory_source_message_id", table_name="memory")
    with op.batch_alter_table("memory") as batch:
        batch.drop_constraint("fk_memory_source_message", type_="foreignkey")
        batch.drop_constraint("uq_memory_user_key", type_="unique")
        batch.drop_constraint("ck_memory_confidence", type_="check")
        batch.drop_constraint("ck_memory_status", type_="check")
        batch.drop_column("key")
        batch.drop_column("source_message_id")
        batch.drop_column("confidence")
        batch.drop_column("status")
        batch.alter_column("value", new_column_name="content", existing_type=sa.Text(), existing_nullable=False)
