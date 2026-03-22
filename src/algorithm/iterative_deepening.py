from .utils import get_neighbors, reconstruct_path

def solve(maze, start, end):
    all_visited = set()
    
    def dls(current, depth, path_visited, came_from_dict):
        yield current, "VISIT"
        
        if current == end:
            yield current, "FOUND"
            return
            
        if depth <= 0:
            return
            
        for neighbor in reversed(get_neighbors(maze, current)):
            if neighbor not in path_visited:
                path_visited.add(neighbor)
                came_from_dict[neighbor] = current
                
                gen = dls(neighbor, depth - 1, path_visited, came_from_dict)
                for state, status in gen:
                    yield state, status
                    if status == "FOUND":
                        return
                        
                path_visited.remove(neighbor)

    max_depth = len(maze) * len(maze[0])
    
    for depth in range(max_depth):
        path_visited = {start}
        came_from = {}
        
        for state, status in dls(start, depth, path_visited, came_from):
            all_visited.add(state)
            if status == "FOUND":
                yield state, all_visited, reconstruct_path(came_from, state)
                return
            else:
                yield state, all_visited, None
                
    yield None, all_visited, []
