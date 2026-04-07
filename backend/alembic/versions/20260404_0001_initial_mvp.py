"""initial mvp schema"""

from alembic import op
import sqlalchemy as sa


revision = "20260404_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "egg_configs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("source_url", sa.String(length=1000), nullable=False),
        sa.Column("source", sa.String(length=10), nullable=False),
        sa.Column("description", sa.String(length=2000), nullable=True),
        sa.Column("java_version", sa.Integer(), nullable=False),
        sa.Column("visibility", sa.String(length=7), nullable=False),
        sa.Column("minecraft_version", sa.String(length=20), nullable=True),
        sa.Column("modloader", sa.String(length=50), nullable=True),
        sa.Column("modloader_version", sa.String(length=50), nullable=True),
        sa.Column("json_data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_egg_configs_owner_id"), "egg_configs", ["owner_id"], unique=False)

    op.create_table(
        "panel_instances",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("api_key_encrypted", sa.String(length=4096), nullable=False),
        sa.Column("owner_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("last_tested_at", sa.DateTime(), nullable=True),
        sa.Column("last_test_status", sa.String(length=32), nullable=False),
        sa.Column("last_test_message", sa.String(length=500), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_panel_instances_owner_id"),
        "panel_instances",
        ["owner_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_panel_instances_owner_id"), table_name="panel_instances")
    op.drop_table("panel_instances")
    op.drop_index(op.f("ix_egg_configs_owner_id"), table_name="egg_configs")
    op.drop_table("egg_configs")
