from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import pandas as pd
import os
from app.core.config import settings

router = APIRouter()

# Cache for ISC data
_isc_cache = {"df": None, "mtime": 0}
MASTER_ISC_PATH = os.path.join(settings.UPLOAD_DIR, "master_isc.csv")


def get_isc_data() -> pd.DataFrame:
    """Load ISC data from master CSV with caching"""
    if not os.path.exists(MASTER_ISC_PATH):
        raise HTTPException(404, "No ISC data uploaded yet")
    
    mtime = os.path.getmtime(MASTER_ISC_PATH)
    if _isc_cache["df"] is None or _isc_cache["mtime"] != mtime:
        df = pd.read_csv(MASTER_ISC_PATH, dtype={"Item code": str})
        # Create lookup dict for O(1) access
        df["_item_upper"] = df["Item code"].str.strip().str.upper()
        _isc_cache["df"] = df
        _isc_cache["mtime"] = mtime
    
    return _isc_cache["df"]


class IscCheckRequest(BaseModel):
    item_code: str
    pick_to_light_stock: float
    requested_quantity: float


class IscCheckResponse(BaseModel):
    item_code: str
    avg_consume: float
    threshold: float
    total: float
    result: str


@router.post("/check", response_model=IscCheckResponse)
async def check_item(data: IscCheckRequest):
    """Check if requested quantity is valid based on ISC data"""
    df = get_isc_data()
    
    item_upper = data.item_code.strip().upper()
    item_rows = df[df["_item_upper"] == item_upper]
    
    if item_rows.empty:
        raise HTTPException(404, f"Item code '{data.item_code}' not found")
    
    # Get first non-NaN Avg Consume value
    avg_values = item_rows["Avg Consume"].dropna()
    if avg_values.empty:
        raise HTTPException(400, f"Avg Consume value is missing for item '{data.item_code}'")
    
    avg_consume = abs(float(avg_values.iloc[0]))
    threshold = 2 * avg_consume
    total = data.pick_to_light_stock + data.requested_quantity
    result = "Yes" if total <= threshold else "No"
    
    return IscCheckResponse(
        item_code=data.item_code,
        avg_consume=avg_consume,
        threshold=threshold,
        total=total,
        result=result
    )
