#!/bin/sh
# Small copies (400px) of every project cover (panel 0) under public/assets/kresilo/gen/t/, for cards and grids.
# Run after a cover is added or regenerated; a test checks that every cover has one.
cd "$(dirname "$0")/../public/assets/kresilo/gen" || exit 1
mkdir -p t
for f in panel--*--0.jpg; do
  sips -s format jpeg -s formatOptions 58 -Z 400 "$f" --out "t/$f" >/dev/null 2>&1 || echo "failed: $f"
done
echo "thumbnails: $(ls t | wc -l)"
