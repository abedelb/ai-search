
Copy

"""
Research Agent with LangGraph - Enhanced Version
- Integration with retrieval_service
- Streaming support
- Clear citation format [1], [2] to avoid confusion with filenames like file(1)
"""

from typing import TypedDict, Annotated, List, Dict, Any, AsyncGenerator
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_anthropic import ChatAnthropic
import operator
import re
import asyncio


# Type definitions for the agent state
class AgentState(TypedDict):
    """State for the research agent"""
    messages: Annotated[List, operator.add]
    query: str
    search_results: List[Dict[str, Any]]
    citations: Dict[str, str]  # Maps citation number to page_id
    final_response: str


class RetrievalService:
    """
    Simulated retrieval service that wraps OpenSearch functionality.
    Replace this with your actual retrieval service.
    """
    
    def __init__(self):
        """Initialize the retrieval service"""
        # In real implementation, this would set up OpenSearch connection
        self.index_name = "pitch_slides"
    
    def search(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Search the indexed slides.
        
        Args:
            query: Search query string
            max_results: Maximum number of results to return
            
        Returns:
            List of search results with structure:
            [
                {
                    "raw_text": "Slide content...",
                    "page_id": "doc-id-slide-number",
                    "score": 0.95,  # Optional
                    "metadata": {}   # Optional
                },
                ...
            ]
        """
        # This is a simulation - replace with your actual OpenSearch implementation
        mock_results = [
            {
                "raw_text": "Q4 2024 revenue reached $2.5M, representing a 45% year-over-year increase. This growth was primarily driven by our enterprise segment, which expanded by 60%.",
                "page_id": "deck-2024-q4-slide-3",
                "score": 0.95,
                "metadata": {"deck_name": "Q4 2024 Results", "slide_number": 3}
            },
            {
                "raw_text": "Customer acquisition cost (CAC) decreased from $450 to $315, a 30% improvement. Meanwhile, customer lifetime value (LTV) increased from $2,000 to $2,500, improving our LTV:CAC ratio to 7.9x.",
                "page_id": "deck-2024-q4-slide-7",
                "score": 0.89,
                "metadata": {"deck_name": "Q4 2024 Results", "slide_number": 7}
            },
            {
                "raw_text": "We successfully expanded to 3 new European markets: Germany, France, and Spain. Germany showed the strongest early adoption with 40% month-over-month growth in user signups.",
                "page_id": "deck-2024-expansion-slide-5",
                "score": 0.82,
                "metadata": {"deck_name": "2024 Expansion Strategy", "slide_number": 5}
            },
            {
                "raw_text": "Our SaaS platform now serves 250 enterprise clients, up from 150 in Q3. Average contract value increased to $45,000 annually.",
                "page_id": "deck-2024-q4-slide-12",
                "score": 0.78,
                "metadata": {"deck_name": "Q4 2024 Results", "slide_number": 12}
            },
            {
                "raw_text": "Partnership with Microsoft Azure resulted in 50+ co-selling opportunities valued at $3.2M total pipeline. Integration is complete and live in Azure Marketplace.",
                "page_id": "deck-2024-partnerships-slide-2",
                "score": 0.75,
                "metadata": {"deck_name": "Strategic Partnerships", "slide_number": 2}
            }
        ]
        
        # Simple keyword filtering for demo
        query_lower = query.lower()
        filtered_results = []
        
        for result in mock_results:
            text_lower = result["raw_text"].lower()
            if any(word in text_lower for word in query_lower.split()):
                filtered_results.append(result)
        
        return filtered_results[:max_results]


class StreamingResearchAgent:
    """
    LangGraph-based research agent with streaming support and clear citations.
    Uses [1], [2] format instead of (1), (2) to avoid confusion with filenames.
    """
    
    def __init__(
        self, 
        retrieval_service: RetrievalService,
        llm_model: str = "claude-sonnet-4-5-20250929"
    ):
        """
        Initialize the research agent.
        
        Args:
            retrieval_service: The retrieval service instance
            llm_model: The Claude model to use for generation
        """
        self.retrieval_service = retrieval_service
        self.llm = ChatAnthropic(model=llm_model, temperature=0)
        self.streaming_llm = ChatAnthropic(model=llm_model, temperature=0, streaming=True)
        self.graph = self._build_graph()
        
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow"""
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("analyze_query", self.analyze_query)
        workflow.add_node("search_pitches", self.search_pitches)
        workflow.add_node("generate_response", self.generate_response)
        
        # Define the flow
        workflow.set_entry_point("analyze_query")
        workflow.add_edge("analyze_query", "search_pitches")
        workflow.add_edge("search_pitches", "generate_response")
        workflow.add_edge("generate_response", END)
        
        return workflow.compile()
    
    def analyze_query(self, state: AgentState) -> AgentState:
        """
        Analyze the user query to extract search keywords.
        """
        query = state["query"]
        
        system_prompt = """You are a query analyzer. Extract the key search terms from the user's question.
Focus on:
- Main topics and concepts
- Specific company names, products, or technologies
- Key metrics or data points mentioned

Return only the refined search query, nothing else."""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"User query: {query}\n\nExtract search keywords:")
        ]
        
        response = self.llm.invoke(messages)
        refined_query = response.content.strip()
        
        return {
            "messages": [AIMessage(content=f"Searching for: {refined_query}")],
            "query": refined_query
        }
    
    def search_pitches(self, state: AgentState) -> AgentState:
        """
        Search internal pitches using the retrieval service.
        """
        query = state["query"]
        
        try:
            # Use the retrieval service to search
            results = self.retrieval_service.search(query, max_results=10)
            
            return {
                "search_results": results,
                "messages": [AIMessage(content=f"Found {len(results)} relevant slides")]
            }
        except Exception as e:
            return {
                "search_results": [],
                "messages": [AIMessage(content=f"Search error: {str(e)}")]
            }
    
    def generate_response(self, state: AgentState) -> AgentState:
        """
        Generate a response based on search results with proper citations.
        Uses [1], [2] format for clarity.
        """
        query = state["query"]
        search_results = state["search_results"]
        
        if not search_results:
            return {
                "final_response": "I couldn't find any relevant information in the internal pitches for your query.",
                "citations": {},
                "messages": [AIMessage(content="No results found")]
            }
        
        # Prepare context with numbered sources
        context_parts = []
        citation_map = {}
        
        for idx, result in enumerate(search_results, 1):
            context_parts.append(f"[Source {idx}]\n{result['raw_text']}\nPage ID: {result['page_id']}\n")
            citation_map[str(idx)] = result['page_id']
        
        context = "\n".join(context_parts)
        
        system_prompt = """You are a research assistant analyzing internal pitch materials.

CRITICAL CITATION RULES:
1. Always cite sources using [1], [2], [3] format (square brackets, NOT parentheses)
2. Place citations immediately after the relevant claim
3. Use multiple citations if a claim is supported by multiple sources: [1, 2]
4. Every factual claim must have a citation
5. Do not make claims without source support
6. NEVER use parentheses (1) for citations - ALWAYS use square brackets [1]

The square bracket format [1] is used to distinguish citations from filenames like file(1).

Provide a comprehensive answer that:
- Directly addresses the user's question
- Synthesizes information from multiple sources when relevant
- Uses clear, professional language
- Properly cites every claim with source numbers in SQUARE BRACKETS

Example format:
"The revenue grew by 45% in Q3 [1]. The main driver was the new product line [2], which exceeded expectations [1, 3]."
"""
        
        user_prompt = f"""Based on the following sources from internal pitches, answer this question:

Question: {query}

Sources:
{context}

Provide a well-cited response using [1], [2] format for citations:"""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = self.llm.invoke(messages)
        
        return {
            "final_response": response.content,
            "citations": citation_map,
            "messages": [AIMessage(content="Response generated with citations")]
        }
    
    async def generate_response_streaming(
        self, 
        state: AgentState
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Generate a streaming response based on search results.
        Yields chunks as they're generated.
        """
        query = state["query"]
        search_results = state["search_results"]
        
        if not search_results:
            yield {
                "type": "final",
                "content": "I couldn't find any relevant information in the internal pitches for your query.",
                "citations": {},
                "done": True
            }
            return
        
        # Prepare context
        context_parts = []
        citation_map = {}
        
        for idx, result in enumerate(search_results, 1):
            context_parts.append(f"[Source {idx}]\n{result['raw_text']}\nPage ID: {result['page_id']}\n")
            citation_map[str(idx)] = result['page_id']
        
        context = "\n".join(context_parts)
        
        system_prompt = """You are a research assistant analyzing internal pitch materials.

CRITICAL CITATION RULES:
1. Always cite sources using [1], [2], [3] format (square brackets, NOT parentheses)
2. Place citations immediately after the relevant claim
3. Use multiple citations if a claim is supported by multiple sources: [1, 2]
4. Every factual claim must have a citation
5. Do not make claims without source support
6. NEVER use parentheses (1) for citations - ALWAYS use square brackets [1]

Provide a comprehensive answer with proper citations in SQUARE BRACKETS [1], [2], etc."""
        
        user_prompt = f"""Based on the following sources from internal pitches, answer this question:

Question: {query}

Sources:
{context}

Provide a well-cited response:"""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        # Stream the response
        full_response = ""
        async for chunk in self.streaming_llm.astream(messages):
            content = chunk.content
            full_response += content
            
            yield {
                "type": "chunk",
                "content": content,
                "done": False
            }
        
        # Send final message with citations
        citations_in_response = self._extract_citations(full_response)
        page_references = {
            num: citation_map[num] 
            for num in citations_in_response 
            if num in citation_map
        }
        
        yield {
            "type": "final",
            "content": full_response,
            "citations": page_references,
            "done": True
        }
    
    def run(self, query: str) -> Dict[str, Any]:
        """
        Run the research agent on a query (non-streaming).
        
        Args:
            query: User's research question
            
        Returns:
            Dictionary with response, citations, and page_ids
        """
        initial_state = {
            "messages": [],
            "query": query,
            "search_results": [],
            "citations": {},
            "final_response": ""
        }
        
        final_state = self.graph.invoke(initial_state)
        
        # Extract citation numbers from the response
        response_text = final_state["final_response"]
        citations_in_response = self._extract_citations(response_text)
        
        # Map citations to page_ids
        page_references = {}
        for citation_num in citations_in_response:
            if citation_num in final_state["citations"]:
                page_references[citation_num] = final_state["citations"][citation_num]
        
        return {
            "response": response_text,
            "citations": page_references,
            "num_sources": len(final_state["search_results"])
        }
    
    async def run_streaming(self, query: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Run the research agent with streaming (async).
        
        Args:
            query: User's research question
            
        Yields:
            Dictionaries with streaming updates
        """
        # Step 1: Analyze query
        yield {"type": "status", "content": "Analyzing query...", "step": "analyze"}
        
        initial_state = {
            "messages": [],
            "query": query,
            "search_results": [],
            "citations": {},
            "final_response": ""
        }
        
        state = self.analyze_query(initial_state)
        
        # Step 2: Search
        yield {"type": "status", "content": "Searching internal pitches...", "step": "search"}
        
        state = self.search_pitches(state)
        
        if not state["search_results"]:
            yield {
                "type": "final",
                "content": "No relevant results found.",
                "citations": {},
                "done": True
            }
            return
        
        # Step 3: Generate response (streaming)
        yield {
            "type": "status", 
            "content": f"Found {len(state['search_results'])} sources. Generating answer...", 
            "step": "generate"
        }
        
        async for chunk in self.generate_response_streaming(state):
            yield chunk
    
    def _extract_citations(self, text: str) -> List[str]:
        """Extract citation numbers from text like [1], [2, 3], etc."""
        pattern = r'\[(\d+(?:,\s*\d+)*)\]'
        matches = re.findall(pattern, text)
        
        citation_numbers = []
        for match in matches:
            # Split by comma and clean up
            nums = [num.strip() for num in match.split(',')]
            citation_numbers.extend(nums)
        
        return list(set(citation_numbers))


# Factory function
def create_research_agent(retrieval_service: RetrievalService) -> StreamingResearchAgent:
    """
    Factory function to create a research agent with streaming support.
    
    Args:
        retrieval_service: Your retrieval service instance
        
    Returns:
        Configured StreamingResearchAgent instance
    """
    return StreamingResearchAgent(retrieval_service)


if __name__ == "__main__":
    # Example usage
    import asyncio
    
    async def demo():
        # Create retrieval service
        retrieval_service = RetrievalService()
        
        # Create agent
        agent = create_research_agent(retrieval_service)
        
        # Test non-streaming
        print("="*80)
        print("NON-STREAMING MODE")
        print("="*80)
        result = agent.run("What were our Q4 revenue results?")
        print(f"\nResponse:\n{result['response']}")
        print(f"\nCitations:")
        for num, page_id in result['citations'].items():
            print(f"  [{num}] -> {page_id}")
        
        # Test streaming
        print("\n\n" + "="*80)
        print("STREAMING MODE")
        print("="*80)
        print("\nQuery: What are our key customer metrics?\n")
        
        async for chunk in agent.run_streaming("What are our key customer metrics?"):
            if chunk["type"] == "status":
                print(f"\n[{chunk['step'].upper()}] {chunk['content']}")
            elif chunk["type"] == "chunk":
                print(chunk["content"], end="", flush=True)
            elif chunk["type"] == "final":
                print("\n\nCitations:")
                for num, page_id in chunk['citations'].items():
                    print(f"  [{num}] -> {page_id}")
    
    asyncio.run(demo())
