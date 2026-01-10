"""
Test Suite for Project Finance Control Module (Phase 3)
Tests vendor mapping and project costing features:
- GET /api/finance/project-finance - List projects with financial data
- GET /api/finance/project-finance/{project_id} - Detailed financial view
- GET /api/finance/vendor-mappings/{project_id} - Vendor mappings for project
- POST /api/finance/vendor-mappings - Create vendor mapping
- PUT /api/finance/vendor-mappings/{mapping_id} - Update vendor mapping
- DELETE /api/finance/vendor-mappings/{mapping_id} - Delete vendor mapping
- GET /api/finance/vendor-categories - Get category list
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "thaha.pakayil@gmail.com"
TEST_PASSWORD = "password123"

# Test project from context
TEST_PROJECT_ID = "proj_17942869"  # sharan project with 3 vendor mappings


class TestProjectFinanceAuth:
    """Authentication and session setup"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = s.post(f"{BASE_URL}/api/auth/local-login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip(f"Authentication failed: {login_response.status_code} - {login_response.text}")
        
        return s
    
    def test_login_success(self, session):
        """Verify login works"""
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data or "email" in data
        print(f"✓ Logged in as: {data.get('email', data.get('name', 'Unknown'))}")


class TestVendorCategories:
    """Test vendor categories endpoint"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        login_response = s.post(f"{BASE_URL}/api/auth/local-login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        return s
    
    def test_get_vendor_categories(self, session):
        """GET /api/finance/vendor-categories returns category list"""
        response = session.get(f"{BASE_URL}/api/finance/vendor-categories")
        assert response.status_code == 200
        
        categories = response.json()
        assert isinstance(categories, list)
        assert len(categories) > 0
        
        # Verify expected categories
        expected = ["Modular", "Non-Modular", "Installation", "Transport", "Other"]
        for cat in expected:
            assert cat in categories, f"Missing category: {cat}"
        
        print(f"✓ Vendor categories: {categories}")


class TestProjectFinanceList:
    """Test project finance list endpoint"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        login_response = s.post(f"{BASE_URL}/api/auth/local-login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        return s
    
    def test_list_projects_with_finance(self, session):
        """GET /api/finance/project-finance returns list of projects with financial data"""
        response = session.get(f"{BASE_URL}/api/finance/project-finance")
        assert response.status_code == 200
        
        projects = response.json()
        assert isinstance(projects, list)
        print(f"✓ Found {len(projects)} projects with finance data")
        
        if len(projects) > 0:
            # Verify structure of first project
            p = projects[0]
            required_fields = [
                "project_id", "pid", "project_name", "client_name",
                "contract_value", "total_received", "planned_cost", 
                "actual_cost", "safe_surplus", "has_overspend"
            ]
            for field in required_fields:
                assert field in p, f"Missing field: {field}"
            
            print(f"✓ Project structure validated: {p.get('project_name')}")
    
    def test_list_projects_with_search(self, session):
        """GET /api/finance/project-finance with search filter"""
        response = session.get(f"{BASE_URL}/api/finance/project-finance", params={"search": "sharan"})
        assert response.status_code == 200
        
        projects = response.json()
        assert isinstance(projects, list)
        print(f"✓ Search 'sharan' returned {len(projects)} projects")
    
    def test_find_test_project(self, session):
        """Verify test project exists in list"""
        response = session.get(f"{BASE_URL}/api/finance/project-finance")
        assert response.status_code == 200
        
        projects = response.json()
        test_project = next((p for p in projects if p.get("project_id") == TEST_PROJECT_ID), None)
        
        if test_project:
            print(f"✓ Found test project: {test_project.get('project_name')}")
            print(f"  - Contract Value: {test_project.get('contract_value')}")
            print(f"  - Planned Cost: {test_project.get('planned_cost')}")
            print(f"  - Actual Cost: {test_project.get('actual_cost')}")
        else:
            print(f"⚠ Test project {TEST_PROJECT_ID} not found in list")


class TestProjectFinanceDetail:
    """Test project finance detail endpoint"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        login_response = s.post(f"{BASE_URL}/api/auth/local-login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        return s
    
    def test_get_project_finance_detail(self, session):
        """GET /api/finance/project-finance/{project_id} returns detailed financial view"""
        response = session.get(f"{BASE_URL}/api/finance/project-finance/{TEST_PROJECT_ID}")
        
        if response.status_code == 404:
            pytest.skip(f"Test project {TEST_PROJECT_ID} not found")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "project" in data
        assert "summary" in data
        assert "vendor_mappings" in data
        assert "transactions" in data
        assert "comparison" in data
        assert "can_edit_vendor_mapping" in data
        
        # Verify project info
        project = data["project"]
        assert project.get("project_id") == TEST_PROJECT_ID
        print(f"✓ Project: {project.get('project_name')}")
        
        # Verify summary
        summary = data["summary"]
        required_summary_fields = [
            "contract_value", "total_received", "planned_cost",
            "actual_cost", "remaining_liability", "safe_surplus", "has_overspend"
        ]
        for field in required_summary_fields:
            assert field in summary, f"Missing summary field: {field}"
        
        print(f"✓ Summary: Contract={summary.get('contract_value')}, Planned={summary.get('planned_cost')}, Actual={summary.get('actual_cost')}")
        
        # Verify vendor mappings
        vendor_mappings = data["vendor_mappings"]
        print(f"✓ Vendor mappings count: {len(vendor_mappings)}")
        
        if len(vendor_mappings) > 0:
            vm = vendor_mappings[0]
            assert "mapping_id" in vm
            assert "vendor_name" in vm
            assert "category" in vm
            assert "planned_amount" in vm
    
    def test_get_project_finance_detail_not_found(self, session):
        """GET /api/finance/project-finance/{project_id} returns 404 for invalid project"""
        response = session.get(f"{BASE_URL}/api/finance/project-finance/invalid_project_id")
        assert response.status_code == 404
        print("✓ 404 returned for invalid project ID")


class TestVendorMappings:
    """Test vendor mappings CRUD endpoints"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        login_response = s.post(f"{BASE_URL}/api/auth/local-login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        return s
    
    def test_get_vendor_mappings_for_project(self, session):
        """GET /api/finance/vendor-mappings/{project_id} returns vendor mappings"""
        response = session.get(f"{BASE_URL}/api/finance/vendor-mappings/{TEST_PROJECT_ID}")
        
        if response.status_code == 404:
            pytest.skip(f"Test project {TEST_PROJECT_ID} not found")
        
        assert response.status_code == 200
        mappings = response.json()
        assert isinstance(mappings, list)
        print(f"✓ Found {len(mappings)} vendor mappings for project")
        
        if len(mappings) > 0:
            for m in mappings:
                print(f"  - {m.get('vendor_name')}: {m.get('category')} - ₹{m.get('planned_amount')}")


class TestVendorMappingCRUD:
    """Test vendor mapping create/update/delete operations"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        login_response = s.post(f"{BASE_URL}/api/auth/local-login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        return s
    
    @pytest.fixture(scope="class")
    def test_project_for_crud(self, session):
        """Find a project that allows vendor mapping edits"""
        # First check if test project allows edits
        response = session.get(f"{BASE_URL}/api/finance/project-finance/{TEST_PROJECT_ID}")
        if response.status_code == 200:
            data = response.json()
            if data.get("can_edit_vendor_mapping"):
                return TEST_PROJECT_ID
        
        # Otherwise find any project that allows edits
        response = session.get(f"{BASE_URL}/api/finance/project-finance")
        if response.status_code == 200:
            projects = response.json()
            for p in projects:
                detail_resp = session.get(f"{BASE_URL}/api/finance/project-finance/{p['project_id']}")
                if detail_resp.status_code == 200:
                    detail = detail_resp.json()
                    if detail.get("can_edit_vendor_mapping"):
                        return p["project_id"]
        
        return None
    
    def test_create_vendor_mapping(self, session, test_project_for_crud):
        """POST /api/finance/vendor-mappings creates new vendor mapping"""
        if not test_project_for_crud:
            pytest.skip("No project available for vendor mapping CRUD (all have spending started)")
        
        payload = {
            "project_id": test_project_for_crud,
            "vendor_name": "TEST_Vendor_Create",
            "category": "Modular",
            "planned_amount": 50000,
            "notes": "Test vendor mapping created by pytest"
        }
        
        response = session.post(f"{BASE_URL}/api/finance/vendor-mappings", json=payload)
        
        if response.status_code == 400:
            # Spending or production may have started
            error = response.json().get("detail", "")
            if "spending" in error.lower() or "production" in error.lower():
                pytest.skip(f"Cannot create mapping: {error}")
        
        assert response.status_code == 200, f"Failed to create: {response.text}"
        
        data = response.json()
        assert "mapping_id" in data
        assert data["vendor_name"] == "TEST_Vendor_Create"
        assert data["category"] == "Modular"
        assert data["planned_amount"] == 50000
        
        print(f"✓ Created vendor mapping: {data['mapping_id']}")
        
        # Store for cleanup
        session.test_mapping_id = data["mapping_id"]
    
    def test_update_vendor_mapping(self, session, test_project_for_crud):
        """PUT /api/finance/vendor-mappings/{mapping_id} updates vendor mapping"""
        if not hasattr(session, 'test_mapping_id'):
            pytest.skip("No test mapping created")
        
        mapping_id = session.test_mapping_id
        
        update_payload = {
            "vendor_name": "TEST_Vendor_Updated",
            "planned_amount": 75000,
            "notes": "Updated by pytest"
        }
        
        response = session.put(f"{BASE_URL}/api/finance/vendor-mappings/{mapping_id}", json=update_payload)
        
        if response.status_code == 400:
            error = response.json().get("detail", "")
            if "spending" in error.lower() or "production" in error.lower():
                pytest.skip(f"Cannot update mapping: {error}")
        
        assert response.status_code == 200, f"Failed to update: {response.text}"
        
        data = response.json()
        assert data["vendor_name"] == "TEST_Vendor_Updated"
        assert data["planned_amount"] == 75000
        
        print(f"✓ Updated vendor mapping: {mapping_id}")
    
    def test_delete_vendor_mapping(self, session, test_project_for_crud):
        """DELETE /api/finance/vendor-mappings/{mapping_id} deletes vendor mapping"""
        if not hasattr(session, 'test_mapping_id'):
            pytest.skip("No test mapping created")
        
        mapping_id = session.test_mapping_id
        
        response = session.delete(f"{BASE_URL}/api/finance/vendor-mappings/{mapping_id}")
        
        if response.status_code == 400:
            error = response.json().get("detail", "")
            if "spending" in error.lower() or "production" in error.lower():
                pytest.skip(f"Cannot delete mapping: {error}")
        
        assert response.status_code == 200, f"Failed to delete: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        
        print(f"✓ Deleted vendor mapping: {mapping_id}")
        
        # Verify deletion
        get_response = session.get(f"{BASE_URL}/api/finance/vendor-mappings/{test_project_for_crud}")
        if get_response.status_code == 200:
            mappings = get_response.json()
            assert not any(m.get("mapping_id") == mapping_id for m in mappings)
            print("✓ Verified mapping no longer exists")


class TestVendorMappingValidation:
    """Test vendor mapping validation rules"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        login_response = s.post(f"{BASE_URL}/api/auth/local-login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        return s
    
    def test_create_with_invalid_category(self, session):
        """POST /api/finance/vendor-mappings rejects invalid category"""
        payload = {
            "project_id": TEST_PROJECT_ID,
            "vendor_name": "TEST_Invalid_Category",
            "category": "InvalidCategory",
            "planned_amount": 10000
        }
        
        response = session.post(f"{BASE_URL}/api/finance/vendor-mappings", json=payload)
        
        # Should fail with 400 for invalid category
        if response.status_code == 400:
            error = response.json().get("detail", "")
            if "category" in error.lower() or "invalid" in error.lower():
                print(f"✓ Invalid category rejected: {error}")
                return
            # Could also be spending started error
            if "spending" in error.lower():
                pytest.skip("Spending started - cannot test validation")
        
        # If it somehow succeeded, clean up
        if response.status_code == 200:
            mapping_id = response.json().get("mapping_id")
            session.delete(f"{BASE_URL}/api/finance/vendor-mappings/{mapping_id}")
            pytest.fail("Invalid category was accepted")
    
    def test_create_with_invalid_project(self, session):
        """POST /api/finance/vendor-mappings rejects invalid project"""
        payload = {
            "project_id": "invalid_project_id",
            "vendor_name": "TEST_Invalid_Project",
            "category": "Modular",
            "planned_amount": 10000
        }
        
        response = session.post(f"{BASE_URL}/api/finance/vendor-mappings", json=payload)
        assert response.status_code == 404
        print("✓ Invalid project rejected with 404")
    
    def test_update_nonexistent_mapping(self, session):
        """PUT /api/finance/vendor-mappings/{mapping_id} returns 404 for invalid mapping"""
        response = session.put(
            f"{BASE_URL}/api/finance/vendor-mappings/invalid_mapping_id",
            json={"vendor_name": "Test"}
        )
        assert response.status_code == 404
        print("✓ Update nonexistent mapping returns 404")
    
    def test_delete_nonexistent_mapping(self, session):
        """DELETE /api/finance/vendor-mappings/{mapping_id} returns 404 for invalid mapping"""
        response = session.delete(f"{BASE_URL}/api/finance/vendor-mappings/invalid_mapping_id")
        assert response.status_code == 404
        print("✓ Delete nonexistent mapping returns 404")


class TestVendorMappingLocking:
    """Test vendor mapping locking when spending starts"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        login_response = s.post(f"{BASE_URL}/api/auth/local-login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        return s
    
    def test_check_locking_status(self, session):
        """Verify can_edit_vendor_mapping flag reflects spending status"""
        response = session.get(f"{BASE_URL}/api/finance/project-finance/{TEST_PROJECT_ID}")
        
        if response.status_code == 404:
            pytest.skip(f"Test project {TEST_PROJECT_ID} not found")
        
        assert response.status_code == 200
        data = response.json()
        
        can_edit = data.get("can_edit_vendor_mapping")
        spending_started = data.get("spending_started")
        production_started = data.get("production_started")
        
        print(f"✓ Locking status for {TEST_PROJECT_ID}:")
        print(f"  - can_edit_vendor_mapping: {can_edit}")
        print(f"  - spending_started: {spending_started}")
        print(f"  - production_started: {production_started}")
        
        # If spending or production started, editing should be locked
        if spending_started or production_started:
            assert can_edit == False, "Editing should be locked when spending/production started"
            print("✓ Editing correctly locked")
        else:
            assert can_edit == True, "Editing should be allowed when no spending/production"
            print("✓ Editing correctly allowed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
