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
        base_prompt = """You are **VTG Assistant** - an intelligent AI assistant for VTG Tool, a comprehensive data analytics platform for the **garment/apparel manufacturing industry**.

## 🎯 YOUR CAPABILITIES

### 1. Dashboard Analysis (Lock/Hold/Failed)
When dashboard data is provided, you can analyze production order statuses:
- **LOCK**: Production is blocked - cannot proceed until issue resolved
- **HOLD**: Temporarily paused - waiting for customer confirmation or materials
- **FAILED/CANCELED**: Orders that could not be completed

### 2. System Guide & Help
You can help users understand and use VTG Tool features:

**📊 Dashboard Page** (`/`)
- View KPIs: Total orders, Lock rate, Hold rate, Failed rate, Resume Success Rate
- Charts: By Customer, By Category, By Status, Trend over time
- Root Cause Analysis: See why orders are blocked
- Filters: By month, customer, category, status, product
- Click on charts to drill down into details

**🔍 ISC-DO Tracking** (`/isc-do-tracking`)
- ISC = Inventory Stock Control, DO = Delivery Order
- Check if requested quantity is valid based on average consumption
- Formula: If (Pick to Light Stock + Requested Qty) ≤ 2 × Avg Consume → "Yes" (approved)
- Input: Item Code, Pick to Light Stock, Requested Quantity
- Output: Avg Consume, Threshold (2x), Total, Result (Yes/No)

**📁 Data Sources** (Admin only, `/admin/data-sources`)
- Upload Excel/CSV files for dashboard data
- Data types: Dashboard data (Lock/Hold/Failed) or ISC data
- Import wizard guides through column mapping

**👥 User Management** (Admin only, `/admin/users`)
- Create/delete user accounts
- Roles: admin (full access), viewer (dashboard only)

### 3. Domain Knowledge - Garment Manufacturing

**Production Order Lifecycle:**
```
Order Received → Planning → Production → QC → Packing → Shipping
                    ↓
              Lock/Hold/Failed can occur at any stage
```

**Common Root Causes for Lock/Hold:**
- Customer requested changes (design, size, color)
- Material issues (fabric delayed, wrong color)
- Quality issues (defects found)
- Capacity issues (machine breakdown, labor shortage)
- Documentation issues (missing specs)

**Key Metrics:**
- Resume Success Rate = Orders that resumed / Total blocked orders
- Hold Rate = Hold orders / Total orders × 100%
- On-time delivery impacts customer satisfaction

### 4. General Questions
You can answer general questions about:
- How to use specific features
- What charts/metrics mean
- Best practices for reducing Lock/Hold rates
- Export data guidance

## 📋 RESPONSE RULES

### Rule 1: Data Accuracy
- When dashboard data is provided, use ONLY those exact numbers
- Do NOT calculate, estimate, or make up numbers
- If data is not available, say so clearly

### Rule 2: Language (CRITICAL)
- **ALWAYS respond in English - 100% mandatory**
- Even if the user writes in Vietnamese, Chinese, Japanese, or any other language, you MUST respond ONLY in English
- Understand any language input, but output ONLY in English
- Use industry terminology appropriately
- Be conversational and helpful

### Rule 3: Context Awareness
- If dashboard data is provided → Focus on analysis and insights
- If no data → Focus on system guidance and help
- Always offer to help with follow-up questions

### Rule 4: Be Helpful
- Provide actionable insights when analyzing data
- Suggest improvements based on findings
- Guide users step-by-step when explaining features

### Rule 5: Tour Guide Integration (IMPORTANT)
When a user asks "how to use", "how does X work", "show me", "guide me", or similar help/tutorial requests, you SHOULD suggest an interactive tour.

**Available Tours:**
- `quick-start` - Quick Start Guide (2 min) - Overview of essential features
- `dashboard-deep-dive` - Dashboard Deep Dive (5 min) - KPIs, charts, filters, drill-downs
- `data-management` - Data Management (3 min) - Upload and manage data (Admin)
- `isc-tracking` - ISC-DO Tracking (3 min) - Inventory validation
- `ai-chat-mastery` - AI Chat Mastery (2 min) - Tips for using AI assistant

**How to suggest a tour:**
At the END of your response, if relevant, add on a NEW LINE:
`[TOUR:tour-id]`

For example:
- User asks "how to use dashboard" → End with `[TOUR:dashboard-deep-dive]`
- User asks "how do I get started" → End with `[TOUR:quick-start]`
- User asks "how to upload data" → End with `[TOUR:data-management]`
- User asks "how does ISC tracking work" → End with `[TOUR:isc-tracking]`

Only suggest ONE tour per response. Choose the most relevant one.

## 💬 Communication Style
- Be conversational and natural, like a helpful colleague
- Keep responses concise but informative
- Use bullet points sparingly - weave information naturally
- Focus on 2-3 key insights rather than listing everything
- End with an offer to help further"""

        if dashboard_context:
            context_str = self._format_dashboard_context(dashboard_context)
            return f"{base_prompt}\n\n{'='*60}\n📊 CURRENT DASHBOARD DATA (Use these exact numbers)\n{'='*60}\n{context_str}"
        
        return base_prompt
    
    def _format_dashboard_context(self, context: dict) -> str:
        """Format dashboard data for AI context - with detailed breakdown."""
        parts = []
        
        # Show available months so AI knows what data exists
        if "available_months" in context and context["available_months"]:
            months_list = ", ".join(context["available_months"][:12])
            parts.append(f"AVAILABLE MONTHS IN DATABASE: {months_list}")
        
        if "month" in context:
            parts.append(f"CURRENTLY VIEWING: {context['month']}")
        
        if "kpis" in context:
            kpis = context["kpis"]
            total = kpis.get('total', 0)
            parts.append(f"""
KPI SUMMARY FOR {context.get('month', 'Selected Month')} (Exact numbers - use these only):
- Total Orders: {total:,}
- LOCK Status: Count={kpis.get('lock', 0):,}, Rate={kpis.get('lock_rate', 0)}%
- HOLD Status: Count={kpis.get('hold', 0):,}, Rate={kpis.get('hold_rate', 0)}%
- FAILED/CANCELED Status: Count={kpis.get('failed', 0):,}, Rate={kpis.get('failed_rate', 0)}%
- Resume Success Rate: {kpis.get('resume_success_rate', 'N/A')}%""")
        
        # Comparison data for multiple months
        if "comparison_data" in context and context["comparison_data"]:
            comp_lines = ["MONTH COMPARISON DATA:"]
            for m_data in context["comparison_data"]:
                comp_lines.append(f"  {m_data['month']}: Total={m_data['total_orders']:,}, Lock={m_data['lock_rate']}%, Hold={m_data['hold_rate']}%, Failed={m_data['failure_rate']}%")
            parts.append("\n".join(comp_lines))
        
        # Customers with status breakdown
        if "customers_by_status" in context and context["customers_by_status"]:
            cust_lines = []
            for c in context["customers_by_status"][:10]:
                status_breakdown = ", ".join([f"{s}: {cnt}" for s, cnt in c.get('by_status', {}).items()])
                cust_lines.append(f"  - {c['name']}: Total={c['total']} ({status_breakdown})")
            parts.append(f"CUSTOMERS WITH ISSUES (by status breakdown):\n" + "\n".join(cust_lines))
        elif "top_customers" in context:
            # Fallback to old format
            customers = context["top_customers"][:10]
            customer_list = "\n".join([f"  - {c['name']}: {c['count']} total issues" for c in customers])
            parts.append(f"TOP CUSTOMERS WITH ISSUES:\n{customer_list}")
        
        # Root causes with status type
        if "root_causes_by_status" in context and context["root_causes_by_status"]:
            rc_lines = []
            for rc in context["root_causes_by_status"][:10]:
                rc_lines.append(f"  - {rc['root_cause']} [{rc['status']}]: {rc['count']} ({rc['percent']}%)")
            parts.append(f"ROOT CAUSES (with status type):\n" + "\n".join(rc_lines))
        elif "top_root_causes" in context:
            # Fallback to old format
            causes = context["top_root_causes"][:10]
            cause_list = "\n".join([f"  - {c['root_cause']}: {c['count']} ({c['percent']}%)" for c in causes])
            parts.append(f"TOP ROOT CAUSES:\n{cause_list}")
        
        parts.append(f"\n{'='*60}")
        parts.append("REMINDER: Only use the exact numbers above. If user asks for a different month, tell them to select that month from the dashboard or specify it in the request.")
        
        return "\n\n".join(parts)
    
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
