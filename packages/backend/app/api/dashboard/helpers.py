"""
Dashboard helpers - utility functions for data processing
"""
import math
from typing import Optional


def clean_for_json(obj):
    """Replace NaN/Inf with None for JSON serialization"""
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(v) for v in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
    return obj


def calc_mom_change(current: dict, prev: dict) -> dict:
    """Calculate month-over-month changes"""
    if not prev or not current:
        return {}
    
    def pct_change(curr, prv):
        if not prv: return None
        return round((curr - prv) / prv * 100, 1)
    
    def pts_change(curr, prv):
        if prv is None: return None
        return round(curr - prv, 1)
    
    return {
        "total_orders": pct_change(current.get("total_orders", 0), prev.get("total_orders", 0)),
        "lock_count": pct_change(current.get("lock_count", 0), prev.get("lock_count", 0)),
        "hold_count": pct_change(current.get("hold_count", 0), prev.get("hold_count", 0)),
        "failure_count": pct_change(current.get("failure_count", 0), prev.get("failure_count", 0)),
        "resume_success_rate": pts_change(current.get("resume_success_rate", 0), prev.get("resume_success_rate", 0)),
        "hold_rate": pts_change(current.get("hold_rate", 0), prev.get("hold_rate", 0)),
        "failure_rate": pts_change(current.get("failure_rate", 0), prev.get("failure_rate", 0)),
    }
