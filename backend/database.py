import os
import sqlite3
import json
import logging
from pymongo import MongoClient

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.mongo_uri = os.environ.get("MONGO_URI")
        self.use_mongo = bool(self.mongo_uri)
        
        if self.use_mongo:
            try:
                logger.info("Connecting to MongoDB...")
                self.mongo_client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
                # Test connection
                self.mongo_client.server_info()
                self.mongo_db = self.mongo_client.get_database("leetpath")
                self.users_col = self.mongo_db.get_collection("users")
                logger.info("Successfully connected to MongoDB!")
            except Exception as e:
                logger.error(f"Failed to connect to MongoDB: {e}. Falling back to SQLite.")
                self.use_mongo = False
                
        if not self.use_mongo:
            logger.info("Using SQLite database.")
            self.sqlite_path = "leetpath.db"
            self._init_sqlite()

    def _init_sqlite(self):
        conn = sqlite3.connect(self.sqlite_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                username TEXT,
                name TEXT,
                institution TEXT,
                solved_questions TEXT, -- JSON array of strings
                solved_easy INTEGER DEFAULT 0,
                solved_medium INTEGER DEFAULT 0,
                solved_hard INTEGER DEFAULT 0
            )
        """)
        # Ensure leetcode_stats column exists
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN leetcode_stats TEXT")
        except sqlite3.OperationalError:
            pass
        conn.commit()
        conn.close()

    def _get_sqlite_conn(self):
        conn = sqlite3.connect(self.sqlite_path)
        conn.row_factory = sqlite3.Row
        return conn

    def create_user(self, email, password_hash):
        """Creates a new user. Returns True if successful, False if email exists."""
        if self.use_mongo:
            try:
                if self.users_col.find_one({"email": email}):
                    return False
                self.users_col.insert_one({
                    "email": email,
                    "password_hash": password_hash,
                    "username": "",
                    "name": "N/A",
                    "institution": "N/A",
                    "solved_questions": [],
                    "solved": {"easy": 0, "medium": 0, "hard": 0}
                })
                return True
            except Exception as e:
                logger.error(f"MongoDB create_user error: {e}")
                return False
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            try:
                cursor.execute(
                    "INSERT INTO users (email, password_hash, name, institution, solved_questions) VALUES (?, ?, ?, ?, ?)",
                    (email, password_hash, "N/A", "N/A", json.dumps([]))
                )
                conn.commit()
                return True
            except sqlite3.IntegrityError:
                return False
            finally:
                conn.close()

    def get_user_by_email(self, email):
        """Returns user dict or None."""
        if self.use_mongo:
            user = self.users_col.find_one({"email": email})
            if not user:
                return None
            # Normalize structure for frontend
            solved = user.get("solved", {"easy": 0, "medium": 0, "hard": 0})
            return {
                "email": user["email"],
                "password_hash": user["password_hash"],
                "username": user.get("username", ""),
                "name": user.get("name", "N/A"),
                "institution": user.get("institution", "N/A"),
                "solved_questions": user.get("solved_questions", []),
                "solved": solved,
                "leetcode_stats": user.get("leetcode_stats", {})
            }
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            row = cursor.fetchone()
            conn.close()
            if not row:
                return None
            
            try:
                solved_q = json.loads(row["solved_questions"] or "[]")
            except Exception:
                solved_q = []

            try:
                stats_str = row["leetcode_stats"]
                leetcode_stats = json.loads(stats_str) if stats_str else {}
            except Exception:
                leetcode_stats = {}

            return {
                "email": row["email"],
                "password_hash": row["password_hash"],
                "username": row["username"] or "",
                "name": row["name"] or "N/A",
                "institution": row["institution"] or "N/A",
                "solved_questions": solved_q,
                "solved": {
                    "easy": row["solved_easy"],
                    "medium": row["solved_medium"],
                    "hard": row["solved_hard"]
                },
                "leetcode_stats": leetcode_stats
            }

    def update_user_profile(self, email, name=None, username=None, institution=None):
        """Updates profile text fields."""
        if self.use_mongo:
            update_fields = {}
            if name is not None: update_fields["name"] = name
            if username is not None: update_fields["username"] = username
            if institution is not None: update_fields["institution"] = institution
            
            if not update_fields:
                return True
                
            res = self.users_col.update_one({"email": email}, {"$set": update_fields})
            return res.matched_count > 0
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            query = "UPDATE users SET "
            params = []
            updates = []
            if name is not None:
                updates.append("name = ?")
                params.append(name)
            if username is not None:
                updates.append("username = ?")
                params.append(username)
            if institution is not None:
                updates.append("institution = ?")
                params.append(institution)
                
            if not updates:
                conn.close()
                return True
                
            query += ", ".join(updates) + " WHERE email = ?"
            params.append(email)
            
            cursor.execute(query, tuple(params))
            conn.commit()
            success = cursor.rowcount > 0
            conn.close()
            return success

    def update_solved_stats(self, email, easy, medium, hard):
        """Updates the LeetCode sync status counts."""
        if self.use_mongo:
            res = self.users_col.update_one(
                {"email": email},
                {"$set": {"solved": {"easy": easy, "medium": medium, "hard": hard}}}
            )
            return res.matched_count > 0
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET solved_easy = ?, solved_medium = ?, solved_hard = ? WHERE email = ?",
                (easy, medium, hard, email)
            )
            conn.commit()
            success = cursor.rowcount > 0
            conn.close()
            return success

    def update_leetcode_stats(self, email, easy, medium, hard, stats_dict):
        """Updates the LeetCode stats JSON and solved difficulty counts."""
        if self.use_mongo:
            res = self.users_col.update_one(
                {"email": email},
                {"$set": {
                    "solved": {"easy": easy, "medium": medium, "hard": hard},
                    "leetcode_stats": stats_dict
                }}
            )
            return res.matched_count > 0
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET solved_easy = ?, solved_medium = ?, solved_hard = ?, leetcode_stats = ? WHERE email = ?",
                (easy, medium, hard, json.dumps(stats_dict), email)
            )
            conn.commit()
            success = cursor.rowcount > 0
            conn.close()
            return success

    def update_solved_questions(self, email, solved_list):
        """Overwrites the entire list of solved question slugs."""
        if self.use_mongo:
            res = self.users_col.update_one(
                {"email": email},
                {"$set": {"solved_questions": solved_list}}
            )
            return res.matched_count > 0
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET solved_questions = ? WHERE email = ?",
                (json.dumps(solved_list), email)
            )
            conn.commit()
            success = cursor.rowcount > 0
            conn.close()
            return success

    def get_solved_questions(self, email):
        user = self.get_user_by_email(email)
        return user["solved_questions"] if user else []

    def add_solved_question(self, email, question_slug):
        solved = self.get_solved_questions(email)
        if question_slug in solved:
            return True # Already added
        solved.append(question_slug)
        
        if self.use_mongo:
            res = self.users_col.update_one(
                {"email": email},
                {"$set": {"solved_questions": solved}}
            )
            return res.matched_count > 0
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET solved_questions = ? WHERE email = ?",
                (json.dumps(solved), email)
            )
            conn.commit()
            success = cursor.rowcount > 0
            conn.close()
            return success

    def remove_solved_question(self, email, question_slug):
        solved = self.get_solved_questions(email)
        if question_slug not in solved:
            return True # Already removed
        solved.remove(question_slug)
        
        if self.use_mongo:
            res = self.users_col.update_one(
                {"email": email},
                {"$set": {"solved_questions": solved}}
            )
            return res.matched_count > 0
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET solved_questions = ? WHERE email = ?",
                (json.dumps(solved), email)
            )
            conn.commit()
            success = cursor.rowcount > 0
            conn.close()
            return success
