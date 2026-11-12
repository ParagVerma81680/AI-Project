import json
from datetime import datetime, timezone
from typing import List, Optional, Any
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, Index, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.types import TypeDecorator

from app.database.connection import Base
from app.core.config import settings

def utc_now():
    return datetime.now(timezone.utc)

# ─────────────────────────────────────────────────────────────────────────────
# Hybrid Vector Type (PostgreSQL pgvector support + SQLite JSON array fallback)
# ─────────────────────────────────────────────────────────────────────────────
class VectorType(TypeDecorator):
    """
    Transparently supports pgvector.sqlalchemy.Vector on PostgreSQL
    and serializes to JSON / Text on SQLite with Python cosine math.
    """
    impl = Text
    cache_ok = True

    def __init__(self, dim: int = 384, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.dim = dim

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            try:
                from pgvector.sqlalchemy import Vector
                return dialect.type_descriptor(Vector(self.dim))
            except ImportError:
                return dialect.type_descriptor(Text())
        return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, (list, tuple)):
            if dialect.name == "postgresql":
                return value
            return json.dumps(list(value))
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return None
        if isinstance(value, (list, tuple)):
            return list(value)
        return value


# ─────────────────────────────────────────────────────────────────────────────
# A. USERS
# ─────────────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(32), default="customer", nullable=False)  # 'customer' or 'admin'
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    memories = relationship("AIMemory", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("AIActivityLog", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user")
    cart = relationship("Cart", uselist=False, back_populates="user")


# ─────────────────────────────────────────────────────────────────────────────
# B. CONVERSATIONS
# ─────────────────────────────────────────────────────────────────────────────
class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(255), default="New In-Store Inquiry", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")
    activity_logs = relationship("AIActivityLog", back_populates="conversation")


# ─────────────────────────────────────────────────────────────────────────────
# C. MESSAGES
# ─────────────────────────────────────────────────────────────────────────────
class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(32), nullable=False)  # 'user', 'assistant', 'system', 'tool'
    message_content = Column(Text, nullable=False)
    model_used = Column(String(64), default="meta-llama", nullable=False)
    token_usage = Column(JSON, default=dict)
    sources = Column(JSON, default=list)  # RAG sources, products referenced, tools called
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    conversation = relationship("Conversation", back_populates="messages")


# ─────────────────────────────────────────────────────────────────────────────
# D. AI_MEMORY (Long-Term User Memory)
# ─────────────────────────────────────────────────────────────────────────────
class AIMemory(Base):
    __tablename__ = "ai_memory"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    memory_type = Column(String(64), default="preference", nullable=False)  # 'preference', 'dietary', 'fact', 'habit'
    memory_content = Column(Text, nullable=False)
    embedding = Column(VectorType(dim=384), nullable=True)
    importance_score = Column(Float, default=0.7, nullable=False)  # 0.0 to 1.0
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="memories")


# ─────────────────────────────────────────────────────────────────────────────
# E. KNOWLEDGE_BASE (Vector RAG Corpus)
# ─────────────────────────────────────────────────────────────────────────────
class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    content = Column(Text, nullable=False)
    category = Column(String(64), default="General", index=True, nullable=False)
    source = Column(String(128), default="manual", nullable=False)  # 'manual', 'pdf', 'csv', 'store_policy'
    embedding = Column(VectorType(dim=384), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


# ─────────────────────────────────────────────────────────────────────────────
# F. PRODUCTS (Store Inventory & Catalog)
# ─────────────────────────────────────────────────────────────────────────────
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    brand = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    barcode = Column(String(64), nullable=True, unique=True, index=True)
    price = Column(Float, nullable=False, default=0.0)
    stock = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)

    # Store spatial fields & categorization
    aisle = Column(String(32), nullable=True, default="1", index=True)
    shelf = Column(String(32), nullable=True, default="Mid")
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    category_rel = relationship("Category", back_populates="products", foreign_keys=[category_id])

    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Compatibility properties for Llama tools & new schemas
    @property
    def product_name(self) -> str:
        return self.name

    @product_name.setter
    def product_name(self, val: str):
        self.name = val

    @property
    def stock_quantity(self) -> int:
        return self.stock

    @stock_quantity.setter
    def stock_quantity(self, val: int):
        self.stock = val

    @property
    def category(self) -> str:
        if self.category_rel and self.category_rel.name:
            return self.category_rel.name
        return "General"

    @property
    def shelf_tier(self) -> str:
        return self.shelf or "Eye-Level"

    @property
    def specifications(self) -> dict:
        return {"brand": self.brand, "barcode": self.barcode}

    @property
    def dietary_tags(self) -> list:
        tags = []
        desc = (self.description or "").lower()
        name_l = self.name.lower()
        for t in ["vegan", "organic", "gluten-free", "keto"]:
            if t in desc or t in name_l:
                tags.append(t)
        return tags

    @property
    def image_url(self) -> str:
        images = {
            "milk": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60",
            "bread": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60",
            "croissant": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=60",
            "paneer": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=60",
            "egg": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&auto=format&fit=crop&q=60",
            "yogurt": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=60",
            "chip": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=60",
            "nacho": "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&auto=format&fit=crop&q=60",
            "almond": "https://images.unsplash.com/photo-1508061252445-5350f37dfc3b?w=500&auto=format&fit=crop&q=60",
            "chocolate": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&auto=format&fit=crop&q=60",
            "juice": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=60",
            "cola": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60",
            "water": "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=60",
            "tea": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60",
            "apple": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=60",
            "banana": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=60",
            "spinach": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&auto=format&fit=crop&q=60",
            "rice": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60",
            "dal": "https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=500&auto=format&fit=crop&q=60",
            "oil": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60",
            "soap": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
            "paste": "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=500&auto=format&fit=crop&q=60",
            "dishwash": "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500&auto=format&fit=crop&q=60",
            "detergent": "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=500&auto=format&fit=crop&q=60",
            "cable": "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=500&auto=format&fit=crop&q=60",
            "batter": "https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=500&auto=format&fit=crop&q=60",
        }
        n = (self.name or "").lower()
        for k, url in images.items():
            if k in n:
                return url
        return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60"


# ─────────────────────────────────────────────────────────────────────────────
# G. AI_ACTIVITY_LOGS
# ─────────────────────────────────────────────────────────────────────────────
class AIActivityLog(Base):
    __tablename__ = "ai_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True, index=True)
    activity_type = Column(String(64), nullable=False, index=True)  # 'chat', 'tool_call', 'rag_search', 'memory_save'
    status = Column(String(32), default="success", nullable=False)   # 'success', 'error'
    details = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="activity_logs")
    conversation = relationship("Conversation", back_populates="activity_logs")


# ─────────────────────────────────────────────────────────────────────────────
# H. CATEGORIES (Legacy Compatibility)
# ─────────────────────────────────────────────────────────────────────────────
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    products = relationship("Product", back_populates="category_rel")


# ─────────────────────────────────────────────────────────────────────────────
# I. POLICY_DOCUMENTS (Legacy Compatibility)
# ─────────────────────────────────────────────────────────────────────────────
class PolicyDocument(Base):
    __tablename__ = "policy_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(128), nullable=False)
    category = Column(String(64), default="General", nullable=False)
    content = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


# ─────────────────────────────────────────────────────────────────────────────
# J. SHOPPING CARTS & CART ITEMS
# ─────────────────────────────────────────────────────────────────────────────
class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    session_id = Column(String(64), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan", order_by="CartItem.created_at")


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")


# ─────────────────────────────────────────────────────────────────────────────
# K. ORDERS & ORDER ITEMS
# ─────────────────────────────────────────────────────────────────────────────
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(32), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_name = Column(String(128), nullable=False)
    customer_phone = Column(String(32), nullable=False)
    delivery_address = Column(Text, nullable=False)
    delivery_instructions = Column(Text, nullable=True)
    subtotal = Column(Float, nullable=False)
    delivery_fee = Column(Float, default=0.0, nullable=False)
    tax = Column(Float, default=0.0, nullable=False)
    total_amount = Column(Float, nullable=False)
    payment_method = Column(String(64), default="Demo Simulation (Cash on Delivery)", nullable=False)
    payment_status = Column(String(32), default="Paid (Demo)", nullable=False)
    status = Column(String(32), default="Order Placed", nullable=False, index=True)
    estimated_delivery = Column(String(64), default="10-15 mins", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", order_by="OrderItem.id")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    product_name = Column(String(255), nullable=False)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
