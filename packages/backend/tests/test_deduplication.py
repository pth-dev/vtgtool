"""
Property-based tests for DeduplicationService.

Tests validate correctness properties defined in the design document:
- Property 1: Latest Date Retention
- Property 2: Exact String Matching  
- Property 3: Unique Record Preservation
- Property 4: Statistics Correctness
- Property 5: Idempotence
"""

import pytest
import pandas as pd
from datetime import date, timedelta
from hypothesis import given, strategies as st, settings, assume

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.deduplication import DeduplicationService, DeduplicationResult


# Custom strategies for generating test data
@st.composite
def production_order_strategy(draw):
    """Generate realistic Production Order numbers like RR11541B"""
    prefix = draw(st.sampled_from(['RR', 'PO', 'WO', 'MO']))
    number = draw(st.integers(min_value=10000, max_value=99999))
    suffix = draw(st.sampled_from(['A', 'B', 'C', 'D', 'E', '']))
    return f"{prefix}{number}{suffix}"


@st.composite
def date_strategy(draw):
    """Generate dates within a reasonable range"""
    days_offset = draw(st.integers(min_value=0, max_value=365))
    base_date = date(2024, 1, 1)
    return base_date + timedelta(days=days_offset)


@st.composite
def dataframe_with_duplicates_strategy(draw):
    """Generate DataFrame with potential duplicates"""
    num_unique_orders = draw(st.integers(min_value=1, max_value=20))
    
    # Generate unique order numbers
    orders = [draw(production_order_strategy()) for _ in range(num_unique_orders)]
    
    records = []
    for order in orders:
        # Each order can appear 1-5 times with different dates
        num_occurrences = draw(st.integers(min_value=1, max_value=5))
        dates = [draw(date_strategy()) for _ in range(num_occurrences)]
        
        for d in dates:
            records.append({
                'Production Order No.': order,
                'Reporting day': d,
                'Customer': draw(st.text(min_size=1, max_size=10, alphabet='ABCDEFGHIJ')),
                'Status': draw(st.sampled_from(['HOLD', 'LOCK', 'FAILURE', 'OK']))
            })
    
    return pd.DataFrame(records)


class TestDeduplicationProperties:
    """
    Property-based tests for DeduplicationService.
    Feature: production-order-deduplication
    """
    
    @given(df=dataframe_with_duplicates_strategy())
    @settings(max_examples=100)
    def test_property_1_latest_date_retention(self, df):
        """
        Property 1: Latest Date Retention
        
        For any set of records with the same Production_Order_No, 
        after deduplication, only the record with the maximum Reporting_Day SHALL remain.
        
        **Validates: Requirements 1.3, 2.1**
        """
        result_df, _ = DeduplicationService.deduplicate_dataframe(df)
        
        # For each unique Production Order in result, verify it has the max date from original
        for order in result_df['Production Order No.'].dropna().unique():
            result_date = result_df[
                result_df['Production Order No.'] == order
            ]['Reporting day'].iloc[0]
            
            original_dates = df[
                df['Production Order No.'] == order
            ]['Reporting day']
            
            expected_max_date = original_dates.max()
            
            assert result_date == expected_max_date, \
                f"Order {order}: expected date {expected_max_date}, got {result_date}"
    
    @given(df=dataframe_with_duplicates_strategy())
    @settings(max_examples=100)
    def test_property_3_unique_record_preservation(self, df):
        """
        Property 3: Unique Record Preservation
        
        For any record with a Production_Order_No that appears exactly once 
        in the input, that record SHALL exist unchanged in the output.
        
        **Validates: Requirements 2.4**
        """
        result_df, _ = DeduplicationService.deduplicate_dataframe(df)
        
        # Find orders that appear exactly once in original
        order_counts = df['Production Order No.'].value_counts()
        unique_orders = order_counts[order_counts == 1].index.tolist()
        
        for order in unique_orders:
            if pd.isna(order):
                continue
                
            # This order should exist in result
            assert order in result_df['Production Order No.'].values, \
                f"Unique order {order} was incorrectly removed"
            
            # The record should be unchanged
            original_record = df[df['Production Order No.'] == order].iloc[0]
            result_record = result_df[result_df['Production Order No.'] == order].iloc[0]
            
            assert original_record['Reporting day'] == result_record['Reporting day'], \
                f"Unique order {order} date was modified"
    
    @given(df=dataframe_with_duplicates_strategy())
    @settings(max_examples=100)
    def test_property_4_statistics_correctness(self, df):
        """
        Property 4: Statistics Correctness
        
        For any deduplication operation, the returned statistics SHALL satisfy:
        original_count - duplicates_removed == final_count
        
        **Validates: Requirements 2.3, 3.4**
        """
        result_df, stats = DeduplicationService.deduplicate_dataframe(df)
        
        # Verify the invariant
        assert stats.original_count - stats.duplicates_removed == stats.final_count, \
            f"Stats mismatch: {stats.original_count} - {stats.duplicates_removed} != {stats.final_count}"
        
        # Verify counts match actual data
        assert stats.original_count == len(df), \
            f"Original count mismatch: {stats.original_count} != {len(df)}"
        assert stats.final_count == len(result_df), \
            f"Final count mismatch: {stats.final_count} != {len(result_df)}"
    
    @given(df=dataframe_with_duplicates_strategy())
    @settings(max_examples=100)
    def test_property_5_idempotence(self, df):
        """
        Property 5: Idempotence
        
        For any dataset, applying deduplication twice SHALL produce 
        the same result as applying it once:
        deduplicate(deduplicate(data)) == deduplicate(data)
        
        **Validates: Requirements 2.1, 2.4**
        """
        # First deduplication
        result1, stats1 = DeduplicationService.deduplicate_dataframe(df)
        
        # Second deduplication on already deduplicated data
        result2, stats2 = DeduplicationService.deduplicate_dataframe(result1)
        
        # Results should be identical
        assert len(result1) == len(result2), \
            f"Idempotence violated: {len(result1)} != {len(result2)}"
        
        # Second pass should remove nothing
        assert stats2.duplicates_removed == 0, \
            f"Second deduplication removed {stats2.duplicates_removed} records"
        
        # DataFrames should be equal (ignoring index)
        pd.testing.assert_frame_equal(
            result1.reset_index(drop=True).sort_values('Production Order No.').reset_index(drop=True),
            result2.reset_index(drop=True).sort_values('Production Order No.').reset_index(drop=True)
        )


class TestDeduplicationEdgeCases:
    """Unit tests for edge cases"""
    
    def test_empty_dataframe(self):
        """Test with empty DataFrame"""
        df = pd.DataFrame(columns=['Production Order No.', 'Reporting day'])
        result, stats = DeduplicationService.deduplicate_dataframe(df)
        
        assert len(result) == 0
        assert stats.original_count == 0
        assert stats.duplicates_removed == 0
        assert stats.final_count == 0
    
    def test_missing_production_order_column(self):
        """Test when Production Order No. column is missing"""
        df = pd.DataFrame({
            'Reporting day': [date(2024, 1, 1)],
            'Customer': ['Test']
        })
        result, stats = DeduplicationService.deduplicate_dataframe(df)
        
        # Should return original unchanged
        assert len(result) == 1
        assert stats.duplicates_removed == 0
    
    def test_missing_reporting_day_column(self):
        """Test when Reporting day column is missing"""
        df = pd.DataFrame({
            'Production Order No.': ['RR12345A'],
            'Customer': ['Test']
        })
        result, stats = DeduplicationService.deduplicate_dataframe(df)
        
        # Should return original unchanged
        assert len(result) == 1
        assert stats.duplicates_removed == 0
    
    def test_null_production_orders_preserved(self):
        """Test that records with NULL Production Order are preserved"""
        df = pd.DataFrame({
            'Production Order No.': ['RR12345A', None, 'RR12345A', None],
            'Reporting day': [
                date(2024, 1, 1), 
                date(2024, 1, 2), 
                date(2024, 1, 3),
                date(2024, 1, 4)
            ]
        })
        result, stats = DeduplicationService.deduplicate_dataframe(df)
        
        # Should have 1 RR12345A (latest) + 2 NULL records = 3 total
        assert len(result) == 3
        assert result['Production Order No.'].isna().sum() == 2
    
    def test_same_order_same_date(self):
        """Test when same order appears multiple times on same date"""
        df = pd.DataFrame({
            'Production Order No.': ['RR12345A', 'RR12345A'],
            'Reporting day': [date(2024, 1, 1), date(2024, 1, 1)],
            'Customer': ['Customer1', 'Customer2']
        })
        result, stats = DeduplicationService.deduplicate_dataframe(df)
        
        # Should keep only one
        assert len(result) == 1
        assert stats.duplicates_removed == 1
    
    def test_exact_string_matching(self):
        """
        Property 2: Exact String Matching
        
        Orders that differ by case or whitespace should be treated as distinct.
        **Validates: Requirements 1.2**
        """
        df = pd.DataFrame({
            'Production Order No.': ['RR12345A', 'rr12345a', 'RR12345A ', ' RR12345A'],
            'Reporting day': [
                date(2024, 1, 1),
                date(2024, 1, 1),
                date(2024, 1, 1),
                date(2024, 1, 1)
            ]
        })
        result, stats = DeduplicationService.deduplicate_dataframe(df)
        
        # All 4 should be treated as distinct (exact matching)
        assert len(result) == 4
        assert stats.duplicates_removed == 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])


class TestUploadFlowIntegration:
    """
    Integration tests for upload flow with deduplication.
    These tests verify the deduplication is correctly integrated into the upload process.
    """
    
    def test_upload_file_with_duplicates_deduplicates_correctly(self):
        """
        Test that uploading a file with duplicate Production Orders
        results in only the latest records being kept.
        
        **Validates: Requirements 3.1, 3.2**
        """
        # Create a DataFrame simulating an uploaded file with duplicates
        df = pd.DataFrame({
            'Production Order No.': ['RR11541B', 'RR11541E', 'RR11541B', 'RR11541E', 'RR99999A'],
            'Reporting day': [
                date(2024, 11, 25),  # Old - should be removed
                date(2024, 11, 25),  # Old - should be removed
                date(2024, 11, 30),  # Latest - should be kept
                date(2024, 11, 30),  # Latest - should be kept
                date(2024, 11, 28),  # Unique - should be kept
            ],
            'Customer': ['Cust1', 'Cust2', 'Cust1', 'Cust2', 'Cust3'],
            'Status': ['HOLD', 'LOCK', 'HOLD', 'LOCK', 'OK']
        })
        
        # Apply deduplication (simulating what happens in upload flow)
        result_df, stats = DeduplicationService.deduplicate_dataframe(df)
        
        # Should have 3 records: RR11541B (11/30), RR11541E (11/30), RR99999A (11/28)
        assert len(result_df) == 3, f"Expected 3 records, got {len(result_df)}"
        assert stats.duplicates_removed == 2, f"Expected 2 duplicates removed, got {stats.duplicates_removed}"
        
        # Verify correct records are kept
        kept_orders = set(result_df['Production Order No.'].tolist())
        assert kept_orders == {'RR11541B', 'RR11541E', 'RR99999A'}
        
        # Verify dates are the latest ones
        for order in ['RR11541B', 'RR11541E']:
            kept_date = result_df[result_df['Production Order No.'] == order]['Reporting day'].iloc[0]
            assert kept_date == date(2024, 11, 30), f"Order {order} should have date 2024-11-30, got {kept_date}"
    
    def test_multiple_uploads_deduplicate_across_sources(self):
        """
        Test scenario: Upload file 1 with data from week 1,
        then upload file 2 with same orders from week 2.
        Only week 2 data should remain.
        
        This tests the deduplicate_dataframe function which handles
        deduplication within a single file upload.
        
        **Validates: Requirements 3.2**
        """
        # First upload - week 1 data
        df1 = pd.DataFrame({
            'Production Order No.': ['RR11541B', 'RR11541E'],
            'Reporting day': [date(2024, 11, 25), date(2024, 11, 25)],
            'Customer': ['Cust1', 'Cust2'],
            'Status': ['HOLD', 'LOCK']
        })
        
        # Second upload - week 2 data (same orders, newer dates)
        df2 = pd.DataFrame({
            'Production Order No.': ['RR11541B', 'RR11541E'],
            'Reporting day': [date(2024, 11, 30), date(2024, 11, 30)],
            'Customer': ['Cust1', 'Cust2'],
            'Status': ['HOLD', 'LOCK']
        })
        
        # Simulate combining both uploads (what would be in DB)
        combined = pd.concat([df1, df2], ignore_index=True)
        
        # Apply deduplication
        result_df, stats = DeduplicationService.deduplicate_dataframe(combined)
        
        # Should only have 2 records (the latest ones)
        assert len(result_df) == 2
        assert stats.duplicates_removed == 2
        
        # All remaining records should be from week 2
        for _, row in result_df.iterrows():
            assert row['Reporting day'] == date(2024, 11, 30)
    
    def test_deduplication_preserves_other_columns(self):
        """
        Test that deduplication preserves all columns from the kept record.
        
        **Validates: Requirements 2.1**
        """
        df = pd.DataFrame({
            'Production Order No.': ['RR11541B', 'RR11541B'],
            'Reporting day': [date(2024, 11, 25), date(2024, 11, 30)],
            'Customer': ['OldCustomer', 'NewCustomer'],
            'Status': ['OLD_STATUS', 'NEW_STATUS'],
            'Category': ['OldCat', 'NewCat']
        })
        
        result_df, _ = DeduplicationService.deduplicate_dataframe(df)
        
        # Should keep the record from 11/30 with all its data
        assert len(result_df) == 1
        kept_record = result_df.iloc[0]
        
        assert kept_record['Customer'] == 'NewCustomer'
        assert kept_record['Status'] == 'NEW_STATUS'
        assert kept_record['Category'] == 'NewCat'
        assert kept_record['Reporting day'] == date(2024, 11, 30)
