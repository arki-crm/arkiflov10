"""
Test Document Attachment (Proof) Layer for Finance Module
Tests: Upload, List, Download, Delete attachments for cashbook, expense, project, liability entities
"""
import pytest
import requests
import os
import io
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "thaha.pakayil@gmail.com"
TEST_PASSWORD = "password123"


class TestDocumentAttachments:
    """Document Attachment API Tests"""
    
    session_token = None
    test_attachment_id = None
    test_entity_id = f"test_entity_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get session token"""
        if not TestDocumentAttachments.session_token:
            response = requests.post(
                f"{BASE_URL}/api/auth/local-login",
                json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
            )
            if response.status_code == 200:
                # Extract session token from cookies
                TestDocumentAttachments.session_token = response.cookies.get('session_token')
            else:
                pytest.skip(f"Login failed: {response.status_code}")
    
    def get_headers(self):
        """Get auth headers"""
        return {"Authorization": f"Bearer {TestDocumentAttachments.session_token}"}
    
    def get_cookies(self):
        """Get auth cookies"""
        return {"session_token": TestDocumentAttachments.session_token}
    
    # ============ UPLOAD TESTS ============
    
    def test_upload_pdf_attachment(self):
        """Test uploading a PDF attachment"""
        # Create a simple PDF-like file (just for testing)
        pdf_content = b'%PDF-1.4 test content'
        files = {'file': ('test_document.pdf', io.BytesIO(pdf_content), 'application/pdf')}
        
        response = requests.post(
            f"{BASE_URL}/api/finance/attachments/upload",
            params={
                "entity_type": "cashbook",
                "entity_id": self.test_entity_id,
                "description": "Test PDF attachment"
            },
            files=files,
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert "attachment" in data
        assert data["attachment"]["entity_type"] == "cashbook"
        assert data["attachment"]["entity_id"] == self.test_entity_id
        assert data["attachment"]["mime_type"] == "application/pdf"
        
        # Store for later tests
        TestDocumentAttachments.test_attachment_id = data["attachment"]["attachment_id"]
        print(f"✓ PDF upload successful: {data['attachment']['attachment_id']}")
    
    def test_upload_jpg_attachment(self):
        """Test uploading a JPG image attachment"""
        # Create a minimal JPEG file header
        jpg_content = bytes([0xFF, 0xD8, 0xFF, 0xE0]) + b'\x00\x10JFIF\x00' + b'\x00' * 100
        files = {'file': ('test_image.jpg', io.BytesIO(jpg_content), 'image/jpeg')}
        
        response = requests.post(
            f"{BASE_URL}/api/finance/attachments/upload",
            params={
                "entity_type": "expense",
                "entity_id": self.test_entity_id,
                "description": "Test JPG attachment"
            },
            files=files,
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert data["attachment"]["mime_type"] == "image/jpeg"
        print(f"✓ JPG upload successful: {data['attachment']['attachment_id']}")
    
    def test_upload_png_attachment(self):
        """Test uploading a PNG image attachment"""
        # Create a minimal PNG file header
        png_content = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100
        files = {'file': ('test_image.png', io.BytesIO(png_content), 'image/png')}
        
        response = requests.post(
            f"{BASE_URL}/api/finance/attachments/upload",
            params={
                "entity_type": "project",
                "entity_id": self.test_entity_id,
                "description": "Test PNG attachment"
            },
            files=files,
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert data["attachment"]["mime_type"] == "image/png"
        print(f"✓ PNG upload successful: {data['attachment']['attachment_id']}")
    
    def test_upload_liability_attachment(self):
        """Test uploading attachment for liability entity"""
        pdf_content = b'%PDF-1.4 liability proof'
        files = {'file': ('liability_proof.pdf', io.BytesIO(pdf_content), 'application/pdf')}
        
        response = requests.post(
            f"{BASE_URL}/api/finance/attachments/upload",
            params={
                "entity_type": "liability",
                "entity_id": self.test_entity_id,
                "description": "Liability proof document"
            },
            files=files,
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert data["attachment"]["entity_type"] == "liability"
        print(f"✓ Liability attachment upload successful")
    
    def test_upload_invalid_file_type(self):
        """Test that invalid file types are rejected"""
        # Try to upload a .txt file
        txt_content = b'This is a text file'
        files = {'file': ('test.txt', io.BytesIO(txt_content), 'text/plain')}
        
        response = requests.post(
            f"{BASE_URL}/api/finance/attachments/upload",
            params={
                "entity_type": "cashbook",
                "entity_id": self.test_entity_id,
                "description": "Invalid file type"
            },
            files=files,
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "not allowed" in response.json().get("detail", "").lower() or "supported" in response.json().get("detail", "").lower()
        print("✓ Invalid file type correctly rejected")
    
    def test_upload_invalid_entity_type(self):
        """Test that invalid entity types are rejected"""
        pdf_content = b'%PDF-1.4 test'
        files = {'file': ('test.pdf', io.BytesIO(pdf_content), 'application/pdf')}
        
        response = requests.post(
            f"{BASE_URL}/api/finance/attachments/upload",
            params={
                "entity_type": "invalid_type",
                "entity_id": self.test_entity_id,
                "description": "Invalid entity type"
            },
            files=files,
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "invalid entity type" in response.json().get("detail", "").lower()
        print("✓ Invalid entity type correctly rejected")
    
    def test_upload_missing_entity_id(self):
        """Test that missing entity_id is rejected"""
        pdf_content = b'%PDF-1.4 test'
        files = {'file': ('test.pdf', io.BytesIO(pdf_content), 'application/pdf')}
        
        response = requests.post(
            f"{BASE_URL}/api/finance/attachments/upload",
            params={
                "entity_type": "cashbook",
                "entity_id": "",
                "description": "Missing entity ID"
            },
            files=files,
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "entity_id" in response.json().get("detail", "").lower()
        print("✓ Missing entity_id correctly rejected")
    
    def test_upload_unauthenticated(self):
        """Test that unauthenticated upload is rejected"""
        pdf_content = b'%PDF-1.4 test'
        files = {'file': ('test.pdf', io.BytesIO(pdf_content), 'application/pdf')}
        
        response = requests.post(
            f"{BASE_URL}/api/finance/attachments/upload",
            params={
                "entity_type": "cashbook",
                "entity_id": "test123",
                "description": "Unauthenticated"
            },
            files=files
            # No cookies/auth
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Unauthenticated upload correctly rejected")
    
    # ============ LIST TESTS ============
    
    def test_list_attachments_for_entity(self):
        """Test listing attachments for a specific entity"""
        response = requests.get(
            f"{BASE_URL}/api/finance/attachments/cashbook/{self.test_entity_id}",
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 200, f"List failed: {response.text}"
        data = response.json()
        assert "attachments" in data
        assert "count" in data
        assert isinstance(data["attachments"], list)
        print(f"✓ Listed {data['count']} attachments for cashbook entity")
    
    def test_list_attachments_expense_entity(self):
        """Test listing attachments for expense entity"""
        response = requests.get(
            f"{BASE_URL}/api/finance/attachments/expense/{self.test_entity_id}",
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "attachments" in data
        print(f"✓ Listed {data['count']} attachments for expense entity")
    
    def test_list_attachments_project_entity(self):
        """Test listing attachments for project entity"""
        response = requests.get(
            f"{BASE_URL}/api/finance/attachments/project/{self.test_entity_id}",
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "attachments" in data
        print(f"✓ Listed {data['count']} attachments for project entity")
    
    def test_list_attachments_liability_entity(self):
        """Test listing attachments for liability entity"""
        response = requests.get(
            f"{BASE_URL}/api/finance/attachments/liability/{self.test_entity_id}",
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "attachments" in data
        print(f"✓ Listed {data['count']} attachments for liability entity")
    
    def test_list_attachments_invalid_entity_type(self):
        """Test listing with invalid entity type"""
        response = requests.get(
            f"{BASE_URL}/api/finance/attachments/invalid_type/test123",
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 400
        print("✓ Invalid entity type correctly rejected for list")
    
    def test_list_attachments_unauthenticated(self):
        """Test that unauthenticated list is rejected"""
        response = requests.get(
            f"{BASE_URL}/api/finance/attachments/cashbook/test123"
            # No cookies/auth
        )
        
        assert response.status_code == 401
        print("✓ Unauthenticated list correctly rejected")
    
    # ============ DOWNLOAD TESTS ============
    
    def test_download_attachment(self):
        """Test downloading an attachment"""
        if not TestDocumentAttachments.test_attachment_id:
            pytest.skip("No test attachment available")
        
        response = requests.get(
            f"{BASE_URL}/api/finance/attachments/download/{TestDocumentAttachments.test_attachment_id}",
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 200, f"Download failed: {response.text}"
        assert len(response.content) > 0
        print(f"✓ Downloaded attachment: {len(response.content)} bytes")
    
    def test_download_nonexistent_attachment(self):
        """Test downloading a non-existent attachment"""
        response = requests.get(
            f"{BASE_URL}/api/finance/attachments/download/nonexistent_id_12345",
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 404
        print("✓ Non-existent attachment correctly returns 404")
    
    def test_download_unauthenticated(self):
        """Test that unauthenticated download is rejected"""
        response = requests.get(
            f"{BASE_URL}/api/finance/attachments/download/any_id"
            # No cookies/auth
        )
        
        assert response.status_code == 401
        print("✓ Unauthenticated download correctly rejected")
    
    # ============ GET BY IDS TESTS ============
    
    def test_get_attachments_by_ids(self):
        """Test getting attachments by multiple IDs"""
        if not TestDocumentAttachments.test_attachment_id:
            pytest.skip("No test attachment available")
        
        response = requests.get(
            f"{BASE_URL}/api/finance/attachments/by-ids",
            params={"ids": TestDocumentAttachments.test_attachment_id},
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "attachments" in data
        assert len(data["attachments"]) >= 1
        print(f"✓ Got {len(data['attachments'])} attachments by IDs")
    
    def test_get_attachments_by_ids_empty(self):
        """Test getting attachments with empty IDs"""
        response = requests.get(
            f"{BASE_URL}/api/finance/attachments/by-ids",
            params={"ids": ""},
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["attachments"] == []
        print("✓ Empty IDs returns empty list")
    
    def test_get_attachments_by_ids_unauthenticated(self):
        """Test that unauthenticated by-ids is rejected"""
        response = requests.get(
            f"{BASE_URL}/api/finance/attachments/by-ids",
            params={"ids": "test_id"}
            # No cookies/auth
        )
        
        assert response.status_code == 401
        print("✓ Unauthenticated by-ids correctly rejected")
    
    # ============ DELETE TESTS ============
    
    def test_delete_attachment(self):
        """Test deleting an attachment (uploader can delete)"""
        # First upload a new attachment to delete
        pdf_content = b'%PDF-1.4 to be deleted'
        files = {'file': ('delete_me.pdf', io.BytesIO(pdf_content), 'application/pdf')}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/finance/attachments/upload",
            params={
                "entity_type": "cashbook",
                "entity_id": "delete_test_entity",
                "description": "To be deleted"
            },
            files=files,
            cookies=self.get_cookies()
        )
        
        assert upload_response.status_code == 200
        attachment_id = upload_response.json()["attachment"]["attachment_id"]
        
        # Now delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/finance/attachments/{attachment_id}",
            cookies=self.get_cookies()
        )
        
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert data["success"] == True
        print(f"✓ Attachment deleted successfully")
        
        # Verify it's gone
        verify_response = requests.get(
            f"{BASE_URL}/api/finance/attachments/download/{attachment_id}",
            cookies=self.get_cookies()
        )
        assert verify_response.status_code == 404
        print("✓ Deleted attachment no longer accessible")
    
    def test_delete_nonexistent_attachment(self):
        """Test deleting a non-existent attachment"""
        response = requests.delete(
            f"{BASE_URL}/api/finance/attachments/nonexistent_id_12345",
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 404
        print("✓ Non-existent attachment delete returns 404")
    
    def test_delete_unauthenticated(self):
        """Test that unauthenticated delete is rejected"""
        response = requests.delete(
            f"{BASE_URL}/api/finance/attachments/any_id"
            # No cookies/auth
        )
        
        assert response.status_code == 401
        print("✓ Unauthenticated delete correctly rejected")


class TestAttachmentMetadata:
    """Test attachment metadata and file storage"""
    
    session_token = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get session token"""
        if not TestAttachmentMetadata.session_token:
            response = requests.post(
                f"{BASE_URL}/api/auth/local-login",
                json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
            )
            if response.status_code == 200:
                TestAttachmentMetadata.session_token = response.cookies.get('session_token')
            else:
                pytest.skip(f"Login failed: {response.status_code}")
    
    def get_cookies(self):
        return {"session_token": TestAttachmentMetadata.session_token}
    
    def test_attachment_metadata_fields(self):
        """Test that attachment metadata contains all required fields"""
        entity_id = f"metadata_test_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        pdf_content = b'%PDF-1.4 metadata test'
        files = {'file': ('metadata_test.pdf', io.BytesIO(pdf_content), 'application/pdf')}
        
        response = requests.post(
            f"{BASE_URL}/api/finance/attachments/upload",
            params={
                "entity_type": "cashbook",
                "entity_id": entity_id,
                "description": "Metadata test description"
            },
            files=files,
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 200
        attachment = response.json()["attachment"]
        
        # Verify all required metadata fields
        assert "attachment_id" in attachment
        assert "entity_type" in attachment
        assert "entity_id" in attachment
        assert "file_name" in attachment
        assert "file_path" in attachment
        assert "file_size" in attachment
        assert "mime_type" in attachment
        assert "description" in attachment
        assert "uploaded_by" in attachment
        assert "uploaded_by_name" in attachment
        assert "uploaded_at" in attachment
        
        # Verify values
        assert attachment["entity_type"] == "cashbook"
        assert attachment["entity_id"] == entity_id
        assert attachment["description"] == "Metadata test description"
        assert attachment["file_size"] > 0
        
        print("✓ All metadata fields present and correct")
    
    def test_file_path_structure(self):
        """Test that file path follows YYYY/MM structure"""
        entity_id = f"path_test_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        pdf_content = b'%PDF-1.4 path test'
        files = {'file': ('path_test.pdf', io.BytesIO(pdf_content), 'application/pdf')}
        
        response = requests.post(
            f"{BASE_URL}/api/finance/attachments/upload",
            params={
                "entity_type": "expense",
                "entity_id": entity_id,
                "description": "Path structure test"
            },
            files=files,
            cookies=self.get_cookies()
        )
        
        assert response.status_code == 200
        file_path = response.json()["attachment"]["file_path"]
        
        # Verify path structure: finance/YYYY/MM/filename
        assert file_path.startswith("finance/")
        parts = file_path.split("/")
        assert len(parts) >= 4  # finance/YYYY/MM/filename
        
        # Verify year/month format
        year = parts[1]
        month = parts[2]
        assert len(year) == 4 and year.isdigit()
        assert len(month) == 2 and month.isdigit()
        
        print(f"✓ File path structure correct: {file_path}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
