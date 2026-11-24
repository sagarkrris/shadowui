#!/usr/bin/env python3
"""Build or verify the reproducible checkout capstone download."""
import argparse
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile, ZipInfo

root = Path(__file__).resolve().parents[2] / "public"
lab = root / "microservices-spring-lab"
archive = root / "microservices-spring-lab.zip"

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--check", action="store_true")
args = parser.parse_args()

files = [lab / name for name in (".dockerignore", ".gitignore", "Dockerfile", "README.md", "compose.yaml", "pom.xml")]
files.extend(path for folder in ("scripts", "src") for path in (lab / folder).rglob("*") if path.is_file())

buffer = BytesIO()
with ZipFile(buffer, "w") as package:
    for path in sorted(files):
        entry = ZipInfo(str(path.relative_to(root).as_posix()))
        entry.create_system = 3
        entry.external_attr = (0o100755 if path.suffix == ".sh" else 0o100644) << 16
        # Store members so exact archive bytes do not depend on the zlib version.
        package.writestr(entry, path.read_bytes())

if args.check:
    if not archive.exists() or archive.read_bytes() != buffer.getvalue():
        parser.exit(1, "The capstone ZIP is stale. Run scripts/validation/package-checkout-lab.py.\n")
else:
    archive.write_bytes(buffer.getvalue())
