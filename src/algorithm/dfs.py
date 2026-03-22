from .utils import get_neighbors, reconstruct_path

def solve(maze, start, end):
    stack = [start]
    visited = set()
    came_from = {}
    
    while stack:
        current = stack.pop()
        
        if current in visited:
            continue
            
        visited.add(current)
        
        if current == end:
            yield current, visited, reconstruct_path(came_from, current)
            return
            
        yield current, visited, None
        
        for neighbor in reversed(get_neighbors(maze, current)):
            if neighbor not in visited:
                came_from[neighbor] = current
                stack.append(neighbor)
                
    yield None, visited, []
