"""Automated Cricsheet IPL ball-by-ball dataset downloader.

Fetches the comprehensive IPL ball-by-ball dataset containing all matches
from 2008 through the current season.
"""

import os
import zipfile
import io
import logging
import urllib.request
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

CRICSHEET_IPL_CSV_URL = "https://cricsheet.org/downloads/ipl_csv2.zip"
DEFAULT_RAW_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw")
DEFAULT_PROCESSED_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "processed")


def ensure_directories():
    """Ensure data directories exist."""
    os.makedirs(DEFAULT_RAW_DIR, exist_ok=True)
    os.makedirs(DEFAULT_PROCESSED_DIR, exist_ok=True)


def download_ipl_dataset(dest_dir: str = DEFAULT_RAW_DIR, force: bool = False) -> str:
    """Download and extract all_matches.csv from Cricsheet.

    Returns the path to all_matches.csv.
    """
    ensure_directories()
    csv_path = os.path.join(dest_dir, "all_matches.csv")

    if os.path.exists(csv_path) and not force:
        logger.info(f"Dataset already exists at {csv_path} (size: {os.path.getsize(csv_path)} bytes)")
        return csv_path

    logger.info(f"Downloading IPL ball-by-ball dataset from {CRICSHEET_IPL_CSV_URL}...")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) IPLNexus/1.0"}
    req = urllib.request.Request(CRICSHEET_IPL_CSV_URL, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            zip_bytes = response.read()
            logger.info(f"Downloaded {len(zip_bytes) / 1024 / 1024:.2f} MB zip archive.")
            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
                z.extract("all_matches.csv", path=dest_dir)
                if "README.txt" in z.namelist():
                    z.extract("README.txt", path=dest_dir)
            logger.info(f"Extracted all_matches.csv to {dest_dir}")
            return csv_path
    except Exception as e:
        logger.error(f"Failed to download dataset from Cricsheet: {e}")
        raise


if __name__ == "__main__":
    download_ipl_dataset()
