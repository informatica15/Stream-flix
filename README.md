# Python Streaming Service (OOP)

A Python project that simulates an online movie streaming platform, built to demonstrate solid object-oriented design. It covers the four core OOP pillars — abstraction, encapsulation, inheritance, and polymorphism — along with custom exception handling and method overriding.

---

## Overview

This project models a simplified streaming service where users log in, watch movies, and manage subscription plans. It's intended as a learning exercise, but the design follows patterns you'd find in production code: an abstract base class for shared behavior, private attributes for sensitive data, and custom exceptions for predictable error handling.

---

## Features

- User login with password authentication
- Movie playback restricted to logged-in users
- Multiple subscription tiers with distinct pricing and quality levels
- Plan upgrades with validation
- Custom exceptions for invalid states (e.g., unauthenticated access, invalid plan names)
- Download support on paid plans

---

## OOP Concepts

### Abstraction

`Subscription` is an abstract base class that defines the contract every plan must implement:

```python
class Subscription(ABC):
    @abstractmethod
    def stream_quality(self):
        pass
```

Concrete implementations include `BasicPlan`, `StandardPlan`, and `PremiumPlan`.

### Inheritance

`StandardPlan` and `PremiumPlan` inherit from `PaidPlan`, which in turn inherits from `Subscription`:

```
Subscription
│
├── BasicPlan
│
└── PaidPlan
    ├── StandardPlan
    └── PremiumPlan
```

### Encapsulation

User passwords are stored as private attributes (`self.__password`) and can only be checked through the `login()` method — there's no direct external access to the value.

### Polymorphism

Each plan implements its own version of `stream_quality()`, `price()`, and `max_devices()`. The same method call produces different results depending on which plan is active.

### Method Overriding

`PaidPlan` overrides `__str__()` to include download availability in its string representation, extending the base behavior rather than replacing it entirely.

---

## Project Structure

```
StreamingService/
│
├── main.py
└── README.md
```

---

## Subscription Plans

| Plan | Quality | Price | Devices | Downloads |
|------|---------|-------|---------|-----------|
| Basic | 720p | ₹199/month | 1 | No |
| Standard | 1080p | ₹499/month | 2 | Yes |
| Premium | 4K Ultra HD | ₹799/month | 4 | Yes |

---

## Movie Class

Stores basic movie metadata: title, genre, and duration.

```python
Movie("Wednesday", "Mystery", 45)
```

---

## User Actions

```python
user.login("1234")
user.watch_movie(movie)
user.upgrade_plan("premium")
```

Users can log in, watch movies, upgrade their subscription, and view their account details.

---

## Custom Exceptions

**`NotLoggedInError`** — raised when a user tries to watch a movie without logging in first.

```python
raise NotLoggedInError("Please login first")
```

**`InvalidPlanError`** — raised when a user attempts to upgrade to a plan that doesn't exist.

```python
raise InvalidPlanError("'ultra' is not a valid plan")
```

---

## Sample Output

```
Invalid password
Login successful

Rahul is watching 'Stranger Things' in 720p

Rahul -> BasicPlan | 720p | ₹199/mo | 1 device(s)

Error: 'ultra' is not a valid plan

Rahul upgraded to Premium Plan

Rahul is watching 'Wednesday' in 4K Ultra HD

Rahul -> PremiumPlan | 4K Ultra HD | ₹799/mo | 4 device(s) | Downloads enabled
```

---

## Technologies Used

- Python 3
- Object-oriented programming
- Abstract base classes (`abc`)
- Exception handling

---

## Getting Started

Clone the repository:

```bash
git clone https://github.com/informatica15/Stream-flix.git
cd Stream-flix
```

### Option 1: Run the Modern StreamFlix Web Application

Run the FastAPI web server:

```bash
python server.py
```

Then open your browser at **`http://127.0.0.1:8000`** to experience the full dark cinematic OTT interface with streaming playback, plan-aware quality selection, search, watchlist, and live subscription tier upgrades.

### Option 2: Run the Console OOP Demo

```bash
python final.py
```


---

## What This Project Demonstrates

- Abstract classes and interfaces
- Inheritance hierarchies
- Encapsulation of sensitive data
- Polymorphic method behavior
- Method overriding
- Custom exception design
- Object composition
- Dictionary-based factory pattern
- Python magic methods (`__str__`)

---

## Possible Improvements

- User registration
- Movie search
- Watch history tracking
- Favorites list
- Multi-user support
- Admin dashboard
- Ratings and reviews
- Persistent storage (JSON or SQLite)

---

## License

This project was built for educational purposes, to demonstrate object-oriented programming concepts in Python.
