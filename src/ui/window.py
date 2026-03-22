import pygame
import math

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
YELLOW = (255, 255, 51)
GREEN = (50, 205, 50)
BLUE = (0, 0, 255)
RED = (255, 0, 0)
GRAY = (220, 220, 220)
DARK_GRAY = (150, 150, 150)

def draw_maze(surface, rect, maze, title, visited, path, time_taken=None, status="Running", font=None):
    surface.fill(GRAY, rect)
    pygame.draw.rect(surface, DARK_GRAY, rect, 2)
    
    if font:
        title_surf = font.render(title, True, BLACK)
        surface.blit(title_surf, (rect.x + 10, rect.y + 5))
        
        status_text = f"Time: {time_taken:.4f}s" if time_taken is not None else "Time: --"
        if status.startswith("Finished"):
            status_text += f" | Finished (Steps: {len(path) if path else 'N/A'})"
        else:
            status_text += f" | {status}"
        status_surf = font.render(status_text, True, BLACK)
        surface.blit(status_surf, (rect.x + 10, rect.y + 25))

    maze_rect = pygame.Rect(rect.x + 10, rect.y + 50, rect.width - 20, rect.height - 60)
    
    rows = len(maze)
    cols = len(maze[0])
    cell_w = maze_rect.width / cols
    cell_h = maze_rect.height / rows
    
    pygame.draw.rect(surface, WHITE, maze_rect)
    
    for r in range(rows):
        for c in range(cols):
            x = maze_rect.x + c * cell_w
            y = maze_rect.y + r * cell_h
            
            color = None
            if maze[r][c] == 1:
                color = BLACK
            elif path and (c, r) in path:
                color = GREEN
            elif visited and (c, r) in visited:
                color = YELLOW
                
            if (c, r) == (1, 1):
                color = BLUE
            elif (c, r) == (cols - 2, rows - 2):
                color = RED
                
            if color is not None:
                pygame.draw.rect(surface, color, (x, y, math.ceil(cell_w), math.ceil(cell_h)))
            
    pygame.draw.rect(surface, BLACK, maze_rect, 2)
