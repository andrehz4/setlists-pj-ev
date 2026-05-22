from pydantic import BaseModel, Field


class TopicCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    body: str = Field(min_length=10, max_length=200000)
    category: str = Field(default="geral", max_length=40)


class PostCreate(BaseModel):
    body: str = Field(min_length=2, max_length=200000)


class ReportCreate(BaseModel):
    target_id: str
    target_type: str = Field(pattern="^(topic|post)$")
    reason: str | None = Field(default=None, max_length=500)


class ReactionCreate(BaseModel):
    target_id: str
    target_type: str = Field(pattern="^(topic|post)$")
    type: str = Field(pattern="^(tava_la|mata|curtir|salvar)$")


class TopicOut(BaseModel):
    id: str
    user_id: str
    title: str
    body: str
    category: str
    site: str
    display_name: str
    avatar_url: str | None
    pinned: bool
    created_at: str
    last_post_at: str
    reply_count: int
    reactions: dict[str, int] = {}
    my_reactions: list[str] = []


class PostOut(BaseModel):
    id: str
    user_id: str
    topic_id: str
    body: str
    site: str
    display_name: str
    avatar_url: str | None
    created_at: str
    reactions: dict[str, int] = {}
    my_reactions: list[str] = []


class TopicDetailOut(BaseModel):
    topic: TopicOut
    posts: list[PostOut]


class TopicsPageOut(BaseModel):
    items: list[TopicOut]
    total: int
    page: int
    per_page: int
    site: str
