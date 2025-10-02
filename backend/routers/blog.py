from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import re
import sys
import os

# Ajouter le répertoire parent au path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db, User, BlogPost

router = APIRouter()

def slugify(text: str) -> str:
    """Generate a URL-friendly slug from a string."""
    text = text.lower()
    text = re.sub(r'[\s\W]+', '-', text) # Replace spaces and non-alphanumeric with -
    return text.strip('-')

# --- Schemas ---
class AuthorOut(BaseModel):
    id: int
    full_name: str

    class Config:
        orm_mode = True

class BlogPostBase(BaseModel):
    title: str
    content: Optional[str] = None
    is_published: bool = False

class BlogPostCreate(BlogPostBase):
    pass

class BlogPostUpdate(BlogPostBase):
    title: Optional[str] = None
    content: Optional[str] = None
    is_published: Optional[bool] = None

class BlogPostOut(BlogPostBase):
    id: int
    slug: str
    author: AuthorOut
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# --- Endpoints ---

@router.post("/posts", response_model=BlogPostOut)
async def create_blog_post(
    post: BlogPostCreate,
    db: Session = Depends(get_db)
):
    """Create a new blog post."""
    slug = slugify(post.title)
    # Check for slug uniqueness
    if db.query(BlogPost).filter(BlogPost.slug == slug).first():
        slug = f"{slug}-{int(datetime.now().timestamp())}"

    # Pour l'instant, utiliser un auteur par défaut (à améliorer avec l'auth)
    default_author = db.query(User).filter(User.is_admin == True).first()
    if not default_author:
        raise HTTPException(status_code=400, detail="Aucun administrateur trouvé")

    db_post = BlogPost(
        title=post.title,
        content=post.content,
        is_published=post.is_published,
        slug=slug,
        author_id=default_author.id
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@router.get("/posts", response_model=List[BlogPostOut])
async def get_blog_posts(
    skip: int = 0,
    limit: int = 20,
    published_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get a list of blog posts."""
    query = db.query(BlogPost)
    if published_only:
        query = query.filter(BlogPost.is_published == True)
    
    posts = query.order_by(BlogPost.created_at.desc()).offset(skip).limit(limit).all()
    return posts

@router.get("/posts/{slug}", response_model=BlogPostOut)
async def get_blog_post(slug: str, db: Session = Depends(get_db)):
    """Get a single blog post by its slug."""
    post = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    if not post or not post.is_published:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.put("/posts/{post_id}", response_model=BlogPostOut)
async def update_blog_post(
    post_id: int,
    post_update: BlogPostUpdate,
    db: Session = Depends(get_db)
):
    """Update a blog post."""
    db_post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")

    update_data = post_update.dict(exclude_unset=True)
    if 'title' in update_data:
        db_post.slug = slugify(update_data['title'])

    for key, value in update_data.items():
        setattr(db_post, key, value)
    
    db_post.updated_at = datetime.utcnow()
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@router.delete("/posts/{post_id}")
async def delete_blog_post(
    post_id: int,
    db: Session = Depends(get_db)
):
    """Delete a blog post."""
    db_post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    db.delete(db_post)
    db.commit()
    return {"success": True, "message": "Blog post deleted"}