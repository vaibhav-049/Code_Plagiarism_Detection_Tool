from pathlib import Path
import json

from graphify.detect import detect
from graphify.extract import extract, collect_files
from graphify.build import build
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_html, to_json

ROOT = Path('.')
OUT = ROOT / 'graphify-out'
OUT.mkdir(parents=True, exist_ok=True)

# Step 2: detect corpus
result = detect(ROOT)
(OUT / '.graphify_detect.json').write_text(json.dumps(result, indent=2), encoding='utf-8')

code_files = []
for item in result.get('files', {}).get('code', []):
    p = Path(item)
    code_files.extend(collect_files(p) if p.is_dir() else [p])

if not code_files:
    raise SystemExit('No code files found for graph extraction.')

# Step 3A: structural extraction (code-only corpus)
ast_result = extract(code_files)
(OUT / '.graphify_ast.json').write_text(json.dumps(ast_result, indent=2), encoding='utf-8')

# Build graph
G = build([ast_result], directed=False)
communities = cluster(G)
cohesion_scores = score_all(G, communities)

community_labels = {}
for cid, nodes in communities.items():
    community_labels[cid] = nodes[0] if nodes else f'community_{cid}'

node_degree = dict(G.degree())
god_list = god_nodes(G, top_n=10)
surprises = surprising_connections(G, communities=communities, top_n=5)
questions = suggest_questions(G, communities, community_labels, top_n=7)

report_text = generate(
    G,
    communities,
    cohesion_scores,
    community_labels,
    god_list,
    surprises,
    result,
    token_cost={
        'input': ast_result.get('input_tokens', 0),
        'output': ast_result.get('output_tokens', 0),
    },
    root=str(ROOT.resolve()),
    suggested_questions=questions,
)

# Exports
json_path = OUT / 'graph.json'
html_path = OUT / 'graph.html'
report_path = OUT / 'GRAPH_REPORT.md'

to_json(G, communities, str(json_path))
to_html(G, communities, str(html_path), community_labels=community_labels)
report_path.write_text(report_text, encoding='utf-8')

summary = {
    'total_files': result.get('total_files', 0),
    'total_words': result.get('total_words', 0),
    'skipped_sensitive': len(result.get('skipped_sensitive', [])),
    'counts': {k: len(v) for k, v in result.get('files', {}).items()},
    'graph_nodes': G.number_of_nodes(),
    'graph_edges': G.number_of_edges(),
    'communities': len(communities),
    'outputs': {
        'json': str(json_path),
        'html': str(html_path),
        'report': str(report_path),
    },
}
print(json.dumps(summary, indent=2))
