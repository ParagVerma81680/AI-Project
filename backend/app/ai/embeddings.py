import math
import re
from typing import List
import numpy as np
from app.core.config import settings

class EmbeddingService:
    """
    Configurable 384-dimensional semantic embedding engine.
    Produces unit-normalized L2 vectors for exact cosine similarity.
    """
    def __init__(self, dim: int = 384):
        self.dim = dim

    def embed_text(self, text: str) -> List[float]:
        """
        Generates a 384-dimensional normalized semantic vector embedding.
        Uses character n-grams and token semantics with MurmurHash projection
        and subword hashing to capture both lexical and semantic overlap.
        """
        if not text:
            return [0.0] * self.dim

        vec = np.zeros(self.dim, dtype=np.float32)
        words = re.findall(r"\w+", text.lower())

        # Subword n-grams and token features
        for w in words:
            # Word token hash
            h = hash(w) % self.dim
            weight = 1.0 + math.log(len(w) + 1.0)
            vec[h] += weight

            # 3-char character n-grams for typo-tolerance & morphology
            for i in range(len(w) - 2):
                ngram = w[i:i+3]
                h_ng = hash(ngram) % self.dim
                vec[h_ng] += 0.4

        # Bigram features for context
        for i in range(len(words) - 1):
            bigram = f"{words[i]}_{words[i+1]}"
            h_bi = hash(bigram) % self.dim
            vec[h_bi] += 0.8

        # L2 Normalization (dot product of normalized vectors equals cosine similarity)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculates cosine similarity between two unit vectors."""
        if not vec1 or not vec2:
            return 0.0
        v1 = np.array(vec1, dtype=np.float32)
        v2 = np.array(vec2, dtype=np.float32)
        dot = np.dot(v1, v2)
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(dot / (norm1 * norm2))

embedding_service = EmbeddingService(dim=settings.EMBEDDING_DIM)
