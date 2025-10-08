"""
M&A Banking Elite Search System - Pitch Deck Intelligence
Designed for investment bankers creating pitch decks from historical materials
Optimized for: Company Profiles, Credentials, Market Analysis, Product Portfolios
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
    """Structured metadata optimized for pitch deck reuse"""
    slide_id: str
    document_name: str
    slide_number: int
    version: int
    created_date: str
    is_latest: bool
    
    # Pitch deck section classification
    pitch_section: str  # credentials, company_profile, product_portfolio, market_analysis, team, financials
    section_confidence: float
    slide_purpose: str  # What this slide is meant to convince/show
    
    # Entity extraction - comprehensive for banking
    target_company: Optional[str]  # Main company this slide is about
    client_company: Optional[str]  # Who the pitch was for
    all_companies_mentioned: List[str]
    competitor_companies: List[str]
    sectors: List[str]
    sub_sectors: List[str]  # More granular (e.g., "Cloud Infrastructure" within "Technology")
    geographies: List[str]
    deal_types: List[str]
    
    # Credentials-specific
    transaction_tombstones: List[Dict]  # [{deal_name, year, value, role}]
    league_table_positions: List[Dict]  # [{metric, rank, year}]
    
    # Company profile-specific
    revenue_mentioned: Optional[float]
    ebitda_mentioned: Optional[float]
    market_cap_mentioned: Optional[float]
    key_metrics: Dict[str, Any]
    business_model: Optional[str]
    
    # Market analysis-specific
    market_size_usd: Optional[float]
    growth_rate_percentage: Optional[float]
    market_drivers: List[str]
    market_trends: List[str]
    
    # Product portfolio-specific
    products_services: List[str]
    competitive_advantages: List[str]
    
    # Rich semantic understanding
    executive_summary: str  # 2-3 sentence summary of what's on this slide
    key_data_points: List[str]  # Specific numbers, facts, metrics
    reusability_tags: List[str]  # Tags for when this slide would be reused
    banker_use_cases: List[str]  # "Use this when pitching X" or "Good for Y situation"
    visual_elements: List[str]  # Charts, tables, diagrams present
    
    # Quality indicators
    data_quality_score: float  # How current and reliable is this data
    visual_quality_score: float  # How well-designed is this slide
    reuse_frequency: int  # How often has this been referenced (to track later)
    
    # Technical
    content_hash: str
    raw_text: str
    image_descriptions: List[str]


@dataclass
class BankerQueryContext:
    """Rich context about what the banker is trying to do"""
    current_pitch_stage: str  # origination, pitch_preparation, due_diligence
    target_client: Optional[str]
    target_sector: Optional[str]
    pitch_narrative: Optional[str]  # What story they're trying to tell
    recent_searches: List[str]  # Pattern detection
    preferred_slide_styles: List[str]  # Based on past usage


@dataclass
class QueryAnalysis:
    """Deep understanding of banker's search intent"""
    original_query: str
    expanded_query: str
    semantic_intent: str  # Detailed explanation of what they really need
    
    # Entity extraction
    entities: Dict[str, List[str]]
    must_have_entities: List[str]
    nice_to_have_entities: List[str]
    
    # Pitch deck context
    pitch_section_needed: str
    use_case: str  # Why the banker needs this slide
    narrative_fit: str  # What story this will support
    
    # Search strategy
    query_type: str
    search_strategy: str  # How to search differently based on intent
    filters: Dict[str, Any]
    boost_criteria: Dict[str, float]  # What to prioritize
    
    # Expected output
    ideal_result_description: str  # What perfect results look like


@dataclass
class SearchResult:
    """Enhanced result with reusability guidance"""
    slide_id: str
    document_name: str
    slide_number: int
    relevance_score: float
    
    # Why this is relevant
    relevance_explanation: str
    how_to_use: str  # Guidance on using this in their pitch
    adaptation_needed: str  # What they might need to customize
    
    # What's on the slide
    metadata: SlideMetadata
    matched_entities: List[str]
    key_snippet: str
    visual_preview_description: str
    
    # Reusability
    similar_slides: List[str]  # Other slide_ids that are similar
    last_used_in: Optional[str]  # Which recent pitch used this
    success_rate: float  # If we track which slides convert to wins


# ============================================================================
# CONFIGURATION
# ============================================================================

class SearchConfig:
    """Optimized configuration for pitch deck search"""
    
    # OpenSearch
    OPENSEARCH_HOST = "localhost"
    OPENSEARCH_PORT = 9200
    INDEX_NAME = "pitch_deck_intelligence"
    
    # LLM APIs
    ANTHROPIC_API_KEY = "your-key"
    MISTRAL_API_KEY = "your-key"
    
    # Search parameters - tuned for precision over recall
    RECALL_SIZE = 50  # Smaller, more focused recall
    RERANK_SIZE = 15  # Deep re-ranking on fewer candidates
    FINAL_RESULTS = 8  # Bankers want focused, not overwhelming results
    
    # Caching
    CACHE_ENABLED = True
    CACHE_TTL_HOURS = 24
    
    # Model selection
    METADATA_MODEL = "mistral-small-latest"
    QUERY_MODEL = "claude-3-5-sonnet-20241022"  # Upgraded for better understanding
    RERANK_MODEL = "claude-3-5-sonnet-20241022"  # Best model for ranking


# ============================================================================
# ELITE PROMPT TEMPLATES
# ============================================================================

class ElitePromptTemplates:
    """World-class prompts designed for M&A banking workflows"""
    
    @staticmethod
    def slide_metadata_extraction(slide_content: str, image_descriptions: List[str], 
                                   document_name: str, slide_number: int) -> str:
        """Extract metadata with deep understanding of pitch deck construction"""
        
        images_text = "\n".join([f"- {desc}" for desc in image_descriptions]) if image_descriptions else "No images described"
        
        return f"""You are a senior M&A investment banker with 15+ years of experience creating winning pitch decks. You understand exactly what makes slides reusable and valuable.

Your task: Analyze this slide and extract comprehensive metadata that will help bankers find and reuse this slide when building future pitches.

SOURCE DOCUMENT: {document_name}
SLIDE NUMBER: {slide_number}

═══════════════════════════════════════════════════════════
SLIDE CONTENT:
{slide_content}

IMAGE DESCRIPTIONS:
{images_text}
═══════════════════════════════════════════════════════════

Think like a banker who will search for this slide 6 months from now. They're building a pitch and need content. What would make them say "YES! This is exactly what I need!"?

Return ONLY valid JSON with this structure:

{{
  "pitch_section": "<Choose ONE from: credentials, company_profile, product_portfolio, market_analysis, financial_overview, team_management, deal_rationale, transaction_structure, valuation_analysis, risk_factors, implementation_timeline, appendix_support>",
  
  "section_confidence": <0.0-1.0 how certain are you>,
  
  "slide_purpose": "<In ONE clear sentence: What is this slide designed to prove or convince the client of? Think: 'This slide shows the client that...' or 'This slide proves our expertise in...'>",
  
  "target_company": "<The PRIMARY company this slide is about. If it's a company profile, it's that company. If it's credentials, it might be null unless focused on one sector/company>",
  
  "client_company": "<If you can infer who this pitch was created FOR (the client), name them. Otherwise null>",
  
  "all_companies_mentioned": ["<Every company name on this slide - be exhaustive>"],
  
  "competitor_companies": ["<If this is comparative analysis, which companies are positioned as competitors?>"],
  
  "sectors": ["<Broad industry sectors, e.g., 'Technology', 'Healthcare', 'Industrials'>"],
  
  "sub_sectors": ["<Specific niches, e.g., 'SaaS', 'Medical Devices', 'Aerospace & Defense', 'Cloud Infrastructure'>"],
  
  "geographies": ["<All geographic regions mentioned or implied, e.g., 'North America', 'EMEA', 'Asia-Pacific', specific countries>"],
  
  "deal_types": ["<M&A, LBO, IPO, debt_financing, restructuring, carve-out, merger_of_equals, etc.>"],
  
  "transaction_tombstones": [
    {{
      "deal_name": "<e.g., 'Advised Boeing on acquisition of Spirit AeroSystems'>",
      "year": <year>,
      "deal_value_usd_millions": <numeric or null>,
      "our_role": "<e.g., 'Sole Financial Advisor', 'Buy-side Advisor'>"
    }}
  ],
  
  "league_table_positions": [
    {{
      "metric": "<e.g., 'Global M&A Advisory'>",
      "rank": <numeric rank>,
      "year": <year>
    }}
  ],
  
  "revenue_mentioned": <numeric value in USD millions if revenue is shown, else null>,
  "ebitda_mentioned": <numeric value in USD millions if EBITDA shown, else null>,
  "market_cap_mentioned": <numeric value in USD millions if market cap shown, else null>,
  
  "key_metrics": {{
    "<metric_name>": "<value with units>",
    "example": "Enterprise Value: $45.2B",
    "example2": "CAGR: 23%"
  }},
  
  "business_model": "<1-2 sentences: How does this company make money? B2B SaaS? Manufacturing? Only if clear from slide, else null>",
  
  "market_size_usd": <if market size mentioned, value in millions>,
  "growth_rate_percentage": <if CAGR or growth rate mentioned>,
  
  "market_drivers": ["<Key factors driving this market, e.g., 'Digital transformation', 'Aging population', 'Regulatory changes'>"],
  
  "market_trends": ["<Observable trends, e.g., 'Consolidation in the sector', 'Shift to subscription models'>"],
  
  "products_services": ["<Specific products or service lines mentioned>"],
  
  "competitive_advantages": ["<Any differentiation or unique selling points mentioned>"],
  
  "executive_summary": "<Write 2-3 sentences that capture the essence of this slide. Be specific. Include key numbers. Make it so a banker can decide if they need this slide without looking at it.>",
  
  "key_data_points": [
    "<Extract every important number, fact, or claim. Format: 'Boeing revenue: $66.6B (2023)'>"
  ],
  
  "reusability_tags": [
    "<Tags that describe WHEN to reuse this slide. Think: 'aerospace_sector', 'large_cap_profile', 'international_credentials', 'market_leader_positioning', 'digital_transformation_theme'>",
    "<Be generous with tags - these help discovery>"
  ],
  
  "banker_use_cases": [
    "<Practical guidance: 'Use this slide when pitching defense contractors about scale'>",
    "<Example: 'Perfect for showing track record in aerospace M&A'>",
    "<Example: 'Good reference for market sizing in SaaS pitches'>",
    "<Give 2-4 specific use cases>"
  ],
  
  "visual_elements": ["<What's on the slide visually? Options: bar_chart, line_graph, pie_chart, table, organizational_chart, process_flow, timeline, map, logo_grid, photo, infographic, text_heavy, mixed>"],
  
  "data_quality_score": <0.0-1.0: How fresh and reliable is this data? Recent data with sources = 1.0, Vague or old = 0.5>,
  
  "visual_quality_score": <0.0-1.0: How professional and polished is this slide? Well-designed with clear hierarchy = 1.0, Dense text or cluttered = 0.5>
}}

CRITICAL INSTRUCTIONS:
1. **For CREDENTIALS slides**: Extract every single deal tombstone. Include deal names, years, values, and your firm's role. These are gold for bankers.

2. **For COMPANY PROFILE slides**: Focus on business model, key metrics, competitive position. Bankers need to understand "what does this company do and why does it matter?"

3. **For MARKET ANALYSIS slides**: Capture market size, growth rates, trends, drivers. Bankers reuse these to show market context.

4. **For PRODUCT PORTFOLIO slides**: List all products/services and their competitive advantages.

5. **Reusability Tags**: Think about how bankers organize their thinking:
   - By sector: "automotive", "fintech", "medtech"
   - By company size: "large_cap", "mid_market", "growth_stage"
   - By geography: "european_focus", "us_domestic", "emerging_markets"
   - By theme: "digital_disruption", "sustainability", "consolidation_play"
   - By slide function: "opening_market_context", "capability_proof", "reference_case"

6. **Executive Summary**: Write this so a banker can forward it to a colleague and they immediately understand what's on the slide. Include the key number or fact.

7. **Be exhaustive with company names**: Extract every logo, every name mentioned. Even in fine print.

8. **Null vs Empty Array**: Use null when the information type doesn't apply. Use [] when it applies but nothing was found.

Return ONLY the JSON. No markdown formatting, no extra text."""

    @staticmethod
    def banker_query_understanding(user_query: str, user_context: Optional[BankerQueryContext] = None) -> str:
        """Deeply understand what the banker really needs"""
        
        context_str = ""
        if user_context:
            context_str = f"""
BANKER CONTEXT (use this to understand their workflow):
- Current pitch stage: {user_context.current_pitch_stage}
- Target client: {user_context.target_client or 'Unknown'}
- Target sector: {user_context.target_sector or 'Unknown'}
- Pitch narrative: {user_context.pitch_narrative or 'Unknown'}
- Recent searches: {user_context.recent_searches}
"""
        
        return f"""You are an expert M&A investment banker who understands the pitch deck creation process inside and out. A banker has entered a search query. Your job is to deeply understand what they REALLY need.

BANKER'S SEARCH QUERY: "{user_query}"
{context_str}

Think about the banker's workflow:
1. They're building a pitch deck (typically 40-60 slides)
2. They need specific content: company profiles, credentials, market data, product info
3. They're looking to reuse and adapt slides from past pitches
4. They need slides that match their narrative and impress the client
5. They value precision - they don't want to sift through 50 irrelevant results

Your task: Analyze their query with deep empathy for what they're trying to accomplish.

Return ONLY valid JSON:

{{
  "semantic_intent": "<Explain in 2-3 sentences what the banker is REALLY looking for and why. What are they building? What gap in their pitch are they trying to fill?>",
  
  "pitch_section_needed": "<Which section of their pitch deck does this support? Options: credentials, company_profile, product_portfolio, market_analysis, financial_overview, team_management, deal_rationale, transaction_structure, valuation_analysis, risk_factors, implementation_timeline, appendix_support>",
  
  "use_case": "<Why do they need this? E.g., 'Building a company profile section for a pitch to Airbus' or 'Need to show credentials in aerospace M&A to establish credibility'>",
  
  "narrative_fit": "<What story arc does this support? E.g., 'Demonstrating we are the leading advisor in this sector' or 'Showing the target company's market position and growth potential'>",
  
  "expanded_query": "<Rewrite the query with banking terminology and synonyms. Think: what words would actually appear on the slides they're looking for?>",
  
  "entities": {{
    "companies": ["<Extracted company names - be precise with spelling>"],
    "sectors": ["<Industry sectors>"],
    "sub_sectors": ["<More specific niches>"],
    "geographies": ["<Regions>"],
    "deal_types": ["<Types of transactions relevant>"]
  }},
  
  "must_have_entities": [
    "<Entities that MUST appear in results - usually company names>",
    "<If they said 'Airbus company profile', then Airbus is mandatory>"
  ],
  
  "nice_to_have_entities": [
    "<Entities that are relevant but not mandatory>",
    "<E.g., competitor names, related sectors>"
  ],
  
  "query_type": "<Choose ONE: specific_company_search, credentials_showcase, market_intelligence, product_information, comparative_analysis, reference_case, data_point_lookup>",
  
  "search_strategy": "<Explain how to search differently based on intent. E.g., 'For credentials, prioritize transaction tombstones and league tables' or 'For company profile, look for executive summaries and key metrics'>",
  
  "filters": {{
    "pitch_sections": ["<Preferred sections>"],
    "min_date": "<YYYY-MM-DD if recency matters, else null>",
    "min_data_quality": <0.0-1.0 or null>,
    "visual_requirements": ["<Required visual types, e.g., 'chart', 'table', or null>"]
  }},
  
  "boost_criteria": {{
    "exact_company_match": <1.0-10.0 how much to boost if exact company found>,
    "same_sector": <1.0-5.0>,
    "recent_slides": <1.0-5.0>,
    "high_quality": <1.0-5.0>,
    "frequently_reused": <1.0-5.0>
  }},
  
  "ideal_result_description": "<Describe what the PERFECT search result would look like. Be specific. E.g., 'A recent, well-designed company profile slide for Airbus showing revenue, market position, and business segments with clean visuals'>",
  
  "query_expansion_rationale": "<Explain your thinking: Why did you expand the query the way you did? What banking terminology did you add and why?>"
}}

BANKING QUERY PATTERNS - LEARN THESE:

1. **"company profile of X"**: 
   - They want: Overview slide with business description, metrics, market position
   - Must have: The company name X
   - Should boost: Slides with revenue, EBITDA, market cap, business model
   - Expand to: "X overview", "X corporate profile", "X business description"

2. **"credentials" or "track record"**:
   - They want: Proof of expertise to win the client
   - Should contain: Transaction tombstones, deal names, years, values
   - Expand to: "deal experience", "transaction history", "mandates", "league tables", "tombstones"
   - Filter to: pitch_section = "credentials"

3. **"market analysis for Y sector"**:
   - They want: Market size, growth rates, trends, competitive landscape
   - Should contain: Numbers, charts, market drivers
   - Expand to: "Y market size", "Y industry trends", "Y sector overview", "Y competitive dynamics"
   - Filter to: pitch_section = "market_analysis"

4. **"products of company X"**:
   - They want: Product portfolio, services, competitive advantages
   - Must have: Company X
   - Filter to: pitch_section = "product_portfolio"
   - Expand to: "X product lines", "X services", "X offerings", "X solutions"

5. **Implicit entity queries**: 
   - "aerospace credentials" → They want credentials slides that include aerospace deals
   - "tech M&A" → They want anything related to technology sector M&A transactions

6. **Comparison queries**:
   - "X vs Y" → They're building competitive analysis
   - Need slides mentioning both companies or comparative market position

7. **Data point queries**:
   - "Boeing revenue" → They need a specific metric, probably from a company profile
   - "SaaS market size" → Looking for market analysis with specific data

CRITICAL RULES:
- If a company name is mentioned → It goes in must_have_entities AND boost_criteria should be 10.0
- "credentials" query → boost transaction_tombstones and league_table_positions
- If they're vague ("show me credentials") → Don't add fake entities, but do expand terminology
- Always consider: What slide would make the banker say "Perfect! This is exactly what I needed!"

Return ONLY the JSON, no markdown, no explanations outside the JSON."""

    @staticmethod
    def elite_reranking(query: str, query_analysis: QueryAnalysis, results: List[Dict]) -> str:
        """Re-rank with deep understanding of pitch deck reusability"""
        
        # Create rich result summaries
        result_summaries = []
        for i, r in enumerate(results):
            summary = {
                "result_id": i + 1,
                "slide_id": r.get("slide_id"),
                "document": r.get("document_name"),
                "slide_num": r.get("slide_number"),
                
                # Core classification
                "pitch_section": r.get("pitch_section"),
                "slide_purpose": r.get("slide_purpose"),
                
                # Entities
                "target_company": r.get("target_company"),
                "all_companies": r.get("all_companies_mentioned", [])[:5],  # First 5
                "sectors": r.get("sectors", []),
                "sub_sectors": r.get("sub_sectors", []),
                
                # Key content
                "executive_summary": r.get("executive_summary", "")[:250],
                "key_data_points": r.get("key_data_points", [])[:3],
                "visual_elements": r.get("visual_elements", []),
                
                # Quality
                "data_quality": r.get("data_quality_score", 0.5),
                "visual_quality": r.get("visual_quality_score", 0.5),
                "created_date": r.get("created_date"),
                "is_latest": r.get("is_latest", False),
                
                # Reusability
                "reusability_tags": r.get("reusability_tags", [])[:5],
                "banker_use_cases": r.get("banker_use_cases", [])[:2]
            }
            result_summaries.append(summary)
        
        return f"""You are a senior M&A investment banker known for creating winning pitch decks. A colleague has searched for content and you need to rank these results by how useful they'll be for building their pitch.

COLLEAGUE'S SEARCH: "{query}"

WHAT THEY'RE TRYING TO DO:
{query_analysis.semantic_intent}

USE CASE: {query_analysis.use_case}
PITCH SECTION NEEDED: {query_analysis.pitch_section_needed}
NARRATIVE FIT: {query_analysis.narrative_fit}

MUST-HAVE ENTITIES: {query_analysis.must_have_entities}
(If a result doesn't contain these, it should be ranked very low)

SEARCH RESULTS TO RANK:
{json.dumps(result_summaries, indent=2)}

Your ranking criteria (in priority order):

1. **ENTITY MATCH (40% of score)**:
   - Does it contain the must-have entities (especially company names)?
   - If they searched for "Airbus company profile" and Airbus isn't mentioned → Score ≤ 0.2
   - Exact match on target_company → Very high score
   - Contains company in all_companies but not as primary → Medium score

2. **SECTION RELEVANCE (25% of score)**:
   - Does pitch_section match what they need?
   - Does slide_purpose align with their use case?
   - If they want credentials and this is credentials → High score
   - If they want company profile but this is market analysis → Low score unless highly relevant

3. **CONTENT QUALITY (20% of score)**:
   - Executive summary: Does it clearly explain what's on the slide?
   - Key data points: Are there specific, useful numbers/facts?
   - Data quality score: Is the information current and reliable?
   - Visual quality score: Is this a well-designed slide they'd be proud to show?

4. **REUSABILITY (10% of score)**:
   - Would this slide work well in their pitch with minimal adaptation?
   - Are the banker_use_cases similar to what they're trying to do?
   - Do the reusability_tags match their needs?

5. **RECENCY (5% of score)**:
   - Newer slides preferred (unless they're looking for historical reference)
   - is_latest version strongly preferred

Your job: Rank these results from most to least useful. Think: "If I were building this pitch, which slides would I actually use?"

Return ONLY valid JSON:

{{
  "ranked_results": [
    {{
      "result_id": <the result_id from above>,
      "slide_id": "<slide_id>",
      "relevance_score": <0.0-1.0, be precise, use full range>,
      
      "why_relevant": "<2-3 sentences: Why is this slide useful for their pitch? Be specific. Reference what's actually on the slide.>",
      
      "how_to_use": "<Practical guidance: 'Use this as your opening market context slide' or 'This tombstone list proves your aerospace credentials' or 'Extract the revenue figure for the profile section'>",
      
      "adaptation_needed": "<What would they need to change? E.g., 'Update 2023 data to 2024' or 'Swap competitor logos' or 'No changes needed, use as-is'>",
      
      "matched_entities": ["<Which must-have entities are present?>"],
      
      "scoring_breakdown": {{
        "entity_match": <0.0-1.0>,
        "section_relevance": <0.0-1.0>,
        "content_quality": <0.0-1.0>,
        "reusability": <0.0-1.0>,
        "recency": <0.0-1.0>
      }},
      
      "red_flags": ["<Any issues? E.g., 'Wrong company', 'Outdated data', 'Different sector', 'Poor visual quality'>"]
    }}
  ],
  
  "overall_assessment": "<1-2 sentences: How good are these results overall for the banker's needs? Would they be satisfied?>",
  
  "missing_content": "<If the results don't fully meet their needs, what's missing? E.g., 'No slides showing specific product portfolio' or 'Missing recent credentials in this sector'>",
  
  "search_improvement_suggestion": "<If results are weak, suggest a better search query>"
}}

RANKING RULES:
- Missing a must-have entity (especially company name) → relevance_score ≤ 0.3, massive penalty
- Perfect entity + section match + high quality → relevance_score ≥ 0.9
- Wrong pitch section but contains good information → relevance_score ≤ 0.6
- Outdated data (old version exists) → relevance_score ≤ 0.5
- Multiple red flags → relevance_score ≤ 0.4

Be honest: If the results are mediocre, say so. If they're excellent, make that clear.

Return ONLY the JSON, no markdown."""


# ============================================================================
# LLM CLIENT (Same as before)
# ============================================================================

class LLMClient:
    """Unified LLM client with caching"""
    
    def __init__(self, config: SearchConfig):
        self.config = config
        self.anthropic = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
        self.mistral = MistralClient(api_key=config.MISTRAL_API_KEY)
        self.cache = {}
    
    def _get_cache_key(self, prompt: str, model: str) -> str:
        return hashlib.md5(f"{model}:{prompt}".encode()).hexdigest()
    
    def call_claude(self, prompt: str, model: str = None, temperature: float = 0) -> str:
        model = model or self.config.QUERY_MODEL
        cache_key = self._get_cache_key(prompt, model)
        
        if self.config.CACHE_ENABLED and cache_key in self.cache:
            return self.cache[cache_key]
        
        response = self.anthropic.messages.create(
            model=model,
            max_tokens=8000,
            temperature=temperature,
            messages=[{"role": "user", "content": prompt}]
        )
        
        result = response.content[0].text
        
        if self.config.CACHE_ENABLED:
            self.cache[cache_key] = result
        
        return result
    
    def call_mistral(self, prompt: str, model: str = None, temperature: float = 0) -> str:
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
        try:
            # Remove markdown if present
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            return json.loads(response)
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}")
            print(f"Response preview: {response[:500]}")
            raise


# ============================================================================
# ELITE SEARCH ENGINE
# ============================================================================

class ElitePitchDeckSearch:
    """Search engine optimized for banker workflows"""
    
    def __init__(self, config: SearchConfig, llm_client: LLMClient):
        self.config = config
        self.llm = llm_client
        self.os_client = OpenSearch(
            hosts=[{'host': config.OPENSEARCH_HOST, 'port': config.OPENSEARCH_PORT}],
            http_compress=True,
            use_ssl=False
        )
    
    def search(self, query: str, banker_context: Optional[BankerQueryContext] = None) -> List[SearchResult]:
        """Execute elite search pipeline"""
        
        print(f"\n{'='*80}")
        print(f"🔍 PITCH DECK INTELLIGENCE SEARCH")
        print(f"{'='*80