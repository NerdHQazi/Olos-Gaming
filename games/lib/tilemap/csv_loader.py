import csv
import os

def load_csv_map(filepath: str) -> list[list[int]]:
    """
    Reads a CSV file and returns a 2D list of integers representing the map grid.
    
    Args:
        filepath (str): The path to the CSV file.
        
    Returns:
        list[list[int]]: A 2D list containing tile IDs. Returns an empty list if file not found or invalid.
    """
    grid = []
    
    if not os.path.exists(filepath):
        print(f"Error: Map file '{filepath}' not found.")
        return []

    try:
        with open(filepath, mode='r', encoding='utf-8') as file:
            reader = csv.reader(file)
            for row in reader:
                int_row = []
                for val in row:
                    val = val.strip()
                    if val:
                        int_row.append(int(val))
                
                if int_row:
                    grid.append(int_row)
    except ValueError as e:
        print(f"Error parsing map file '{filepath}': Non-integer value found. ({e})")
        return []
    except Exception as e:
        print(f"An unexpected error occurred while loading '{filepath}': {e}")
        return []
        
    return grid
