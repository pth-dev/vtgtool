"""
Gemini AI Service
Handles chat interactions with Google Gemini API
"""
import asyncio
import logging
from typing import Optional
import google.generativeai as genai
from google.api_core import exceptions as google_exceptions

from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    """Service for interacting with Gemini AI API with automatic fallback."""
    
    def __init__(self):
        """Initialize Gemini client with API key."""
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured")
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.primary_model = settings.GEMINI_MODEL_PRIMARY
        self.fallback_model = settings.GEMINI_MODEL_FALLBACK
        self.chat_sessions: dict[str, list] = {}
    
    def _get_system_prompt(self, dashboard_context: Optional[dict] = None) -> str:
        """Build system prompt with optional dashboard context."""
        base_prompt = """You are a friendly AI assistant for VTG Tool - a data analytics platform for Lock/Hold/Failed analysis in the garment industry.

Your responsibilities:
- Analyze and explain dashboard data in a conversational way
- Provide actionable insights and improvement suggestions
- Answer questions about the system and usage
- Help users understand KPI metrics

Communication style:
- Be conversational and natural, like chatting with a helpful colleague
- IMPORTANT: Respond in the English language as the user's message
- Avoid excessive bullet points and formal formatting - use them sparingly
- Keep responses concise but warm and helpful
- When providing data insights, weave numbers naturally into sentences
- Focus on the most important 2-3 insights rather than listing everything
- End with a practical suggestion or offer to help further when appropriate"""

        if dashboard_context:
            context_str = self._format_dashboard_context(dashboard_context)
            return f"{base_prompt}\n\n--- CURRENT DASHBOARD DATA ---\n{context_str}"
        
        return base_prompt
    
    def _format_dashboard_context(self, context: dict) -> str:
        """Format dashboard data for AI context."""
        parts = []
        
        if "month" in context:
            parts.append(f"Month: {context['month']}")
        
        if "kpis" in context:
            kpis = context["kpis"]
            parts.append(f"""
KPI Overview:
- Total orders: {kpis.get('total', 'N/A'):,}
- Lock: {kpis.get('lock', 'N/A'):,} ({kpis.get('lock_rate', 'N/A')}%)
- Hold: {kpis.get('hold', 'N/A'):,} ({kpis.get('hold_rate', 'N/A')}%)
- Failed: {kpis.get('failed', 'N/A'):,} ({kpis.get('failed_rate', 'N/A')}%)""")
        
        if "top_customers" in context:
            customers = context["top_customers"][:5]
            customer_list = "\n".join([f"  - {c['name']}: {c['count']} issues" for c in customers])
            parts.append(f"Top customers with issues:\n{customer_list}")
        
        if "top_root_causes" in context:
            causes = context["top_root_causes"][:5]
            cause_list = "\n".join([f"  - {c['root_cause']}: {c['count']} ({c['percent']}%)" for c in causes])
            parts.append(f"Top root causes:\n{cause_list}")
        
        return "\n".join(parts)
    
    async def send_message(
        self,
        message: str,
        session_id: str = "default",
        dashboard_context: Optional[dict] = None
    ) -> str:
        """
        Send a message to Gemini and get response.
        Automatically falls back to secondary model if primary fails.
        """
        system_prompt = self._get_system_prompt(dashboard_context)
        
        # Get or create chat history for session
        if session_id not in self.chat_sessions:
            self.chat_sessions[session_id] = []
        
        history = self.chat_sessions[session_id]
        
        # Try primary model first
        try:
            response = await self._call_gemini(
                model_name=self.primary_model,
                message=message,
                system_prompt=system_prompt,
                history=history
            )
            logger.info(f"Response from primary model {self.primary_model}")
        except (google_exceptions.ResourceExhausted, google_exceptions.TooManyRequests) as e:
            logger.warning(f"Primary model rate limited, falling back to {self.fallback_model}: {e}")
            response = await self._call_gemini(
                model_name=self.fallback_model,
                message=message,
                system_prompt=system_prompt,
                history=history
            )
            logger.info(f"Response from fallback model {self.fallback_model}")
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            raise
        
        # Update chat history
        history.append({"role": "user", "parts": [message]})
        history.append({"role": "model", "parts": [response]})
        
        # Keep history manageable (last 20 messages)
        if len(history) > 20:
            self.chat_sessions[session_id] = history[-20:]
        
        return response
    
    async def _call_gemini(
        self,
        model_name: str,
        message: str,
        system_prompt: str,
        history: list
    ) -> str:
        """Call Gemini API with specified model."""
        def sync_call() -> str:
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_prompt
            )
            chat = model.start_chat(history=history)
            response = chat.send_message(message)
            return response.text
        
        return await asyncio.to_thread(sync_call)
    
    def clear_history(self, session_id: str = "default") -> None:
        """Clear chat history for a session."""
        if session_id in self.chat_sessions:
            del self.chat_sessions[session_id]
            logger.info(f"Cleared chat history for session {session_id}")
    
    def clear_all_history(self) -> None:
        """Clear all chat histories."""
        self.chat_sessions.clear()
        logger.info("Cleared all chat histories")


# Singleton instance
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Get or create GeminiService singleton."""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
