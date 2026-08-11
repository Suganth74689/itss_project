import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

from schemas import FaqItem, FaqQueryRequest, FaqQueryResponse, CitationEvidence

BASE_DIR = Path(__file__).resolve().parent.parent
FAQS_PATH = BASE_DIR / "data" / "faqs.json"

# Out-of-scope keywords for explicit refusal guardrails
NON_BANKING_TRIGGERS = [
    "prime minister", "president", "cricket", "match", "python", "code", 
    "weather", "movie", "recipe", "capital of", "who is", "programming",
    "software", "football", "joke", "song"
]

class FaqService:
    _faqs_cache: Optional[List[FaqItem]] = None

    @classmethod
    def load_faqs(cls) -> List[FaqItem]:
        if cls._faqs_cache is None:
            if not FAQS_PATH.exists():
                raise FileNotFoundError(f"FAQs knowledge base file not found at {FAQS_PATH}")
            with open(FAQS_PATH, "r", encoding="utf-8") as f:
                raw_list = json.load(f)
                cls._faqs_cache = [FaqItem(**item) for item in raw_list]
        return cls._faqs_cache

    @staticmethod
    def _tokenize(text: str) -> set:
        words = re.findall(r'\w+', text.lower())
        stopwords = {"what", "is", "the", "are", "how", "do", "i", "can", "my", "to", "a", "for", "on", "in", "of", "and", "or", "with"}
        return {w for w in words if w not in stopwords and len(w) > 1}

    @classmethod
    def calculate_similarity(cls, query_tokens: set, faq: FaqItem) -> float:
        faq_text = f"{faq.question} {' '.join(faq.keywords)} {faq.category} {faq.answer}"
        faq_tokens = cls._tokenize(faq_text)
        
        if not query_tokens or not faq_tokens:
            return 0.0

        intersection = query_tokens.intersection(faq_tokens)
        
        # Give higher weight to keyword matches
        keyword_tokens = {w for kw in faq.keywords for w in cls._tokenize(kw)}
        keyword_hits = query_tokens.intersection(keyword_tokens)

        jaccard = len(intersection) / len(query_tokens.union(faq_tokens))
        keyword_score = len(keyword_hits) / max(len(query_tokens), 1)

        final_score = (jaccard * 0.4) + (keyword_score * 0.6)
        return min(final_score * 2.5, 1.0)  # Normalize scale up to 1.0

    @classmethod
    def answer_faq(cls, request: FaqQueryRequest) -> FaqQueryResponse:
        user_q = request.question.strip()
        q_lower = user_q.lower()

        # 1. Guardrail Check: Refuse explicit non-banking queries
        is_explicit_non_banking = any(trigger in q_lower for trigger in NON_BANKING_TRIGGERS)
        
        faqs = cls.load_faqs()
        query_tokens = cls._tokenize(user_q)

        # 2. Similarity scoring across all FAQs
        scored_faqs: List[Tuple[float, FaqItem]] = []
        for faq in faqs:
            score = cls.calculate_similarity(query_tokens, faq)
            scored_faqs.append((score, faq))

        scored_faqs.sort(key=lambda x: x[0], reverse=True)
        top_score, top_faq = scored_faqs[0] if scored_faqs else (0.0, None)

        # 3. Refusal Guardrail Threshold
        if is_explicit_non_banking or top_score < 0.18:
            return FaqQueryResponse(
                status="REFUSED",
                user_question=user_q,
                matched_faq=None,
                confidence_score="REFUSED",
                similarity_score=round(top_score, 2),
                explanation="Out-of-Scope Query Refusal: This AI Assistant is restricted strictly to official bank FAQs.",
                refusal_reason="I am designed to answer questions strictly from the bank FAQ knowledge base (accounts, loans, KYC, interest rates, security). I cannot answer general trivia, programming, or non-banking questions.",
                suggested_related_faqs=faqs[:2],  # Provide top 2 standard FAQs as reference
                citations=[]
            )

        # 4. Success Match
        confidence = "HIGH" if top_score >= 0.45 else "MEDIUM"

        # Find related FAQs
        related_ids = top_faq.related_faqs if top_faq else []
        related_items = [f for f in faqs if f.id in related_ids]

        citation = CitationEvidence(
            table="faqs.json",
            record_id=top_faq.id,
            field_name="answer",
            value=top_faq.answer,
            description=f"Official Bank FAQ Knowledge Base Record #{top_faq.id} ({top_faq.category})"
        )

        return FaqQueryResponse(
            status="MATCHED",
            user_question=user_q,
            matched_faq=top_faq,
            confidence_score=confidence,
            similarity_score=round(top_score, 2),
            explanation=f"Answer matched with {confidence} confidence (Similarity: {round(top_score * 100)}%) from official Bank FAQ #{top_faq.id}.",
            refusal_reason=None,
            suggested_related_faqs=related_items,
            citations=[citation]
        )

    @classmethod
    def list_faqs(cls) -> List[FaqItem]:
        return cls.load_faqs()
