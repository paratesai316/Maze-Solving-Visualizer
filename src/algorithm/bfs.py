from collections import deque
from .utils import get_neighbors, reconstruct_path

def solve(maze, start, end):
    queue = deque([start])
    enqueued = {start}
    visited = set()
    came_from = {}

    while queue:
        current = queue.popleft()
        visited.add(current)

        if current == end:
            yield current, visited, reconstruct_path(came_from, current)
            return

        yield current, visited, None

        for neighbor in get_neighbors(maze, current):
            if neighbor not in enqueued:
                enqueued.add(neighbor)
                came_from[neighbor] = current
                queue.append(neighbor)

    yield None, visited, []