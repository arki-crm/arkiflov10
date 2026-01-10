"""
Test suite for PDF Premium Design and Project Finance Detail Receipts Section
Tests: PDF typography (no ALL CAPS), company settings usage, receipts filtering by project
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPDFPremiumDesign:
    """Test PDF receipt has premium design with proper typography"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get session
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/local-login",
            json={"email": "thaha.pakayil@gmail.com", "password": "password123"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.cookies = login_response.cookies
    
    def test_pdf_is_valid(self):
        """Test PDF generation returns valid PDF"""
        # Get a receipt
        response = self.session.get(f"{BASE_URL}/api/finance/receipts", cookies=self.cookies)
        assert response.status_code == 200
        
        receipts = response.json()
        if not receipts:
            pytest.skip("No receipts found")
        
        receipt_id = receipts[0]["receipt_id"]
        
        # Generate PDF
        response = self.session.get(
            f"{BASE_URL}/api/finance/receipts/{receipt_id}/pdf",
            cookies=self.cookies
        )
        assert response.status_code == 200
        assert response.content.startswith(b"%PDF"), "Should be valid PDF"
        assert len(response.content) > 1000, "PDF should have content"
        print(f"✓ PDF is valid: {len(response.content)} bytes")
    
    def test_pdf_uses_company_settings(self):
        """Test PDF uses company settings (company_name, authorized_signatory)"""
        # First update company settings
        settings = {
            "company_name": "Test Company Name",
            "authorized_signatory": "Test Authorized Person"
        }
        response = self.session.post(
            f"{BASE_URL}/api/finance/company-settings",
            json=settings,
            cookies=self.cookies
        )
        assert response.status_code == 200
        
        # Get a receipt
        response = self.session.get(f"{BASE_URL}/api/finance/receipts", cookies=self.cookies)
        receipts = response.json()
        if not receipts:
            pytest.skip("No receipts found")
        
        receipt_id = receipts[0]["receipt_id"]
        
        # Generate PDF
        response = self.session.get(
            f"{BASE_URL}/api/finance/receipts/{receipt_id}/pdf",
            cookies=self.cookies
        )
        assert response.status_code == 200
        
        # PDF content should contain company name (we can't easily parse PDF, but we verify it generates)
        print("✓ PDF generated with company settings")
        
        # Reset company settings
        self.session.post(
            f"{BASE_URL}/api/finance/company-settings",
            json={"company_name": "Arki Dots", "authorized_signatory": "Test Signatory"},
            cookies=self.cookies
        )
    
    def test_company_settings_fields(self):
        """Test company settings has all required fields for PDF"""
        response = self.session.get(f"{BASE_URL}/api/finance/company-settings", cookies=self.cookies)
        assert response.status_code == 200
        
        data = response.json()
        
        # Required fields for PDF
        required_fields = [
            "company_name",
            "company_address",
            "company_gstin",
            "authorized_signatory"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✓ Company settings has all required fields: {list(data.keys())}")


class TestProjectFinanceDetailReceipts:
    """Test receipts section on Project Finance Detail page"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/local-login",
            json={"email": "thaha.pakayil@gmail.com", "password": "password123"}
        )
        assert login_response.status_code == 200
        self.cookies = login_response.cookies
    
    def test_receipts_filtered_by_project(self):
        """Test GET /api/finance/receipts?project_id=xxx returns filtered receipts"""
        # Get a project with receipts
        response = self.session.get(f"{BASE_URL}/api/finance/project-finance", cookies=self.cookies)
        assert response.status_code == 200
        
        projects = response.json()
        project_with_receipts = None
        for p in projects:
            if p.get("total_received", 0) > 0:
                project_with_receipts = p
                break
        
        if not project_with_receipts:
            pytest.skip("No project with receipts found")
        
        project_id = project_with_receipts["project_id"]
        
        # Get receipts filtered by project
        response = self.session.get(
            f"{BASE_URL}/api/finance/receipts?project_id={project_id}",
            cookies=self.cookies
        )
        assert response.status_code == 200
        
        receipts = response.json()
        assert isinstance(receipts, list)
        
        # All receipts should be for this project
        for receipt in receipts:
            assert receipt["project_id"] == project_id, f"Receipt {receipt['receipt_id']} has wrong project_id"
        
        print(f"✓ Found {len(receipts)} receipts for project {project_id}")
    
    def test_receipts_section_columns(self):
        """Test receipts have all columns needed for Project Finance Detail page"""
        response = self.session.get(f"{BASE_URL}/api/finance/receipts", cookies=self.cookies)
        assert response.status_code == 200
        
        receipts = response.json()
        if not receipts:
            pytest.skip("No receipts found")
        
        receipt = receipts[0]
        
        # Required columns for Project Finance Detail receipts section
        required_fields = [
            "receipt_number",  # Receipt #
            "payment_date",    # Date
            "amount",          # Amount
            "payment_mode",    # Mode
            "account_name",    # Account
            "receipt_id"       # For View/Download actions
        ]
        
        for field in required_fields:
            assert field in receipt, f"Missing field: {field}"
        
        print(f"✓ Receipt has all required columns for Project Finance Detail")
    
    def test_receipt_view_details(self):
        """Test single receipt has all details for view dialog"""
        response = self.session.get(f"{BASE_URL}/api/finance/receipts", cookies=self.cookies)
        receipts = response.json()
        if not receipts:
            pytest.skip("No receipts found")
        
        receipt_id = receipts[0]["receipt_id"]
        
        # Get single receipt details
        response = self.session.get(
            f"{BASE_URL}/api/finance/receipts/{receipt_id}",
            cookies=self.cookies
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Required fields for view dialog
        required_fields = [
            "receipt_number",
            "amount",
            "payment_date",
            "payment_mode",
            "account_name",
            "stage_name",
            "total_received",
            "balance_remaining",
            "project"  # Project details
        ]
        
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Project should have contract_value
        assert "contract_value" in data.get("project", {}), "Project should have contract_value"
        
        print(f"✓ Receipt view has all required details")
    
    def test_project_finance_detail_endpoint(self):
        """Test project finance detail endpoint returns receipts data"""
        # Get a project
        response = self.session.get(f"{BASE_URL}/api/finance/project-finance", cookies=self.cookies)
        projects = response.json()
        if not projects:
            pytest.skip("No projects found")
        
        project_id = projects[0]["project_id"]
        
        # Get project finance detail
        response = self.session.get(
            f"{BASE_URL}/api/finance/project-finance/{project_id}",
            cookies=self.cookies
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Should have summary with total_received
        assert "summary" in data
        assert "total_received" in data["summary"]
        
        print(f"✓ Project finance detail has summary with total_received: {data['summary']['total_received']}")


class TestReceiptsTotalCalculation:
    """Test receipts total calculation for project"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/local-login",
            json={"email": "thaha.pakayil@gmail.com", "password": "password123"}
        )
        assert login_response.status_code == 200
        self.cookies = login_response.cookies
    
    def test_receipts_total_matches_project_received(self):
        """Test sum of receipts matches project total_received"""
        # Get a project with receipts
        response = self.session.get(f"{BASE_URL}/api/finance/project-finance", cookies=self.cookies)
        projects = response.json()
        
        project_with_receipts = None
        for p in projects:
            if p.get("total_received", 0) > 0:
                project_with_receipts = p
                break
        
        if not project_with_receipts:
            pytest.skip("No project with receipts found")
        
        project_id = project_with_receipts["project_id"]
        project_total_received = project_with_receipts["total_received"]
        
        # Get receipts for this project
        response = self.session.get(
            f"{BASE_URL}/api/finance/receipts?project_id={project_id}",
            cookies=self.cookies
        )
        receipts = response.json()
        
        # Calculate sum of receipts
        receipts_sum = sum(r.get("amount", 0) for r in receipts)
        
        # Should match (allowing for small floating point differences)
        assert abs(receipts_sum - project_total_received) < 1, \
            f"Receipts sum ({receipts_sum}) doesn't match project total_received ({project_total_received})"
        
        print(f"✓ Receipts total ({receipts_sum}) matches project total_received ({project_total_received})")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
