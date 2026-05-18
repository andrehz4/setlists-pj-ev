from pydantic import BaseModel, Field


class FeedPostCreate(BaseModel):
    photo_url: str = Field(min_length=10, max_length=500)
    caption: str | None = Field(default=None, max_length=2200)


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=500)


class FeedCommentOut(BaseModel):
    id: str
    post_id: str
    body: str
    display_name: str
    avatar_url: str | None
    created_at: str


class FeedPostOut(BaseModel):
    id: str
    site: str
    photo_url: str
    caption: str | None
    display_name: str
    avatar_url: str | None
    like_count: int
    comment_count: int
    liked_by_me: bool
    created_at: str


class FeedPostDetailOut(BaseModel):
    post: FeedPostOut
    comments: list[FeedCommentOut]


class FeedPageOut(BaseModel):
    items: list[FeedPostOut]
    total: int
    page: int
    per_page: int
    site: str
