#!/bin/sh
# Tiny copies (160px) of every maker portrait under public/assets/kresilo/p/, for avatars shown at a few dozen pixels.
# Run after a portrait is added or replaced; a test checks that every portrait has one.
cd "$(dirname "$0")/../public/assets/kresilo" || exit 1
mkdir -p p
for f in *-portrait.webp gen/portrait--*.jpg; do
  [ -f "$f" ] || continue
  name=$(basename "$f"); name="${name%.*}"
  sips -s format jpeg -s formatOptions 62 -Z 160 "$f" --out "p/$name.jpg" >/dev/null 2>&1 || echo "failed: $f"
done
echo "avatars: $(ls p | wc -l)"
