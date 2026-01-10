"""
Accounting Module Backend Tests
Tests for Cash Book, Accounts, Categories, Transactions, and Daily Closing
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "thaha.pakayil@gmail.com"
TEST_PASSWORD = "password123"


class TestAccountingModule:
    """Accounting Module API Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session and authenticate"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get session
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/local-login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        # Store cookies for subsequent requests
        self.cookies = login_response.cookies
        
    # ============ ACCOUNTS TESTS ============
    
    def test_get_accounts_list(self):
        """GET /api/accounting/accounts - List all accounts"""
        response = self.session.get(
            f"{BASE_URL}/api/accounting/accounts",
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to get accounts: {response.text}"
        
        accounts = response.json()
        assert isinstance(accounts, list), "Response should be a list"
        
        # Verify account structure
        if len(accounts) > 0:
            account = accounts[0]
            assert "account_id" in account, "Account should have account_id"
            assert "account_name" in account, "Account should have account_name"
            assert "account_type" in account, "Account should have account_type"
            assert "current_balance" in account, "Account should have current_balance"
            print(f"✓ Found {len(accounts)} accounts")
            for acc in accounts:
                print(f"  - {acc['account_name']}: ₹{acc['current_balance']}")
    
    def test_create_account(self):
        """POST /api/accounting/accounts - Create new account"""
        test_account = {
            "account_name": "TEST_Test Bank Account",
            "account_type": "bank",
            "bank_name": "Test Bank",
            "branch": "Test Branch",
            "category": "Company Bank (Secondary)",
            "opening_balance": 10000.0,
            "is_active": True
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/accounting/accounts",
            json=test_account,
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to create account: {response.text}"
        
        created = response.json()
        assert created["account_name"] == test_account["account_name"]
        assert created["account_type"] == test_account["account_type"]
        assert created["opening_balance"] == test_account["opening_balance"]
        assert created["current_balance"] == test_account["opening_balance"]
        assert "account_id" in created
        
        print(f"✓ Created account: {created['account_id']}")
        
        # Cleanup - store for later deletion
        self.created_account_id = created["account_id"]
        
        # Verify persistence with GET
        get_response = self.session.get(
            f"{BASE_URL}/api/accounting/accounts",
            cookies=self.cookies
        )
        accounts = get_response.json()
        found = any(a["account_id"] == created["account_id"] for a in accounts)
        assert found, "Created account should be in list"
        print(f"✓ Account persisted and found in list")
    
    # ============ CATEGORIES TESTS ============
    
    def test_get_categories_list(self):
        """GET /api/accounting/categories - List all categories"""
        response = self.session.get(
            f"{BASE_URL}/api/accounting/categories",
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to get categories: {response.text}"
        
        categories = response.json()
        assert isinstance(categories, list), "Response should be a list"
        assert len(categories) > 0, "Should have at least default categories"
        
        # Verify category structure
        category = categories[0]
        assert "category_id" in category, "Category should have category_id"
        assert "name" in category, "Category should have name"
        assert "is_active" in category, "Category should have is_active"
        
        print(f"✓ Found {len(categories)} categories")
        for cat in categories:
            print(f"  - {cat['name']}")
    
    def test_create_category(self):
        """POST /api/accounting/categories - Create new category"""
        test_category = {
            "name": "TEST_Test Category",
            "description": "Test category for automated testing",
            "is_active": True
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/accounting/categories",
            json=test_category,
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to create category: {response.text}"
        
        created = response.json()
        assert created["name"] == test_category["name"]
        assert created["description"] == test_category["description"]
        assert "category_id" in created
        
        print(f"✓ Created category: {created['category_id']}")
        
        # Verify persistence
        get_response = self.session.get(
            f"{BASE_URL}/api/accounting/categories",
            cookies=self.cookies
        )
        categories = get_response.json()
        found = any(c["category_id"] == created["category_id"] for c in categories)
        assert found, "Created category should be in list"
        print(f"✓ Category persisted and found in list")
    
    # ============ TRANSACTIONS TESTS ============
    
    def test_get_transactions_for_date(self):
        """GET /api/accounting/transactions - Get transactions for a date"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        response = self.session.get(
            f"{BASE_URL}/api/accounting/transactions?date={today}",
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to get transactions: {response.text}"
        
        transactions = response.json()
        assert isinstance(transactions, list), "Response should be a list"
        
        print(f"✓ Found {len(transactions)} transactions for {today}")
        
        if len(transactions) > 0:
            txn = transactions[0]
            assert "transaction_id" in txn, "Transaction should have transaction_id"
            assert "amount" in txn, "Transaction should have amount"
            assert "transaction_type" in txn, "Transaction should have transaction_type"
            assert "account_name" in txn, "Transaction should have account_name"
            assert "category_name" in txn, "Transaction should have category_name"
    
    def test_create_transaction_and_verify_balance_update(self):
        """POST /api/accounting/transactions - Create transaction and verify balance update"""
        # First get accounts and categories
        accounts_response = self.session.get(
            f"{BASE_URL}/api/accounting/accounts",
            cookies=self.cookies
        )
        accounts = accounts_response.json()
        assert len(accounts) > 0, "Need at least one account"
        
        categories_response = self.session.get(
            f"{BASE_URL}/api/accounting/categories",
            cookies=self.cookies
        )
        categories = categories_response.json()
        assert len(categories) > 0, "Need at least one category"
        
        # Get initial balance
        account = accounts[0]
        initial_balance = account["current_balance"]
        
        # Create outflow transaction
        test_txn = {
            "transaction_date": datetime.now().isoformat(),
            "transaction_type": "outflow",
            "amount": 100.0,
            "mode": "cash",
            "category_id": categories[0]["category_id"],
            "account_id": account["account_id"],
            "paid_to": "TEST_Vendor",
            "remarks": "TEST_Automated test transaction"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/accounting/transactions",
            json=test_txn,
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to create transaction: {response.text}"
        
        created = response.json()
        assert created["amount"] == test_txn["amount"]
        assert created["transaction_type"] == test_txn["transaction_type"]
        assert created["remarks"] == test_txn["remarks"]
        assert "transaction_id" in created
        
        print(f"✓ Created transaction: {created['transaction_id']}")
        
        # Verify balance was updated
        accounts_after = self.session.get(
            f"{BASE_URL}/api/accounting/accounts",
            cookies=self.cookies
        ).json()
        
        updated_account = next(a for a in accounts_after if a["account_id"] == account["account_id"])
        expected_balance = initial_balance - 100.0  # outflow reduces balance
        assert updated_account["current_balance"] == expected_balance, \
            f"Balance should be {expected_balance}, got {updated_account['current_balance']}"
        
        print(f"✓ Balance updated correctly: {initial_balance} -> {updated_account['current_balance']}")
    
    def test_create_inflow_transaction(self):
        """POST /api/accounting/transactions - Create inflow transaction"""
        accounts = self.session.get(f"{BASE_URL}/api/accounting/accounts", cookies=self.cookies).json()
        categories = self.session.get(f"{BASE_URL}/api/accounting/categories", cookies=self.cookies).json()
        
        account = accounts[0]
        initial_balance = account["current_balance"]
        
        test_txn = {
            "transaction_date": datetime.now().isoformat(),
            "transaction_type": "inflow",
            "amount": 500.0,
            "mode": "bank_transfer",
            "category_id": categories[0]["category_id"],
            "account_id": account["account_id"],
            "paid_to": "TEST_Client Payment",
            "remarks": "TEST_Inflow test transaction"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/accounting/transactions",
            json=test_txn,
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to create inflow: {response.text}"
        
        # Verify balance increased
        accounts_after = self.session.get(f"{BASE_URL}/api/accounting/accounts", cookies=self.cookies).json()
        updated_account = next(a for a in accounts_after if a["account_id"] == account["account_id"])
        expected_balance = initial_balance + 500.0
        assert updated_account["current_balance"] == expected_balance
        
        print(f"✓ Inflow transaction created, balance: {initial_balance} -> {updated_account['current_balance']}")
    
    def test_transaction_validation_no_remarks(self):
        """POST /api/accounting/transactions - Should fail without remarks"""
        accounts = self.session.get(f"{BASE_URL}/api/accounting/accounts", cookies=self.cookies).json()
        categories = self.session.get(f"{BASE_URL}/api/accounting/categories", cookies=self.cookies).json()
        
        test_txn = {
            "transaction_date": datetime.now().isoformat(),
            "transaction_type": "outflow",
            "amount": 100.0,
            "mode": "cash",
            "category_id": categories[0]["category_id"],
            "account_id": accounts[0]["account_id"],
            "remarks": ""  # Empty remarks should fail
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/accounting/transactions",
            json=test_txn,
            cookies=self.cookies
        )
        assert response.status_code == 400, "Should fail with empty remarks"
        print(f"✓ Validation works: Empty remarks rejected")
    
    def test_transaction_validation_zero_amount(self):
        """POST /api/accounting/transactions - Should fail with zero amount"""
        accounts = self.session.get(f"{BASE_URL}/api/accounting/accounts", cookies=self.cookies).json()
        categories = self.session.get(f"{BASE_URL}/api/accounting/categories", cookies=self.cookies).json()
        
        test_txn = {
            "transaction_date": datetime.now().isoformat(),
            "transaction_type": "outflow",
            "amount": 0,  # Zero amount should fail
            "mode": "cash",
            "category_id": categories[0]["category_id"],
            "account_id": accounts[0]["account_id"],
            "remarks": "Test"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/accounting/transactions",
            json=test_txn,
            cookies=self.cookies
        )
        assert response.status_code == 400, "Should fail with zero amount"
        print(f"✓ Validation works: Zero amount rejected")
    
    # ============ DAILY SUMMARY TESTS ============
    
    def test_get_daily_summary(self):
        """GET /api/accounting/daily-summary/{date} - Get daily summary"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        response = self.session.get(
            f"{BASE_URL}/api/accounting/daily-summary/{today}",
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to get daily summary: {response.text}"
        
        summary = response.json()
        assert "date" in summary, "Summary should have date"
        assert "is_locked" in summary, "Summary should have is_locked"
        assert "total_inflow" in summary, "Summary should have total_inflow"
        assert "total_outflow" in summary, "Summary should have total_outflow"
        assert "net_change" in summary, "Summary should have net_change"
        assert "transaction_count" in summary, "Summary should have transaction_count"
        assert "accounts" in summary, "Summary should have accounts"
        
        print(f"✓ Daily summary for {today}:")
        print(f"  - Total Inflow: ₹{summary['total_inflow']}")
        print(f"  - Total Outflow: ₹{summary['total_outflow']}")
        print(f"  - Net Change: ₹{summary['net_change']}")
        print(f"  - Transaction Count: {summary['transaction_count']}")
        print(f"  - Is Locked: {summary['is_locked']}")
        
        # Verify accounts in summary
        assert isinstance(summary["accounts"], list)
        if len(summary["accounts"]) > 0:
            acc_summary = summary["accounts"][0]
            assert "account_id" in acc_summary
            assert "account_name" in acc_summary
            assert "opening_balance" in acc_summary
            assert "closing_balance" in acc_summary
            assert "inflow" in acc_summary
            assert "outflow" in acc_summary
    
    def test_daily_summary_past_date(self):
        """GET /api/accounting/daily-summary/{date} - Get summary for past date"""
        past_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        
        response = self.session.get(
            f"{BASE_URL}/api/accounting/daily-summary/{past_date}",
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to get past summary: {response.text}"
        
        summary = response.json()
        assert summary["date"] == past_date
        print(f"✓ Past date summary retrieved for {past_date}")
    
    # ============ CLOSE DAY TESTS ============
    
    def test_close_day_flow(self):
        """POST /api/accounting/close-day/{date} - Test day closing flow"""
        # Use a past date that won't affect current testing
        test_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        
        # First check if already locked
        summary_response = self.session.get(
            f"{BASE_URL}/api/accounting/daily-summary/{test_date}",
            cookies=self.cookies
        )
        summary = summary_response.json()
        
        if summary.get("is_locked"):
            print(f"✓ Day {test_date} is already locked - skipping close test")
            return
        
        # Close the day
        response = self.session.post(
            f"{BASE_URL}/api/accounting/close-day/{test_date}",
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to close day: {response.text}"
        
        result = response.json()
        assert result["success"] == True
        assert "closing" in result
        
        print(f"✓ Day {test_date} closed successfully")
        
        # Verify day is now locked
        summary_after = self.session.get(
            f"{BASE_URL}/api/accounting/daily-summary/{test_date}",
            cookies=self.cookies
        ).json()
        
        assert summary_after["is_locked"] == True, "Day should be locked after closing"
        print(f"✓ Day lock verified")
    
    def test_cannot_add_transaction_to_locked_day(self):
        """POST /api/accounting/transactions - Should fail for locked day"""
        # Use the same past date we locked
        test_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        
        # First ensure day is locked
        summary = self.session.get(
            f"{BASE_URL}/api/accounting/daily-summary/{test_date}",
            cookies=self.cookies
        ).json()
        
        if not summary.get("is_locked"):
            # Lock it first
            self.session.post(
                f"{BASE_URL}/api/accounting/close-day/{test_date}",
                cookies=self.cookies
            )
        
        # Try to add transaction to locked day
        accounts = self.session.get(f"{BASE_URL}/api/accounting/accounts", cookies=self.cookies).json()
        categories = self.session.get(f"{BASE_URL}/api/accounting/categories", cookies=self.cookies).json()
        
        test_txn = {
            "transaction_date": f"{test_date}T10:00:00",
            "transaction_type": "outflow",
            "amount": 100.0,
            "mode": "cash",
            "category_id": categories[0]["category_id"],
            "account_id": accounts[0]["account_id"],
            "remarks": "TEST_Should fail - locked day"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/accounting/transactions",
            json=test_txn,
            cookies=self.cookies
        )
        assert response.status_code == 400, "Should fail for locked day"
        assert "locked" in response.json().get("detail", "").lower()
        
        print(f"✓ Transaction to locked day correctly rejected")
    
    # ============ PROJECTS LIST TEST ============
    
    def test_get_projects_list_for_accounting(self):
        """GET /api/accounting/projects-list - Get projects for expense linking"""
        response = self.session.get(
            f"{BASE_URL}/api/accounting/projects-list",
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to get projects list: {response.text}"
        
        projects = response.json()
        assert isinstance(projects, list), "Response should be a list"
        
        print(f"✓ Found {len(projects)} projects for expense linking")
    
    # ============ REPORTS TESTS ============
    
    def test_get_account_balances_report(self):
        """GET /api/accounting/reports/account-balances - Get account balances report"""
        response = self.session.get(
            f"{BASE_URL}/api/accounting/reports/account-balances",
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to get account balances: {response.text}"
        
        report = response.json()
        assert "accounts" in report
        assert "total_balance" in report
        
        print(f"✓ Account balances report: Total ₹{report['total_balance']}")
    
    def test_get_category_summary_report(self):
        """GET /api/accounting/reports/category-summary - Get category summary report"""
        response = self.session.get(
            f"{BASE_URL}/api/accounting/reports/category-summary",
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to get category summary: {response.text}"
        
        report = response.json()
        assert isinstance(report, list)
        
        print(f"✓ Category summary report: {len(report)} categories")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
