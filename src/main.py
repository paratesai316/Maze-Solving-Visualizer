import pygame
import time
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from algorithm.bfs import solve as bfs_solve
from algorithm.dfs import solve as dfs_solve
from algorithm.a_star import solve as a_star_solve
from algorithm.dijkstra import solve as dijkstra_solve
from algorithm.best_first import solve as best_first_solve
from algorithm.uniform_cost import solve as ucs_solve

from maze.generator import generate_maze
from ui.window import draw_maze

def draw_button(surface, rect, text, font, bg_color=(200, 200, 200), text_color=(0,0,0)):
    pygame.draw.rect(surface, bg_color, rect)
    pygame.draw.rect(surface, (0, 0, 0), rect, 2)
    text_surf = font.render(text, True, text_color)
    text_rect = text_surf.get_rect(center=rect.center)
    surface.blit(text_surf, text_rect)

def reset_algorithms(maze, start, end):
    return [
        {"name": "Breadth-First Search", "generator": bfs_solve(maze, start, end), "visited": set(), "path": None, "time": 0.0, "status": "Waiting"},
        {"name": "Depth-First Search", "generator": dfs_solve(maze, start, end), "visited": set(), "path": None, "time": 0.0, "status": "Waiting"},
        {"name": "A* Search", "generator": a_star_solve(maze, start, end), "visited": set(), "path": None, "time": 0.0, "status": "Waiting"},
        {"name": "Dijkstra's Algorithm", "generator": dijkstra_solve(maze, start, end), "visited": set(), "path": None, "time": 0.0, "status": "Waiting"},
        {"name": "Greedy Best-First Search", "generator": best_first_solve(maze, start, end), "visited": set(), "path": None, "time": 0.0, "status": "Waiting"},
        {"name": "Uniform Cost Search", "generator": ucs_solve(maze, start, end), "visited": set(), "path": None, "time": 0.0, "status": "Waiting"},
    ]

def main():
    pygame.init()
    
    infoObject = pygame.display.Info()
    screen = pygame.display.set_mode((0, 0), pygame.FULLSCREEN)
    width, height = screen.get_size()
    pygame.display.set_caption("Maze Solving Visualizer")
    
    font = pygame.font.SysFont("Arial", 16)
    large_font = pygame.font.SysFont("Arial", 20, bold=True)
    
    maze_cols, maze_rows = 61, 61 
    start = (1, 1)
    end = (maze_cols - 2, maze_rows - 2)
    maze = generate_maze(maze_cols, maze_rows)
    algorithms = reset_algorithms(maze, start, end)
    
    clock = pygame.time.Clock()
    running = True
    leaderboard = []
    
    leaderboard_w = 400
    maze_area_w = width - leaderboard_w
    button_area_h = 80
    
    btn_start_all = pygame.Rect(10, height - 60, 120, 40)
    btn_stop_all = pygame.Rect(140, height - 60, 120, 40)
    btn_new_maze = pygame.Rect(270, height - 60, 120, 40)

    algo_rects = []

    while running:
        mouse_pos = pygame.mouse.get_pos()
        click = False
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:
                    click = True
                    
        if click:
            if btn_start_all.collidepoint(mouse_pos):
                for algo in algorithms:
                    if algo["status"] in ["Waiting", "Stopped"]:
                        algo["status"] = "Running"
            elif btn_stop_all.collidepoint(mouse_pos):
                for algo in algorithms:
                    if algo["status"] == "Running":
                        algo["status"] = "Stopped"
            elif btn_new_maze.collidepoint(mouse_pos):
                maze = generate_maze(maze_cols, maze_rows)
                algorithms = reset_algorithms(maze, start, end)
                leaderboard = []
            else:
                for i, rect in enumerate(algo_rects):
                    if hasattr(rect, 'collidepoint') and rect.collidepoint(mouse_pos):
                        if algorithms[i]["status"] in ["Waiting", "Stopped"]:
                            algorithms[i]["status"] = "Running"
                        elif algorithms[i]["status"] == "Running":
                            algorithms[i]["status"] = "Stopped"

        screen.fill((255, 255, 255))
        
        for algo in algorithms:
            if algo["status"] == "Running":
                steps_per_frame = 2 
                start_step_time = time.perf_counter()
                
                for _ in range(steps_per_frame):
                    try:
                        current, visited, path = next(algo["generator"])
                        algo["visited"] = visited
                        if path is not None:
                            algo["path"] = path
                            algo["status"] = "Finished"
                            break
                    except StopIteration:
                        algo["status"] = "Finished"
                        break
                        
                algo["time"] += (time.perf_counter() - start_step_time)
                
                if algo["status"] == "Finished":
                    leaderboard.append({
                        "name": algo["name"],
                        "time": algo["time"],
                        "steps": len(algo["path"]) if algo["path"] else float('inf')
                    })
        
        margin = 10
        usable_w = maze_area_w - 4 * margin
        usable_h = height - button_area_h - 3 * margin 
        
        cell_w = usable_w // 3
        cell_h = usable_h // 2
        
        algo_rects = []
        
        for i, algo in enumerate(algorithms):
            row = i // 3
            col = i % 3
            
            rect = pygame.Rect(
                margin + col * (cell_w + margin),
                margin + row * (cell_h + margin),
                cell_w,
                cell_h
            )
            algo_rects.append(rect)
            
            display_status = algo["status"]
            if algo["status"] in ["Waiting", "Stopped"]:
                display_status += " (Click to Start)"
            elif algo["status"] == "Running":
                display_status += " (Click to Stop)"
            
            draw_maze(screen, rect, maze, algo["name"], algo["visited"], algo["path"], algo["time"], display_status, font)
            
        board_rect = pygame.Rect(maze_area_w + margin, margin, leaderboard_w - 2 * margin, height - 2 * margin)
        pygame.draw.rect(screen, (240, 240, 240), board_rect)
        pygame.draw.rect(screen, (100, 100, 100), board_rect, 2)
        
        title_surf = large_font.render("Leaderboard", True, (0, 0, 0))
        screen.blit(title_surf, (board_rect.x + 10, board_rect.y + 10))
        
        subtitle_surf = font.render("(Fastest Time & Shortest Route)", True, (50, 50, 50))
        screen.blit(subtitle_surf, (board_rect.x + 10, board_rect.y + 35))
        
        pygame.draw.line(screen, (150, 150, 150), (board_rect.x + 10, board_rect.y + 60), (board_rect.x + board_rect.w - 10, board_rect.y + 60), 2)
        
        if leaderboard:
            sorted_by_time = sorted(leaderboard, key=lambda x: x["time"])
            sorted_by_steps = sorted([l for l in leaderboard if l["steps"] != float('inf')], key=lambda x: x["steps"])
            shortest_route_len = sorted_by_steps[0]["steps"] if sorted_by_steps else "N/A"
            shortest_route_names = [l["name"] for l in sorted_by_steps if l["steps"] == shortest_route_len]
            
            y_offset = board_rect.y + 70
            for i, entry in enumerate(sorted_by_time):
                is_shortest = entry["name"] in shortest_route_names
                highlight = " ⭐ Shortest" if is_shortest else ""
                
                text1 = f"{i+1}. {entry['name']}{highlight}"
                text2 = f"    Time: {entry['time']:.5f}s | Steps: {entry['steps']}"
                
                text_color = (0, 128, 0) if i == 0 else (0, 0, 0)
                
                surf1 = font.render(text1, True, text_color)
                screen.blit(surf1, (board_rect.x + 10, y_offset))
                
                surf2 = font.render(text2, True, text_color)
                screen.blit(surf2, (board_rect.x + 10, y_offset + 25))
                
                y_offset += 60

        draw_button(screen, btn_start_all, "Start All", font, (144, 238, 144))
        draw_button(screen, btn_stop_all, "Stop All", font, (255, 182, 193))
        draw_button(screen, btn_new_maze, "New Maze", font, (173, 216, 230))
        
        exit_surf = font.render("Press ESC to exit Fullscreen", True, (100, 100, 100))
        screen.blit(exit_surf, (btn_new_maze.x + btn_new_maze.w + 20, height - 50))

        pygame.display.flip()
        clock.tick(60)

    pygame.quit()

if __name__ == "__main__":
    main()