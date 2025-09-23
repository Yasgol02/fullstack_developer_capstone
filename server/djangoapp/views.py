# Uncomment the required imports before adding the code
import json
import logging

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import CarMake, CarModel
from .populate import initiate
from .restapis import (
    get_request,
    analyze_review_sentiments,
    post_review,
)

# Get an instance of a logger
logger = logging.getLogger(__name__)


# Create your views here.

# Create a `login_request` view to handle sign in request
@csrf_exempt
def login_user(request):
    """Authenticate user and start session."""
    data = json.loads(request.body)
    username = data["userName"]
    password = data["password"]

    user = authenticate(username=username, password=password)
    resp = {"userName": username}
    if user is not None:
        login(request, user)
        resp = {"userName": username, "status": "Authenticated"}
    return JsonResponse(resp)


# Create a `logout_request` view to handle sign out request
def logout_request(request):
    """Terminate user session."""
    logout(request)
    return JsonResponse({"userName": ""})


# Create a `registration` view to handle sign up request
@csrf_exempt
def registration(request):
    """Register a new user."""
    data = json.loads(request.body)
    username = data["userName"]
    password = data["password"]
    first_name = data["firstName"]
    last_name = data["lastName"]
    email = data["email"]

    username_exist = False
    try:
        User.objects.get(username=username)
        username_exist = True
    except User.DoesNotExist:
        logger.debug("%s is a new user", username)

    if not username_exist:
        user = User.objects.create_user(
            username=username,
            first_name=first_name,
            last_name=last_name,
            password=password,
            email=email,
        )
        login(request, user)
        return JsonResponse(
            {"userName": username, "status": "Authenticated"}
        )

    return JsonResponse(
        {"userName": username, "error": "Already Registered"}
    )


def get_cars(request):
    """Return available car makes/models; populate once if empty."""
    count = CarMake.objects.count()
    if count == 0:
        initiate()

    car_models = CarModel.objects.select_related("car_make")
    cars = [
        {"CarModel": cm.name, "CarMake": cm.car_make.name}
        for cm in car_models
    ]
    return JsonResponse({"CarModels": cars})


# Update the `get_dealerships` render list of dealerships
def get_dealerships(request, state="All"):
    """Fetch dealers; all by default or filtered by state."""
    endpoint = "/fetchDealers" if state == "All" else f"/fetchDealers/{state}"
    dealerships = get_request(endpoint)
    return JsonResponse({"status": 200, "dealers": dealerships})


# Create a `get_dealer_reviews` view to render the reviews of a dealer
def get_dealer_reviews(request, dealer_id):
    """Fetch reviews for a specific dealer and add sentiment."""
    if dealer_id:
        endpoint = f"/fetchReviews/dealer/{dealer_id}"
        reviews = get_request(endpoint)
        for review_detail in reviews:
            resp = analyze_review_sentiments(
                review_detail["review"]
            )
            review_detail["sentiment"] = (
                resp.get("sentiment") if resp else None
            )
        return JsonResponse({"status": 200, "reviews": reviews})

    return JsonResponse({"status": 400, "message": "Bad Request"})


# Create a `get_dealer_details` view to render the dealer details
def get_dealer_details(request, dealer_id):
    """Fetch single dealer details."""
    if dealer_id:
        endpoint = f"/fetchDealer/{dealer_id}"
        dealership = get_request(endpoint)
        return JsonResponse(
            {"status": 200, "dealer": dealership}
        )

    return JsonResponse({"status": 400, "message": "Bad Request"})


# Create an `add_review` view to submit a review
def add_review(request):
    """Submit a review to the backend service."""
    try:
        data = json.loads(request.body)
        post_review(data)
        return JsonResponse({"status": 200})
    except Exception:
        return JsonResponse(
            {"status": 400, "message": "Error in posting review"}
        )
