CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE
    news_stories (
        id serial primary key,
        link text,
        headline text,
        category varchar(50),
        short_description text,
        authors text,
        date date,
        embeddings vector (768)
    );