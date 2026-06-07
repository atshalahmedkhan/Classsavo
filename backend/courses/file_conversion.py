import logging
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

logger = logging.getLogger(__name__)


def find_libreoffice_executable() -> str | None:
    candidates = [
        os.environ.get('LIBREOFFICE_PATH'),
        'soffice',
        'libreoffice',
        r'C:\Program Files\LibreOffice\program\soffice.exe',
        r'C:\Program Files (x86)\LibreOffice\program\soffice.exe',
    ]
    for candidate in candidates:
        if not candidate:
            continue
        if os.path.isabs(candidate) and os.path.isfile(candidate):
            return candidate
        found = shutil.which(candidate)
        if found:
            return found
    return None


def convert_docx_to_pdf(docx_path: str) -> bytes | None:
    """Convert a DOCX file to PDF bytes using LibreOffice headless mode."""
    soffice = find_libreoffice_executable()
    if not soffice:
        logger.warning('LibreOffice not found; DOCX will be stored without PDF preview.')
        return None

    docx_path = os.path.abspath(docx_path)
    if not os.path.isfile(docx_path):
        logger.error('DOCX file not found for conversion: %s', docx_path)
        return None

    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            result = subprocess.run(
                [soffice, '--headless', '--convert-to', 'pdf', '--outdir', tmpdir, docx_path],
                capture_output=True,
                timeout=120,
                check=False,
            )
        except (OSError, subprocess.TimeoutExpired) as exc:
            logger.error('DOCX conversion failed: %s', exc)
            return None

        if result.returncode != 0:
            stderr = result.stderr.decode(errors='ignore').strip()
            logger.error('LibreOffice conversion failed: %s', stderr or result.returncode)
            return None

        pdf_path = os.path.join(tmpdir, f'{Path(docx_path).stem}.pdf')
        if not os.path.isfile(pdf_path):
            logger.error('Expected PDF output was not created: %s', pdf_path)
            return None

        with open(pdf_path, 'rb') as pdf_file:
            return pdf_file.read()
