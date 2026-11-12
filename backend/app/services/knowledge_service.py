import io
import re
import csv
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from fastapi import UploadFile

from app.database.models import KnowledgeBase, AIActivityLog
from app.ai.embeddings import embedding_service
from app.core.logging import logger

class KnowledgeService:
    """Handles parsing, cleaning, chunking, and embedding of ingested documents."""

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 80) -> List[str]:
        """Splits long text into overlapping semantic passages."""
        # Normalize whitespace and clean
        cleaned = re.sub(r"\s+", " ", text).strip()
        if len(cleaned) <= chunk_size:
            return [cleaned] if cleaned else []

        chunks = []
        start = 0
        while start < len(cleaned):
            end = start + chunk_size
            chunk = cleaned[start:end]
            if end < len(cleaned):
                # Try finding natural sentence break
                last_period = max(chunk.rfind(". "), chunk.rfind("! "), chunk.rfind("? "), chunk.rfind("\n"))
                if last_period != -1 and last_period > chunk_size // 2:
                    chunk = chunk[:last_period + 1]
                    start += len(chunk)
                else:
                    start += (chunk_size - overlap)
            else:
                start += chunk_size

            chunk_str = chunk.strip()
            if len(chunk_str) > 30:  # Skip tiny fragments
                chunks.append(chunk_str)

        return chunks

    async def ingest_file(self, db: Session, file: UploadFile, category: str = "General", user_id: int = None) -> Tuple[int, str]:
        filename = file.filename or "unknown"
        ext = filename.lower().split(".")[-1]
        raw_bytes = await file.read()
        extracted_text = ""

        # 1. Text extraction based on file format
        if ext == "pdf":
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
                pages_text = [page.extract_text() or "" for page in reader.pages]
                extracted_text = "\n\n".join(pages_text)
            except Exception as e:
                logger.error(f"Failed to parse PDF {filename}: {e}")
                raise ValueError(f"Could not extract text from PDF file: {str(e)}")

        elif ext in ["txt", "md", "markdown"]:
            extracted_text = raw_bytes.decode("utf-8", errors="replace")

        elif ext == "csv":
            try:
                stream = io.StringIO(raw_bytes.decode("utf-8", errors="replace"))
                csv_reader = csv.reader(stream)
                rows = []
                for row in csv_reader:
                    rows.append(" | ".join(row))
                extracted_text = "\n".join(rows)
            except Exception as e:
                raise ValueError(f"Could not parse CSV: {str(e)}")
        else:
            # Fallback to UTF-8 text decoding
            extracted_text = raw_bytes.decode("utf-8", errors="replace")

        if not extracted_text.strip():
            raise ValueError(f"File {filename} contains no readable text.")

        # 2. Chunking
        chunks = self.chunk_text(extracted_text, chunk_size=500, overlap=80)
        chunks_created = 0

        # 3. Embedding & Persistence
        for idx, chunk in enumerate(chunks):
            chunk_title = f"{filename} (Part {idx + 1}/{len(chunks)})"
            emb = embedding_service.embed_text(f"{chunk_title}\n{chunk}")
            kb_doc = KnowledgeBase(
                title=chunk_title,
                content=chunk,
                category=category,
                source=f"upload:{filename}",
                embedding=emb
            )
            db.add(kb_doc)
            chunks_created += 1

        # Activity log
        log = AIActivityLog(
            user_id=user_id,
            activity_type="document_upload",
            status="success",
            details={"filename": filename, "chunks": chunks_created, "category": category}
        )
        db.add(log)
        db.commit()

        logger.info(f"Successfully ingested {filename}: {chunks_created} vector chunks stored in knowledge base.")
        return chunks_created, filename

knowledge_service = KnowledgeService()
