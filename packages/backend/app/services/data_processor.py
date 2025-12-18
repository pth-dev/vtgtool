import pandas as pd
from pathlib import Path
from typing import Any
import re
from datetime import datetime

class FileParser:
    """Parse various file formats into DataFrame"""
    
    @staticmethod
    def parse(file_path: str, encoding: str = None) -> pd.DataFrame:
        path = Path(file_path)
        ext = path.suffix.lower()
        
        if ext == '.csv':
            # Try different encodings
            for enc in [encoding, 'utf-8', 'utf-16', 'latin-1']:
                if enc:
                    try:
                        return pd.read_csv(file_path, encoding=enc)
                    except:
                        continue
            return pd.read_csv(file_path)
        elif ext in ['.xlsx', '.xls']:
            return pd.read_excel(file_path)
        elif ext == '.json':
            return pd.read_json(file_path)
        else:
            raise ValueError(f"Unsupported file type: {ext}")
    
    @staticmethod
    def get_metadata(df: pd.DataFrame) -> dict:
        return {
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": [
                {"name": col, "dtype": str(df[col].dtype), "null_count": int(df[col].isnull().sum())}
                for col in df.columns
            ]
        }


class SchemaDetector:
    """DM-001-07: Auto-detect column types"""
    
    DATE_PATTERNS = [
        r'^\d{4}-\d{2}-\d{2}$',  # YYYY-MM-DD
        r'^\d{2}/\d{2}/\d{4}$',  # DD/MM/YYYY
        r'^\d{2}-\d{2}-\d{4}$',  # DD-MM-YYYY
    ]
    
    @staticmethod
    def detect_column_type(series: pd.Series) -> str:
        """Detect semantic type: string, number, date, boolean"""
        non_null = series.dropna()
        if len(non_null) == 0:
            return "string"
        
        # Check boolean
        unique = set(non_null.astype(str).str.lower().unique())
        if unique <= {'true', 'false', '1', '0', 'yes', 'no'}:
            return "boolean"
        
        # Check number
        if pd.api.types.is_numeric_dtype(series):
            return "number"
        
        # Try convert to number
        try:
            pd.to_numeric(non_null)
            return "number"
        except:
            pass
        
        # Check date
        sample = non_null.head(100).astype(str)
        for pattern in SchemaDetector.DATE_PATTERNS:
            if sample.str.match(pattern).mean() > 0.8:
                return "date"
        
        # Try parse as date
        try:
            pd.to_datetime(sample, errors='raise')
            return "date"
        except:
            pass
        
        return "string"
    
    @staticmethod
    def _serialize_value(val: Any) -> Any:
        """Convert value to JSON-serializable type"""
        if pd.isna(val):
            return None
        if isinstance(val, (pd.Timestamp, datetime)):
            return val.isoformat()
        if hasattr(val, 'item'):  # numpy types
            return val.item()
        return val
    
    @staticmethod
    def detect_schema(df: pd.DataFrame) -> list[dict]:
        """Return schema with detected types and sample values"""
        # Force types for known columns
        FORCED_TYPES = {
            'Reporting day': 'date',
            'Production No': 'number',
        }
        
        schema = []
        for col in df.columns:
            # Use forced type if defined, otherwise detect
            col_type = FORCED_TYPES.get(col, SchemaDetector.detect_column_type(df[col]))
            sample_raw = df[col].dropna().head(5).tolist()
            sample = [SchemaDetector._serialize_value(v) for v in sample_raw]
            schema.append({
                "name": col,
                "original_dtype": str(df[col].dtype),
                "detected_type": col_type,
                "nullable": bool(df[col].isnull().any()),
                "unique_count": int(df[col].nunique()),
                "null_count": int(df[col].isnull().sum()),
                "sample_values": sample
            })
        return schema


class DataValidator:
    """DM-001-06: Validate data format, duplicates, encoding"""
    
    @staticmethod
    def validate(df: pd.DataFrame) -> dict:
        errors = []
        warnings = []
        
        # Check duplicates
        dup_count = df.duplicated().sum()
        if dup_count > 0:
            warnings.append(f"Found {dup_count} duplicate rows")
        
        # Check empty columns
        empty_cols = [col for col in df.columns if df[col].isnull().all()]
        if empty_cols:
            warnings.append(f"Empty columns: {empty_cols}")
        
        # Check column name issues
        for col in df.columns:
            col_str = str(col)
            if not col_str or col_str.strip() == '':
                errors.append("Found column with empty name")
            if col_str.startswith('Unnamed'):
                warnings.append(f"Column '{col_str}' may be auto-generated")
        
        return {
            "valid": len(errors) == 0,
            "row_count": len(df),
            "column_count": len(df.columns),
            "duplicate_rows": int(dup_count),
            "errors": errors,
            "warnings": warnings
        }


class DataCleaner:
    """Clean and transform data"""
    
    @staticmethod
    def clean(df: pd.DataFrame) -> pd.DataFrame:
        # Remove duplicates
        df = df.drop_duplicates()
        # Standardize column names - convert to string first
        df.columns = [str(col).lower().strip().replace(' ', '_') for col in df.columns]
        return df
    
    @staticmethod
    def fill_nulls(df: pd.DataFrame, strategy: str = "drop") -> pd.DataFrame:
        if strategy == "drop":
            return df.dropna()
        elif strategy == "zero":
            return df.fillna(0)
        elif strategy == "mean":
            return df.fillna(df.mean(numeric_only=True))
        return df


class DataTransformer:
    """Transform data for visualization"""
    
    @staticmethod
    def to_chart_data(df: pd.DataFrame, x_col: str, y_col: str = None, agg: str = "count", group_by: str = None) -> list[dict]:
        if agg == "count":
            if group_by:
                grouped = df.groupby([x_col, group_by]).size().unstack(fill_value=0)
                return [{"name": str(idx), **{str(c): int(grouped.loc[idx, c]) for c in grouped.columns}} for idx in grouped.index]
            return [{"name": str(k), "value": int(v)} for k, v in df.groupby(x_col).size().items()]
        
        if not y_col:
            y_col = df.select_dtypes(include='number').columns[0] if len(df.select_dtypes(include='number').columns) > 0 else df.columns[0]
        
        if group_by:
            grouped = df.groupby([x_col, group_by])[y_col].agg(agg).unstack(fill_value=0)
            return [{"name": str(idx), **{str(c): float(grouped.loc[idx, c]) for c in grouped.columns}} for idx in grouped.index]
        
        grouped = df.groupby(x_col)[y_col].agg(agg)
        return [{"name": str(k), "value": float(v)} for k, v in grouped.items()]
    
    @staticmethod
    def _serialize_row(row: dict) -> dict:
        """Convert all values in a row to JSON-serializable types"""
        result = {}
        for key, val in row.items():
            if pd.isna(val):
                result[key] = None
            elif isinstance(val, (pd.Timestamp, datetime)):
                result[key] = val.isoformat()
            elif hasattr(val, 'item'):  # numpy types
                result[key] = val.item()
            else:
                result[key] = val
        return result
    
    @staticmethod
    def to_json(df: pd.DataFrame, limit: int = None) -> list[dict]:
        if limit:
            df = df.head(limit)
        records = df.to_dict(orient="records")
        return [DataTransformer._serialize_row(row) for row in records]
