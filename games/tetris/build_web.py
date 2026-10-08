"""Build the Tetris game for the web with pygbag.

Usage (run from the folder that contains tetris.py):

    python build_web.py                                   build only (uses tetris.py)
    python build_web.py tetris.py                         same, naming the source file
    python build_web.py --deploy ../my-next-app/public/tetris
                                                          build, then copy the result into Next
    python build_web.py --prepare-only                    just write build_src/main.py, no pygbag
    python build_web.py game.py --app-dir other_folder    other options (see --help)

Steps:
  1. Read the source file (default tetris.py).
  2. If it already has `async def main()` it is copied untouched. Otherwise it is
     converted: the code after the imports / classes / functions is wrapped in an
     async main() and `await asyncio.sleep(0)` is added to the first while loop.
  3. Run `pygbag --build` on the app folder.
  4. Optionally copy build/web into your Next project's public folder.
"""
import argparse
import ast
import shutil
import subprocess
import sys
from pathlib import Path


# --------------------------------------------------------------------------- #
#  Step 1-2: produce build_src/main.py
# --------------------------------------------------------------------------- #
def has_call(node):
    return any(isinstance(x, ast.Call) for x in ast.walk(node))


def is_setup(node):
    if isinstance(node, (ast.Import, ast.ImportFrom, ast.ClassDef,
                         ast.FunctionDef, ast.AsyncFunctionDef)):
        return True
    if isinstance(node, ast.Assign) and not has_call(node):
        return True
    if isinstance(node, ast.Expr) and isinstance(node.value, ast.Constant):  # docstring
        return True
    return False


def already_async(tree):
    return any(isinstance(n, ast.AsyncFunctionDef) and n.name == "main" for n in tree.body)


def convert(src):
    """Turn a plain script into a pygbag-ready async main.py. Returns (code, setup_count, wrapped_count)."""
    tree = ast.parse(src)

    idx = 0
    while idx < len(tree.body) and is_setup(tree.body[idx]):
        idx += 1
    head, tail = tree.body[:idx], tree.body[idx:]

    if not tail:
        raise SystemExit("Nothing found after the class/function definitions to wrap in main().")

    # Unwrap `if __name__ == "__main__":` so the code runs inside main().
    if len(tail) == 1 and isinstance(tail[0], ast.If) and "__name__" in ast.unparse(tail[0].test):
        tail = tail[0].body

    loop = next((x for t in tail for x in ast.walk(t) if isinstance(x, ast.While)), None)
    if loop is None:
        raise SystemExit("No while loop found in the game code.")
    loop.body.append(ast.parse("async def _f():\n    await asyncio.sleep(0)").body[0].body[0])

    main_fn = ast.parse("async def main():\n    pass").body[0]
    main_fn.body = tail

    new = ast.Module(
        body=[ast.parse("import asyncio").body[0], *head, main_fn,
              ast.parse("asyncio.run(main())").body[0]],
        type_ignores=[],
    )
    ast.fix_missing_locations(new)
    return ast.unparse(new), len(head), len(tail)


def prepare(src_path, app_dir):
    if not src_path.is_file():
        raise SystemExit(f"Source file not found: {src_path}")
    src = src_path.read_text(encoding="utf-8")
    try:
        tree = ast.parse(src)
    except SyntaxError as err:
        raise SystemExit(f"{src_path} has a syntax error: {err}")

    app_dir.mkdir(parents=True, exist_ok=True)
    target = app_dir / "main.py"
    if already_async(tree):
        target.write_text(src, encoding="utf-8")
        print(f"[prepare] {src_path} is already async: copied to {target} unchanged")
    else:
        code, n_head, n_tail = convert(src)
        target.write_text(code, encoding="utf-8")
        print(f"[prepare] converted {src_path} -> {target} "
              f"(setup statements: {n_head}, wrapped in main(): {n_tail})")
    return target


# --------------------------------------------------------------------------- #
#  Step 3: pygbag
# --------------------------------------------------------------------------- #
def run_pygbag(app_dir):
    cmd = [sys.executable, "-m", "pygbag", "--build", str(app_dir)]
    print("[build] " + " ".join(cmd))
    try:
        result = subprocess.run(cmd)
    except FileNotFoundError:
        raise SystemExit("Could not run Python to start pygbag.")
    if result.returncode != 0:
        raise SystemExit(
            "pygbag failed. If it says 'No module named pygbag', run:  pip install pygbag"
        )
    web_dir = app_dir / "build" / "web"
    if not (web_dir / "index.html").is_file():
        raise SystemExit(f"Build finished but {web_dir / 'index.html'} was not found.")
    print(f"[build] done: {web_dir}")
    return web_dir


# --------------------------------------------------------------------------- #
#  Step 4: copy into the Next project
# --------------------------------------------------------------------------- #
def deploy(web_dir, dest):
    dest.mkdir(parents=True, exist_ok=True)
    shutil.copytree(web_dir, dest, dirs_exist_ok=True)  # same-named files are overwritten
    print(f"[deploy] copied {web_dir} -> {dest}")
    print("[deploy] if the browser still shows the old game, hard refresh or add ?v=<number> to the iframe URL")


def main():
    parser = argparse.ArgumentParser(description="Build the Tetris game for the web with pygbag.")
    parser.add_argument("src", nargs="?", default="tetris.py", help="game source file (default: tetris.py)")
    parser.add_argument("--app-dir", default="build_src", help="folder pygbag packages (default: build_src)")
    parser.add_argument("--deploy", metavar="DIR", help="copy the finished build into this folder (e.g. your Next public/tetris)")
    parser.add_argument("--prepare-only", action="store_true", help="only write build_src/main.py, skip pygbag")
    args = parser.parse_args()

    here = Path(__file__).resolve().parent
    src_path = Path(args.src)
    app_dir = Path(args.app_dir)
    if not src_path.is_absolute():
        src_path = here / src_path
    if not app_dir.is_absolute():
        app_dir = here / app_dir

    prepare(src_path, app_dir)
    if args.prepare_only:
        return

    web_dir = run_pygbag(app_dir)
    if args.deploy:
        dest = Path(args.deploy)
        if not dest.is_absolute():
            dest = Path.cwd() / dest
        deploy(web_dir, dest)


if __name__ == "__main__":
    main()