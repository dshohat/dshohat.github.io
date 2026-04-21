"""Audio File Combiner

Concatenates all audio files in a given folder into a single file per format.
Uses ffmpeg with stream copy (no re-encoding) for minimum changes.

Usage: python combine_audio.py <folder_path>

Naming order: Files are sorted NATURALLY by filename.
  "track 1.mp3", "track 2.mp3", "track 10.mp3" => sorted as 1, 2, 10 (not 1, 10, 2).
  Name your files so that natural sort gives the desired order.

If multiple formats exist in the folder, each format is combined separately.
Supported formats: .wav, .mp3, .mp4, .m4a, .ogg, .flac, .aac, .wma
"""

import sys
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from collections import defaultdict

SUPPORTED_EXTENSIONS = {'.wav', '.mp3', '.mp4', '.m4a', '.ogg', '.flac', '.aac', '.wma'}
OUTPUT_PREFIX = 'combined_output'


def get_ffmpeg():
    """Find ffmpeg binary: system PATH first, then imageio-ffmpeg fallback."""
    path = shutil.which('ffmpeg')
    if path:
        return path
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        print("Error: ffmpeg not found. Install it or run: pip install imageio-ffmpeg")
        sys.exit(1)


def natural_sort_key(filename):
    """Sort key that handles numbers naturally (1, 2, 10 instead of 1, 10, 2)."""
    return [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', filename)]


def combine_files(folder_path):
    folder = Path(folder_path).resolve()
    if not folder.is_dir():
        print(f"Error: '{folder_path}' is not a valid directory.")
        sys.exit(1)

    # Group files by extension, skip previous outputs
    files_by_ext = defaultdict(list)
    for f in folder.iterdir():
        if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS:
            if f.stem.startswith(OUTPUT_PREFIX):
                continue
            files_by_ext[f.suffix.lower()].append(f)

    if not files_by_ext:
        print(f"No supported audio files found in '{folder_path}'.")
        print(f"Supported formats: {', '.join(sorted(SUPPORTED_EXTENSIONS))}")
        sys.exit(1)

    for ext, files in sorted(files_by_ext.items()):
        files.sort(key=lambda f: natural_sort_key(f.name))

        print(f"\n{'=' * 60}")
        print(f"Processing {len(files)} {ext} file(s):")
        print(f"{'=' * 60}")
        for i, f in enumerate(files, 1):
            print(f"  {i}. {f.name}")

        output_path = folder / f"{OUTPUT_PREFIX}{ext}"
        ffmpeg = get_ffmpeg()

        # Create ffmpeg concat list file
        concat_file = tempfile.NamedTemporaryFile(
            mode='w', suffix='.txt', delete=False, encoding='utf-8'
        )
        try:
            for f in files:
                safe_path = str(f).replace("'", "'\\''")
                concat_file.write(f"file '{safe_path}'\n")
            concat_file.close()

            cmd = [
                ffmpeg, '-y',
                '-f', 'concat', '-safe', '0',
                '-i', concat_file.name,
                '-c', 'copy',
                str(output_path),
            ]

            print(f"\nCombining into: {output_path.name}")
            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode != 0:
                print(f"Error combining {ext} files:")
                print(result.stderr)
                sys.exit(1)
            else:
                size_mb = output_path.stat().st_size / (1024 * 1024)
                print(f"Successfully created: {output_path.name} ({size_mb:.1f} MB)")
        finally:
            os.unlink(concat_file.name)

    print(f"\nDone.")


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    combine_files(sys.argv[1])
