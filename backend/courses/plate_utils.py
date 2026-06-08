import json


def _extract_text_from_node(node) -> str:
    if not node or not isinstance(node, dict):
        return ''
    if isinstance(node.get('text'), str):
        return node['text']
    children = node.get('children')
    if isinstance(children, list):
        return ' '.join(_extract_text_from_node(child) for child in children)
    return ''


def extract_plain_text_from_plate(content) -> str:
    if not content:
        return ''
    if isinstance(content, str):
        try:
            parsed = json.loads(content)
        except (json.JSONDecodeError, TypeError):
            return ''
        content = parsed
    if not isinstance(content, list):
        return ''
    return ' '.join(_extract_text_from_node(node) for node in content).strip()
