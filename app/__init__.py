from flask import Flask
from .routes import main
from .database import init_db

def create_app():
    app = Flask(__name__,
            template_folder="../templates",
            static_folder="../static")

    init_db()
    app.register_blueprint(main)

    return app
