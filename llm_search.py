"""
M&A Banking Smart Search System
Enterprise-grade search with LLM enhancement for investment banking pitch decks
"""

import json
import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
from opensearchpy import OpenSearch
import anthropic
from mistralai.client import MistralClient
import hashlib


# ============================================================================
# DATA MODELS
# ============================================================================

@dataclass
class SlideMetadata:
    """Structured metadata for each slide"""
    slide_id: str
    document_name: str
    slide_number: int
    version: int
    created_date: str
    is_latest: bool
    
    # Content classification
    slide_type: str  # credentials, company_profile, valuation, market_analysis, etc.
    confidence_score: float
    
    # Entity extraction
    primary_company: Optional[str]
    mentioned_companies: List[str]
    sectors: List[str]
    geographies: List[str]
    deal_types: List[str]  # M&A, IPO, debt_financing, etc.
    
    # Semantic enrichment
    key_insights: List[str]
    relevant_queries: List[str]  # Queries this slide would answer
    business_context: str
    
    # Deal-specific
    deal_stage: Optional[str]  # origination, execution, post_merger
    client_names: List[str]
    transaction_year: Optional[int]
    deal_value_usd: Optional[float]
    
    # Technical
    content_hash: str
    raw_text: str
    image_descriptions: List[str]


@dataclass
class QueryAnalysis:
    """Parsed and enriched query"""
    original_query: str
    expanded_query: str
    entities: Dict[str, List[str]]  # {companies: [...], sectors: [...]}
    query_type: str  # credentials, profile, valuation, comps, market
    intent: str  # search, analysis, comparison
    filters: Dict[str, Any]
    must_have_entities: List[str]  # Entities that MUST be in results


@dataclass
class SearchResult:
    """Enhanced search result with explainability"""
    slide_id: str
    document_name: str
    slide_number: int
    score: float
    relevance_explanation: str
    metadata: SlideMetadata
    matched_entities: List[str]
    snippet: str


# ============================================================================
# CONFIGURATION
# ============================================================================

class SearchConfig:
    """Centralized configuration"""
    
    # OpenSearch
    OPENSEARCH_HOST = "localhost"
    OPENSEARCH_PORT = 9200
    INDEX_NAME = "ma_slides"
    
    # LLM APIs
    ANTHROPIC_API_KEY = "your-key"
    MISTRAL_API_KEY = "your-key"
    
    # Search parameters
    RECALL_SIZE = 100
    RERANK_SIZE = 20
    FINAL_RESULTS = 10
    
    # Caching
    CACHE_ENABLED = True
    CACHE_TTL_HOURS = 24
    
    # Model selection
    METADATA_MODEL = "mistral-small-latest"  # For slide analysis
    QUERY_MODEL = "claude-3-5-haiku-20241022"  # For query rewriting
    RERANK_MODEL = "claude-3-5-haiku-20241022"  # For re-ranking


# ============================================================================
# PROMPT TEMPLATES
# ============================================================================

class PromptTemplates:
    """High-quality prompts for all LLM operations"""
    
    @staticmethod
    def slide_metadata_extraction(slide_content: str, image_descriptions: List[str], 
                                   document_name: str, slide_number: int) -> str:
        """Extract comprehensive metadata from a slide"""
        images_text = "\n".join([f"- {desc}" for desc in image_descriptions]) if image_descriptions else "No images"
        
        return f"""You are an expert M&A investment banking analyst. Analyze this pitch deck slide and extract structured metadata.

DOCUMENT: {document_name}
SLIDE NUMBER: {slide_number}

SLIDE CONTENT:
{slide_content}

IMAGE DESCRIPTIONS:
{images_text}

Extract the following information and return ONLY valid JSON:

{{
  "slide_type": "<one of: credentials, company_profile, valuation_analysis, market_overview, transaction_comps, financial_metrics, deal_rationale, management_team, risk_factors, appendix, cover_page, disclaimer, other>",
  "confidence_score": <0.0-1.0>,
  
  "primary_company": "<main company discussed, or null>",
  "mentioned_companies": ["<list all companies mentioned>"],
  "sectors": ["<industry sectors, e.g., Technology, Healthcare, Aerospace>"],
  "geographies": ["<regions/countries, e.g., North America, France, EMEA>"],
  "deal_types": ["<M&A, IPO, LBO, debt_financing, restructuring, etc.>"],
  
  "key_insights": [
    "<3-5 bullet points of key information on this slide>",
    "<focus on metrics, companies, deals, insights>"
  ],
  
  "relevant_queries": [
    "<3-5 natural language queries this slide would answer>",
    "<e.g., 'What are Airbus's recent acquisitions?'>",
    "<e.g., 'Show credentials in aerospace sector'>"
  ],
  
  "business_context": "<1-2 sentences describing what this slide is about and why it matters>",
  
  "deal_stage": "<origination, execution, post_merger, or null>",
  "client_names": ["<if this mentions specific client names>"],
  "transaction_year": <year if specific deal mentioned, or null>,
  "deal_value_usd": <numeric value in USD millions if mentioned, or null>
}}

IMPORTANT GUIDELINES:
1. For "credentials" slides: Look for tombstones, deal lists, league tables, transaction history
2. For "company_profile": Look for business descriptions, financials, market position
3. Extract ALL company names mentioned, even in passing
4. Sectors should be specific (not just "industrials" but "Aerospace & Defense")
5. Be generous with relevant_queries - think like a banker searching for this content
6. If information is not present, use null or empty array
7. Confidence score reflects how clearly you can classify the slide type

Return only the JSON, no additional text."""

    @staticmethod
    def query_rewriting(user_query: str, user_context: Optional[Dict] = None) -> str:
        """Rewrite and expand user query with banking domain knowledge"""
        context_str = ""
        if user_context:
            context_str = f"\n\nUSER CONTEXT:\n- Recent sectors: {user_context.get('recent_sectors', [])}\n- Recent clients: {user_context.get('recent_clients', [])}"
        
        return f"""You are an M&A banking search expert. A banker has entered a search query. Your job is to:
1. Identify what they're really looking for
2. Expand the query with synonyms and related terms used in pitch decks
3. Extract key entities (companies, sectors, regions)
4. Suggest filters to improve results

USER QUERY: "{user_query}"{context_str}

Return ONLY valid JSON:

{{
  "query_type": "<credentials|company_profile|valuation|comps|market_analysis|deal_rationale|financial_metrics|other>",
  "intent": "<search|analysis|comparison|verification>",
  
  "expanded_query": "<rewritten query with synonyms and related terms>",
  
  "entities": {{
    "companies": ["<extracted company names>"],
    "sectors": ["<industry sectors>"],
    "geographies": ["<regions mentioned or implied>"],
    "deal_types": ["<M&A, IPO, etc. if relevant>"]
  }},
  
  "must_have_entities": [
    "<entities that MUST appear in results - usually company names>"
  ],
  
  "filters": {{
    "slide_types": ["<preferred slide types for this query>"],
    "min_date": "<YYYY-MM-DD or null>",
    "deal_stages": ["<relevant deal stages or empty>"]
  }},
  
  "synonym_expansions": {{
    "<original_term>": ["<synonym1>", "<synonym2>"]
  }},
  
  "explanation": "<brief explanation of what the user is looking for>"
}}

BANKING TERMINOLOGY GUIDE:
- "credentials" = track record, deal experience, tombstones, mandates, league tables, transaction history
- "company profile" = overview, business description, corporate snapshot, company overview
- "valuation" = DCF, comparable companies, comps, precedent transactions, trading multiples, LBO analysis
- "market analysis" = industry overview, market dynamics, competitive landscape, sector trends
- "comps" = comparable companies, peer analysis, trading comps, precedent transactions
- "deal rationale" = strategic rationale, investment thesis, synergies, value creation

ENTITY EXTRACTION RULES:
1. Company names: Extract exact names (e.g., "Airbus SE", "Boeing")
2. If query mentions a company, it goes in must_have_entities
3. Infer sector if company is well-known (e.g., Airbus → Aerospace & Defense)
4. Geographic hints: "European", "US", "Asia-Pacific" → add to geographies

EXAMPLES:
Query: "airbus company profile"
→ must_have_entities: ["Airbus"]
→ expanded_query: "Airbus SE company profile business overview corporate description"
→ slide_types: ["company_profile", "market_overview"]

Query: "show me credentials"
→ expanded_query: "credentials track record deal experience tombstones transaction history mandates"
→ slide_types: ["credentials"]
→ must_have_entities: [] (no specific company)

Query: "tech M&A deals in 2024"
→ entities: {{sectors: ["Technology"], deal_types: ["M&A"]}}
→ filters: {{min_date: "2024-01-01"}}

Return only the JSON, no additional text."""

    @staticmethod
    def result_reranking(query: str, query_analysis: QueryAnalysis, 
                        results: List[Dict], top_k: int = 20) -> str:
        """Re-rank results based on deep relevance understanding"""
        
        # Simplify results for the prompt
        simplified_results = []
        for i, r in enumerate(results[:top_k]):
            simplified_results.append({
                "rank": i + 1,
                "slide_id": r.get("slide_id"),
                "document": r.get("document_name"),
                "slide_num": r.get("slide_number"),
                "slide_type": r.get("slide_type"),
                "primary_company": r.get("primary_company"),
                "companies": r.get("mentioned_companies", []),
                "sectors": r.get("sectors", []),
                "key_insights": r.get("key_insights", [])[:2],  # Only first 2
                "created_date": r.get("created_date"),
                "is_latest": r.get("is_latest"),
                "snippet": r.get("raw_text", "")[:200]  # First 200 chars
            })
        
        return f"""You are an expert M&A banker. Re-rank these search results by relevance to the user's query.

USER QUERY: "{query}"

QUERY ANALYSIS:
- Type: {query_analysis.query_type}
- Intent: {query_analysis.intent}
- Must-have entities: {query_analysis.must_have_entities}
- All entities: {json.dumps(query_analysis.entities)}

RESULTS TO RANK:
{json.dumps(simplified_results, indent=2)}

RANKING CRITERIA (in order of importance):
1. **Entity Match**: Does it contain must-have entities (especially company names)?
2. **Slide Type Relevance**: Does the slide type match the query intent?
3. **Content Relevance**: Do key insights directly answer the query?
4. **Recency**: Newer slides preferred (check created_date and is_latest)
5. **Completeness**: Does it provide comprehensive information?

SCORING RULES:
- Missing must-have entity: Score ≤ 0.3 (major penalty)
- Perfect entity + type match: Score ≥ 0.9
- Wrong slide type: Score ≤ 0.5
- Older version when latest exists: Score ≤ 0.6

Return ONLY valid JSON:

{{
  "ranked_results": [
    {{
      "slide_id": "<slide_id>",
      "relevance_score": <0.0-1.0>,
      "explanation": "<1 sentence explaining why this rank>",
      "matched_entities": ["<entities from query found in this slide>"],
      "ranking_factors": {{
        "entity_match": <0.0-1.0>,
        "type_match": <0.0-1.0>,
        "content_relevance": <0.0-1.0>,
        "recency": <0.0-1.0>
      }}
    }}
  ],
  "overall_quality": "<excellent|good|fair|poor> - how well do these results answer the query?"
}}

Return results in descending order by relevance_score. Return only the JSON, no additional text."""


# ============================================================================
# LLM CLIENTS
# ============================================================================

class LLMClient:
    """Unified LLM client with caching"""
    
    def __init__(self, config: SearchConfig):
        self.config = config
        self.anthropic = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
        self.mistral = MistralClient(api_key=config.MISTRAL_API_KEY)
        self.cache = {}  # Simple in-memory cache
    
    def _get_cache_key(self, prompt: str, model: str) -> str:
        """Generate cache key"""
        return hashlib.md5(f"{model}:{prompt}".encode()).hexdigest()
    
    def call_claude(self, prompt: str, model: str = None, 
                   temperature: float = 0) -> str:
        """Call Claude with caching"""
        model = model or self.config.QUERY_MODEL
        cache_key = self._get_cache_key(prompt, model)
        
        if self.config.CACHE_ENABLED and cache_key in self.cache:
            return self.cache[cache_key]
        
        response = self.anthropic.messages.create(
            model=model,
            max_tokens=4096,
            temperature=temperature,
            messages=[{"role": "user", "content": prompt}]
        )
        
        result = response.content[0].text
        
        if self.config.CACHE_ENABLED:
            self.cache[cache_key] = result
        
        return result
    
    def call_mistral(self, prompt: str, model: str = None,
                    temperature: float = 0) -> str:
        """Call Mistral with caching"""
        model = model or self.config.METADATA_MODEL
        cache_key = self._get_cache_key(prompt, model)
        
        if self.config.CACHE_ENABLED and cache_key in self.cache:
            return self.cache[cache_key]
        
        response = self.mistral.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature
        )
        
        result = response.choices[0].message.content
        
        if self.config.CACHE_ENABLED:
            self.cache[cache_key] = result
        
        return result
    
    def parse_json_response(self, response: str) -> Dict:
        """Safely parse JSON from LLM response"""
        try:
            # Try to extract JSON from markdown code blocks
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', 
                                  response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            
            # Try direct parsing
            return json.loads(response)
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON: {e}")
            print(f"Response: {response[:500]}")
            raise


# ============================================================================
# ENTITY EXTRACTION
# ============================================================================

class EntityExtractor:
    """Extract and validate entities from text"""
    
    # Common M&A sectors
    KNOWN_SECTORS = {
        "technology", "healthcare", "financial services", "industrials",
        "consumer goods", "energy", "telecommunications", "real estate",
        "aerospace & defense", "automotive", "retail", "media"
    }
    
    # Common deal types
    DEAL_TYPES = {
        "m&a", "merger", "acquisition", "ipo", "lbo", "debt financing",
        "restructuring", "divestiture", "joint venture", "carve-out"
    }
    
    @staticmethod
    def extract_companies(text: str) -> List[str]:
        """Extract company names - basic implementation, enhance with NER"""
        # This is a simplified version - in production, use spaCy or similar
        companies = []
        
        # Pattern: Capitalized words followed by Corp, Inc, Ltd, SE, etc.
        patterns = [
            r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Corp|Inc|Ltd|SE|SA|GmbH|PLC)\b',
            r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b'  # Multi-word caps
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            companies.extend(matches)
        
        return list(set(companies))
    
    @staticmethod
    def extract_sectors(text: str) -> List[str]:
        """Extract industry sectors"""
        text_lower = text.lower()
        found_sectors = []
        
        for sector in EntityExtractor.KNOWN_SECTORS:
            if sector in text_lower:
                found_sectors.append(sector.title())
        
        return found_sectors
    
    @staticmethod
    def extract_geographies(text: str) -> List[str]:
        """Extract geographic regions"""
        geo_patterns = {
            "North America": r'\b(?:North America|USA|United States|Canada)\b',
            "Europe": r'\b(?:Europe|EU|European Union|EMEA)\b',
            "Asia": r'\b(?:Asia|APAC|Asia-Pacific|China|Japan|India)\b',
            "Latin America": r'\b(?:Latin America|LATAM|South America)\b',
            "Middle East": r'\b(?:Middle East|GCC)\b'
        }
        
        found_geos = []
        for geo_name, pattern in geo_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                found_geos.append(geo_name)
        
        return found_geos


# ============================================================================
# INDEXING PIPELINE
# ============================================================================

class SlideIndexer:
    """Index slides with rich metadata"""
    
    def __init__(self, config: SearchConfig, llm_client: LLMClient):
        self.config = config
        self.llm = llm_client
        self.os_client = OpenSearch(
            hosts=[{'host': config.OPENSEARCH_HOST, 'port': config.OPENSEARCH_PORT}],
            http_compress=True,
            use_ssl=False
        )
    
    def create_index(self):
        """Create OpenSearch index with proper mappings"""
        index_body = {
            "settings": {
                "number_of_shards": 2,
                "number_of_replicas": 1,
                "analysis": {
                    "analyzer": {
                        "banking_analyzer": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase", "stop", "snowball"]
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    # Core fields
                    "slide_id": {"type": "keyword"},
                    "document_name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "slide_number": {"type": "integer"},
                    "version": {"type": "integer"},
                    "created_date": {"type": "date"},
                    "is_latest": {"type": "boolean"},
                    
                    # Content
                    "raw_text": {"type": "text", "analyzer": "banking_analyzer"},
                    "image_descriptions": {"type": "text"},
                    "embedding": {"type": "knn_vector", "dimension": 1024},
                    
                    # Metadata
                    "slide_type": {"type": "keyword"},
                    "confidence_score": {"type": "float"},
                    "primary_company": {"type": "keyword"},
                    "mentioned_companies": {"type": "keyword"},
                    "sectors": {"type": "keyword"},
                    "geographies": {"type": "keyword"},
                    "deal_types": {"type": "keyword"},
                    "client_names": {"type": "keyword"},
                    
                    # Semantic fields
                    "key_insights": {"type": "text"},
                    "relevant_queries": {"type": "text"},
                    "business_context": {"type": "text"},
                    
                    # Deal info
                    "deal_stage": {"type": "keyword"},
                    "transaction_year": {"type": "integer"},
                    "deal_value_usd": {"type": "float"},
                    
                    # Technical
                    "content_hash": {"type": "keyword"}
                }
            }
        }
        
        if not self.os_client.indices.exists(index=self.config.INDEX_NAME):
            self.os_client.indices.create(index=self.config.INDEX_NAME, body=index_body)
            print(f"Created index: {self.config.INDEX_NAME}")
    
    def index_slide(self, slide_content: str, image_descriptions: List[str],
                   document_name: str, slide_number: int, embedding: List[float],
                   version: int = 1, created_date: str = None) -> SlideMetadata:
        """Index a single slide with full metadata extraction"""
        
        # Generate metadata using LLM
        prompt = PromptTemplates.slide_metadata_extraction(
            slide_content, image_descriptions, document_name, slide_number
        )
        
        response = self.llm.call_mistral(prompt, model=self.config.METADATA_MODEL)
        metadata_dict = self.llm.parse_json_response(response)
        
        # Generate content hash for deduplication
        content_hash = hashlib.md5(slide_content.encode()).hexdigest()
        
        # Create slide metadata
        slide_id = f"{document_name}_slide_{slide_number}_v{version}"
        created_date = created_date or datetime.now().isoformat()
        
        metadata = SlideMetadata(
            slide_id=slide_id,
            document_name=document_name,
            slide_number=slide_number,
            version=version,
            created_date=created_date,
            is_latest=True,  # Update logic needed for versioning
            slide_type=metadata_dict["slide_type"],
            confidence_score=metadata_dict["confidence_score"],
            primary_company=metadata_dict.get("primary_company"),
            mentioned_companies=metadata_dict["mentioned_companies"],
            sectors=metadata_dict["sectors"],
            geographies=metadata_dict["geographies"],
            deal_types=metadata_dict["deal_types"],
            key_insights=metadata_dict["key_insights"],
            relevant_queries=metadata_dict["relevant_queries"],
            business_context=metadata_dict["business_context"],
            deal_stage=metadata_dict.get("deal_stage"),
            client_names=metadata_dict["client_names"],
            transaction_year=metadata_dict.get("transaction_year"),
            deal_value_usd=metadata_dict.get("deal_value_usd"),
            content_hash=content_hash,
            raw_text=slide_content,
            image_descriptions=image_descriptions
        )
        
        # Index to OpenSearch
        doc = asdict(metadata)
        doc["embedding"] = embedding
        
        self.os_client.index(
            index=self.config.INDEX_NAME,
            id=slide_id,
            body=doc
        )
        
        print(f"Indexed: {slide_id} - Type: {metadata.slide_type}")
        return metadata


# ============================================================================
# SEARCH ENGINE
# ============================================================================

class SmartBankingSearch:
    """Main search orchestrator"""
    
    def __init__(self, config: SearchConfig, llm_client: LLMClient):
        self.config = config
        self.llm = llm_client
        self.os_client = OpenSearch(
            hosts=[{'host': config.OPENSEARCH_HOST, 'port': config.OPENSEARCH_PORT}],
            http_compress=True,
            use_ssl=False
        )
        self.entity_extractor = EntityExtractor()
    
    def search(self, query: str, user_context: Optional[Dict] = None) -> List[SearchResult]:
        """Execute full search pipeline"""
        
        print(f"\n{'='*60}")
        print(f"SEARCH QUERY: {query}")
        print(f"{'='*60}\n")
        
        # Step 1: Query Analysis & Rewriting
        query_analysis = self._analyze_query(query, user_context)
        print(f"Query Type: {query_analysis.query_type}")
        print(f"Expanded: {query_analysis.expanded_query}")
        print(f"Must-have entities: {query_analysis.must_have_entities}\n")
        
        # Step 2: Recall - Hybrid Search
        candidates = self._hybrid_search(query_analysis)
        print(f"Recall: Retrieved {len(candidates)} candidates\n")
        
        # Step 3: Entity Filtering
        filtered = self._entity_filter(candidates, query_analysis)
        print(f"After entity filtering: {len(filtered)} results\n")
        
        # Step 4: Deduplication (latest versions)
        deduplicated = self._deduplicate_versions(filtered)
        print(f"After deduplication: {len(deduplicated)} results\n")
        
        # Step 5: LLM Re-ranking
        if len(deduplicated) > 5:
            reranked = self._llm_rerank(query, query_analysis, deduplicated)
            print(f"Re-ranked top {len(reranked)} results\n")
        else:
            reranked = self._simple_rank(deduplicated)
        
        # Step 6: Convert to SearchResult objects
        final_results = self._format_results(reranked[:self.config.FINAL_RESULTS])
        
        print(f"{'='*60}")
        print(f"FINAL: Returning {len(final_results)} results")
        print(f"{'='*60}\n")
        
        return final_results
    
    def _analyze_query(self, query: str, user_context: Optional[Dict]) -> QueryAnalysis:
        """Analyze and expand query using LLM"""
        prompt = PromptTemplates.query_rewriting(query, user_context)
        response = self.llm.call_claude(prompt, model=self.config.QUERY_MODEL)
        analysis_dict = self.llm.parse_json_response(response)
        
        return QueryAnalysis(
            original_query=query,
            expanded_query=analysis_dict["expanded_query"],
            entities=analysis_dict["entities"],
            query_type=analysis_dict["query_type"],
            intent=analysis_dict["intent"],
            filters=analysis_dict["filters"],
            must_have_entities=analysis_dict["must_have_entities"]
        )
    
    def _hybrid_search(self, query_analysis: QueryAnalysis) -> List[Dict]:
        """Execute hybrid search (text + semantic + filters)"""
        
        # Build OpenSearch query
        must_clauses = []
        should_clauses = []
        filter_clauses = []
        
        # Text search on multiple fields
        must_clauses.append({
            "multi_match": {
                "query": query_analysis.expanded_query,
                "fields": [
                    "document_name^3",
                    "raw_text^2",
                    "key_insights^2",
                    "relevant_queries^3",
                    "business_context"
                ],
                "type": "best_fields",
                "operator": "or"
            }
        })
        
        # Boost by slide type if specified
        if query_analysis.filters.get("slide_types"):
            for slide_type in query_analysis.filters["slide_types"]:
                should_clauses.append({
                    "term": {"slide_type": {"value": slide_type, "boost": 3.0}}
                })
        
        # Boost latest versions
        should_clauses.append({
            "term": {"is_latest": {"value": True, "boost": 5.0}}
        })
        
        # Boost recent documents
        should_clauses.append({
            "range": {
                "created_date": {
                    "gte": "now-1y",
                    "boost": 2.0
                }
            }
        })
        
        # Apply entity filters if present
        entities = query_analysis.entities
        if entities.get("companies"):
            should_clauses.append({
                "terms": {"mentioned_companies": entities["companies"], "boost": 5.0}
            })
        
        if entities.get("sectors"):
            should_clauses.append({
                "terms": {"sectors": entities["sectors"], "boost": 3.0}
            })
        
        if entities.get("geographies"):
            should_clauses.append({
                "terms": {"geographies": entities["geographies"], "boost": 2.0}
            })
        
        # Date filter if specified
        if query_analysis.filters.get("min_date"):
            filter_clauses.append({
                "range": {"created_date": {"gte": query_analysis.filters["min_date"]}}
            })
        
        # Build full query
        search_body = {
            "size": self.config.RECALL_SIZE,
            "query": {
                "bool": {
                    "must": must_clauses,
                    "should": should_clauses,
                    "filter": filter_clauses,
                    "minimum_should_match": 0
                }
            },
            "_source": True
        }
        
        # Execute search
        response = self.os_client.search(
            index=self.config.INDEX_NAME,
            body=search_body
        )
        
        # Extract hits
        results = []
        for hit in response['hits']['hits']:
            result = hit['_source']
            result['_score'] = hit['_score']
            results.append(result)
        
        return results
    
    def _entity_filter(self, results: List[Dict], 
                      query_analysis: QueryAnalysis) -> List[Dict]:
        """Filter results to ensure must-have entities are present"""
        if not query_analysis.must_have_entities:
            return results
        
        filtered = []
        for result in results:
            # Check if all must-have entities are present
            mentioned = result.enties