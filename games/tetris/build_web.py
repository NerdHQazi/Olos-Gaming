import ast, sys
from pathlib import Path

src = Path(sys.argv[1]).read_text()
tree = ast.parse(src)

def has_call(n):
    return any(isinstance(x, ast.Call) for x in ast.walk(n))

def is_setup(n):
    if isinstance(n, (ast.Import, ast.ImportFrom, ast.ClassDef,
                      ast.FunctionDef, ast.AsyncFunctionDef)):
        return True
    if isinstance(n, ast.Assign) and not has_call(n):
        return True
    if isinstance(n, ast.Expr) and isinstance(n.value, ast.Constant):  # docstring
        return True
    return False

# Setup = leading imports/classes/functions/constants. The rest goes into main().
idx = 0
while idx < len(tree.body) and is_setup(tree.body[idx]):
    idx += 1
head, tail = tree.body[:idx], tree.body[idx:]

if not tail:
    sys.exit("Nothing found after the class/function definitions to wrap in main().")

# Unwrap `if __name__ == "__main__":` so the code runs inside main().
if len(tail) == 1 and isinstance(tail[0], ast.If) and "__name__" in ast.unparse(tail[0].test):
    tail = tail[0].body

# Add `await asyncio.sleep(0)` at the end of the first (outermost) while loop.
yield_stmt = ast.parse("async def _f():\n    await asyncio.sleep(0)").body[0].body[0]
loop = next((x for t in tail for x in ast.walk(t) if isinstance(x, ast.While)), None)
if loop is None:
    sys.exit("No while loop found in the game code.")
loop.body.append(yield_stmt)

main_fn = ast.parse("async def main():\n    pass").body[0]
main_fn.body = tail

new = ast.Module(
    body=[ast.parse("import asyncio").body[0], *head, main_fn,
          ast.parse("asyncio.run(main())").body[0]],
    type_ignores=[],
)
ast.fix_missing_locations(new)

out = Path("build_src")
out.mkdir(exist_ok=True)
(out / "main.py").write_text(ast.unparse(new))
print(f"Wrote build_src/main.py  (setup statements: {len(head)}, wrapped in main(): {len(tail)})")
