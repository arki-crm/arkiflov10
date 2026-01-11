"""
Test suite for Accounting Roles & Permission System
Tests the new finance roles (JuniorAccountant, SeniorAccountant, FinanceManager, CharteredAccountant, Founder)
and granular finance permission groups.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "thaha.pakayil@gmail.com"
TEST_PASSWORD = "password123"


@pytest.fixture(scope="module")
def auth_session():
    """Create authenticated session for testing"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Login
    response = session.post(f"{BASE_URL}/api/auth/local-login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    
    return session


class TestRolesAvailableEndpoint:
    """Test GET /api/roles/available endpoint"""
    
    def test_get_available_roles_returns_200(self, auth_session):
        """Test that endpoint returns 200 with authenticated user"""
        response = auth_session.get(f"{BASE_URL}/api/roles/available")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_get_available_roles_returns_roles_list(self, auth_session):
        """Test that response contains roles array"""
        response = auth_session.get(f"{BASE_URL}/api/roles/available")
        data = response.json()
        
        assert "roles" in data, "Response should contain 'roles' key"
        assert isinstance(data["roles"], list), "Roles should be a list"
        assert len(data["roles"]) > 0, "Roles list should not be empty"
    
    def test_get_available_roles_returns_categories(self, auth_session):
        """Test that response contains categories"""
        response = auth_session.get(f"{BASE_URL}/api/roles/available")
        data = response.json()
        
        assert "categories" in data, "Response should contain 'categories' key"
        assert "Finance" in data["categories"], "Categories should include 'Finance'"
        assert "Leadership" in data["categories"], "Categories should include 'Leadership'"
    
    def test_finance_roles_present(self, auth_session):
        """Test that all new finance roles are present"""
        response = auth_session.get(f"{BASE_URL}/api/roles/available")
        data = response.json()
        
        role_ids = [r["id"] for r in data["roles"]]
        
        # Check new finance roles
        assert "JuniorAccountant" in role_ids, "JuniorAccountant role should be present"
        assert "SeniorAccountant" in role_ids, "SeniorAccountant role should be present"
        assert "FinanceManager" in role_ids, "FinanceManager role should be present"
        assert "CharteredAccountant" in role_ids, "CharteredAccountant role should be present"
        assert "Founder" in role_ids, "Founder role should be present"
    
    def test_crm_roles_still_present(self, auth_session):
        """Test that existing CRM roles are still present (not removed)"""
        response = auth_session.get(f"{BASE_URL}/api/roles/available")
        data = response.json()
        
        role_ids = [r["id"] for r in data["roles"]]
        
        # Check CRM roles are untouched
        assert "Designer" in role_ids, "Designer role should still be present"
        assert "SalesManager" in role_ids, "SalesManager role should still be present"
        assert "PreSales" in role_ids, "PreSales role should still be present"
        assert "DesignManager" in role_ids, "DesignManager role should still be present"
        assert "ProductionOpsManager" in role_ids, "ProductionOpsManager role should still be present"
    
    def test_roles_have_required_fields(self, auth_session):
        """Test that each role has required fields: id, name, category, description"""
        response = auth_session.get(f"{BASE_URL}/api/roles/available")
        data = response.json()
        
        for role in data["roles"]:
            assert "id" in role, f"Role should have 'id' field: {role}"
            assert "name" in role, f"Role should have 'name' field: {role}"
            assert "category" in role, f"Role should have 'category' field: {role}"
            assert "description" in role, f"Role should have 'description' field: {role}"
    
    def test_finance_roles_have_correct_category(self, auth_session):
        """Test that finance roles are categorized correctly"""
        response = auth_session.get(f"{BASE_URL}/api/roles/available")
        data = response.json()
        
        finance_role_ids = ["JuniorAccountant", "SeniorAccountant", "FinanceManager", "CharteredAccountant"]
        
        for role in data["roles"]:
            if role["id"] in finance_role_ids:
                assert role["category"] == "Finance", f"{role['id']} should have category 'Finance'"
        
        # Founder should be in Leadership
        founder_role = next((r for r in data["roles"] if r["id"] == "Founder"), None)
        assert founder_role is not None, "Founder role should exist"
        assert founder_role["category"] == "Leadership", "Founder should have category 'Leadership'"


class TestDefaultPermissionsEndpoint:
    """Test GET /api/roles/{role_id}/default-permissions endpoint"""
    
    def test_junior_accountant_permissions(self, auth_session):
        """Test JuniorAccountant has basic permissions, NO delete"""
        response = auth_session.get(f"{BASE_URL}/api/roles/JuniorAccountant/default-permissions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["role"] == "JuniorAccountant"
        perms = data["default_permissions"]
        
        # Should have view and create
        assert "finance.cashbook.view" in perms, "JuniorAccountant should have cashbook view"
        assert "finance.cashbook.create" in perms, "JuniorAccountant should have cashbook create"
        
        # Should NOT have delete or edit
        assert "finance.cashbook.delete" not in perms, "JuniorAccountant should NOT have cashbook delete"
        assert "finance.cashbook.edit" not in perms, "JuniorAccountant should NOT have cashbook edit"
        
        # Should NOT have daily closing lock
        assert "finance.daily_closing.lock" not in perms, "JuniorAccountant should NOT have daily closing lock"
    
    def test_senior_accountant_permissions(self, auth_session):
        """Test SeniorAccountant has edit, verify, lock but NO delete"""
        response = auth_session.get(f"{BASE_URL}/api/roles/SeniorAccountant/default-permissions")
        assert response.status_code == 200
        
        data = response.json()
        perms = data["default_permissions"]
        
        # Should have edit and verify
        assert "finance.cashbook.edit" in perms, "SeniorAccountant should have cashbook edit"
        assert "finance.cashbook.verify" in perms, "SeniorAccountant should have cashbook verify"
        assert "finance.daily_closing.lock" in perms, "SeniorAccountant should have daily closing lock"
        
        # Should NOT have delete
        assert "finance.cashbook.delete" not in perms, "SeniorAccountant should NOT have cashbook delete"
        
        # Should have invoice creation
        assert "finance.invoices.create" in perms, "SeniorAccountant should have invoice create"
    
    def test_finance_manager_permissions(self, auth_session):
        """Test FinanceManager has full control including delete and budget override"""
        response = auth_session.get(f"{BASE_URL}/api/roles/FinanceManager/default-permissions")
        assert response.status_code == 200
        
        data = response.json()
        perms = data["default_permissions"]
        
        # Should have full cashbook access including delete
        assert "finance.cashbook.delete" in perms, "FinanceManager should have cashbook delete"
        assert "finance.transaction.reverse" in perms, "FinanceManager should have transaction reverse"
        
        # Should have budget override
        assert "finance.project.override_budget" in perms, "FinanceManager should have budget override"
        
        # Should have profit/margin reports
        assert "finance.reports.profit" in perms, "FinanceManager should have profit reports"
        assert "finance.reports.margin" in perms, "FinanceManager should have margin reports"
        
        # Should have controls
        assert "finance.writeoff.approve" in perms, "FinanceManager should have writeoff approve"
        assert "finance.cancellation.mark" in perms, "FinanceManager should have cancellation mark"
    
    def test_chartered_accountant_read_only(self, auth_session):
        """Test CharteredAccountant has read-only access (no create/edit/delete)"""
        response = auth_session.get(f"{BASE_URL}/api/roles/CharteredAccountant/default-permissions")
        assert response.status_code == 200
        
        data = response.json()
        perms = data["default_permissions"]
        
        # Should have view permissions
        assert "finance.cashbook.view" in perms, "CA should have cashbook view"
        assert "finance.reports.view" in perms, "CA should have reports view"
        assert "finance.audit_log.view" in perms, "CA should have audit log view"
        
        # Should NOT have any create/edit/delete
        assert "finance.cashbook.create" not in perms, "CA should NOT have cashbook create"
        assert "finance.cashbook.edit" not in perms, "CA should NOT have cashbook edit"
        assert "finance.cashbook.delete" not in perms, "CA should NOT have cashbook delete"
        assert "finance.invoices.create" not in perms, "CA should NOT have invoice create"
        assert "finance.expenses.create" not in perms, "CA should NOT have expense create"
        
        # Should have profit/margin for audit purposes
        assert "finance.reports.profit" in perms, "CA should have profit reports for audit"
        assert "finance.reports.margin" in perms, "CA should have margin reports for audit"
    
    def test_founder_permissions(self, auth_session):
        """Test Founder has visibility and final override capabilities"""
        response = auth_session.get(f"{BASE_URL}/api/roles/Founder/default-permissions")
        assert response.status_code == 200
        
        data = response.json()
        perms = data["default_permissions"]
        
        # Should have CRM visibility
        assert "projects.view_all" in perms, "Founder should have projects view all"
        assert "leads.view_all" in perms, "Founder should have leads view all"
        
        # Should have finance visibility
        assert "finance.cashbook.view" in perms, "Founder should have cashbook view"
        assert "finance.founder_dashboard" in perms, "Founder should have founder dashboard"
        
        # Should have override capabilities
        assert "finance.project.override_budget" in perms, "Founder should have budget override"
        assert "finance.writeoff.approve" in perms, "Founder should have writeoff approve"
        assert "finance.expenses.approve" in perms, "Founder should have expense approve"
    
    def test_invalid_role_returns_404(self, auth_session):
        """Test that invalid role ID returns 404"""
        response = auth_session.get(f"{BASE_URL}/api/roles/InvalidRole123/default-permissions")
        assert response.status_code == 404, f"Expected 404 for invalid role, got {response.status_code}"
    
    def test_crm_roles_permissions_unchanged(self, auth_session):
        """Test that CRM roles (Designer, SalesManager) still have their permissions"""
        # Test Designer
        response = auth_session.get(f"{BASE_URL}/api/roles/Designer/default-permissions")
        assert response.status_code == 200
        
        data = response.json()
        perms = data["default_permissions"]
        
        assert "leads.view" in perms, "Designer should have leads view"
        assert "projects.view" in perms, "Designer should have projects view"
        assert "milestones.update.design" in perms, "Designer should have design milestone update"
        
        # Test SalesManager
        response = auth_session.get(f"{BASE_URL}/api/roles/SalesManager/default-permissions")
        assert response.status_code == 200
        
        data = response.json()
        perms = data["default_permissions"]
        
        assert "leads.view_all" in perms, "SalesManager should have leads view all"
        assert "presales.view" in perms, "SalesManager should have presales view"


class TestPermissionsAvailableEndpoint:
    """Test GET /api/permissions/available endpoint"""
    
    def test_get_permissions_returns_200(self, auth_session):
        """Test that endpoint returns 200 for admin"""
        response = auth_session.get(f"{BASE_URL}/api/permissions/available")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_permissions_contains_finance_groups(self, auth_session):
        """Test that response contains granular finance permission groups"""
        response = auth_session.get(f"{BASE_URL}/api/permissions/available")
        data = response.json()
        
        assert "permission_groups" in data, "Response should contain permission_groups"
        groups = data["permission_groups"]
        
        # Check for new granular finance groups
        assert "finance_cashbook" in groups, "Should have finance_cashbook group"
        assert "finance_accounts" in groups, "Should have finance_accounts group"
        assert "finance_documents" in groups, "Should have finance_documents group"
        assert "finance_project" in groups, "Should have finance_project group"
        assert "finance_expenses" in groups, "Should have finance_expenses group"
        assert "finance_reports" in groups, "Should have finance_reports group"
        assert "finance_masters" in groups, "Should have finance_masters group"
        assert "finance_controls" in groups, "Should have finance_controls group"
    
    def test_finance_cashbook_permissions(self, auth_session):
        """Test finance_cashbook group has correct permissions"""
        response = auth_session.get(f"{BASE_URL}/api/permissions/available")
        data = response.json()
        
        cashbook_group = data["permission_groups"]["finance_cashbook"]
        perm_ids = [p["id"] for p in cashbook_group["permissions"]]
        
        assert "finance.cashbook.view" in perm_ids
        assert "finance.cashbook.create" in perm_ids
        assert "finance.cashbook.edit" in perm_ids
        assert "finance.cashbook.delete" in perm_ids
        assert "finance.cashbook.verify" in perm_ids
        assert "finance.daily_closing.view" in perm_ids
        assert "finance.daily_closing.create" in perm_ids
        assert "finance.daily_closing.lock" in perm_ids
    
    def test_finance_controls_permissions(self, auth_session):
        """Test finance_controls group has high-level permissions"""
        response = auth_session.get(f"{BASE_URL}/api/permissions/available")
        data = response.json()
        
        controls_group = data["permission_groups"]["finance_controls"]
        perm_ids = [p["id"] for p in controls_group["permissions"]]
        
        assert "finance.writeoff.approve" in perm_ids
        assert "finance.exception.mark" in perm_ids
        assert "finance.audit_log.view" in perm_ids
        assert "finance.cancellation.mark" in perm_ids
    
    def test_legacy_finance_permissions_present(self, auth_session):
        """Test that legacy finance permissions are still present for backward compatibility"""
        response = auth_session.get(f"{BASE_URL}/api/permissions/available")
        data = response.json()
        
        # Legacy finance group should exist
        assert "finance" in data["permission_groups"], "Legacy finance group should exist"
        
        legacy_group = data["permission_groups"]["finance"]
        perm_ids = [p["id"] for p in legacy_group["permissions"]]
        
        # Check some legacy permissions
        assert "finance.view_dashboard" in perm_ids
        assert "finance.view_cashbook" in perm_ids
        assert "finance.add_transaction" in perm_ids
    
    def test_crm_permissions_untouched(self, auth_session):
        """Test that CRM permission groups are still present and unchanged"""
        response = auth_session.get(f"{BASE_URL}/api/permissions/available")
        data = response.json()
        
        groups = data["permission_groups"]
        
        # CRM groups should exist
        assert "presales" in groups, "presales group should exist"
        assert "leads" in groups, "leads group should exist"
        assert "projects" in groups, "projects group should exist"
        assert "milestones" in groups, "milestones group should exist"
        assert "warranty" in groups, "warranty group should exist"
        assert "academy" in groups, "academy group should exist"
    
    def test_response_includes_available_roles(self, auth_session):
        """Test that response includes available_roles for reference"""
        response = auth_session.get(f"{BASE_URL}/api/permissions/available")
        data = response.json()
        
        assert "available_roles" in data, "Response should include available_roles"
        assert "default_role_permissions" in data, "Response should include default_role_permissions"


class TestUnauthenticatedAccess:
    """Test that endpoints require authentication"""
    
    def test_roles_available_requires_auth(self):
        """Test /api/roles/available requires authentication"""
        response = requests.get(f"{BASE_URL}/api/roles/available")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_default_permissions_requires_auth(self):
        """Test /api/roles/{role_id}/default-permissions requires authentication"""
        response = requests.get(f"{BASE_URL}/api/roles/JuniorAccountant/default-permissions")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_permissions_available_requires_auth(self):
        """Test /api/permissions/available requires authentication"""
        response = requests.get(f"{BASE_URL}/api/permissions/available")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
