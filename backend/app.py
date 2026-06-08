import os
import datetime
import logging
from functools import wraps
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import bcrypt
import jwt
import requests

from database import Database

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Dynamically load recommender from jupyter notebook
def load_recommender_from_notebook():
    import json
    base_dir = os.path.dirname(__file__)
    notebook_path = os.path.join(base_dir, "recommendation.ipynb")
        
    logger.info(f"Loading recommendation algorithm from notebook: {notebook_path}")
    with open(notebook_path, 'r', encoding='utf-8') as f:
        nb = json.load(f)
        
    code_cells = []
    for cell in nb.get('cells', []):
        if cell.get('cell_type') == 'code':
            source_lines = cell.get('source', [])
            source_code = "".join(source_lines)
            code_cells.append(source_code)
            
    full_code = "\n\n".join(code_cells)
    
    namespace = {
        '__file__': notebook_path,
        '__name__': 'recommender_notebook'
    }
    exec(full_code, namespace)
    
    if 'get_recommender' not in namespace:
        raise ImportError("Jupyter notebook does not define get_recommender function!")
        
    return namespace['get_recommender']

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'leetpath_super_secret_key_12345')
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize Database and Recommender
logger.info("Initializing database...")
db = Database()

logger.info("Initializing recommender engine dynamically from notebook...")
get_recommender = load_recommender_from_notebook()

# Path to files
BASE_DIR = os.path.dirname(__file__)
pkl_path = os.path.join(BASE_DIR, "recommender.pkl")
json_path = os.path.join(BASE_DIR, "data.json")
rec_engine = get_recommender(pkl_path, json_path)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'status': False, 'message': 'Authentication token is missing!'}), 401
            
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user_email = data['email']
        except jwt.ExpiredSignatureError:
            return jsonify({'status': False, 'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'status': False, 'message': 'Token is invalid!'}), 401
            
        return f(current_user_email, *args, **kwargs)
    return decorated

def fetch_full_leetcode_profile(username):
    """Hits LeetCode GraphQL API to retrieve complete user profile statistics, 
    including solved counts, calendar, badges, language stats, contest ratings, 
    and recent accepted submissions in a single request.
    """
    query = """
    query getUserFullProfile($username: String!) {
        matchedUser(username: $username) {
            username
            profile {
                ranking
                reputation
                userAvatar
            }
            submitStats {
                acSubmissionNum {
                    difficulty
                    count
                }
            }
            submissionCalendar
            languageProblemCount {
                languageName
                problemsSolved
            }
            badges {
                name
                icon
            }
        }
        userContestRanking(username: $username) {
            rating
            globalRanking
            attendedContestsCount
            topPercentage
        }
        userContestRankingHistory(username: $username) {
            rating
            attended
            contest {
                title
                startTime
            }
        }
        recentAcSubmissionList(username: $username, limit: 20) {
            titleSlug
        }
    }
    """
    payload = {
        "query": query,
        "variables": {"username": username}
    }
    headers = {"Content-Type": "application/json"}
    
    try:
        resp = requests.post("https://leetcode.com/graphql", json=payload, headers=headers, timeout=12)
        if resp.status_code == 200:
            data = resp.json()
            if "data" in data and data["data"]:
                return data["data"]
    except Exception as e:
        logger.error(f"Error fetching full LeetCode profile for {username}: {e}")
    return None

# ================= AUTH ENDPOINTS =================

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'status': False, 'message': 'Email and Password are required.'}), 400
        
    email = data['email'].strip().lower()
    password = data['password']
    
    # Hash password
    salt = bcrypt.gensalt()
    pw_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    success = db.create_user(email, pw_hash)
    if not success:
        return jsonify({'status': False, 'message': 'User already exists.'}), 409
        
    # Generate token
    token = jwt.encode({
        'email': email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'status': True,
        'message': 'Registration successful.',
        'token': token,
        'email': email
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'status': False, 'message': 'Email and Password are required.'}), 400
        
    email = data['email'].strip().lower()
    password = data['password']
    
    user = db.get_user_by_email(email)
    if not user:
        return jsonify({'status': False, 'message': 'Invalid email or password.'}), 401
        
    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return jsonify({'status': False, 'message': 'Invalid email or password.'}), 401
        
    # Generate token
    token = jwt.encode({
        'email': email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'status': True,
        'message': 'Login successful.',
        'token': token,
        'email': email
    }), 200

# ================= USER PROFILE ENDPOINTS =================

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user_email):
    user = db.get_user_by_email(current_user_email)
    if not user:
        return jsonify({'status': False, 'message': 'User not found.'}), 404
        
    # Run weak area analysis
    weak_areas = rec_engine.analyze_weak_areas(user['solved_questions'])
    
    # Check if local image exists
    safe_email = current_user_email.replace('@', '_').replace('.', '_')
    has_image = os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], f"{safe_email}.png"))
    image_url = f"/api/profile/image/{safe_email}.png" if has_image else None
    
    profile_data = {
        'email': user['email'],
        'username': user['username'],
        'name': user['name'],
        'institution': user['institution'],
        'solved_questions': user['solved_questions'],
        'solved': user['solved'],
        'weak_areas': weak_areas,
        'imageUrl': image_url,
        'leetcode_stats': user.get('leetcode_stats', {})
    }
    
    return jsonify({'status': True, 'profile': profile_data})

@app.route('/api/profile/update', methods=['PATCH'])
@token_required
def update_profile(current_user_email):
    data = request.get_json()
    if not data:
        return jsonify({'status': False, 'message': 'No data provided.'}), 400
        
    name = data.get('name')
    username = data.get('username')
    institution = data.get('institution')
    
    # Fetch old user to check if username changed
    old_user = db.get_user_by_email(current_user_email)
    
    success = db.update_user_profile(current_user_email, name, username, institution)
    if not success:
        return jsonify({'status': False, 'message': 'Failed to update profile.'}), 500
        
    # If username changed and is not empty, auto-sync stats
    if username and username != old_user.get('username'):
        stats = fetch_leetcode_stats(username)
        if stats:
            db.update_solved_stats(current_user_email, stats['easy'], stats['medium'], stats['hard'])
            
    return jsonify({'status': True, 'message': 'Profile updated successfully.'})

@app.route('/api/profile/image/upload', methods=['POST'])
@token_required
def upload_image(current_user_email):
    if 'file' not in request.files:
        return jsonify({'status': False, 'message': 'No file uploaded.'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'status': False, 'message': 'Empty file.'}), 400
        
    safe_email = current_user_email.replace('@', '_').replace('.', '_')
    filename = f"{safe_email}.png"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    return jsonify({
        'status': True, 
        'message': 'Image uploaded successfully.',
        'imageUrl': f"/api/profile/image/{filename}"
    })

@app.route('/api/profile/image/<filename>', methods=['GET'])
def get_image(filename):
    safe_filename = os.path.basename(filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
    if os.path.exists(filepath):
        return send_file(filepath, mimetype='image/png')
    return jsonify({'status': False, 'message': 'Image not found.'}), 404

# ================= SOLVED QUESTIONS ENDPOINTS =================

@app.route('/api/solved/add', methods=['POST'])
@token_required
def add_solved(current_user_email):
    data = request.get_json()
    if not data or not data.get('question_slug'):
        return jsonify({'status': False, 'message': 'question_slug is required.'}), 400
        
    slug = data['question_slug'].strip()
    success = db.add_solved_question(current_user_email, slug)
    if success:
        return jsonify({'status': True, 'message': 'Question marked as solved.'})
    return jsonify({'status': False, 'message': 'Failed to mark question as solved.'}), 500

@app.route('/api/solved/remove', methods=['POST'])
@token_required
def remove_solved(current_user_email):
    data = request.get_json()
    if not data or not data.get('question_slug'):
        return jsonify({'status': False, 'message': 'question_slug is required.'}), 400
        
    slug = data['question_slug'].strip()
    success = db.remove_solved_question(current_user_email, slug)
    if success:
        return jsonify({'status': True, 'message': 'Question marked as unsolved.'})
    return jsonify({'status': False, 'message': 'Failed to mark question as unsolved.'}), 500

@app.route('/api/leetcode/sync', methods=['POST'])
@token_required
def sync_leetcode(current_user_email):
    user = db.get_user_by_email(current_user_email)
    username = user.get('username')
    if not username:
        return jsonify({'status': False, 'message': 'LeetCode username not configured in profile.'}), 400
        
    full_data = fetch_full_leetcode_profile(username)
    if not full_data or not full_data.get('matchedUser'):
        return jsonify({'status': False, 'message': 'Could not fetch stats. Check if username is valid.'}), 404
        
    matched_user = full_data['matchedUser']
    
    # 1. Parse solved counts
    stats = {"easy": 0, "medium": 0, "hard": 0}
    ac_sub_num = matched_user.get("submitStats", {}).get("acSubmissionNum", [])
    for s in ac_sub_num:
        diff = s["difficulty"].lower()
        if diff in stats:
            stats[diff] = s["count"]
            
    # 2. Extract LeetCode profile statistics
    badges_list = []
    for badge in matched_user.get("badges", []) or []:
        icon_url = badge.get("icon", "")
        if icon_url.startswith("/"):
            icon_url = f"https://leetcode.com{icon_url}"
        badges_list.append({
            "name": badge.get("name"),
            "icon": icon_url
        })
        
    contest_history = []
    for hist in full_data.get("userContestRankingHistory", []) or []:
        if hist.get("attended"):
            contest_history.append({
                "rating": hist.get("rating"),
                "contestTitle": hist.get("contest", {}).get("title"),
                "startTime": hist.get("contest", {}).get("startTime")
            })
            
    contest_ranking = full_data.get("userContestRanking")
    contest_data = None
    if contest_ranking:
        contest_data = {
            "rating": contest_ranking.get("rating"),
            "globalRanking": contest_ranking.get("globalRanking"),
            "attendedContestsCount": contest_ranking.get("attendedContestsCount"),
            "topPercentage": contest_ranking.get("topPercentage")
        }
        
    avatar_url = matched_user.get("profile", {}).get("userAvatar", "")
    if avatar_url.startswith("/"):
        avatar_url = f"https://leetcode.com{avatar_url}"
        
    leetcode_stats_dict = {
        "ranking": matched_user.get("profile", {}).get("ranking"),
        "reputation": matched_user.get("profile", {}).get("reputation"),
        "avatar": avatar_url,
        "language_problem_count": matched_user.get("languageProblemCount", []),
        "badges": badges_list,
        "submission_calendar": matched_user.get("submissionCalendar"),
        "contest_ranking": contest_data,
        "contest_history": contest_history
    }
    
    # Update leetcode_stats in db
    db.update_leetcode_stats(current_user_email, stats['easy'], stats['medium'], stats['hard'], leetcode_stats_dict)
    
    # 3. Solved questions seeding: get real recent submissions + seed matching difficulty counts
    recent_subs = full_data.get("recentAcSubmissionList", []) or []
    recent_slugs = [s["titleSlug"] for s in recent_subs]
    
    # Get current user solved question list
    current_solved = set(user.get('solved_questions', []))
    all_slugs_in_db = set(rec_engine.df['titleSlug'].values)
    
    # Add real recent ones
    for slug in recent_slugs:
        if slug in all_slugs_in_db:
            current_solved.add(slug)
            
    # Count how many we currently have in solved list per difficulty
    current_solved_problems = rec_engine.df[rec_engine.df['titleSlug'].isin(current_solved)]
    current_easy = len(current_solved_problems[current_solved_problems['difficulty'].str.lower() == 'easy'])
    current_medium = len(current_solved_problems[current_solved_problems['difficulty'].str.lower() == 'medium'])
    current_hard = len(current_solved_problems[current_solved_problems['difficulty'].str.lower() == 'hard'])
    
    target_easy = stats['easy']
    target_medium = stats['medium']
    target_hard = stats['hard']
    
    # Seeding
    import random
    seed_val = sum(ord(c) for c in current_user_email)
    random.seed(seed_val)
    
    all_easy_slugs = rec_engine.df[rec_engine.df['difficulty'].str.lower() == 'easy']['titleSlug'].tolist()
    all_medium_slugs = rec_engine.df[rec_engine.df['difficulty'].str.lower() == 'medium']['titleSlug'].tolist()
    all_hard_slugs = rec_engine.df[rec_engine.df['difficulty'].str.lower() == 'hard']['titleSlug'].tolist()
    
    added_count = 0
    
    if current_easy < target_easy:
        available = [s for s in all_easy_slugs if s not in current_solved]
        to_add = random.sample(available, min(len(available), target_easy - current_easy))
        for s in to_add:
            current_solved.add(s)
            added_count += 1
            
    if current_medium < target_medium:
        available = [s for s in all_medium_slugs if s not in current_solved]
        to_add = random.sample(available, min(len(available), target_medium - current_medium))
        for s in to_add:
            current_solved.add(s)
            added_count += 1
            
    if current_hard < target_hard:
        available = [s for s in all_hard_slugs if s not in current_solved]
        to_add = random.sample(available, min(len(available), target_hard - current_hard))
        for s in to_add:
            current_solved.add(s)
            added_count += 1
            
    # Save the updated list in db
    db.update_solved_questions(current_user_email, list(current_solved))
    
    return jsonify({
        'status': True,
        'message': f'LeetCode profile synced. Auto-added {added_count} solved question slugs to match LeetCode solved counts.',
        'solved': stats,
        'added_count': added_count,
        'leetcode_stats': leetcode_stats_dict
    })

@app.route('/api/solved/bulk', methods=['POST'])
@token_required
def add_solved_bulk(current_user_email):
    data = request.get_json()
    if not data or not isinstance(data.get('question_slugs'), list):
        return jsonify({'status': False, 'message': 'question_slugs list is required.'}), 400
        
    slugs = data['question_slugs']
    added_count = 0
    all_slugs_in_db = set(rec_engine.df['titleSlug'].values)
    for slug in slugs:
        slug = slug.strip().lower()
        if slug in all_slugs_in_db:
            success = db.add_solved_question(current_user_email, slug)
            if success:
                added_count += 1
                
    return jsonify({
        'status': True,
        'message': f'Bulk added {added_count} question slugs to solved list.',
        'added_count': added_count
    })

# ================= RECOMMEND & PROBLEM BROWSER ENDPOINTS =================

@app.route('/api/recommend', methods=['POST'])
@token_required
def get_recommendations(current_user_email):
    data = request.get_json() or {}
    mode = data.get('mode', 'balanced')  # balanced, weak_areas, similar
    count = data.get('count', 10)
    
    user = db.get_user_by_email(current_user_email)
    solved_slugs = user.get('solved_questions', [])
    
    recommended_pairs = rec_engine.recommend_questions_enhanced(solved_slugs, top_n=count, mode=mode)
    recommended_slugs = [slug for slug, score in recommended_pairs]
    
    # Retrieve details for recommended slugs from data.json
    all_problems_df = rec_engine.df
    recommended_df = all_problems_df[all_problems_df['titleSlug'].isin(recommended_slugs)]
    
    problems_list = []
    for slug in recommended_slugs:
        # Match slug row
        row_matches = recommended_df[recommended_df['titleSlug'] == slug]
        if not row_matches.empty:
            row = row_matches.iloc[0]
            problems_list.append({
                "questionId": str(row.get('questionId', '')),
                "questionFrontendId": str(row.get('questionFrontendId', '')),
                "title": row['title'],
                "titleSlug": row['titleSlug'],
                "difficulty": row['difficulty'],
                "topics": row.get('topics', []),
                "link": row.get('link', ''),
                "question": row.get('question', ''),
                "likability": row.get('likability', 50.0)
            })
            
    return jsonify({
        'status': True,
        'recommendations': problems_list,
        'mode': mode
    })

@app.route('/api/problems', methods=['GET'])
def list_problems():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    search = request.args.get('search', '', type=str).lower()
    difficulty = request.args.get('difficulty', '', type=str).lower()
    topic = request.args.get('topic', '', type=str).lower()
    
    df = rec_engine.df
    
    # Filter
    if search:
        df = df[df['title'].str.lower().str.contains(search) | df['titleSlug'].str.lower().str.contains(search)]
    if difficulty:
        df = df[df['difficulty'] == difficulty]
    if topic:
        df = df[df['topics'].apply(lambda x: topic in [t.lower() for t in x] if isinstance(x, list) else False)]
        
    total = len(df)
    start = (page - 1) * limit
    end = start + limit
    
    paginated_df = df.iloc[start:end]
    
    problems = []
    for idx, row in paginated_df.iterrows():
        problems.append({
            "questionId": str(row.get('questionId', '')),
            "questionFrontendId": str(row.get('questionFrontendId', '')),
            "title": row['title'],
            "titleSlug": row['titleSlug'],
            "difficulty": row['difficulty'],
            "topics": row.get('topics', []),
            "link": row.get('link', ''),
            "question": row.get('question', ''),
            "likability": row.get('likability', 50.0)
        })
        
    return jsonify({
        'status': True,
        'problems': problems,
        'total': total,
        'page': page,
        'limit': limit
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    # Run server
    app.run(host='0.0.0.0', port=port, debug=True)
