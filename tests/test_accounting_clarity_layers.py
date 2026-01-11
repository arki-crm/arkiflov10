"""
Test suite for Accounting Clarity Layers feature
Phase A - Explicit Liability Register
Phase B - Project Profit Visibility
Phase C - Simple P&L Snapshot
Phase D - Founder Overview Enhancement with Outstanding Liabilities card

All features derived from existing data, no double-entry accounting.
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "thaha.pakayil@gmail.com"
TEST_PASSWORD = "password123"


@pytest.fixture(scope="module")
def session():
    """Create authenticated session"""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    
    # Setup local admin first
    setup_res = s.post(f"{BASE_URL}/api/auth/setup-local-admin")
    print(f"Setup admin response: {setup_res.status_code}")
    
    # Login
    login_res = s.post(f"{BASE_URL}/api/auth/local-login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    if login_res.status_code == 200:
        print(f"Login successful: {login_res.json().get('user', {}).get('email')}")
    else:
        print(f"Login failed: {login_res.status_code} - {login_res.text}")
        pytest.skip("Authentication failed")
    
    return s


class TestLiabilitiesAPI:
    """Phase A - Explicit Liability Register API Tests"""
    
    def test_get_liabilities_list(self, session):
        """GET /api/finance/liabilities - List all liabilities"""
        response = session.get(f"{BASE_URL}/api/finance/liabilities")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} liabilities")
        
        # Check structure if liabilities exist
        if len(data) > 0:
            liability = data[0]
            assert "liability_id" in liability
            assert "vendor_name" in liability
            assert "amount" in liability
            assert "amount_remaining" in liability
            assert "status" in liability
    
    def test_get_liabilities_with_status_filter(self, session):
        """GET /api/finance/liabilities?status=open - Filter by status"""
        response = session.get(f"{BASE_URL}/api/finance/liabilities?status=open")
        assert response.status_code == 200
        
        data = response.json()
        # All returned liabilities should have status 'open'
        for liability in data:
            assert liability.get("status") == "open", f"Expected status 'open', got {liability.get('status')}"
    
    def test_get_liabilities_with_category_filter(self, session):
        """GET /api/finance/liabilities?category=raw_material - Filter by category"""
        response = session.get(f"{BASE_URL}/api/finance/liabilities?category=raw_material")
        assert response.status_code == 200
        
        data = response.json()
        for liability in data:
            assert liability.get("category") == "raw_material"
    
    def test_get_liabilities_summary(self, session):
        """GET /api/finance/liabilities/summary - Dashboard summary"""
        response = session.get(f"{BASE_URL}/api/finance/liabilities/summary")
        assert response.status_code == 200
        
        data = response.json()
        # Check required fields
        assert "total_outstanding" in data, "Missing total_outstanding"
        assert "due_this_month" in data, "Missing due_this_month"
        assert "overdue" in data, "Missing overdue"
        assert "open_count" in data, "Missing open_count"
        assert "overdue_count" in data, "Missing overdue_count"
        
        # Validate data types
        assert isinstance(data["total_outstanding"], (int, float))
        assert isinstance(data["due_this_month"], (int, float))
        assert isinstance(data["overdue"], (int, float))
        
        print(f"Liabilities Summary: Outstanding={data['total_outstanding']}, Due This Month={data['due_this_month']}, Overdue={data['overdue']}")
    
    def test_get_liabilities_summary_has_top_vendors(self, session):
        """GET /api/finance/liabilities/summary - Should include top vendors"""
        response = session.get(f"{BASE_URL}/api/finance/liabilities/summary")
        assert response.status_code == 200
        
        data = response.json()
        assert "top_vendors" in data, "Missing top_vendors"
        
        if data["top_vendors"]:
            vendor = data["top_vendors"][0]
            assert "vendor" in vendor
            assert "amount" in vendor
    
    def test_create_liability_admin_only(self, session):
        """POST /api/finance/liabilities - Create manual liability (Admin only)"""
        liability_data = {
            "vendor_name": "TEST_Vendor_" + datetime.now().strftime("%H%M%S"),
            "category": "raw_material",
            "amount": 50000,
            "due_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "description": "Test liability for automated testing",
            "source": "manual"
        }
        
        response = session.post(f"{BASE_URL}/api/finance/liabilities", json=liability_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "liability_id" in data
        assert data["vendor_name"] == liability_data["vendor_name"]
        assert data["amount"] == liability_data["amount"]
        assert data["status"] == "open"
        assert data["amount_remaining"] == liability_data["amount"]
        
        print(f"Created liability: {data['liability_id']}")
        return data["liability_id"]
    
    def test_get_single_liability(self, session):
        """GET /api/finance/liabilities/{id} - Get single liability"""
        # First create a liability
        liability_data = {
            "vendor_name": "TEST_SingleGet_" + datetime.now().strftime("%H%M%S"),
            "category": "office",
            "amount": 10000,
            "source": "manual"
        }
        create_res = session.post(f"{BASE_URL}/api/finance/liabilities", json=liability_data)
        assert create_res.status_code == 200
        liability_id = create_res.json()["liability_id"]
        
        # Get the liability
        response = session.get(f"{BASE_URL}/api/finance/liabilities/{liability_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["liability_id"] == liability_id
        assert data["vendor_name"] == liability_data["vendor_name"]
    
    def test_settle_liability(self, session):
        """POST /api/finance/liabilities/{id}/settle - Settle liability"""
        # First create a liability
        liability_data = {
            "vendor_name": "TEST_Settle_" + datetime.now().strftime("%H%M%S"),
            "category": "production",
            "amount": 25000,
            "source": "manual"
        }
        create_res = session.post(f"{BASE_URL}/api/finance/liabilities", json=liability_data)
        assert create_res.status_code == 200
        liability_id = create_res.json()["liability_id"]
        
        # Settle partially
        settle_data = {
            "amount": 10000,
            "remarks": "Partial payment via bank transfer"
        }
        response = session.post(f"{BASE_URL}/api/finance/liabilities/{liability_id}/settle", json=settle_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["amount_settled"] == 10000
        assert data["amount_remaining"] == 15000
        assert data["status"] == "partially_settled"
        
        print(f"Settled liability {liability_id}: Settled=10000, Remaining=15000")
    
    def test_settle_liability_full(self, session):
        """POST /api/finance/liabilities/{id}/settle - Full settlement closes liability"""
        # Create liability
        liability_data = {
            "vendor_name": "TEST_FullSettle_" + datetime.now().strftime("%H%M%S"),
            "category": "transport",
            "amount": 5000,
            "source": "manual"
        }
        create_res = session.post(f"{BASE_URL}/api/finance/liabilities", json=liability_data)
        assert create_res.status_code == 200
        liability_id = create_res.json()["liability_id"]
        
        # Settle fully
        settle_data = {
            "amount": 5000,
            "remarks": "Full payment"
        }
        response = session.post(f"{BASE_URL}/api/finance/liabilities/{liability_id}/settle", json=settle_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["amount_remaining"] == 0
        assert data["status"] == "closed"
    
    def test_settle_liability_over_amount_fails(self, session):
        """POST /api/finance/liabilities/{id}/settle - Cannot settle more than remaining"""
        # Create liability
        liability_data = {
            "vendor_name": "TEST_OverSettle_" + datetime.now().strftime("%H%M%S"),
            "category": "other",
            "amount": 1000,
            "source": "manual"
        }
        create_res = session.post(f"{BASE_URL}/api/finance/liabilities", json=liability_data)
        assert create_res.status_code == 200
        liability_id = create_res.json()["liability_id"]
        
        # Try to settle more than amount
        settle_data = {
            "amount": 2000,
            "remarks": "Over payment attempt"
        }
        response = session.post(f"{BASE_URL}/api/finance/liabilities/{liability_id}/settle", json=settle_data)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"


class TestVendorsAPI:
    """Vendors API Tests"""
    
    def test_get_vendors_list(self, session):
        """GET /api/finance/vendors - List all vendors"""
        response = session.get(f"{BASE_URL}/api/finance/vendors")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} vendors")


class TestPnLSnapshotAPI:
    """Phase C - Simple P&L Snapshot API Tests"""
    
    def test_get_pnl_snapshot_month(self, session):
        """GET /api/finance/pnl-snapshot?period=month - Monthly P&L"""
        response = session.get(f"{BASE_URL}/api/finance/pnl-snapshot?period=month")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check required fields
        assert "period_label" in data
        assert "start_date" in data
        assert "end_date" in data
        assert "revenue" in data
        assert "execution_costs" in data
        assert "operating_expenses" in data
        assert "gross_profit" in data
        assert "net_operating_profit" in data
        assert "cash_profit" in data
        assert "accounting_profit" in data
        
        print(f"P&L Snapshot ({data['period_label']}): Revenue={data['revenue']['total']}, Net Profit={data['net_operating_profit']}")
    
    def test_get_pnl_snapshot_quarter(self, session):
        """GET /api/finance/pnl-snapshot?period=quarter - Quarterly P&L"""
        response = session.get(f"{BASE_URL}/api/finance/pnl-snapshot?period=quarter")
        assert response.status_code == 200
        
        data = response.json()
        assert "period_label" in data
        assert "quarter" in data["period_label"].lower() or "q" in data["period_label"].lower()
    
    def test_get_pnl_snapshot_custom_dates(self, session):
        """GET /api/finance/pnl-snapshot?period=custom - Custom date range"""
        start_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
        end_date = datetime.now().strftime("%Y-%m-%d")
        
        response = session.get(
            f"{BASE_URL}/api/finance/pnl-snapshot?period=custom&start_date={start_date}&end_date={end_date}"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["start_date"] == start_date
        assert data["end_date"] == end_date
    
    def test_pnl_snapshot_revenue_structure(self, session):
        """P&L revenue section has correct structure"""
        response = session.get(f"{BASE_URL}/api/finance/pnl-snapshot?period=month")
        assert response.status_code == 200
        
        data = response.json()
        revenue = data["revenue"]
        
        assert "from_projects" in revenue
        assert "other_income" in revenue
        assert "total" in revenue
        
        # Total should be sum of components
        assert revenue["total"] == revenue["from_projects"] + revenue["other_income"]
    
    def test_pnl_snapshot_execution_costs_structure(self, session):
        """P&L execution costs shows paid vs committed"""
        response = session.get(f"{BASE_URL}/api/finance/pnl-snapshot?period=month")
        assert response.status_code == 200
        
        data = response.json()
        costs = data["execution_costs"]
        
        assert "paid" in costs, "Missing 'paid' (cashbook outflows)"
        assert "committed" in costs, "Missing 'committed' (liabilities)"
        assert "total_exposure" in costs
        
        # Total exposure = paid + committed
        assert costs["total_exposure"] == costs["paid"] + costs["committed"]
    
    def test_pnl_snapshot_operating_expenses_structure(self, session):
        """P&L operating expenses has category breakdown"""
        response = session.get(f"{BASE_URL}/api/finance/pnl-snapshot?period=month")
        assert response.status_code == 200
        
        data = response.json()
        opex = data["operating_expenses"]
        
        assert "salaries" in opex
        assert "office" in opex
        assert "marketing" in opex
        assert "travel" in opex
        assert "misc" in opex
    
    def test_pnl_snapshot_cash_vs_accounting_profit(self, session):
        """P&L shows both cash profit and accounting profit"""
        response = session.get(f"{BASE_URL}/api/finance/pnl-snapshot?period=month")
        assert response.status_code == 200
        
        data = response.json()
        
        assert "cash_profit" in data
        assert "accounting_profit" in data
        assert "profit_difference" in data
        assert "difference_factors" in data
        
        # Difference factors explain the gap
        factors = data["difference_factors"]
        assert "advances_locked_pct" in factors
        assert "open_liabilities" in factors
        assert "committed_not_paid" in factors


class TestProjectProfitAPI:
    """Phase B - Project Profit Visibility API Tests"""
    
    def test_get_project_profit_requires_project_id(self, session):
        """GET /api/finance/project-profit/{id} - Requires valid project ID"""
        response = session.get(f"{BASE_URL}/api/finance/project-profit/nonexistent_project_123")
        assert response.status_code == 404
    
    def test_get_project_profit_structure(self, session):
        """GET /api/finance/project-profit/{id} - Returns profit metrics"""
        # First get a project
        projects_res = session.get(f"{BASE_URL}/api/projects")
        if projects_res.status_code != 200 or not projects_res.json():
            pytest.skip("No projects available for testing")
        
        project_id = projects_res.json()[0]["project_id"]
        
        response = session.get(f"{BASE_URL}/api/finance/project-profit/{project_id}")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check required fields
        assert "project_id" in data
        assert "contract_value" in data
        assert "planned_cost" in data
        assert "actual_cost" in data
        assert "total_received" in data
        
        # Profit metrics
        assert "projected_profit" in data
        assert "projected_profit_pct" in data
        assert "realised_profit" in data
        assert "realised_profit_pct" in data
        assert "execution_margin_remaining" in data
        
        print(f"Project Profit: Projected={data['projected_profit']}, Realised={data['realised_profit']}")


class TestFounderDashboardLiabilities:
    """Phase D - Founder Dashboard Outstanding Liabilities Card"""
    
    def test_founder_dashboard_includes_liabilities(self, session):
        """Founder dashboard should include liabilities summary"""
        # The liabilities summary is fetched separately by the frontend
        response = session.get(f"{BASE_URL}/api/finance/liabilities/summary")
        assert response.status_code == 200
        
        data = response.json()
        
        # These fields are used by the Outstanding Liabilities card
        assert "total_outstanding" in data
        assert "due_this_month" in data
        assert "overdue" in data
        assert "open_count" in data
        assert "top_vendors" in data
    
    def test_founder_dashboard_api(self, session):
        """GET /api/finance/founder-dashboard - Main dashboard data"""
        response = session.get(f"{BASE_URL}/api/finance/founder-dashboard")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check main dashboard fields
        assert "health" in data
        assert "total_cash_available" in data
        assert "safe_surplus" in data


class TestLiabilitiesUnauthenticated:
    """Test unauthenticated access is blocked"""
    
    def test_liabilities_requires_auth(self):
        """GET /api/finance/liabilities - Requires authentication"""
        response = requests.get(f"{BASE_URL}/api/finance/liabilities")
        assert response.status_code == 401
    
    def test_liabilities_summary_requires_auth(self):
        """GET /api/finance/liabilities/summary - Requires authentication"""
        response = requests.get(f"{BASE_URL}/api/finance/liabilities/summary")
        assert response.status_code == 401
    
    def test_pnl_snapshot_requires_auth(self):
        """GET /api/finance/pnl-snapshot - Requires authentication"""
        response = requests.get(f"{BASE_URL}/api/finance/pnl-snapshot")
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
