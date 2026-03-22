from collections import deque
from .utils import get_neighbors, reconstruct_path

def solve(maze, start, end):
    queue_s = deque([start])
    queue_e = deque([end])
    
    visited_s_dict = {start}
    visited_e_dict = {end}
    
    came_from_s = {}
    came_from_e = {}
    
    all_visited = set()
    
    while queue_s and queue_e:
        if queue_s:
            curr_s = queue_s.popleft()
            all_visited.add(curr_s)
            
            if curr_s in visited_e_dict:
                path_s = reconstruct_path(came_from_s, curr_s)
                path_e = reconstruct_path(came_from_e, curr_s)
                path_e.reverse()
                path = path_s + path_e[1:]
                yield curr_s, all_visited, path
                return
                
            yield curr_s, all_visited, None
            
            for neighbor in get_neighbors(maze, curr_s):
                if neighbor not in visited_s_dict:
                    visited_s_dict.add(neighbor)
                    came_from_s[neighbor] = curr_s
                    queue_s.append(neighbor)
                    
        if queue_e:
            curr_e = queue_e.popleft()
            all_visited.add(curr_e)
            
            if curr_e in visited_s_dict:
                path_s = reconstruct_path(came_from_s, curr_e)
                path_e = reconstruct_path(came_from_e, curr_e)
                path_e.reverse()
                path = path_s + path_e[1:]
                yield curr_e, all_visited, path
                return
                
            yield curr_e, all_visited, None
            
            for neighbor in get_neighbors(maze, curr_e):
                if neighbor not in visited_e_dict:
                    visited_e_dict.add(neighbor)
                    came_from_e[neighbor] = curr_e
                    queue_e.append(neighbor)
                    
    yield None, all_visited, []
