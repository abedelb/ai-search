"""
APEX - Advanced Pitch Excellence System
State-of-the-art M&A pitch deck intelligence platform
Built to power autonomous pitch deck generation with human-level understanding
"""

import json
import re
from typing import List, Dict, Any, Optional, Tuple, Set
from dataclasses import dataclass, asdict, field
from datetime import datetime, timedelta
from enum import Enum
from opensearchpy import OpenSearch
import anthropic
from mistralai.client import MistralClient
import hashlib
from collections import defaultdict


# ============================================================================
# ENUMS & CONSTANTS
# ============================================================================

class PitchSection(Enum):
    """Standardized pitch deck sections"""
    COVER = "cover"
    EXECUTIVE_SUMMARY = "executive_summary"
    SITUATION_ANALYSIS = "situation_analysis"
    STRATEGIC_RATIONALE = "strategic_rationale"
    COMPANY_OVERVIEW = "company_overview"
    FINANCIAL_PROFILE = "financial_profile"
    MARKET_POSITION = "market_position"
    COMPETITIVE_LANDSCAPE = "competitive_landscape"
    PRODUCT_PORTFOLIO = "product_portfolio"
    MANAGEMENT_TEAM = "management_team"
    TRANSACTION_STRUCTURE = "transaction_structure"
    VALUATION_FRAMEWORK = "valuation_framework"
    SYNERGY_ANALYSIS = "synergy_analysis"
    FINANCING_STRATEGY = "financing_strategy"
    RISK_MITIGATION = "risk_mitigation"
    IMPLEMENTATION_ROADMAP = "implementation_roadmap"
    CREDENTIALS = "credentials"
    LEAGUE_TABLES = "league_tables"
    CASE_STUDIES = "case_studies"
    APPENDIX = "appendix"
    DISCLAIMER = "disclaimer"


class SlideIntent(Enum):
    """What the slide is designed to accomplish"""
    ESTABLISH_CREDIBILITY = "establish_credibility"
    PROVE_MARKET_OPPORTUNITY = "prove_market_opportunity"
    DEMONSTRATE_VALUE = "demonstrate_value"
    QUANTIFY_BENEFITS = "quantify_benefits"
    MITIGATE_CONCERNS = "mitigate_concerns"
    COMPARE_ALTERNATIVES = "compare_alternatives"
    SHOW_TRACK_RECORD = "show_track_record"
    PROVIDE_CONTEXT = "provide_context"
    SUPPORT_DECISION = "support_decision"
    CALL_TO_ACTION = "call_to_action"


class DataType(Enum):
    """Types of data present on slides"""
    FINANCIAL_METRICS = "financial_metrics"
    MARKET_STATISTICS = "market_statistics"
    OPERATIONAL_KPIS = "operational_kpis"
    TRANSACTION_DETAILS = "transaction_details"
    COMPETITIVE_BENCHMARKS = "competitive_benchmarks"
    QUALITATIVE_ANALYSIS = "qualitative_analysis"
    ORGANIZATIONAL_INFO = "organizational_info"
    TEMPORAL_TRENDS = "temporal_trends"


# ============================================================================
# ADVANCED DATA MODELS
# ============================================================================

@dataclass
class FinancialMetrics:
    """Structured financial data extraction"""
    revenue_usd_m: Optional[float] = None
    revenue_growth_pct: Optional[float] = None
    ebitda_usd_m: Optional[float] = None
    ebitda_margin_pct: Optional[float] = None
    net_income_usd_m: Optional[float] = None
    market_cap_usd_m: Optional[float] = None
    enterprise_value_usd_m: Optional[float] = None
    ev_revenue_multiple: Optional[float] = None
    ev_ebitda_multiple: Optional[float] = None
    pe_ratio: Optional[float] = None
    debt_to_equity: Optional[float] = None
    fcf_usd_m: Optional[float] = None
    year: Optional[int] = None
    period: Optional[str] = None  # Q1-2024, FY2023, LTM


@dataclass
class MarketIntelligence:
    """Market analysis metadata"""
    market_size_usd_b: Optional[float] = None
    addressable_market_usd_b: Optional[float] = None
    market_growth_cagr_pct: Optional[float] = None
    market_share_pct: Optional[float] = None
    market_rank: Optional[int] = None
    total_competitors: Optional[int] = None
    market_maturity: Optional[str] = None  # emerging, growth, mature, declining
    concentration_level: Optional[str] = None  # fragmented, consolidated, monopolistic
    key_players: List[str] = field(default_factory=list)
    market_drivers: List[str] = field(default_factory=list)
    market_headwinds: List[str] = field(default_factory=list)
    disruption_factors: List[str] = field(default_factory=list)


@dataclass
class TransactionTombstone:
    """Structured deal information"""
    deal_id: str
    transaction_name: str
    announcement_date: Optional[str] = None
    close_date: Optional[str] = None
    target_company: Optional[str] = None
    acquirer_company: Optional[str] = None
    deal_value_usd_m: Optional[float] = None
    deal_type: str = "M&A"  # M&A, LBO, IPO, etc.
    sector: Optional[str] = None
    our_role: Optional[str] = None  # "Sole Financial Advisor", "Buy-side Advisor"
    deal_status: str = "completed"  # announced, pending, completed
    cross_border: bool = False
    strategic_rationale: Optional[str] = None


@dataclass
class ContentQuality:
    """Multi-dimensional quality assessment"""
    data_recency_score: float = 0.5  # How current is the data
    visual_design_score: float = 0.5  # Professional design quality
    information_density_score: float = 0.5  # Right amount of info
    source_credibility_score: float = 0.5  # Reliability of sources
    reusability_score: float = 0.5  # How easy to adapt
    completeness_score: float = 0.5  # Has all needed information
    clarity_score: float = 0.5  # Easy to understand
    overall_quality: float = 0.5  # Composite score
    
    def calculate_overall(self):
        """Calculate weighted average"""
        self.overall_quality = (
            self.data_recency_score * 0.20 +
            self.visual_design_score * 0.15 +
            self.information_density_score * 0.15 +
            self.source_credibility_score * 0.15 +
            self.reusability_score * 0.20 +
            self.completeness_score * 0.10 +
            self.clarity_score * 0.05
        )


@dataclass
class SlideGenome:
    """Complete genetic profile of a slide for generation purposes"""
    
    # Core Identity
    slide_id: str
    document_name: str
    slide_number: int
    version: int
    created_date: str
    last_modified: str
    is_latest: bool
    content_hash: str
    
    # Structural Classification
    pitch_section: str
    pitch_subsection: Optional[str] = None
    slide_sequence_position: Optional[int] = None  # Where in typical flow
    depends_on_slides: List[str] = field(default_factory=list)  # Prerequisites
    enables_slides: List[str] = field(default_factory=list)  # What this unlocks
    
    # Intent & Purpose
    primary_intent: str
    secondary_intents: List[str] = field(default_factory=list)
    target_audience: List[str] = field(default_factory=list)  # C-suite, board, technical
    emotional_appeal: Optional[str] = None  # urgency, confidence, opportunity
    persuasion_technique: Optional[str] = None  # social_proof, authority, scarcity
    
    # Entity Universe
    primary_subject_company: Optional[str] = None
    client_company: Optional[str] = None
    all_mentioned_companies: List[str] = field(default_factory=list)
    competitor_companies: List[str] = field(default_factory=list)
    partner_companies: List[str] = field(default_factory=list)
    comparable_companies: List[str] = field(default_factory=list)
    
    # Industry Context
    primary_sector: Optional[str] = None
    sub_sectors: List[str] = field(default_factory=list)
    adjacent_sectors: List[str] = field(default_factory=list)
    value_chain_position: Optional[str] = None  # upstream, midstream, downstream
    
    # Geographic Footprint
    primary_geography: Optional[str] = None
    all_geographies: List[str] = field(default_factory=list)
    geographic_scope: Optional[str] = None  # local, regional, national, global
    
    # Deal Context
    deal_types: List[str] = field(default_factory=list)
    deal_stage_relevance: List[str] = field(default_factory=list)
    transaction_size_range: Optional[str] = None  # sub-100m, 100m-1b, 1b-10b, 10b+
    deal_complexity: Optional[str] = None  # simple, moderate, complex
    
    # Structured Data
    financial_metrics: Optional[FinancialMetrics] = None
    market_intelligence: Optional[MarketIntelligence] = None
    transaction_tombstones: List[TransactionTombstone] = field(default_factory=list)
    
    # Content Analysis
    data_types_present: List[str] = field(default_factory=list)
    key_metrics_highlighted: List[str] = field(default_factory=list)
    key_insights: List[str] = field(default_factory=list)
    supporting_evidence: List[str] = field(default_factory=list)
    data_sources_cited: List[str] = field(default_factory=list)
    assumptions_stated: List[str] = field(default_factory=list)
    
    # Visual Architecture
    layout_type: Optional[str] = None  # single_chart, comparison, timeline, matrix
    visual_elements: List[str] = field(default_factory=list)
    color_scheme: Optional[str] = None  # corporate, neutral, vibrant
    text_density: Optional[str] = None  # minimal, moderate, dense
    chart_types: List[str] = field(default_factory=list)
    has_annotations: bool = False
    
    # Semantic Understanding
    executive_summary: str = ""
    detailed_description: str = ""
    slide_narrative: str = ""  # Story this slide tells
    key_takeaway: str = ""  # One sentence conclusion
    
    # Generation Intelligence
    reusability_patterns: List[str] = field(default_factory=list)
    customization_points: List[str] = field(default_factory=list)
    generation_templates: List[str] = field(default_factory=list)
    variable_elements: Dict[str, str] = field(default_factory=dict)
    
    # Usage Intelligence
    typical_use_cases: List[str] = field(default_factory=list)
    pitch_narratives: List[str] = field(default_factory=list)
    client_types: List[str] = field(default_factory=list)
    success_indicators: List[str] = field(default_factory=list)
    
    # Quality Assessment
    quality_metrics: Optional[ContentQuality] = None
    
    # Search Optimization
    semantic_tags: List[str] = field(default_factory=list)
    banker_keywords: List[str] = field(default_factory=list)
    search_boosters: List[str] = field(default_factory=list)
    
    # Raw Content
    raw_text: str = ""
    image_descriptions: List[str] = field(default_factory=list)
    ocr_text: Optional[str] = None


@dataclass
class PitchContext:
    """Rich context about the pitch being built"""
    pitch_id: Optional[str] = None
    pitch_stage: str = "discovery"  # discovery, structuring, drafting, refinement
    
    # Target Information
    target_company: Optional[str] = None
    target_sector: Optional[str] = None
    target_geography: Optional[str] = None
    target_size_usd_m: Optional[float] = None
    
    # Client Information
    client_name: Optional[str] = None
    client_type: Optional[str] = None  # corporate, pe_firm, family_office
    client_sophistication: Optional[str] = None  # high, medium, low
    client_priorities: List[str] = field(default_factory=list)
    
    # Deal Information
    deal_type: Optional[str] = None
    deal_rationale: Optional[str] = None
    deal_timeline: Optional[str] = None
    competitive_process: bool = False
    
    # Narrative Strategy
    pitch_narrative: Optional[str] = None
    key_messages: List[str] = field(default_factory=list)
    differentiation_strategy: Optional[str] = None
    
    # Constraints
    slide_budget: Optional[int] = 40  # Target deck length
    time_to_deliver: Optional[int] = None  # Days
    confidentiality_level: Optional[str] = None
    
    # Search History
    recent_searches: List[str] = field(default_factory=list)
    viewed_slides: List[str] = field(default_factory=list)
    selected_slides: List[str] = field(default_factory=list)
    rejected_slides: List[str] = field(default_factory=list)


@dataclass
class SearchIntent:
    """Deep understanding of search intent"""
    original_query: str
    normalized_query: str
    expanded_queries: List[str]
    
    # Intent Classification
    primary_intent: str
    intent_confidence: float
    sub_intents: List[str]
    
    # What they're building
    pitch_section_target: str
    slide_position_in_deck: Optional[int] = None
    narrative_role: str = ""
    
    # Entity Requirements
    must_have_companies: List[str] = field(default_factory=list)
    must_have_sectors: List[str] = field(default_factory=list)
    must_have_geographies: List[str] = field(default_factory=list)
    nice_to_have_companies: List[str] = field(default_factory=list)
    
    # Content Requirements
    required_data_types: List[str] = field(default_factory=list)
    required_visuals: List[str] = field(default_factory=list)
    required_metrics: List[str] = field(default_factory=list)
    
    # Quality Requirements
    min_quality_threshold: float = 0.6
    recency_importance: float = 0.5
    
    # Search Strategy
    search_mode: str = "precision"  # precision, recall, balanced
    ranking_strategy: str = ""
    boost_factors: Dict[str, float] = field(default_factory=dict)
    
    # Generation Readiness
    ready_for_generation: bool = False
    generation_template_hint: Optional[str] = None
    customization_needed: List[str] = field(default_factory=list)


# ============================================================================
# WORLD-CLASS PROMPTS
# ============================================================================

class ApexPrompts:
    """State-of-the-art prompts for pitch deck intelligence"""
    
    @staticmethod
    def slide_genome_extraction(slide_content: str, image_descriptions: List[str],
                                document_name: str, slide_number: int,
                                total_slides: int) -> str:
        """Extract complete slide genome for generation purposes"""
        
        img_context = "\n".join([f"  {i+1}. {desc}" for i, desc in enumerate(image_descriptions)]) if image_descriptions else "  (No images)"
        
        return f"""You are an elite M&A investment banking analyst and pitch deck architect with 20+ years of experience. You've built hundreds of winning pitch decks and understand what makes slides exceptional and reusable.

Your mission: Create a complete "genetic profile" of this slide so that an AI system can later:
1. Find this slide with perfect precision when bankers search
2. Understand exactly when and how to reuse this slide
3. Generate new slides based on this template
4. Compose this slide into coherent pitch narratives

DOCUMENT: {document_name}
SLIDE: {slide_number} of {total_slides}
POSITION IN DECK: {(slide_number/total_slides)*100:.1f}% through the presentation

═══════════════════════════════════════════════════════════════════════════════
SLIDE CONTENT:
{slide_content}

VISUAL ELEMENTS:
{img_context}
═══════════════════════════════════════════════════════════════════════════════

Think like both a banker searching for this slide AND an AI that will generate similar slides.

Return ONLY valid JSON (no markdown):

{{
  "structural_classification": {{
    "pitch_section": "<Choose from: cover, executive_summary, situation_analysis, strategic_rationale, company_overview, financial_profile, market_position, competitive_landscape, product_portfolio, management_team, transaction_structure, valuation_framework, synergy_analysis, financing_strategy, risk_mitigation, implementation_roadmap, credentials, league_tables, case_studies, appendix, disclaimer>",
    "pitch_subsection": "<More specific, e.g., 'financial_highlights', 'management_bios', 'sector_credentials'>",
    "slide_sequence_position": <1-100: where does this typically appear in a 40-slide deck?>,
    "depends_on_slides": ["<What slides should come before this? e.g., 'market_overview must precede this competitive analysis'>"],
    "enables_slides": ["<What slides does this unlock? e.g., 'this overview enables detailed product breakdowns'>"]
  }},
  
  "intent_architecture": {{
    "primary_intent": "<establish_credibility|prove_market_opportunity|demonstrate_value|quantify_benefits|mitigate_concerns|compare_alternatives|show_track_record|provide_context|support_decision|call_to_action>",
    "secondary_intents": ["<additional goals this slide achieves>"],
    "target_audience": ["<c_suite|board_members|technical_experts|financial_analysts|all>"],
    "emotional_appeal": "<urgency|confidence|opportunity|reassurance|excitement|authority>",
    "persuasion_technique": "<social_proof|authority|scarcity|reciprocity|consistency|liking|data_driven|storytelling>",
    "slide_narrative": "<In 2-3 sentences: What story does this slide tell? What's the beginning, middle, end?>",
    "key_takeaway": "<The ONE thing the audience should remember from this slide>"
  }},
  
  "entity_universe": {{
    "primary_subject_company": "<The main company this slide focuses on, or null>",
    "client_company": "<Who was this pitch created for, if determinable>",
    "all_mentioned_companies": ["<Every single company name, logo, or reference>"],
    "competitor_companies": ["<Companies positioned as competitors>"],
    "partner_companies": ["<Strategic partners, suppliers, customers mentioned>"],
    "comparable_companies": ["<Peer companies used for benchmarking>"]
  }},
  
  "industry_context": {{
    "primary_sector": "<Technology|Healthcare|Financial Services|Industrials|Consumer|Energy|Real Estate|TMT|etc.>",
    "sub_sectors": ["<Specific niches: 'Enterprise SaaS', 'Medical Devices', 'Aerospace & Defense'>"],
    "adjacent_sectors": ["<Related industries that might find this relevant>"],
    "value_chain_position": "<upstream|midstream|downstream|integrated|platform>"
  }},
  
  "geographic_intelligence": {{
    "primary_geography": "<Main geographic focus>",
    "all_geographies": ["<All regions/countries mentioned>"],
    "geographic_scope": "<local|regional|national|global>"
  }},
  
  "deal_context": {{
    "deal_types": ["<M&A|LBO|IPO|debt_financing|restructuring|divestiture|JV|carve_out>"],
    "deal_stage_relevance": ["<origination|pitch|due_diligence|negotiation|execution|post_close>"],
    "transaction_size_range": "<micro_<50m|small_50-250m|mid_250-1b|large_1-5b|mega_5b+>",
    "deal_complexity": "<simple|moderate|complex|highly_complex>"
  }},
  
  "structured_data": {{
    "financial_metrics": {{
      "revenue_usd_m": <numeric or null>,
      "revenue_growth_pct": <numeric or null>,
      "ebitda_usd_m": <numeric or null>,
      "ebitda_margin_pct": <numeric or null>,
      "net_income_usd_m": <numeric or null>,
      "market_cap_usd_m": <numeric or null>,
      "enterprise_value_usd_m": <numeric or null>,
      "ev_revenue_multiple": <numeric or null>,
      "ev_ebitda_multiple": <numeric or null>,
      "pe_ratio": <numeric or null>,
      "debt_to_equity": <numeric or null>,
      "fcf_usd_m": <numeric or null>,
      "year": <year of data>,
      "period": "<Q1-2024|FY2023|LTM|etc.>"
    }},
    "market_intelligence": {{
      "market_size_usd_b": <numeric or null>,
      "addressable_market_usd_b": <numeric or null>,
      "market_growth_cagr_pct": <numeric or null>,
      "market_share_pct": <numeric or null>,
      "market_rank": <numeric rank or null>,
      "total_competitors": <number or null>,
      "market_maturity": "<emerging|growth|mature|declining>",
      "concentration_level": "<fragmented|consolidated|monopolistic>",
      "key_players": ["<top competitors>"],
      "market_drivers": ["<key growth drivers>"],
      "market_headwinds": ["<challenges/risks>"],
      "disruption_factors": ["<disruptive forces>"]
    }},
    "transaction_tombstones": [
      {{
        "transaction_name": "<e.g., 'Advised Boeing on $4.7B acquisition of Spirit AeroSystems'>",
        "announcement_date": "<YYYY-MM-DD or null>",
        "close_date": "<YYYY-MM-DD or null>",
        "target_company": "<company name>",
        "acquirer_company": "<company name>",
        "deal_value_usd_m": <numeric or null>,
        "deal_type": "<M&A|LBO|IPO|etc.>",
        "sector": "<industry>",
        "our_role": "<Sole Financial Advisor|Buy-side Advisor|Co-Advisor|etc.>",
        "deal_status": "<completed|pending|announced>",
        "cross_border": <true|false>,
        "strategic_rationale": "<brief description if mentioned>"
      }}
    ]
  }},
  
  "content_analysis": {{
    "data_types_present": ["<financial_metrics|market_statistics|operational_kpis|transaction_details|competitive_benchmarks|qualitative_analysis|organizational_info|temporal_trends>"],
    "key_metrics_highlighted": ["<List the 3-5 most prominent metrics with values, e.g., '$2.4B Revenue (2024)', '34% EBITDA Margin'>"],
    "key_insights": [
      "<Insight 1: A specific, actionable finding from this slide>",
      "<Insight 2: Another key learning>",
      "<Insight 3-5: Continue as needed>"
    ],
    "supporting_evidence": ["<What data/facts back up the narrative?>"],
    "data_sources_cited": ["<Company filings|Industry reports|Proprietary analysis|etc.>"],
    "assumptions_stated": ["<Any explicit assumptions made>"]
  }},
  
  "visual_architecture": {{
    "layout_type": "<single_visual|split_comparison|timeline|matrix_2x2|dashboard|text_dominant|icon_grid|process_flow>",
    "visual_elements": ["<bar_chart|line_graph|pie_chart|waterfall|scatter_plot|table|org_chart|map|photo|logo|icon|diagram|infographic>"],
    "color_scheme": "<corporate_blue|neutral_grayscale|vibrant_multi|financial_green_red|custom>",
    "text_density": "<minimal_<100words|moderate_100-300|dense_300+|extremely_dense_500+>",
    "chart_types": ["<specific chart types present>"],
    "has_annotations": <true|false, are there callouts/highlights?>
  }},
  
  "semantic_understanding": {{
    "executive_summary": "<3-4 sentences: Comprehensive summary of what's on this slide. Include key numbers. Make it so someone can decide if they need this without seeing it.>",
    "detailed_description": "<5-8 sentences: Thorough walkthrough of the slide content, structure, and insights. Describe it as if explaining to a colleague over the phone.>"
  }},
  
  "generation_intelligence": {{
    "reusability_patterns": [
      "<Pattern 1: When to reuse this slide, e.g., 'Use when showing market opportunity in technology sectors'>",
      "<Pattern 2: Another reuse scenario>",
      "<Pattern 3-5: Continue>"
    ],
    "customization_points": [
      "<Point 1: What needs to change when reusing, e.g., 'Update company name and logo'>",
      "<Point 2: Another customization needed>",
      "<Point 3-5: Continue>"
    ],
    "generation_templates": [
      "<Template 1: How to auto-generate similar slides, e.g., 'Market size framework: [TAM] → [SAM] → [SOM] with CAGR'>",
      "<Template 2: Another generation pattern>"
    ],
    "variable_elements": {{
      "<element_name>": "<what it is, e.g., 'company_name': 'The primary company that varies'>",
      "example": "'metrics_year': 'The year for financial data'"
    }}
  }},
  
  "usage_intelligence": {{
    "typical_use_cases": [
      "<Use case 1: 'Opening market context for tech M&A pitches'>",
      "<Use case 2: 'Proving scale in large-cap situations'>",
      "<Use case 3-5: More scenarios>"
    ],
    "pitch_narratives": [
      "<Narrative 1: 'Supporting a market leadership story'>",
      "<Narrative 2: 'Demonstrating growth potential'>",
      "<Narrative 3-4: More narratives>"
    ],
    "client_types": ["<corporate_strategic|private_equity|family_office|sovereign_wealth|pension_fund|hedge_fund>"],
    "success_indicators": ["<What makes this slide effective? e.g., 'Clear data visualization', 'Compelling narrative flow'>"]
  }},
  
  "quality_assessment": {{
    "data_recency_score": <0.0-1.0: 1.0 = current year data, 0.5 = 1-2 years old, 0.2 = 3+ years old>,
    "visual_design_score": <0.0-1.0: 1.0 = exceptional design, 0.5 = acceptable, 0.2 = poor>,
    "information_density_score": <0.0-1.0: 1.0 = perfect balance, 0.5 = too dense or too sparse, 0.2 = unusable>,
    "source_credibility_score": <0.0-1.0: 1.0 = verified sources, 0.5 = unknown, 0.2 = questionable>,
    "reusability_score": <0.0-1.0: 1.0 = highly adaptable, 0.5 = some effort, 0.2 = hard to reuse>,
    "completeness_score": <0.0-1.0: 1.0 = all needed info, 0.5 = missing some elements, 0.2 = incomplete>,
    "clarity_score": <0.0-1.0: 1.0 = crystal clear, 0.5 = understandable, 0.2 = confusing>
  }},
  
  "search_optimization": {{
    "semantic_tags": [
      "<Tag 1: Conceptual tags for semantic search, e.g., 'market_dominance', 'growth_trajectory'>",
      "<Tag 2-10: More semantic concepts this represents>"
    ],
    "banker_keywords": [
      "<Keyword 1: Terms bankers would use, e.g., 'tombstones', 'league tables', 'track record'>",
      "<Keyword 2-15: More banking vocabulary>"
    ],
    "search_boosters": [
      "<Booster 1: Phrases that should make this rank high, e.g., 'aerospace credentials', 'tech valuations'>",
      "<Booster 2-10: More search triggers>"
    ]
  }}
}}

CRITICAL CALIBRATION INSTRUCTIONS:

1. **CREDENTIALS SLIDES** - These are gold for bankers:
   - Extract EVERY transaction tombstone with full details
   - Capture league table rankings precisely
   - Note sector-specific experience clearly
   - High reusability_score (0.8-1.0) if well-documented

2. **COMPANY PROFILE SLIDES** - Foundation slides:
   - Capture business model clearly
   - Extract all financial metrics with years
   - Note competitive positioning
   - Template-ready structure in generation_intelligence

3. **MARKET ANALYSIS SLIDES** - High reuse potential:
   - Market size data is precious - extract precisely
   - CAGR and growth trends are key
   - Market drivers create narrative hooks
   - These adapt across sectors - note reusability patterns

4. **PRODUCT PORTFOLIO SLIDES**:
   - List all products/services comprehensively
   - Capture competitive advantages
   - Note how offerings are structured

5. **QUALITY SCORING CALIBRATION**:
   - Data from 2024-2025: recency_score = 0.9-1.0
   - Data from 2023: recency_score = 0.7-0.8
   - Data from 2021-2022: recency_score = 0.4-0.6
   - Data pre-2021: recency_score = 0.2-0.4
   - Professional design with clear hierarchy: visual_design_score = 0.8-1.0
   - Cluttered or text-heavy: visual_design_score = 0.3-0.5

6. **GENERATION INTELLIGENCE** - Critical for AI:
   - Think: "How would an AI recreate this slide for a different company?"
   - Identify what's fixed vs. variable
   - Describe the underlying template structure
   - Note what data sources would be needed

7. **SEARCH OPTIMIZATION**:
   - Include both formal and informal banker terms
   - Think: "What would someone type to find this?"
   - Consider partial matches and related concepts

Be exhaustive. The richer this genome, the better the search and generation will be.

Return ONLY the JSON. No markdown code blocks."""

    @staticmethod
    def intent_decoder(query: str, pitch_context: Optional[PitchContext] = None) -> str:
        """Decode search intent with deep contextual understanding"""
        
        context_block = ""
        if pitch_context:
            context_block = f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║ BANKER'S CURRENT CONTEXT                                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
Pitch Stage: {pitch_context.pitch_stage}
Target Company: {pitch_context.target_company or 'Not specified'}
Target Sector: {pitch_context.target_sector or 'Not specified'}
Client: {pitch_context.client_name or 'Not specified'}
Deal Type: {pitch_context.deal_type or 'Not specified'}
Pitch Narrative: {pitch_context.pitch_narrative or 'Not defined yet'}
Recent Searches: {', '.join(pitch_context.recent_searches[-5:]) if pitch_context.recent_searches else 'None'}
Slides in Draft: {len(pitch_context.selected_slides)} selected
"""
        
        return f"""You are an elite M&A banker's cognitive assistant. You understand not just what they're searching for, but WHY they're searching, WHAT they're building, and HOW this fits into their pitch narrative.

A banker has entered this search query. Decode their true intent with surgical precision.

SEARCH QUERY: "{query}"
{context_block}

Your mission: Understand this search at multiple levels:
1. **Literal Level**: What are they explicitly asking for?
2. **Tactical Level**: What slide do they need right now?
3. **Strategic Level**: How does this fit into their broader pitch?
4. **Generative Level**: Could this query be satisfied by generating a new slide vs. finding existing?

Think through the banker's mental model:
- Are they at the beginning (broad market context) or deep in details?
- Do they need proof points (credentials) or narrative building blocks (company profiles)?
- Is this a showstopper slide (must be perfect) or supporting material?
- Are they time-constrained (need exact match) or exploratory (open to inspiration)?

Return ONLY valid JSON (no markdown):

{{
  "intent_analysis": {{
    "literal_interpretation": "<What they literally typed, unpacked>",
    "true_need": "<What they actually need - often different from what they asked>",
    "urgency_level": "<critical|high|moderate|low>",
    "specificity_level": "<precise|moderate|vague>",
    "exploration_mode": "<exact_match|similar_content|inspiration|research>"
  }},
  
  "query_understanding": {{
    "original_query": "{query}",
    "normalized_query": "<Cleaned, standardized version>",
    "expanded_queries": [
      "<Expansion 1: Key synonym/related query>",
      "<Expansion 2: Alternative phrasing>",
      "<Expansion 3-5: More expansions>"
    ],
    "semantic_meaning": "<Deep semantic interpretation in 2-3 sentences>"
  }},
  
  "intent_classification": {{
    "primary_intent": "<specific_company_search|credentials_showcase|market_intelligence|product_information|financial_data_lookup|comparative_analysis|reference_example|template_search|inspiration_browsing>",
    "intent_confidence": <0.0-1.0>,
    "sub_intents": ["<secondary goals>"],
    "intent_rationale": "<Why you classified it this way>"
  }},
  
  "pitch_construction_context": {{
    "pitch_section_target": "<Which section of a 40-slide deck are they building?>",
    "slide_position_in_deck": <1-40 estimated position, or null>,
    "narrative_role": "<How this slide advances their story, e.g., 'Establishes market context before diving into target company analysis'>",
    "dependency_chain": "<What slides likely come before/after this?>",
    "critical_path": <true|false, is this a make-or-break slide?>
  }},
  
  "entity_extraction": {{
    "must_have_companies": ["<Companies that MUST appear in results - non-negotiable>"],
    "must_have_sectors": ["<Sectors that MUST be covered>"],
    "must_have_geographies": ["<Geographies that MUST be included>"],
    "nice_to_have_companies": ["<Companies that would be helpful but not mandatory>"],
    "inferred_entities": {{
      "implicit_companies": ["<Companies not mentioned but likely relevant>"],
      "implied_sectors": ["<Sectors implied by context>"],
      "related_geographies": ["<Geographic context from other clues>"]
    }},
    "entity_relationships": "<How entities relate, e.g., 'Boeing vs Airbus comparison' or 'Airbus as acquisition target'>"
  }},
  
  "content_requirements": {{
    "required_data_types": ["<financial_metrics|market_statistics|transaction_details|competitive_benchmarks|etc.>"],
    "required_visuals": ["<chart|table|timeline|matrix|org_chart|etc.>"],
    "required_metrics": ["<Specific metrics needed, e.g., 'revenue', 'EBITDA margin', 'market share'>"],
    "required_time_period": "<Current|historical_5y|specific_year_YYYY|etc.>",
    "required_detail_level": "<executive_summary|detailed_analysis|comprehensive_data>",
    "must_have_elements": ["<What absolutely must be on the slides returned?>"]
  }},
  
  "quality_requirements": {{
    "min_quality_threshold": <0.0-1.0, how high-quality must results be?>,
    "recency_importance": <0.0-1.0, how critical is fresh data?>,
    "visual_quality_importance": <0.0-1.0, how much does design matter?>,
    "completeness_importance": <0.0-1.0, need all info vs. partial ok?>,
    "source_credibility_importance": <0.0-1.0, how verified must sources be?>
  }},
  
  "search_strategy": {{
    "search_mode": "<precision|recall|balanced>",
    "ranking_strategy": "<Explain how to rank results for this query>",
    "boost_factors": {{
      "exact_entity_match": <1.0-10.0>,
      "section_match": <1.0-5.0>,
      "recency": <1.0-5.0>,
      "quality": <1.0-5.0>,
      "reusability": <1.0-5.0>,
      "visual_appeal": <1.0-3.0>
    }},
    "filter_strategy": "<What hard filters to apply?>",
    "fallback_strategy": "<If no results, what to try next?>"
  }},
  
  "generation_consideration": {{
    "can_generate_new": <true|false, could we generate this instead of searching?>,
    "generation_feasibility": <0.0-1.0>,
    "generation_approach": "<If we were to generate, what would the approach be?>",
    "hybrid_approach": "<Could we find similar slides and adapt them?>",
    "search_vs_generate_decision": "<search_first|generate_first|hybrid>"
  }},
  
  "expected_results": {{
    "ideal_result_count": <1-5|5-15|15-30>,
    "ideal_result_description": "<Describe perfect results in detail>",
    "result_diversity": "<homogeneous|diverse_perspectives|varied_approaches>",
    "acceptable_variations": ["<What variations are acceptable?>"],
    "unacceptable_results": ["<What would be wrong results?>"]
  }},
  
  "banker_workflow_intelligence": {{
    "likely_next_search": "<What will they probably search for next?>",
    "complementary_content": ["<What other slides would complement this?>"],
    "workflow_stage_indicators": "<Are they starting, middle, or finishing their deck?>",
    "time_pressure_indicators": "<Do they seem rushed or exploratory?>",
    "quality_vs_speed_tradeoff": "<Prioritize perfection or speed?>"
  }}
}}

QUERY PATTERN RECOGNITION:

**1. "Company profile of [COMPANY]"**
- TRUE NEED: Overview slide with business model, financials, market position
- MUST HAVE: Exact company name in results
- SECTION TARGET: company_overview (slides 8-12 typically)
- BOOST: Financial metrics, market position, clean visuals
- GENERATION: Possible if we have recent data sources

**2. "Credentials" / "Track record" / "Tombstones"**
- TRUE NEED: Proof of expertise to establish credibility
- MUST HAVE: Transaction tombstones with deals, dates, values, roles
- SECTION TARGET: credentials (slides 35-40, back of deck)
- BOOST: Sector-specific deals, recent transactions, large values
- GENERATION: Hard to generate - need real deal history

**3. "[SECTOR] credentials" (e.g., "aerospace credentials")**
- TRUE NEED: Sector-specific track record
- MUST HAVE: Deals in that specific sector
- FILTER: Sector must match
- BOOST: Large transactions, recent deals, recognizable names

**4. "Market analysis [SECTOR]"**
- TRUE NEED: Market size, growth, trends, competitive dynamics
- SECTION TARGET: market_position or situation_analysis (slides 5-8)
- REQUIRED DATA: Market size ($B), CAGR (%), key players, drivers
- GENERATION: Possible with current market research data

**5. "Products of [COMPANY]"**
- TRUE NEED: Product portfolio, competitive advantages
- SECTION TARGET: product_portfolio (slides 15-18)
- MUST HAVE: Specific company
- BOOST: Product descriptions, competitive differentiation

**6. "[COMPANY A] vs [COMPANY B]"**
- TRUE NEED: Competitive comparison
- SECTION TARGET: competitive_landscape
- MUST HAVE: Both companies mentioned
- REQUIRED VISUALS: Comparison table or matrix

**7. "[METRIC] of [COMPANY]" (e.g., "Boeing revenue")**
- TRUE NEED: Specific data point
- SEARCH MODE: Precision
- REQUIRED: Exact metric with current data
- GENERATION: Check if we can pull from data sources

**8. Vague queries ("show me tech stuff")**
- TRUE NEED: Exploration/inspiration
- SEARCH MODE: Recall
- PROVIDE: Diverse examples across tech sector
- SUGGEST: More specific search refinements

**9. Context-aware patterns**:
- If recent searches show "Airbus profile" then "aerospace market" → They're building sector context around Airbus
- If they've selected 15 slides → They're deep into drafting, need specific content
- If first search of session → Likely broad exploration

CRITICAL CALIBRATION:
- Company names in query → ALWAYS must_have_entities, boost_factor = 10.0
- "credentials" → Filter to credentials section, boost tombstones
- Sector mentioned → Nice to have but not mandatory unless "sector X credentials"
- Numbers/metrics in query → They need data-driven slides, boost data_quality
- Comparison words (vs, compared to) → Need comparative analysis slides
- "recent" or "latest" → Recency importance = 0.9+
- Vague query → Lower min_quality_threshold, increase result diversity

Think: What slide would make them say "YES! This is EXACTLY what I need for my pitch!"

Return ONLY the JSON."""

    @staticmethod
    def neural_reranking(query: str, intent: SearchIntent, results: List[Dict], 
                        pitch_context: Optional[PitchContext] = None) -> str:
        """Neural-level re-ranking with multi-dimensional relevance"""
        
        # Create ultra-rich result summaries
        result_profiles = []
        for i, r in enumerate(results):
            profile = {
                "rank": i + 1,
                "slide_id": r.get("slide_id"),
                "doc": r.get("document_name", "")[:50],
                "slide": r.get("slide_number"),
                
                "section": r.get("pitch_section"),
                "intent": r.get("primary_intent"),
                "purpose": r.get("slide_purpose", "")[:100],
                
                "target_co": r.get("primary_subject_company"),
                "all_cos": r.get("all_mentioned_companies", [])[:5],
                "sectors": r.get("primary_sector"),
                "sub_sectors": r.get("sub_sectors", [])[:3],
                "geos": r.get("all_geographies", [])[:3],
                
                "summary": r.get("executive_summary", "")[:200],
                "key_takeaway": r.get("key_takeaway", "")[:150],
                "key_metrics": r.get("key_metrics_highlighted", [])[:3],
                
                "financials": {
                    "rev": r.get("financial_metrics", {}).get("revenue_usd_m"),
                    "year": r.get("financial_metrics", {}).get("year")
                } if r.get("financial_metrics") else None,
                
                "market_intel": {
                    "size": r.get("market_intelligence", {}).get("market_size_usd_b"),
                    "growth": r.get("market_intelligence", {}).get("market_growth_cagr_pct")
                } if r.get("market_intelligence") else None,
                
                "tombstones": len(r.get("transaction_tombstones", [])),
                
                "quality": {
                    "overall": r.get("quality_metrics", {}).get("overall_quality", 0.5),
                    "data_recency": r.get("quality_metrics", {}).get("data_recency_score", 0.5),
                    "visual": r.get("quality_metrics", {}).get("visual_design_score", 0.5),
                    "reusability": r.get("quality_metrics", {}).get("reusability_score", 0.5)
                },
                
                "created": r.get("created_date"),
                "latest": r.get("is_latest", False),
                
                "use_cases": r.get("typical_use_cases", [])[:2],
                "tags": r.get("reusability_patterns", [])[:3]
            }
            result_profiles.append(profile)
        
        context_str = ""
        if pitch_context:
            context_str = f"""
PITCH CONTEXT:
Building for: {pitch_context.target_company or 'Unknown'} ({pitch_context.target_sector or 'Unknown sector'})
Client: {pitch_context.client_name or 'Unknown'}
Deal Type: {pitch_context.deal_type or 'Unknown'}
Narrative: {pitch_context.pitch_narrative or 'Not defined'}
Already Selected: {len(pitch_context.selected_slides)} slides
"""
        
        return f"""You are the world's leading M&A pitch deck architect. A banker is searching for content and you must rank these results with surgical precision.

Your ranking will determine whether they find the perfect slide immediately or waste 20 minutes searching.

SEARCH QUERY: "{query}"

BANKER'S TRUE INTENT:
{intent.normalized_query}

What they really need: {intent.narrative_role}
Pitch section: {intent.pitch_section_target}
Critical path slide: {"YES - This is make-or-break" if intent.expected_results.get("ideal_result_count") == "1-5" else "No - Supporting material"}

MUST-HAVE REQUIREMENTS:
- Companies: {intent.must_have_companies}
- Sectors: {intent.must_have_sectors}  
- Data types: {intent.required_data_types}
- Metrics: {intent.required_metrics}
{context_str}

SEARCH RESULTS TO RANK:
{json.dumps(result_profiles, indent=2)}

═══════════════════════════════════════════════════════════════════════════════

Your ranking framework (apply weights precisely):

**TIER 1: ENTITY PRECISION (35% of score)**
→ Must-have companies present in target_co or all_cos?
   - Exact match in target_co: Score = 1.0
   - In all_cos but not primary: Score = 0.7
   - Not present but same sector: Score = 0.3
   - Completely wrong entity: Score = 0.0-0.2 (disqualify)

→ Sector alignment
   - Exact sector match: Score = 1.0
   - Adjacent sector: Score = 0.6
   - Wrong sector: Score = 0.2

**TIER 2: SECTION & PURPOSE ALIGNMENT (25% of score)**
→ Does pitch_section match what they need?
   - Perfect match: Score = 1.0
   - Related section: Score = 0.6
   - Wrong section but relevant content: Score = 0.4
   - Completely wrong: Score = 0.1

→ Does the slide purpose align with their intent?
   - Perfectly aligned: Score = 1.0
   - Partially aligned: Score = 0.5

**TIER 3: CONTENT RICHNESS (20% of score)**
→ Does it have the required data/metrics?
   - All required elements: Score = 1.0
   - Most elements: Score = 0.7
   - Some elements: Score = 0.4
   - Missing critical elements: Score = 0.2

→ Executive summary clarity
   - Crystal clear and compelling: Score = 1.0
   - Understandable: Score = 0.6
   - Vague: Score = 0.3

**TIER 4: QUALITY & USABILITY (15% of score)**
→ Overall quality score (from metadata)
   - 0.8-1.0: Exceptional
   - 0.6-0.8: Good
   - 0.4-0.6: Acceptable
   - <0.4: Poor

→ Data recency (critical for some queries)
   - Apply intent.recency_importance weight
   - Recent data gets full score
   - Outdated data penalized

→ Visual quality
   - Apply intent.visual_quality_importance weight
   - Well-designed slides score higher

→ Reusability
   - Easy to adapt: Score = 1.0
   - Moderate effort: Score = 0.6
   - Hard to reuse: Score = 0.3

**TIER 5: CONTEXT & FIT (5% of score)**
→ Fits the pitch narrative?
→ Right level of detail?
→ Appropriate for client type?
→ Latest version available?

═══════════════════════════════════════════════════════════════════════════════

CRITICAL RANKING RULES:

1. **ENTITY DISQUALIFICATION**:
   - If must_have_companies specified and slide doesn't have them → relevance_score ≤ 0.25
   - Example: Query "Airbus company profile" but slide is about Boeing → MAX score = 0.2

2. **SECTION MISMATCH PENALTY**:
   - Wrong section = -30% penalty
   - Example: They need credentials but got company profile → Cap at 0.6

3. **QUALITY FLOOR**:
   - If overall_quality < 0.4 → relevance_score ≤ 0.5 (low quality ceiling)

4. **RECENCY CRITICAL CASES**:
   - If intent.recency_importance > 0.8 and data is old → -40% penalty

5. **PERFECT MATCH BONUS**:
   - Entity match + Section match + High quality → relevance_score ≥ 0.85

6. **TOMBSTONE PRIORITY** (for credentials):
   - If query is credentials-related, slides with tombstones > 0 get +20% boost

7. **WRONG IS WRONG**:
   - Don't rationalize bad matches
   - If it's not relevant, score it low (0.1-0.3)
   - Be honest about gaps

═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON (no markdown):

{{
  "ranked_results": [
    {{
      "rank": <1-N>,
      "slide_id": "<slide_id>",
      "relevance_score": <0.00-1.00, precise to 2 decimals>,
      
      "one_line_verdict": "<In ONE sentence: Why this slide is/isn't relevant>",
      
      "relevance_explanation": "<2-3 sentences: Detailed explanation of fit>",
      
      "how_to_use": "<Practical guidance if relevant. If not relevant, say 'Not recommended'>",
      
      "adaptation_guide": "<What to change when using this slide. If not relevant, say 'N/A'>",
      
      "matched_entities": ["<Entities from query found here>"],
      
      "scoring_breakdown": {{
        "entity_precision": <0.00-1.00>,
        "section_alignment": <0.00-1.00>,
        "content_richness": <0.00-1.00>,
        "quality_usability": <0.00-1.00>,
        "context_fit": <0.00-1.00>
      }},
      
      "strengths": ["<What's great about this slide?>"],
      "weaknesses": ["<What's wrong or missing?>"],
      
      "red_flags": ["<Deal-breakers: 'Wrong company', 'Outdated data', etc.>"],
      "green_flags": ["<Perfect elements: 'Exact entity match', 'Recent data', etc.>"]
    }}
  ],
  
  "ranking_summary": {{
    "total_results_analyzed": <N>,
    "highly_relevant_count": <score >= 0.7>,
    "somewhat_relevant_count": <score 0.4-0.7>,
    "not_relevant_count": <score < 0.4>,
    "perfect_matches": <score >= 0.85>
  }},
  
  "overall_assessment": {{
    "quality": "<excellent|good|fair|poor>",
    "verdict": "<2-3 sentences: How well do these results satisfy the query?>",
    "best_slide_description": "<Describe the top result in detail>",
    "gaps": ["<What's missing from these results?>"],
    "confidence": <0.0-1.0: How confident are you in this ranking?>
  }},
  
  "recommendations": {{
    "top_pick": "<Which slide_id to use first>",
    "alternative_picks": ["<2-3 backup options>"],
    "dont_use": ["<slide_ids that are misleading/wrong>"],
    "search_refinement": "<If results are weak, suggest better query>",
    "generation_suggestion": "<If no good matches, suggest generating new slide instead>"
  }}
}}

CALIBRATION EXAMPLES:

Query: "Airbus company profile"
Slide: Company profile of Boeing
→ Entity mismatch: 0.0, Section match: 1.0, Overall: 0.20 (wrong company!)

Query: "Aerospace credentials"  
Slide: Credentials with 5 aerospace tombstones
→ Entity: 1.0, Section: 1.0, Tombstones: 5, Overall: 0.95 (perfect!)

Query: "Market size SaaS"
Slide: SaaS market analysis with $250B market size, 18% CAGR
→ Entity: 1.0, Section: 1.0, Has metrics: 1.0, Overall: 0.92 (excellent!)

Query: "Boeing revenue"
Slide: Financial overview with Boeing $77B revenue (2023)
→ Entity: 1.0, Has metric: 1.0, Recent: 1.0, Overall: 0.90 (perfect match!)

Query: "credentials"
Slide: Generic credentials with outdated 2019 deals
→ Section: 1.0, But old data: 0.3, Overall: 0.45 (acceptable but dated)

Be precise. Be honest. Rank like the banker's success depends on it - because it does.

Return ONLY the JSON."""


# ============================================================================
# ELITE SEARCH ENGINE
# ============================================================================

class ApexSearchEngine:
    """State-of-the-art search engine for pitch deck intelligence"""
    
    def __init__(self, config: SearchConfig, llm_client: LLMClient):
        self.config = config
        self.llm = llm_client
        self.os_client = OpenSearch(
            hosts=[{'host': config.OPENSEARCH_HOST, 'port': config.OPENSEARCH_PORT}],
            http_compress=True,
            use_ssl=False
        )
        
        # Analytics
        self.search_analytics = defaultdict(list)
    
    def search(self, query: str, pitch_context: Optional[PitchContext] = None) -> List[SearchResult]:
        """Execute APEX search pipeline"""
        
        print(f"\n{'═'*80}")
        print(f"🎯 APEX PITCH DECK INTELLIGENCE")
        print(f"{'═'*80}")
        print(f"Query: {query}")
        if pitch_context:
            print(f"Context: Building {pitch_context.pitch_section_target or 'pitch'} for {pitch_context.target_company or 'client'}")
        print(f"{'═'*80}\n")
        
        # PHASE 1: Deep Intent Understanding
        print("🧠 PHASE 1: Decoding Intent...")
        intent = self._decode_intent(query, pitch_context)
        print(f"   Intent: {intent.primary_intent}")
        print(f"   True need: {intent.narrative_role[:80]}...")
        print(f"   Must-have entities: {intent.must_have_companies}")
        print(f"   Target section: {intent.pitch_section_target}\n")
        
        # PHASE 2: Multi-Strategy Retrieval
        print("🔍 PHASE 2: Neural Retrieval...")
        candidates = self._neural_retrieval(intent, pitch_context)
        print(f"   Retrieved: {len(candidates)} candidates\n")
        
        # PHASE 3: Entity Precision Filtering
        print("🎯 PHASE 3: Entity Filtering...")
        filtered = self._entity_precision_filter(candidates, intent)
        print(f"   After entity filter: {len(filtered)} slides\n")
        
        # PHASE 4: Quality & Relevance Pre-filtering  
        print("⚡ PHASE 4: Quality Gate...")
        quality_passed = self._quality_gate(filtered, intent)
        print(f"   Quality gate passed: {len(quality_passed)} slides\n")
        
        # PHASE 5: Version Deduplication
        print("🔄 PHASE 5: Deduplication...")
        deduplicated = self._smart_deduplication(quality_passed)
        print(f"   After dedup: {len(deduplicated)} unique slides\n")
        
        # PHASE 6: Neural Re-ranking
        print("🧮 PHASE 6: Neural Re-ranking...")
        if len(deduplicated) >= 5:
            reranked = self._neural_rerank(query, intent, deduplicated, pitch_context)
            print(f"   Re-ranked: {len(reranked)} results\n")
        else:
            reranked = deduplicated
            print(f"   Too few results for reranking, using as-is\n")
        
        # PHASE 7: Final Assembly
        print("📦 PHASE 7: Assembling Results...")
        final_results = self._assemble_results(reranked[:self.config.FINAL_RESULTS], intent)
        
        print(f"\n{'═'*80}")
        print(f"✅ COMPLETE: {len(final_results)} elite results delivered")
        print(f"{'═'*80}\n")
        
        # Analytics
        self._log_search(query, intent, final_results)
        
        return final_results
    
    def _decode_intent(self, query: str, pitch_context: Optional[PitchContext]) -> SearchIntent:
        """Decode search intent with deep understanding"""
        
        prompt = ApexPrompts.intent_decoder(query, pitch_context)
        response = self.llm.call_claude(prompt, model=self.config.QUERY_MODEL)
        intent_data = self.llm.parse_json_response(response)
        
        # Build SearchIntent object
        intent = SearchIntent(
            original_query=query,
            normalized_query=intent_data["query_understanding"]["normalized_query"],
            expanded_queries=intent_data["query_understanding"]["expanded_queries"],
            primary_intent=intent_data["intent_classification"]["primary_intent"],
            intent_confidence=intent_data["intent_classification"]["intent_confidence"],
            sub_intents=intent_data["intent_classification"]["sub_intents"],
            pitch_section_target=intent_data["pitch_construction_context"]["pitch_section_target"],
            slide_position_in_deck=intent_data["pitch_construction_context"].get("slide_position_in_deck"),
            narrative_role=intent_data["pitch_construction_context"]["narrative_role"],
            must_have_companies=intent_data["entity_extraction"]["must_have_companies"],
            must_have_sectors=intent_data["entity_extraction"]["must_have_sectors"],
            must_have_geographies=intent_data["entity_extraction"]["must_have_geographies"],
            nice_to_have_companies=intent_data["entity_extraction"]["nice_to_have_companies"],
            required_data_types=intent_data["content_requirements"]["required_data_types"],
            required_visuals=intent_data["content_requirements"]["required_visuals"],
            required_metrics=intent_data["content_requirements"]["required_metrics"],
            min_quality_threshold=intent_data["quality_requirements"]["min_quality_threshold"],
            recency_importance=intent_data["quality_requirements"]["recency_importance"],
            search_mode=intent_data["search_strategy"]["search_mode"],
            ranking_strategy=intent_data["search_strategy"]["ranking_strategy"],
            boost_factors=intent_data["search_strategy"]["boost_factors"],
            ready_for_generation=intent_data["generation_consideration"]["can_generate_new"],
            generation_template_hint=intent_data["generation_consideration"].get("generation_approach"),
            customization_needed=intent_data["generation_consideration"].get("hybrid_approach", "").split(";") if intent_data["generation_consideration"].get("hybrid_approach") else []
        )
        
        return intent
    
    def _neural_retrieval(self, intent: SearchIntent, pitch_context: Optional[PitchContext]) -> List[Dict]:
        """Multi-strategy retrieval with neural understanding"""
        
        # Build sophisticated OpenSearch query
        must_clauses = []
        should_clauses = []
        filter_clauses = []
        
        # Text search across semantic fields
        text_query = {
            "multi_match": {
                "query": " ".join([intent.normalized_query] + intent.expanded_queries[:3]),
                "fields": [
                    "executive_summary^5",
                    "detailed_description^3",
                    "key_takeaway^4",
                    "slide_narrative^3",
                    "key_insights^2",
                    "banker_keywords^3",
                    "semantic_tags^2",
                    "raw_text"
                ],
                "type": "best_fields",
                "operator": "or",
                "minimum_should_match": "30%"
            }
        }
        must_clauses.append(text_query)
        
        # Boost by pitch section
        if intent.pitch_section_target:
            should_clauses.append({
                "term": {
                    "pitch_section": {
                        "value": intent.pitch_section_target,
                        "boost": intent.boost_factors.get("section_match", 5.0)
                    }
                }
            })
        
        # Boost by primary intent
        should_clauses.append({
            "term": {
                "primary_intent": {
                    "value": intent.primary_intent,
                    "boost": 3.0
                }
            }
        })
        
        # Entity boosting - critical for precision
        if intent.must_have_companies:
            for company in intent.must_have_companies:
                should_clauses.append({
                    "term": {
                        "primary_subject_company.keyword": {
                            "value": company,
                            "boost": intent.boost_factors.get("exact_entity_match", 10.0)
                        }
                    }
                })
                should_clauses.append({
                    "terms": {
                        "all_mentioned_companies.keyword": [company],
                        "boost": intent.boost_factors.get("exact_entity_match", 10.0) * 0.7
                    }
                })
        
        if intent.must_have_sectors:
            for sector in intent.must_have_sectors:
                should_clauses.append({
                    "term": {
                        "primary_sector.keyword": {
                            "value": sector,
                            "boost": intent.boost_factors.get("same_sector", 4.0)
                        }
                    }
                })
        
        # Quality boosting
        should_clauses.append({
            "range": {
                "quality_metrics.overall_quality": {
                    "gte": 0.7,
                    "boost": intent.boost_factors.get("quality", 3.0)
                }
            }
        })
        
        # Recency boosting
        if intent.recency_importance > 0.5:
            should_clauses.append({
                "range": {
                    "created_date": {
                        "gte": "now-2y",
                        "boost": intent.boost_factors.get("recency", 4.0)
                    }
                }
            })
        
        # Latest version preference
        should_clauses.append({
            "term": {
                "is_latest": {
                    "value": True,
                    "boost": 5.0
                }
            }
        })
        
        # Apply minimum quality filter
        if intent.min_quality_threshold > 0.5:
            filter_clauses.append({
                "range": {
                    "quality_metrics.overall_quality": {
                        "gte": intent.min_quality_threshold
                    }
                }
            })
        
        # Build final query
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
            "_source": True,
            "sort": [
                "_score",
                {"quality_metrics.overall_quality": {"order": "desc"}},
                {"created_date": {"order": "desc"}}
            ]
        }
        
        # Execute search
        response = self.os_client.search(
            index=self.config.INDEX_NAME,
            body=search_body
        )
        
        # Extract and enrich results
        results = []
        for hit in response['hits']['hits']:
            result = hit['_source']
            result['_search_score'] = hit['_score']
            results.append(result)
        
        return results
    
    def _entity_precision_filter(self, results: List[Dict], intent: SearchIntent) -> List[Dict]:
        """Filter results with entity precision"""
        
        if not intent.must_have_companies and not intent.must_have_sectors:
            return results
        
        filtered = []
        for result in results:
            # Check company requirements
            if intent.must_have_companies:
                primary_company = result.get("primary_subject_company", "")
                all_companies = result.get("all_mentioned_companies", [])
                
                # Must have at least one must-have company
                has_company = False
                for required_company in intent.must_have_companies:
                    if (required_company.lower() in primary_company.lower() or
                        any(required_company.lower() in comp.lower() for comp in all_companies)):
                        has_company = True
                        break
                
                if not has_company:
                    continue  # Skip this result
            
            # Check sector requirements
            if intent.must_have_sectors:
                primary_sector = result.get("primary_sector", "")
                sub_sectors = result.get("sub_sectors", [])
                
                has_sector = False
                for required_sector in intent.must_have_sectors:
                    if (required_sector.lower() in primary_sector.lower() or
                        any(required_sector.lower() in sub.lower() for sub in sub_sectors)):
                        has_sector = True
                        break
                
                if not has_sector:
                    continue
            
            filtered.append(result)
        
        return filtered
    
    def _quality_gate(self, results: List[Dict], intent: SearchIntent) -> List[Dict]:
        """Apply quality thresholds"""
        
        passed = []
        for result in results:
            quality = result.get("quality_metrics", {})
            
            # Overall quality check
            overall_quality = quality.get("overall_quality", 0.5)
            if overall_quality < intent.min_quality_threshold:
                continue
            
            # Recency check if important
            if intent.recency_importance > 0.7:
                data_recency = quality.get("data_recency_score", 0.5)
                if data_recency < 0.6:
                    continue
            
            passed.append(result)
        
        return passed
    
    def _smart_deduplication(self, results: List[Dict]) -> List[Dict]:
        """Deduplicate slides, keeping latest versions"""
        
        # Group by content hash
        hash_groups = defaultdict(list)
        for result in results:
            content_hash = result.get("content_hash", "")
            if content_hash:
                hash_groups[content_hash].append(result)
        
        # Keep only latest version from each group
        deduplicated = []
        seen_hashes = set()
        
        for result in results:
            content_hash = result.get("content_hash", "")
            
            if not content_hash or content_hash not in seen_hashes:
                # Check if this is the latest version in its group
                if content_hash and len(hash_groups[content_hash]) > 1:
                    # Find latest version
                    group = hash_groups[content_hash]
                    latest = max(group, key=lambda x: (x.get("is_latest", False), x.get("created_date", "")))
                    
                    if result["slide_id"] == latest["slide_id"]:
                        deduplicated.append(result)
                        seen_hashes.add(content_hash)
                else:
                    deduplicated.append(result)
                    if content_hash:
                        seen_hashes.add(content_hash)
        
        return deduplicated
    
    def _neural_rerank(self, query: str, intent: SearchIntent, results: List[Dict],
                      pitch_context: Optional[PitchContext]) -> List[Dict]:
        """Neural re-ranking with LLM"""
        
        # Take top candidates for re-ranking
        candidates = results[:self.config.RERANK_SIZE]
        
        prompt = ApexPrompts.neural_reranking(query, intent, candidates, pitch_context)
        response = self.llm.call_claude(prompt, model=self.config.RERANK_MODEL)
        ranking_data = self.llm.parse_json_response(response)
        
        # Create ranking map
        slide_rankings = {}
        for ranked_result in ranking_data["ranked_results"]:
            slide_id = ranked_result["slide_id"]
            slide_rankings[slide_id] = {
                "rank": ranked_result["rank"],
                "relevance_score": ranked_result["relevance_score"],
                "explanation": ranked_result["relevance_explanation"],
                "how_to_use": ranked_result["how_to_use"],
                "adaptation_guide": ranked_result["adaptation_guide"],
                "matched_entities": ranked_result["matched_entities"],
                "scoring": ranked_result["scoring_breakdown"],
                "strengths": ranked_result["strengths"],
                "weaknesses": ranked_result["weaknesses"]
            }
        
        # Re-order results based on ranking
        reranked = []
        for result in results:
            slide_id = result["slide_id"]
            if slide_id in slide_rankings:
                result["_rerank_data"] = slide_rankings[slide_id]
                result["_final_score"] = slide_rankings[slide_id]["relevance_score"]
                reranked.append(result)
        
        # Sort by final score
        reranked.sort(key=lambda x: x.get("_final_score", 0), reverse=True)
        
        # Add unranked results at the end
        for result in results:
            if result["slide_id"] not in slide_rankings:
                result["_final_score"] = result.get("_search_score", 0) * 0.5
                reranked.append(result)
        
        return reranked
    
    def _assemble_results(self, results: List[Dict], intent: SearchIntent) -> List[SearchResult]:
        """Assemble final SearchResult objects"""
        
        final_results = []
        
        for result in results:
            # Get rerank data if available
            rerank_data = result.get("_rerank_data", {})
            
            # Build metadata object
            quality = ContentQuality(
                data_recency_score=result.get("quality_metrics", {}).get("data_recency_score", 0.5),
                visual_design_score=result.get("quality_metrics", {}).get("visual_design_score", 0.5),
                information_density_score=result.get("quality_metrics", {}).get("information_density_score", 0.5),
                source_credibility_score=result.get("quality_metrics", {}).get("source_credibility_score", 0.5),
                reusability_score=result.get("quality_metrics", {}).get("reusability_score", 0.5),
                completeness_score=result.get("quality_metrics", {}).get("completeness_score", 0.5),
                clarity_score=result.get("quality_metrics", {}).get("clarity_score", 0.5),
                overall_quality=result.get("quality_metrics", {}).get("overall_quality", 0.5)
            )
            
            # Build financial metrics if present
            fin_data = result.get("financial_metrics")
            financial_metrics = None
            if fin_data:
                financial_metrics = FinancialMetrics(
                    revenue_usd_m=fin_data.get("revenue_usd_m"),
                    revenue_growth_pct=fin_data.get("revenue_growth_pct"),
                    ebitda_usd_m=fin_data.get("ebitda_usd_m"),
                    ebitda_margin_pct=fin_data.get("ebitda_margin_pct"),
                    net_income_usd_m=fin_data.get("net_income_usd_m"),
                    market_cap_usd_m=fin_data.get("market_cap_usd_m"),
                    enterprise_value_usd_m=fin_data.get("enterprise_value_usd_m"),
                    ev_revenue_multiple=fin_data.get("ev_revenue_multiple"),
                    ev_ebitda_multiple=fin_data.get("ev_ebitda_multiple"),
                    pe_ratio=fin_data.get("pe_ratio"),
                    debt_to_equity=fin_data.get("debt_to_equity"),
                    fcf_usd_m=fin_data.get("fcf_usd_m"),
                    year=fin_data.get("year"),
                    period=fin_data.get("period")
                )
            
            # Build market intelligence if present
            mkt_data = result.get("market_intelligence")
            market_intel = None
            if mkt_data:
                market_intel = MarketIntelligence(
                    market_size_usd_b=mkt_data.get("market_size_usd_b"),
                    addressable_market_usd_b=mkt_data.get("addressable_market_usd_b"),
                    market_growth_cagr_pct=mkt_data.get("market_growth_cagr_pct"),
                    market_share_pct=mkt_data.get("market_share_pct"),
                    market_rank=mkt_data.get("market_rank"),
                    total_competitors=mkt_data.get("total_competitors"),
                    market_maturity=mkt_data.get("market_maturity"),
                    concentration_level=mkt_data.get("concentration_level"),
                    key_players=mkt_data.get("key_players", []),
                    market_drivers=mkt_data.get("market_drivers", []),
                    market_headwinds=mkt_data.get("market_headwinds", []),
                    disruption_factors=mkt_data.get("disruption_factors", [])
                )
            
            # Build tombstones if present
            tombstones = []
            for tomb_data in result.get("transaction_tombstones", []):
                tombstone = TransactionTombstone(
                    deal_id=tomb_data.get("deal_id", ""),
                    transaction_name=tomb_data.get("transaction_name", ""),
                    announcement_date=tomb_data.get("announcement_date"),
                    close_date=tomb_data.get("close_date"),
                    target_company=tomb_data.get("target_company"),
                    acquirer_company=tomb_data.get("acquirer_company"),
                    deal_value_usd_m=tomb_data.get("deal_value_usd_m"),
                    deal_type=tomb_data.get("deal_type", "M&A"),
                    sector=tomb_data.get("sector"),
                    our_role=tomb_data.get("our_role"),
                    deal_status=tomb_data.get("deal_status", "completed"),
                    cross_border=tomb_data.get("cross_border", False),
                    strategic_rationale=tomb_data.get("strategic_rationale")
                )
                tombstones.append(tombstone)
            
            # Build full SlideGenome
            metadata = SlideGenome(
                slide_id=result["slide_id"],
                document_name=result["document_name"],
                slide_number=result["slide_number"],
                version=result["version"],
                created_date=result["created_date"],
                last_modified=result.get("last_modified", result["created_date"]),
                is_latest=result["is_latest"],
                content_hash=result["content_hash"],
                pitch_section=result["pitch_section"],
                pitch_subsection=result.get("pitch_subsection"),
                slide_sequence_position=result.get("slide_sequence_position"),
                depends_on_slides=result.get("depends_on_slides", []),
                enables_slides=result.get("enables_slides", []),
                primary_intent=result["primary_intent"],
                secondary_intents=result.get("secondary_intents", []),
                target_audience=result.get("target_audience", []),
                emotional_appeal=result.get("emotional_appeal"),
                persuasion_technique=result.get("persuasion_technique"),
                primary_subject_company=result.get("primary_subject_company"),
                client_company=result.get("client_company"),
                all_mentioned_companies=result.get("all_mentioned_companies", []),
                competitor_companies=result.get("competitor_companies", []),
                partner_companies=result.get("partner_companies", []),
                comparable_companies=result.get("comparable_companies", []),
                primary_sector=result.get("primary_sector"),
                sub_sectors=result.get("sub_sectors", []),
                adjacent_sectors=result.get("adjacent_sectors", []),
                value_chain_position=result.get("value_chain_position"),
                primary_geography=result.get("primary_geography"),
                all_geographies=result.get("all_geographies", []),
                geographic_scope=result.get("geographic_scope"),
                deal_types=result.get("deal_types", []),
                deal_stage_relevance=genome_data["deal_context"].get("deal_stage_relevance", []),
            transaction_size_range=genome_data["deal_context"].get("transaction_size_range"),
            deal_complexity=genome_data["deal_context"].get("deal_complexity"),
            financial_metrics=financial_metrics,
            market_intelligence=market_intel,
            transaction_tombstones=tombstones,
            data_types_present=genome_data["content_analysis"].get("data_types_present", []),
            key_metrics_highlighted=genome_data["content_analysis"].get("key_metrics_highlighted", []),
            key_insights=genome_data["content_analysis"].get("key_insights", []),
            supporting_evidence=genome_data["content_analysis"].get("supporting_evidence", []),
            data_sources_cited=genome_data["content_analysis"].get("data_sources_cited", []),
            assumptions_stated=genome_data["content_analysis"].get("assumptions_stated", []),
            layout_type=genome_data["visual_architecture"].get("layout_type"),
            visual_elements=genome_data["visual_architecture"].get("visual_elements", []),
            color_scheme=genome_data["visual_architecture"].get("color_scheme"),
            text_density=genome_data["visual_architecture"].get("text_density"),
            chart_types=genome_data["visual_architecture"].get("chart_types", []),
            has_annotations=genome_data["visual_architecture"].get("has_annotations", False),
            executive_summary=genome_data["semantic_understanding"]["executive_summary"],
            detailed_description=genome_data["semantic_understanding"]["detailed_description"],
            slide_narrative=genome_data["intent_architecture"]["slide_narrative"],
            key_takeaway=genome_data["intent_architecture"]["key_takeaway"],
            reusability_patterns=genome_data["generation_intelligence"].get("reusability_patterns", []),
            customization_points=genome_data["generation_intelligence"].get("customization_points", []),
            generation_templates=genome_data["generation_intelligence"].get("generation_templates", []),
            variable_elements=genome_data["generation_intelligence"].get("variable_elements", {}),
            typical_use_cases=genome_data["usage_intelligence"].get("typical_use_cases", []),
            pitch_narratives=genome_data["usage_intelligence"].get("pitch_narratives", []),
            client_types=genome_data["usage_intelligence"].get("client_types", []),
            success_indicators=genome_data["usage_intelligence"].get("success_indicators", []),
            quality_metrics=quality,
            semantic_tags=genome_data["search_optimization"].get("semantic_tags", []),
            banker_keywords=genome_data["search_optimization"].get("banker_keywords", []),
            search_boosters=genome_data["search_optimization"].get("search_boosters", []),
            raw_text=slide_content,
            image_descriptions=image_descriptions
        )
        
        # Prepare document for indexing
        doc = asdict(genome)
        
        # Convert nested dataclasses to dicts
        if doc["financial_metrics"]:
            doc["financial_metrics"] = asdict(genome.financial_metrics)
        if doc["market_intelligence"]:
            doc["market_intelligence"] = asdict(genome.market_intelligence)
        if doc["transaction_tombstones"]:
            doc["transaction_tombstones"] = [asdict(t) for t in genome.transaction_tombstones]
        if doc["quality_metrics"]:
            doc["quality_metrics"] = asdict(genome.quality_metrics)
        
        # Add embedding
        doc["embedding"] = embedding
        
        # Index to OpenSearch
        self.os_client.index(
            index=self.config.INDEX_NAME,
            id=slide_id,
            body=doc,
            refresh=True
        )
        
        print(f"✅ Indexed: {slide_id}")
        print(f"   Section: {genome.pitch_section}")
        print(f"   Intent: {genome.primary_intent}")
        print(f"   Quality: {quality.overall_quality:.2f}")
        if genome.primary_subject_company:
            print(f"   Company: {genome.primary_subject_company}")
        
        return genome


# ============================================================================
# USAGE EXAMPLES & MAIN
# ============================================================================

def example_usage():
    """Demonstrate the APEX system"""
    
    # Initialize
    config = SearchConfig()
    llm_client = LLMClient(config)
    
    # Create search engine
    search_engine = ApexSearchEngine(config, llm_client)
    
    # Create pitch context
    pitch_context = PitchContext(
        pitch_stage="drafting",
        target_company="Airbus SE",
        target_sector="Aerospace & Defense",
        client_name="European Investment Bank",
        deal_type="M&A",
        pitch_narrative="Positioning Airbus as a consolidation leader in aerospace manufacturing",
        slide_budget=40,
        recent_searches=["aerospace market analysis", "Airbus financial performance"]
    )
    
    # Example searches
    queries = [
        "Airbus company profile",
        "aerospace credentials",
        "market size aerospace & defense",
        "Boeing vs Airbus comparison",
        "credentials in European M&A"
    ]
    
    for query in queries:
        print(f"\n{'#'*80}")
        print(f"SEARCH: {query}")
        print(f"{'#'*80}")
        
        results = search_engine.search(query, pitch_context)
        
        print("\n📊 RESULTS:")
        for i, result in enumerate(results, 1):
            print(f"\n{i}. {result.document_name} - Slide {result.slide_number}")
            print(f"   Score: {result.relevance_score:.3f}")
            print(f"   Section: {result.metadata.pitch_section}")
            print(f"   Purpose: {result.metadata.slide_purpose[:100]}...")
            print(f"   How to use: {result.how_to_use[:150]}...")
            if result.metadata.primary_subject_company:
                print(f"   Company: {result.metadata.primary_subject_company}")
            print(f"   Quality: {result.metadata.quality_metrics.overall_quality:.2f}")


def example_indexing():
    """Demonstrate slide indexing"""
    
    # Initialize
    config = SearchConfig()
    llm_client = LLMClient(config)
    indexer = ApexIndexer(config, llm_client)
    
    # Create index
    indexer.create_index()
    
    # Example slide content
    slide_content = """
    Company Profile: Airbus SE
    
    Global Aerospace Leader
    • Revenue: €58.8B (2023)
    • EBITDA: €5.8B (9.9% margin)
    • Employees: 134,000 globally
    
    Business Segments:
    - Commercial Aircraft (70% of revenue)
    - Defense & Space (15%)
    - Helicopters (15%)
    
    Market Position:
    - #1 in commercial aircraft deliveries (2023)
    - 50% market share in wide-body aircraft
    - Strong order backlog: 8,600+ aircraft ($500B+)
    
    Geographic Presence:
    - Manufacturing: France, Germany, Spain, UK, USA, China
    - Sales: 180+ countries
    """
    
    image_descriptions = [
        "Bar chart showing Airbus revenue growth 2019-2023",
        "World map highlighting Airbus manufacturing locations",
        "Pie chart of revenue by business segment"
    ]
    
    # Generate mock embedding (in production, use actual embedding model)
    embedding = [0.1] * 1024
    
    # Index the slide
    genome = indexer.index_slide(
        slide_content=slide_content,
        image_descriptions=image_descriptions,
        document_name="Airbus_Strategic_Overview_2024.pptx",
        slide_number=3,
        total_slides=42,
        embedding=embedding,
        version=1
    )
    
    print(f"\n✅ Successfully indexed slide with genome:")
    print(f"   Slide ID: {genome.slide_id}")
    print(f"   Section: {genome.pitch_section}")
    print(f"   Primary Company: {genome.primary_subject_company}")
    print(f"   Quality Score: {genome.quality_metrics.overall_quality:.2f}")
    print(f"   Reusability Patterns: {len(genome.reusability_patterns)}")


# ============================================================================
# ADVANCED FEATURES FOR PITCH GENERATION
# ============================================================================

class PitchGenerationAssistant:
    """Assistant for generating pitch decks from search results"""
    
    def __init__(self, search_engine: ApexSearchEngine, llm_client: LLMClient):
        self.search = search_engine
        self.llm = llm_client
    
    def suggest_slide_sequence(self, pitch_context: PitchContext) -> List[Dict]:
        """Suggest optimal slide sequence based on context"""
        
        prompt = f"""You are an elite M&A pitch deck architect. Design the optimal slide sequence for this pitch.

PITCH CONTEXT:
- Target: {pitch_context.target_company}
- Sector: {pitch_context.target_sector}
- Client: {pitch_context.client_name}
- Deal Type: {pitch_context.deal_type}
- Narrative: {pitch_context.pitch_narrative}
- Slide Budget: {pitch_context.slide_budget} slides

Create a slide-by-slide outline that will win this mandate.

Return ONLY valid JSON:
{{
  "slide_sequence": [
    {{
      "position": 1,
      "section": "cover",
      "title": "Proposed slide title",
      "purpose": "What this slide achieves",
      "search_query": "Query to find this content"
    }}
  ],
  "narrative_flow": "Explanation of story arc",
  "critical_slides": [<positions that are make-or-break>]
}}"""
        
        response = self.llm.call_claude(prompt)
        return self.llm.parse_json_response(response)
    
    def auto_populate_deck(self, pitch_context: PitchContext) -> Dict[int, SearchResult]:
        """Automatically find best slides for each position"""
        
        # Get suggested sequence
        sequence = self.suggest_slide_sequence(pitch_context)
        
        # Search for each slide
        deck = {}
        for slide_spec in sequence["slide_sequence"]:
            position = slide_spec["position"]
            query = slide_spec["search_query"]
            
            results = self.search.search(query, pitch_context)
            if results:
                deck[position] = results[0]  # Take best match
        
        return deck
    
    def identify_gaps(self, selected_slides: List[str], pitch_context: PitchContext) -> List[Dict]:
        """Identify missing content in draft deck"""
        
        # Analyze what's present vs needed
        # Return list of gaps with generation suggestions
        pass


# ============================================================================
# ANALYTICS & OPTIMIZATION
# ============================================================================

class SearchAnalytics:
    """Track and optimize search performance"""
    
    def __init__(self, search_engine: ApexSearchEngine):
        self.search = search_engine
    
    def analyze_query_patterns(self) -> Dict:
        """Analyze search patterns to improve system"""
        
        analytics = self.search.search_analytics
        
        # Aggregate statistics
        total_searches = len(analytics)
        intent_distribution = defaultdict(int)
        avg_result_quality = []
        
        for search_data in analytics.values():
            intent_distribution[search_data["intent"]] += 1
            avg_result_quality.append(search_data["top_score"])
        
        return {
            "total_searches": total_searches,
            "intent_distribution": dict(intent_distribution),
            "avg_top_score": sum(avg_result_quality) / len(avg_result_quality) if avg_result_quality else 0,
            "search_satisfaction": sum(1 for s in avg_result_quality if s > 0.8) / total_searches if total_searches else 0
        }
    
    def suggest_improvements(self) -> List[str]:
        """Suggest system improvements based on analytics"""
        
        stats = self.analyze_query_patterns()
        suggestions = []
        
        if stats["avg_top_score"] < 0.7:
            suggestions.append("Consider enriching slide metadata with more semantic tags")
        
        if stats["search_satisfaction"] < 0.6:
            suggestions.append("Review query expansion logic and boost factors")
        
        # Add more sophisticated analysis
        
        return suggestions


# ============================================================================
# PRODUCTION DEPLOYMENT UTILITIES
# ============================================================================

class ProductionDeployment:
    """Utilities for production deployment"""
    
    @staticmethod
    def batch_index_documents(indexer: ApexIndexer, documents: List[Dict]):
        """Batch index multiple documents efficiently"""
        
        print(f"\n🚀 Batch indexing {len(documents)} documents...")
        
        total_slides = 0
        for doc in documents:
            document_name = doc["name"]
            slides = doc["slides"]
            
            print(f"\n📁 Processing: {document_name} ({len(slides)} slides)")
            
            for slide_data in slides:
                genome = indexer.index_slide(
                    slide_content=slide_data["content"],
                    image_descriptions=slide_data.get("image_descriptions", []),
                    document_name=document_name,
                    slide_number=slide_data["slide_number"],
                    total_slides=len(slides),
                    embedding=slide_data["embedding"],
                    version=slide_data.get("version", 1)
                )
                total_slides += 1
            
            print(f"✅ Completed: {document_name}")
        
        print(f"\n🎉 Batch indexing complete: {total_slides} total slides indexed")
    
    @staticmethod
    def health_check(search_engine: ApexSearchEngine) -> Dict:
        """Perform system health check"""
        
        # Test search
        test_results = search_engine.search("test query", None)
        
        # Check index stats
        index_stats = search_engine.os_client.indices.stats(index=search_engine.config.INDEX_NAME)
        
        return {
            "status": "healthy",
            "search_functional": len(test_results) >= 0,
            "index_size": index_stats["_all"]["primaries"]["docs"]["count"],
            "index_size_bytes": index_stats["_all"]["primaries"]["store"]["size_in_bytes"]
        }
    
    @staticmethod
    def backup_index(search_engine: ApexSearchEngine, backup_path: str):
        """Backup index data"""
        # Implementation for backing up OpenSearch index
        pass


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════════════════════════════════════╗
    ║                                                                              ║
    ║                    APEX - Advanced Pitch Excellence System                   ║
    ║                                                                              ║
    ║                  State-of-the-Art M&A Pitch Deck Intelligence                ║
    ║                                                                              ║
    ╚══════════════════════════════════════════════════════════════════════════════╝
    """)
    
    # Initialize system
    print("\n🚀 Initializing APEX System...")
    config = SearchConfig()
    llm_client = LLMClient(config)
    
    # Setup indexer
    print("\n📊 Setting up indexer...")
    indexer = ApexIndexer(config, llm_client)
    # indexer.create_index()  # Uncomment to create index
    
    # Setup search engine
    print("\n🔍 Setting up search engine...")
    search_engine = ApexSearchEngine(config, llm_client)
    
    # Setup generation assistant
    print("\n🎨 Setting up pitch generation assistant...")
    gen_assistant = PitchGenerationAssistant(search_engine, llm_client)
    
    print("\n✅ APEX System Ready!")
    print("\nKey Features:")
    print("  • Neural intent understanding")
    print("  • Multi-dimensional relevance ranking")
    print("  • Complete slide genome extraction")
    print("  • Pitch generation assistance")
    print("  • Real-time search analytics")
    
    print("\n" + "="*80)
    print("USAGE EXAMPLES:")
    print("="*80)
    
    # Run example
    # example_indexing()
    # example_usage()
    
    print("\nSystem is ready for production use!")
=result.get("deal_stage_relevance", []),
                transaction_size_range=result.get("transaction_size_range"),
                deal_complexity=result.get("deal_complexity"),
                financial_metrics=financial_metrics,
                market_intelligence=market_intel,
                transaction_tombstones=tombstones,
                data_types_present=result.get("data_types_present", []),
                key_metrics_highlighted=result.get("key_metrics_highlighted", []),
                key_insights=result.get("key_insights", []),
                supporting_evidence=result.get("supporting_evidence", []),
                data_sources_cited=result.get("data_sources_cited", []),
                assumptions_stated=result.get("assumptions_stated", []),
                layout_type=result.get("layout_type"),
                visual_elements=result.get("visual_elements", []),
                color_scheme=result.get("color_scheme"),
                text_density=result.get("text_density"),
                chart_types=result.get("chart_types", []),
                has_annotations=result.get("has_annotations", False),
                executive_summary=result.get("executive_summary", ""),
                detailed_description=result.get("detailed_description", ""),
                slide_narrative=result.get("slide_narrative", ""),
                key_takeaway=result.get("key_takeaway", ""),
                reusability_patterns=result.get("reusability_patterns", []),
                customization_points=result.get("customization_points", []),
                generation_templates=result.get("generation_templates", []),
                variable_elements=result.get("variable_elements", {}),
                typical_use_cases=result.get("typical_use_cases", []),
                pitch_narratives=result.get("pitch_narratives", []),
                client_types=result.get("client_types", []),
                success_indicators=result.get("success_indicators", []),
                quality_metrics=quality,
                semantic_tags=result.get("semantic_tags", []),
                banker_keywords=result.get("banker_keywords", []),
                search_boosters=result.get("search_boosters", []),
                raw_text=result.get("raw_text", ""),
                image_descriptions=result.get("image_descriptions", []),
                ocr_text=result.get("ocr_text")
            )
            
            # Create SearchResult
            search_result = SearchResult(
                slide_id=result["slide_id"],
                document_name=result["document_name"],
                slide_number=result["slide_number"],
                relevance_score=result.get("_final_score", 0),
                relevance_explanation=rerank_data.get("explanation", "Matched based on search criteria"),
                how_to_use=rerank_data.get("how_to_use", "Review and adapt as needed"),
                adaptation_needed=rerank_data.get("adaptation_guide", "Update company names and dates as needed"),
                metadata=metadata,
                matched_entities=rerank_data.get("matched_entities", []),
                key_snippet=result.get("executive_summary", "")[:300],
                visual_preview_description=f"Layout: {result.get('layout_type', 'unknown')}, Visuals: {', '.join(result.get('visual_elements', [])[:3])}",
                similar_slides=[],  # Could be populated with similarity search
                last_used_in=None,  # Could track usage history
                success_rate=0.0  # Could track conversion metrics
            )
            
            final_results.append(search_result)
        
        return final_results
    
    def _log_search(self, query: str, intent: SearchIntent, results: List[SearchResult]):
        """Log search for analytics"""
        self.search_analytics[datetime.now().isoformat()] = {
            "query": query,
            "intent": intent.primary_intent,
            "results_count": len(results),
            "top_score": results[0].relevance_score if results else 0
        }


# ============================================================================
# INDEXING PIPELINE
# ============================================================================

class ApexIndexer:
    """Elite indexing pipeline for pitch decks"""
    
    def __init__(self, config: SearchConfig, llm_client: LLMClient):
        self.config = config
        self.llm = llm_client
        self.os_client = OpenSearch(
            hosts=[{'host': config.OPENSEARCH_HOST, 'port': config.OPENSEARCH_PORT}],
            http_compress=True,
            use_ssl=False
        )
    
    def create_index(self):
        """Create optimized OpenSearch index"""
        
        index_body = {
            "settings": {
                "number_of_shards": 3,
                "number_of_replicas": 1,
                "analysis": {
                    "analyzer": {
                        "banking_analyzer": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase", "stop", "snowball", "banking_synonyms"]
                        }
                    },
                    "filter": {
                        "banking_synonyms": {
                            "type": "synonym",
                            "synonyms": [
                                "credentials, track record, deal experience, tombstones, mandates, league tables",
                                "company profile, overview, corporate profile, business description",
                                "valuation, DCF, comparable companies, comps, precedent transactions",
                                "M&A, merger, acquisition, deal",
                                "revenue, sales, turnover",
                                "EBITDA, operating income, EBIT",
                                "market size, TAM, total addressable market"
                            ]
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    # Core Identity
                    "slide_id": {"type": "keyword"},
                    "document_name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "slide_number": {"type": "integer"},
                    "version": {"type": "integer"},
                    "created_date": {"type": "date"},
                    "last_modified": {"type": "date"},
                    "is_latest": {"type": "boolean"},
                    "content_hash": {"type": "keyword"},
                    
                    # Classification
                    "pitch_section": {"type": "keyword"},
                    "pitch_subsection": {"type": "keyword"},
                    "slide_sequence_position": {"type": "integer"},
                    "primary_intent": {"type": "keyword"},
                    "secondary_intents": {"type": "keyword"},
                    
                    # Entities
                    "primary_subject_company": {"type": "keyword"},
                    "client_company": {"type": "keyword"},
                    "all_mentioned_companies": {"type": "keyword"},
                    "competitor_companies": {"type": "keyword"},
                    "primary_sector": {"type": "keyword"},
                    "sub_sectors": {"type": "keyword"},
                    "all_geographies": {"type": "keyword"},
                    "deal_types": {"type": "keyword"},
                    
                    # Structured Data (nested objects)
                    "financial_metrics": {
                        "type": "object",
                        "properties": {
                            "revenue_usd_m": {"type": "float"},
                            "ebitda_usd_m": {"type": "float"},
                            "market_cap_usd_m": {"type": "float"},
                            "year": {"type": "integer"}
                        }
                    },
                    "market_intelligence": {
                        "type": "object",
                        "properties": {
                            "market_size_usd_b": {"type": "float"},
                            "market_growth_cagr_pct": {"type": "float"}
                        }
                    },
                    "transaction_tombstones": {
                        "type": "nested",
                        "properties": {
                            "transaction_name": {"type": "text"},
                            "deal_value_usd_m": {"type": "float"},
                            "sector": {"type": "keyword"}
                        }
                    },
                    
                    # Semantic Content
                    "executive_summary": {"type": "text", "analyzer": "banking_analyzer"},
                    "detailed_description": {"type": "text", "analyzer": "banking_analyzer"},
                    "slide_narrative": {"type": "text"},
                    "key_takeaway": {"type": "text"},
                    "key_insights": {"type": "text"},
                    "key_metrics_highlighted": {"type": "text"},
                    
                    # Search Optimization
                    "semantic_tags": {"type": "keyword"},
                    "banker_keywords": {"type": "text", "analyzer": "banking_analyzer"},
                    "search_boosters": {"type": "text"},
                    
                    # Generation Intelligence
                    "reusability_patterns": {"type": "text"},
                    "typical_use_cases": {"type": "text"},
                    "generation_templates": {"type": "text"},
                    
                    # Visual
                    "layout_type": {"type": "keyword"},
                    "visual_elements": {"type": "keyword"},
                    "chart_types": {"type": "keyword"},
                    
                    # Quality
                    "quality_metrics": {
                        "type": "object",
                        "properties": {
                            "overall_quality": {"type": "float"},
                            "data_recency_score": {"type": "float"},
                            "visual_design_score": {"type": "float"},
                            "reusability_score": {"type": "float"}
                        }
                    },
                    
                    # Raw Content
                    "raw_text": {"type": "text", "analyzer": "banking_analyzer"},
                    "image_descriptions": {"type": "text"},
                    
                    # Embeddings for semantic search
                    "embedding": {"type": "knn_vector", "dimension": 1024}
                }
            }
        }
        
        if self.os_client.indices.exists(index=self.config.INDEX_NAME):
            print(f"Index {self.config.INDEX_NAME} already exists")
        else:
            self.os_client.indices.create(index=self.config.INDEX_NAME, body=index_body)
            print(f"✅ Created elite index: {self.config.INDEX_NAME}")
    
    def index_slide(self, slide_content: str, image_descriptions: List[str],
                   document_name: str, slide_number: int, total_slides: int,
                   embedding: List[float], version: int = 1) -> SlideGenome:
        """Index a slide with complete genome extraction"""
        
        print(f"\n📄 Indexing: {document_name} - Slide {slide_number}/{total_slides}")
        
        # Extract slide genome using LLM
        prompt = ApexPrompts.slide_genome_extraction(
            slide_content, image_descriptions, document_name, slide_number, total_slides
        )
        
        response = self.llm.call_mistral(prompt, model=self.config.METADATA_MODEL)
        genome_data = self.llm.parse_json_response(response)
        
        # Generate IDs and hashes
        slide_id = f"{document_name}_s{slide_number:03d}_v{version}"
        content_hash = hashlib.md5(slide_content.encode()).hexdigest()
        created_date = datetime.now().isoformat()
        
        # Build quality metrics
        quality = ContentQuality(
            **genome_data["quality_assessment"]
        )
        quality.calculate_overall()
        
        # Build financial metrics
        fin_data = genome_data["structured_data"]["financial_metrics"]
        financial_metrics = FinancialMetrics(**fin_data) if any(fin_data.values()) else None
        
        # Build market intelligence
        mkt_data = genome_data["structured_data"]["market_intelligence"]
        market_intel = MarketIntelligence(**mkt_data) if any(v for v in mkt_data.values() if v) else None
        
        # Build tombstones
        tombstones = []
        for i, tomb_data in enumerate(genome_data["structured_data"]["transaction_tombstones"]):
            tomb_data["deal_id"] = f"{slide_id}_deal_{i}"
            tombstones.append(TransactionTombstone(**tomb_data))
        
        # Create SlideGenome
        genome = SlideGenome(
            slide_id=slide_id,
            document_name=document_name,
            slide_number=slide_number,
            version=version,
            created_date=created_date,
            last_modified=created_date,
            is_latest=True,
            content_hash=content_hash,
            pitch_section=genome_data["structural_classification"]["pitch_section"],
            pitch_subsection=genome_data["structural_classification"].get("pitch_subsection"),
            slide_sequence_position=genome_data["structural_classification"].get("slide_sequence_position"),
            depends_on_slides=genome_data["structural_classification"].get("depends_on_slides", []),
            enables_slides=genome_data["structural_classification"].get("enables_on_slides", []),
            primary_intent=genome_data["intent_architecture"]["primary_intent"],
            secondary_intents=genome_data["intent_architecture"].get("secondary_intents", []),
            target_audience=genome_data["intent_architecture"].get("target_audience", []),
            emotional_appeal=genome_data["intent_architecture"].get("emotional_appeal"),
            persuasion_technique=genome_data["intent_architecture"].get("persuasion_technique"),
            primary_subject_company=genome_data["entity_universe"].get("primary_subject_company"),
            client_company=genome_data["entity_universe"].get("client_company"),
            all_mentioned_companies=genome_data["entity_universe"].get("all_mentioned_companies", []),
            competitor_companies=genome_data["entity_universe"].get("competitor_companies", []),
            partner_companies=genome_data["entity_universe"].get("partner_companies", []),
            comparable_companies=genome_data["entity_universe"].get("comparable_companies", []),
            primary_sector=genome_data["industry_context"].get("primary_sector"),
            sub_sectors=genome_data["industry_context"].get("sub_sectors", []),
            adjacent_sectors=genome_data["industry_context"].get("adjacent_sectors", []),
            value_chain_position=genome_data["industry_context"].get("value_chain_position"),
            primary_geography=genome_data["geographic_intelligence"].get("primary_geography"),
            all_geographies=genome_data["geographic_intelligence"].get("all_geographies", []),
            geographic_scope=genome_data["geographic_intelligence"].get("geographic_scope"),
            deal_types=genome_data["deal_context"].get("deal_types", []),
            deal_stage_relevance