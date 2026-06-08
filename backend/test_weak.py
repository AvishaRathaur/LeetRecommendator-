import pandas as pd
import os
def load_recommender_from_notebook():
    import json
    base_dir = os.path.dirname(__file__)
    notebook_path = os.path.join(base_dir, "recommendation.ipynb")
        
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
    return namespace['get_recommender']

get_recommender = load_recommender_from_notebook()

pkl_path = "recommender_test_weak.pkl"
json_path = "data.json"
engine = get_recommender(pkl_path, json_path)

print("df shape:", engine.df.shape)
print("Is 'two-sum' in df['titleSlug'].values?", 'two-sum' in engine.df['titleSlug'].values)
matched = engine.df[engine.df['titleSlug'] == 'two-sum']
print("matched count:", len(matched))
if len(matched) > 0:
    row = matched.iloc[0]
    print("Row titleSlug:", row['titleSlug'])
    print("Row topics:", row['topics'])
    
weak = engine.analyze_weak_areas(['two-sum'])
for w in weak:
    if w['solved'] > 0:
        print(f"Solved found: {w['topic']} - {w['solved']}")
        
# Cleanup
if os.path.exists(pkl_path):
    os.remove(pkl_path)
