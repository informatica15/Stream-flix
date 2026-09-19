from abc import ABC, abstractmethod
class NotLoggedInError(Exception):
    pass
class InvalidPlanError(Exception):
    pass
#abstraction
class Subscription(ABC):
    @abstractmethod
    def stream_quality(self):
        pass
    @abstractmethod
    def price(self):
        pass
    @abstractmethod
    def max_devices(self):
        pass
    def allows_download(self):
        return False
    def __str__(self):#__str__ tells python how to display obj as a string
        return (
            f"{self.__class__.__name__} | {self.stream_quality()} | "
            f"₹{self.price()}/mo | {self.max_devices()} device(s)")
    
class PaidPlan(Subscription):
    def allows_download(self):
        return True
    def __str__(self):
        base = super().__str__()          # reuses parent's formatting
        return base + " | Downloads enabled"
#inheritance
class BasicPlan(Subscription):
    def stream_quality(self):
        return "720p"
    def price(self):
        return 199
    def max_devices(self):
        return 1

class StandardPlan(PaidPlan):
    def stream_quality(self):
        return "1080p"
    def price(self):
        return 499
    def max_devices(self):
        return 2

class PremiumPlan(PaidPlan):
    def stream_quality(self):
        return "4K Ultra HD"
    def price(self):
        return 799
    def max_devices(self):
        return 4

VALID_PLANS = {
    "basic": BasicPlan,
    "standard": StandardPlan,
    "premium": PremiumPlan,
}

class Movie:
    def __init__(self, title, genre, duration_minutes):
        self.title = title
        self.genre = genre
        self.duration_minutes = duration_minutes
    def __str__(self):
        return f"{self.title} ({self.genre}, {self.duration_minutes} min)"
#Encapsultion 
class User:
    def __init__(self, name, password,subscription):
        self.name = name
        self.__password = password
        self.is_logged_in = False
        self.subscription = subscription
    def login(self, password):
        if self.__password == password:
            self.is_logged_in = True
            print("Login successful")
        else:
            print("Invalid password")
    def watch_movie(self, movie: Movie):
        if not self.is_logged_in:
            raise NotLoggedInError("Please login first")
        print(
            f"{self.name} is watching '{movie.title}' "
            f"in {self.subscription.stream_quality()}")
    def upgrade_plan(self, plan_name):
        plan_name = plan_name.lower()
        if plan_name not in VALID_PLANS:
            raise InvalidPlanError(f"'{plan_name}' is not a valid plan")
        else:
            self.subscription = VALID_PLANS[plan_name]()
            print(f"{self.name} upgraded to {plan_name.title()} Plan")
    def __str__(self):
        return f"{self.name} -> {self.subscription}"
def start_streaming(user, movie):
    try:
        user.watch_movie(movie)
    except NotLoggedInError as e:
        print(f"Error: {e}")
if __name__ == "__main__":
    stranger_things = Movie("Stranger Things", "Sci-Fi", 50)
    wednesday = Movie("Wednesday", "Mystery", 45)
    r = User("Rahul", "1234", BasicPlan())
    r.login("5678")
    r.login("1234")
    start_streaming(r, stranger_things)
    print(r)
    try:
        r.upgrade_plan("ultra")
    except InvalidPlanError as e:
        print(f"Error: {e}")
    r.upgrade_plan("premium")
    start_streaming(r, wednesday)
    print(r)

