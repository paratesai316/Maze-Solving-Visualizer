import random

def generate_maze(width, height):
    """
    Generates a randomized imperfect maze using Randomized Prim's Algorithm.
    Removes additional extra walls to create multiple paths/loops, which allows 
    demonstrating the difference between shortest-path algorithms and non-optimal ones (like DFS).
    Returns a 2D list where 1 represents a wall and 0 represents a path.
    """
    if width % 2 == 0:
        width += 1
    if height % 2 == 0:
        height += 1
        
    maze = [[1 for _ in range(width)] for _ in range(height)]
    
    start_x, start_y = 1, 1
    maze[start_y][start_x] = 0
    
    walls = []
    
    def add_walls(cx, cy):
        for dx, dy in [(0, -2), (0, 2), (-2, 0), (2, 0)]:
            nx, ny = cx + dx, cy + dy
            if 0 < nx < width and 0 < ny < height and maze[ny][nx] == 1:
                walls.append((cx + dx // 2, cy + dy // 2, nx, ny))

    add_walls(start_x, start_y)
    
    while walls:
        wall_idx = random.randint(0, len(walls) - 1)
        wx, wy, nx, ny = walls.pop(wall_idx)
        
        if maze[ny][nx] == 1:
            maze[wy][wx] = 0
            maze[ny][nx] = 0
            add_walls(nx, ny)
            
    breakable_walls = []
    for y in range(1, height - 1):
        for x in range(1, width - 1):
            if maze[y][x] == 1:
                if maze[y-1][x] == 0 and maze[y+1][x] == 0 and maze[y][x-1] == 1 and maze[y][x+1] == 1:
                    breakable_walls.append((x, y))
                elif maze[y][x-1] == 0 and maze[y][x+1] == 0 and maze[y-1][x] == 1 and maze[y+1][x] == 1:
                    breakable_walls.append((x, y))
                    
    num_to_break = int(len(breakable_walls) * 0.08)
    for wx, wy in random.sample(breakable_walls, num_to_break):
        maze[wy][wx] = 0
        
    return maze
