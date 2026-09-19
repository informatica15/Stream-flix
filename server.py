import os
from typing import Optional, List
from fastapi import FastAPI, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from final import (
    Subscription,
    BasicPlan,
    StandardPlan,
    PremiumPlan,
    VALID_PLANS,
    Movie as OOPMovie,
    User,
    NotLoggedInError,
    InvalidPlanError
)

app = FastAPI(title="StreamFlix Backend", description="Modern Streaming Platform API")

# Setup Default User according to final.py
# Default initialized to Rahul with BasicPlan, logged in for seamless demo experience
current_user = User("Rahul", "1234", BasicPlan())
current_user.is_logged_in = True

# In-memory storage for interactive user state
my_list_ids = {"stranger-things", "dune-part-two", "cyberpunk-edgerunners"}
watch_history = [
    {
        "id": "stranger-things",
        "progress_percent": 68,
        "stopped_at_seconds": 2040,
        "last_watched": "Today"
    },
    {
        "id": "interstellar",
        "progress_percent": 42,
        "stopped_at_seconds": 4250,
        "last_watched": "Yesterday"
    },
    {
        "id": "blade-runner-2049",
        "progress_percent": 85,
        "stopped_at_seconds": 8300,
        "last_watched": "3 days ago"
    }
]

# Curated High-Definition Movie & Series Catalog
# Working video streams from Blender Foundation cinematic open films (Big Buck Bunny, Sintel, Tears of Steel)
CATALOG = [
    {
        "id": "stranger-things",
        "title": "Stranger Things",
        "type": "series",
        "genre": "Sci-Fi",
        "genres": ["Sci-Fi", "Mystery", "Horror", "Drama"],
        "year": 2024,
        "rating": 8.7,
        "age_rating": "16+",
        "duration_minutes": 55,
        "duration_str": "4 Seasons",
        "description": "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
        "director": "The Duffer Brothers",
        "cast": ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder", "David Harbour"],
        "poster_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "trailer_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "match_score": 98,
        "is_trending": True,
        "is_popular": True,
        "is_recommended": True,
        "is_top_rated": True,
        "is_new": True,
        "episodes": [
            {"num": 1, "title": "Chapter One: The Vanishing", "duration": "48m", "thumbnail": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80"},
            {"num": 2, "title": "Chapter Two: The Weirdo", "duration": "55m", "thumbnail": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80"},
            {"num": 3, "title": "Chapter Three: Holly, Jolly", "duration": "51m", "thumbnail": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80"}
        ]
    },
    {
        "id": "wednesday",
        "title": "Wednesday",
        "type": "series",
        "genre": "Mystery",
        "genres": ["Mystery", "Comedy", "Fantasy", "Crime"],
        "year": 2023,
        "rating": 8.1,
        "age_rating": "13+",
        "duration_minutes": 45,
        "duration_str": "1 Season",
        "description": "Smart, sarcastic and a little dead inside, Wednesday Addams investigates a murder spree while making new friends — and foes — at Nevermore Academy.",
        "director": "Tim Burton",
        "cast": ["Jenna Ortega", "Gwendoline Christie", "Riki Lindhome", "Christina Ricci"],
        "poster_url": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1920&q=80",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        "trailer_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        "match_score": 96,
        "is_trending": True,
        "is_popular": True,
        "is_recommended": True,
        "is_top_rated": False,
        "is_new": False,
        "episodes": [
            {"num": 1, "title": "Wednesday's Child is Full of Woe", "duration": "59m", "thumbnail": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80"},
            {"num": 2, "title": "Woe is the Loneliest Number", "duration": "48m", "thumbnail": "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=400&q=80"}
        ]
    },
    {
        "id": "dune-part-two",
        "title": "Dune: Part Two",
        "type": "movie",
        "genre": "Sci-Fi",
        "genres": ["Sci-Fi", "Adventure", "Action", "Drama"],
        "year": 2024,
        "rating": 8.9,
        "age_rating": "13+",
        "duration_minutes": 166,
        "duration_str": "2h 46m",
        "description": "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family, confronting a choice between the love of his life and the fate of the universe.",
        "director": "Denis Villeneuve",
        "cast": ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Javier Bardem"],
        "poster_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "trailer_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "match_score": 99,
        "is_trending": True,
        "is_popular": True,
        "is_recommended": True,
        "is_top_rated": True,
        "is_new": True
    },
    {
        "id": "cyberpunk-edgerunners",
        "title": "Cyberpunk: Edgerunners",
        "type": "series",
        "genre": "Sci-Fi",
        "genres": ["Sci-Fi", "Animation", "Action", "Drama"],
        "year": 2023,
        "rating": 8.3,
        "age_rating": "18+",
        "duration_minutes": 25,
        "duration_str": "1 Season",
        "description": "A street kid trying to survive in a technology and body modification-obsessed city of the future. Having everything to lose, he chooses to stay alive by becoming an edgerunner.",
        "director": "Hiroyuki Imaishi",
        "cast": ["KENN", "Aoi Yuuki", "Hiroki Touchi", "Michiko Kaiden"],
        "poster_url": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "trailer_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "match_score": 97,
        "is_trending": True,
        "is_popular": True,
        "is_recommended": True,
        "is_top_rated": True,
        "is_new": False
    },
    {
        "id": "interstellar",
        "title": "Interstellar",
        "type": "movie",
        "genre": "Sci-Fi",
        "genres": ["Sci-Fi", "Adventure", "Drama"],
        "year": 2014,
        "rating": 8.7,
        "age_rating": "13+",
        "duration_minutes": 169,
        "duration_str": "2h 49m",
        "description": "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
        "director": "Christopher Nolan",
        "cast": ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
        "poster_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1920&q=80",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        "trailer_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        "match_score": 98,
        "is_trending": False,
        "is_popular": True,
        "is_recommended": True,
        "is_top_rated": True,
        "is_new": False
    },
    {
        "id": "blade-runner-2049",
        "title": "Blade Runner 2049",
        "type": "movie",
        "genre": "Sci-Fi",
        "genres": ["Sci-Fi", "Action", "Mystery", "Drama"],
        "year": 2017,
        "rating": 8.0,
        "age_rating": "16+",
        "duration_minutes": 164,
        "duration_str": "2h 44m",
        "description": "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who's been missing for thirty years.",
        "director": "Denis Villeneuve",
        "cast": ["Ryan Gosling", "Harrison Ford", "Ana de Armas", "Sylvia Hoeks"],
        "poster_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1920&q=80",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "trailer_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "match_score": 94,
        "is_trending": True,
        "is_popular": False,
        "is_recommended": True,
        "is_top_rated": True,
        "is_new": False
    },
    {
        "id": "the-dark-knight",
        "title": "The Dark Knight",
        "type": "movie",
        "genre": "Action",
        "genres": ["Action", "Crime", "Drama", "Thriller"],
        "year": 2008,
        "rating": 9.0,
        "age_rating": "16+",
        "duration_minutes": 152,
        "duration_str": "2h 32m",
        "description": "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        "director": "Christopher Nolan",
        "cast": ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Michael Caine"],
        "poster_url": "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1920&q=80",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "trailer_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "match_score": 99,
        "is_trending": False,
        "is_popular": True,
        "is_recommended": False,
        "is_top_rated": True,
        "is_new": False
    },
    {
        "id": "john-wick-4",
        "title": "John Wick: Chapter 4",
        "type": "movie",
        "genre": "Action",
        "genres": ["Action", "Crime", "Thriller"],
        "year": 2023,
        "rating": 7.7,
        "age_rating": "18+",
        "duration_minutes": 169,
        "duration_str": "2h 49m",
        "description": "John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe.",
        "director": "Chad Stahelski",
        "cast": ["Keanu Reeves", "Donnie Yen", "Bill Skarsgård", "Laurence Fishburne"],
        "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "trailer_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "match_score": 93,
        "is_trending": True,
        "is_popular": True,
        "is_recommended": True,
        "is_top_rated": False,
        "is_new": True
    },
    {
        "id": "glass-onion",
        "title": "Glass Onion: A Knives Out Mystery",
        "type": "movie",
        "genre": "Comedy",
        "genres": ["Comedy", "Mystery", "Crime"],
        "year": 2022,
        "rating": 7.1,
        "age_rating": "13+",
        "duration_minutes": 140,
        "duration_str": "2h 20m",
        "description": "Tech billionaire Miles Bron invites his friends for a getaway on his private Greek island. When someone turns up dead, Detective Benoit Blanc is put on the case.",
        "director": "Rian Johnson",
        "cast": ["Daniel Craig", "Edward Norton", "Janelle Monáe", "Kathryn Hahn"],
        "poster_url": "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=800&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        "trailer_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        "match_score": 90,
        "is_trending": False,
        "is_popular": True,
        "is_recommended": True,
        "is_top_rated": False,
        "is_new": False
    },
    {
        "id": "barbie",
        "title": "Barbie",
        "type": "movie",
        "genre": "Comedy",
        "genres": ["Comedy", "Adventure", "Fantasy"],
        "year": 2023,
        "rating": 7.0,
        "age_rating": "13+",
        "duration_minutes": 114,
        "duration_str": "1h 54m",
        "description": "Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they soon discover the joys and perils of living among humans.",
        "director": "Greta Gerwig",
        "cast": ["Margot Robbie", "Ryan Gosling", "America Ferrera", "Kate McKinnon"],
        "poster_url": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "trailer_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "match_score": 89,
        "is_trending": True,
        "is_popular": True,
        "is_recommended": False,
        "is_top_rated": False,
        "is_new": True
    },
    {
        "id": "oppenheimer",
        "title": "Oppenheimer",
        "type": "movie",
        "genre": "Drama",
        "genres": ["Drama", "Biography", "History"],
        "year": 2023,
        "rating": 8.9,
        "age_rating": "16+",
        "duration_minutes": 180,
        "duration_str": "3h 00m",
        "description": "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
        "director": "Christopher Nolan",
        "cast": ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr."],
        "poster_url": "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1920&q=80",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "trailer_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "match_score": 99,
        "is_trending": True,
        "is_popular": True,
        "is_recommended": True,
        "is_top_rated": True,
        "is_new": True
    },
    {
        "id": "succession",
        "title": "Succession",
        "type": "series",
        "genre": "Drama",
        "genres": ["Drama"],
        "year": 2023,
        "rating": 8.9,
        "age_rating": "18+",
        "duration_minutes": 60,
        "duration_str": "4 Seasons",
        "description": "The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their aging father steps down from the company.",
        "director": "Jesse Armstrong",
        "cast": ["Brian Cox", "Jeremy Strong", "Sarah Snook", "Kieran Culkin"],
        "poster_url": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1920&q=80",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        "trailer_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        "match_score": 97,
        "is_trending": False,
        "is_popular": True,
        "is_recommended": True,
        "is_top_rated": True,
        "is_new": False
    },
    {
        "id": "arcane",
        "title": "Arcane: League of Legends",
        "type": "series",
        "genre": "Sci-Fi",
        "genres": ["Sci-Fi", "Animation", "Action", "Adventure", "Fantasy"],
        "year": 2024,
        "rating": 9.0,
        "age_rating": "16+",
        "duration_minutes": 40,
        "duration_str": "2 Seasons",
        "description": "Set in utopian Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic League champions-and the power that will tear them apart.",
        "director": "Pascal Charrue, Arnaud Delord",
        "cast": ["Hailee Steinfeld", "Ella Purnell", "Kevin Alejandro", "Katie Leung"],
        "poster_url": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1920&q=80",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "trailer_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "match_score": 99,
        "is_trending": True,
        "is_popular": True,
        "is_recommended": True,
        "is_top_rated": True,
        "is_new": True
    },
    {
        "id": "the-batman",
        "title": "The Batman",
        "type": "movie",
        "genre": "Action",
        "genres": ["Action", "Crime", "Drama", "Mystery"],
        "year": 2022,
        "rating": 7.8,
        "age_rating": "16+",
        "duration_minutes": 176,
        "duration_str": "2h 56m",
        "description": "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
        "director": "Matt Reeves",
        "cast": ["Robert Pattinson", "Zoë Kravitz", "Jeffrey Wright", "Colin Farrell"],
        "poster_url": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "trailer_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "match_score": 92,
        "is_trending": False,
        "is_popular": True,
        "is_recommended": False,
        "is_top_rated": False,
        "is_new": False
    },
    {
        "id": "everything-everywhere",
        "title": "Everything Everywhere All at Once",
        "type": "movie",
        "genre": "Comedy",
        "genres": ["Comedy", "Action", "Adventure", "Sci-Fi"],
        "year": 2022,
        "rating": 7.8,
        "age_rating": "16+",
        "duration_minutes": 139,
        "duration_str": "2h 19m",
        "description": "A middle-aged Chinese immigrant is swept up into an insane adventure in which she alone can save existence by exploring other universes and connecting with the lives she could have led.",
        "director": "Daniel Kwan, Daniel Scheinert",
        "cast": ["Michelle Yeoh", "Stephanie Hsu", "Ke Huy Quan", "Jamie Lee Curtis"],
        "poster_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        "trailer_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        "match_score": 95,
        "is_trending": False,
        "is_popular": False,
        "is_recommended": True,
        "is_top_rated": True,
        "is_new": False
    },
    {
        "id": "the-bear",
        "title": "The Bear",
        "type": "series",
        "genre": "Drama",
        "genres": ["Drama", "Comedy"],
        "year": 2024,
        "rating": 8.6,
        "age_rating": "18+",
        "duration_minutes": 35,
        "duration_str": "3 Seasons",
        "description": "A young chef from the fine dining world comes home to Chicago to run his family Italian beef sandwich shop after a heartbreaking death in his family.",
        "director": "Christopher Storer",
        "cast": ["Jeremy Allen White", "Ebon Moss-Bachrach", "Ayo Edebiri", "Lionel Boyce"],
        "poster_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "trailer_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "match_score": 96,
        "is_trending": True,
        "is_popular": True,
        "is_recommended": True,
        "is_top_rated": True,
        "is_new": True
    }
]

catalog_by_id = {item["id"]: item for item in CATALOG}

# Request Schemas
class LoginRequest(BaseModel):
    name: Optional[str] = "Rahul"
    password: str

class UpgradeRequest(BaseModel):
    plan: str

class WatchHistoryRequest(BaseModel):
    id: str
    progress_percent: int
    stopped_at_seconds: int

# Auth Endpoints (Integrating User from final.py)
@app.get("/api/auth/user")
def get_current_user():
    sub = current_user.subscription
    plan_key = sub.__class__.__name__.lower().replace("plan", "")
    return {
        "name": current_user.name,
        "email": f"{current_user.name.lower()}@streamflix.io",
        "is_logged_in": current_user.is_logged_in,
        "subscription": {
            "id": plan_key,
            "name": sub.__class__.__name__,
            "quality": sub.stream_quality(),
            "price": sub.price(),
            "max_devices": sub.max_devices(),
            "allows_download": sub.allows_download(),
            "display_str": str(sub)
        }
    }

@app.post("/api/auth/login")
def login_user(req: LoginRequest):
    if req.name:
        current_user.name = req.name
    # Call final.py User.login method
    current_user.login(req.password)
    if not current_user.is_logged_in:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password. Default password is '1234'."
        )
    return get_current_user()

@app.post("/api/auth/logout")
def logout_user():
    current_user.is_logged_in = False
    return {"status": "logged_out", "is_logged_in": False}

# Subscription Endpoints (Integrating VALID_PLANS from final.py)
@app.get("/api/subscription/plans")
def get_plans():
    plans_list = []
    for key, plan_cls in VALID_PLANS.items():
        inst = plan_cls()
        plans_list.append({
            "id": key,
            "name": inst.__class__.__name__,
            "quality": inst.stream_quality(),
            "price": inst.price(),
            "max_devices": inst.max_devices(),
            "allows_download": inst.allows_download(),
            "is_current": (inst.__class__.__name__ == current_user.subscription.__class__.__name__)
        })
    return plans_list

@app.post("/api/subscription/upgrade")
def upgrade_subscription(req: UpgradeRequest):
    try:
        current_user.upgrade_plan(req.plan)
        return {
            "success": True,
            "message": f"Successfully upgraded to {current_user.subscription.__class__.__name__}",
            "user": get_current_user()
        }
    except InvalidPlanError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Movie Watch & Streaming Endpoint (Invoking final.py watch_movie & catching NotLoggedInError)
@app.post("/api/movies/{movie_id}/watch")
def watch_movie_stream(movie_id: str):
    if movie_id not in catalog_by_id:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    movie_info = catalog_by_id[movie_id]
    
    # Create OOP Movie instance from final.py
    oop_movie = OOPMovie(
        title=movie_info["title"],
        genre=movie_info["genre"],
        duration_minutes=movie_info["duration_minutes"]
    )
    
    # Call final.py User.watch_movie method
    try:
        current_user.watch_movie(oop_movie)
    except NotLoggedInError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"{e}. Please log in to stream movies."
        )
    
    # User is logged in and authorized
    return {
        "status": "streaming",
        "movie_id": movie_id,
        "title": movie_info["title"],
        "video_url": movie_info["video_url"],
        "quality": current_user.subscription.stream_quality(),
        "max_devices": current_user.subscription.max_devices(),
        "allows_download": current_user.subscription.allows_download(),
        "user_name": current_user.name
    }

# Catalog & Categories
@app.get("/api/movies")
def get_movies(
    category: Optional[str] = None,
    genre: Optional[str] = None,
    type: Optional[str] = None
):
    results = CATALOG
    if type and type != "all":
        results = [m for m in results if m["type"] == type]
    if genre and genre != "all":
        results = [m for m in results if genre.lower() in [g.lower() for g in m["genres"]]]
    
    return {
        "all": results,
        "featured": catalog_by_id.get("dune-part-two") or CATALOG[0],
        "categories": {
            "Trending Now": [m for m in results if m.get("is_trending")],
            "Popular Movies": [m for m in results if m.get("is_popular") and m["type"] == "movie"],
            "Recommended For You": [m for m in results if m.get("is_recommended")],
            "Top Rated": [m for m in results if m.get("is_top_rated")],
            "New Releases": [m for m in results if m.get("is_new")],
            "Action": [m for m in results if "Action" in m["genres"]],
            "Sci-Fi": [m for m in results if "Sci-Fi" in m["genres"]],
            "Comedy": [m for m in results if "Comedy" in m["genres"]],
            "Drama": [m for m in results if "Drama" in m["genres"]]
        }
    }

@app.get("/api/movies/{movie_id}")
def get_movie_detail(movie_id: str):
    if movie_id not in catalog_by_id:
        raise HTTPException(status_code=404, detail="Movie not found")
    movie = dict(catalog_by_id[movie_id])
    # Add related movies based on genre
    related = [
        m for m in CATALOG
        if m["id"] != movie_id and any(g in m["genres"] for g in movie["genres"])
    ][:6]
    movie["related"] = related
    movie["in_my_list"] = movie_id in my_list_ids
    return movie

# Search API with Filters & Sorting
@app.get("/api/search")
def search_catalog(
    q: Optional[str] = "",
    type: Optional[str] = "all",
    genre: Optional[str] = "all",
    sort: Optional[str] = "relevance"
):
    query = (q or "").strip().lower()
    filtered = CATALOG

    if query:
        filtered = [
            m for m in filtered
            if query in m["title"].lower()
            or query in m["description"].lower()
            or query in m["director"].lower()
            or any(query in c.lower() for c in m["cast"])
            or any(query in g.lower() for g in m["genres"])
        ]

    if type and type != "all":
        filtered = [m for m in filtered if m["type"] == type]

    if genre and genre != "all":
        filtered = [m for m in filtered if genre.lower() in [g.lower() for g in m["genres"]]]

    if sort == "rating":
        filtered = sorted(filtered, key=lambda x: x["rating"], reverse=True)
    elif sort == "year":
        filtered = sorted(filtered, key=lambda x: x["year"], reverse=True)
    elif sort == "match":
        filtered = sorted(filtered, key=lambda x: x["match_score"], reverse=True)

    suggestions = [m["title"] for m in CATALOG if query and query in m["title"].lower()][:5]

    return {
        "query": q,
        "count": len(filtered),
        "results": filtered,
        "suggestions": suggestions
    }

# My List Management
@app.get("/api/mylist")
def get_my_list():
    items = [catalog_by_id[mid] for mid in my_list_ids if mid in catalog_by_id]
    return items

@app.post("/api/mylist/{movie_id}")
def add_to_my_list(movie_id: str):
    if movie_id not in catalog_by_id:
        raise HTTPException(status_code=404, detail="Movie not found")
    my_list_ids.add(movie_id)
    return {"success": True, "in_my_list": True, "movie_id": movie_id}

@app.delete("/api/mylist/{movie_id}")
def remove_from_my_list(movie_id: str):
    my_list_ids.discard(movie_id)
    return {"success": True, "in_my_list": False, "movie_id": movie_id}

# Watch History / Continue Watching
@app.get("/api/history")
def get_watch_history():
    res = []
    for item in watch_history:
        mid = item["id"]
        if mid in catalog_by_id:
            m = dict(catalog_by_id[mid])
            m["progress_percent"] = item["progress_percent"]
            m["stopped_at_seconds"] = item["stopped_at_seconds"]
            m["last_watched"] = item["last_watched"]
            res.append(m)
    return res

@app.post("/api/history")
def update_watch_history(req: WatchHistoryRequest):
    global watch_history
    # Remove existing entry if any and prepend
    watch_history = [w for w in watch_history if w["id"] != req.id]
    watch_history.insert(0, {
        "id": req.id,
        "progress_percent": req.progress_percent,
        "stopped_at_seconds": req.stopped_at_seconds,
        "last_watched": "Just now"
    })
    return {"success": True}

# Static Files & SPA Fallback
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir, exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "StreamFlix API is running. Create static/index.html to view UI."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
