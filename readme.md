# API Documentation: `/api/generate`

This endpoint generates a customized `.docx` document based on provided institution and product data, using a template and dynamic values. The generated document is uploaded to public blob storage, and a download URL is returned.

---

## 📝 Logic Overview

### Input

- **Method:** `POST`
- **Content-Type:** `application/json`
- **Body:**
  - `deal_name` (string): Name for the deal (used in output filename)
  - `doc_name` (string): Document template key (see [Supported Templates](#supported-templates))
  - `data` (object): Institution and product details

### Processing Steps

1. **Address Formatting:** Combines address fields into a single string.
2. **Product Splitting:** Separates products into ERAS and non-ERAS, computes stats (totals, counts).
3. **Template Selection:** Chooses a `.docx` template based on `doc_name`.
4. **Document Generation:** Fills the template with provided and computed data.
5. **File Upload:** Uploads the generated document to blob storage and returns a public URL.

### Output

Returns a JSON object:

- `success` (boolean): Operation status
- `message` (string): Status message
- `filename` (string): Name of the generated file
- `url` (string): Public URL to download the document

---

## 📄 Supported Templates

Use one of these values for `doc_name`:

- `Institutional_v250507`
- `Departmental_v250507`
- `MSA_v250321`
- `MSA_SOW_v250321`
- `CSA_SOW_v250609`

---

## 📦 Example Request Objects

### 1. Simple ERAS Object (Single Product)

```json
{
  "deal_name": "Test Deal",
  "doc_name": "Institutional_v250507",
  "data": {
    "institution_name": "Sample Hospital",
    "gme_id": "GME12345",
    "address": {
      "street": "123 Main St",
      "city": "Metropolis",
      "state": "NY",
      "zip": "10001"
    },
    "products": [
      {
        "properties": {
          "eras_program": "true",
          "associated_program_id": "ACGME001",
          "specialty": "Internal Medicine",
          "thalamus_core_id__sync_": "TS001",
          "amount": "5000",
          "product_name": "ERAS Core"
        }
      }
    ]
  }
}
```

### 2. Complex Object (ERAS and Non-ERAS Products)

```json
{
  "deal_name": "Complex Deal",
  "doc_name": "CSA_SOW_v250609",
  "data": {
    "institution_name": "Advanced Medical Center",
    "gme_id": "GME67890",
    "address": {
      "street": "456 Elm St",
      "city": "Gotham",
      "state": "CA",
      "zip": "90001"
    },
    "products": [
      {
        "properties": {
          "eras_program": "true",
          "associated_program_id": "ACGME002",
          "specialty": "Surgery",
          "thalamus_core_id__sync_": "TS002",
          "amount": "8000",
          "product_name": "ERAS Video"
        }
      },
      {
        "properties": {
          "eras_program": "false",
          "associated_program_id": "ACGME003",
          "specialty": "Pediatrics",
          "thalamus_core_id__sync_": "TS003",
          "amount": "3000",
          "product_name": "Core"
        }
      },
      {
        "properties": {
          "eras_program": "false",
          "associated_program_id": "ACGME003",
          "specialty": "Pediatrics",
          "thalamus_core_id__sync_": "TS003",
          "amount": "2000",
          "product_name": "Video"
        }
      }
    ]
  }
}
```

---

For further details, see the code in `api/generate.js` and `utils/helpers.js`.
