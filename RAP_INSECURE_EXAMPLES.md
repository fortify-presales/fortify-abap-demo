# INSECURE_EXAMPLES.md

> **Purpose**: This document catalogs **intentionally insecure** coding patterns in **ABAP Cloud / RAP** and shows **secure fixes**. Use this for reviews, training, and code hardening. Do **not** copy the insecure samples into production. This information was AI Generated.

---

## How to use this document
- For each risk area, you'll find: **Summary → ❌ Insecure example(s) → ✅ Secure fix**.
- Most examples target **RAP handlers, behavior definitions, CDS/DCL, and service exposure**.
- Tailor the fixes to your project's authorization model and ABAP Cloud restrictions.

---

## 1) Authorization & Data Exposure

### 1.1 Missing instance-based authorization (CDS + behavior)
**Risk:** Row/instance checks and field protections are bypassed; internal fields are exposed.

**❌ Insecure** — CDS without DCL and behavior without instance auth:
```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED  " Disables authorization checks globally
define root view entity ZI_SalesOrder as select from zso {
  key salesorder,
  customer,
  grossamount,
  secret_internal_flag   " Internal field exposed
}
```

```abap
managed implementation in class zbp_i_salesorder unique
  lock master;  " No `authorization master (instance)`
```

**✅ Secure fix** — Enforce DCL + instance-level authorization and hide internal fields:
```abap
@AccessControl.authorizationCheck: #CHECK
@EndUserText.label: 'Sales Order'
define root view entity ZI_SalesOrder as select from zso {
  key salesorder,
  customer,
  grossamount,
  @Semantics.id.hidden: true secret_internal_flag  " Hidden from consumers
}
```

```abap
managed implementation in class zbp_i_salesorder unique
  authorization master ( instance )  " Instance-based checks
  lock master;
```

Implement authorization in the behavior pool:
```abap
METHOD check_instance_authorizations.
  LOOP AT keys INTO DATA(key).
    IF NOT zcl_authz=>can_update( key-salesorder ).
      APPEND VALUE #( %tky = key-%tky ) TO failed-update.
    ENDIF.
  ENDLOOP.
ENDMETHOD.
```

### 1.2 Database modifications without authorization checks
**Risk:** DML operations bypass authorization framework, allowing unauthorized data manipulation.

**Implemented in Custom Rule:** `ABAP-STRUCTURAL-DML-AUTH-CHECK`

**❌ Insecure** — Direct database modification without authorization:
```abap
METHOD update_sales_order.
  " Direct database modification without any authorization check
  UPDATE zso SET grossamount = @lv_amount
    WHERE salesorder = @lv_salesorder.
  
  " Or using INSERT/DELETE/MODIFY without checks
  INSERT zso FROM @ls_salesorder.
ENDMETHOD.
```

**✅ Secure fix** — Always perform authorization checks before DML:
```abap
METHOD update_sales_order.
  " Perform authorization check first
  AUTHORITY-CHECK OBJECT 'S_TABU_DIS'
    ID 'DICBERCLS' FIELD '&NC&'
    ID 'ACTVT' FIELD '02'.
  
  IF sy-subrc <> 0.
    MESSAGE e001(z_msg) WITH 'No authorization for update'.
    RETURN.
  ENDIF.
  
  " Now perform the database modification
  UPDATE zso SET grossamount = @lv_amount
    WHERE salesorder = @lv_salesorder.
ENDMETHOD.
```

### 1.3 Bulk operations without WHERE conditions
**Risk:** Mass operations affect entire tables, causing data loss and performance issues.

**Implemented in Custom Rule:** `ABAP-STRUCTURAL-DML-BULK-OPERATIONS`

**❌ Insecure** — Bulk operations without restrictions:
```abap
" Dangerous: affects ALL records in table
DELETE FROM zso.
UPDATE zso SET status = 'CLOSED'.
MODIFY zso FROM TABLE @lt_all_orders.
```

**✅ Secure fix** — Always include WHERE conditions and authorization checks:
```abap
" Safe: targeted operations with proper restrictions
DELETE FROM zso WHERE status = 'CANCELLED' AND created_by = @sy-uname.

UPDATE zso SET status = 'CLOSED' 
  WHERE salesorder IN @lt_authorized_orders
  AND last_changed_by = @sy-uname.

" For bulk operations, implement batch processing with limits
SELECT salesorder FROM zso 
  INTO TABLE @DATA(lt_orders)
  WHERE status = 'OPEN'
  AND created_by = @sy-uname
  UP TO 1000 ROWS.

MODIFY zso FROM TABLE @lt_orders.
```

### 1.4 Exposing technical/internal identifiers
**Risk:** Technical GUIDs and wildcards enable enumeration and data correlation.

**❌ Insecure** — Projection leaks GUIDs and uses `*`:
```abap
@EndUserText.label: 'Sales Order Projection'
define view entity ZC_SalesOrder as projection on ZI_SalesOrder {
  key salesorder_uuid,   " Internal GUID exposed
  *                      " Wildcard leaks future fields
}
```

**✅ Secure fix** — Expose business keys only and explicitly list fields:
```abap
@EndUserText.label: 'Sales Order (UI)'
define view entity ZC_SalesOrder as projection on ZI_SalesOrder {
  key salesorder,
  customer,
  grossamount
}
```

### 1.5 Sensitive field exposure in CDS views
**Risk:** Sensitive fields exposed without proper UI hiding annotations.

**Implemented in Custom Rule:** `RAP-CDL-SENSITIVE-FIELD-EXPOSURE`

**❌ Insecure** — CDS projection exposes sensitive fields:
```abap
define view entity ZC_Customer as projection on ZI_Customer {
  key customer,
  name,
  Password,           " Sensitive field exposed
  SSN,               " Personal data exposed
  CreditCardNumber,  " Financial data exposed
  ApiKey             " Technical secret exposed
}
```

**✅ Secure fix** — Hide sensitive fields or move to internal views:
```abap
define view entity ZC_Customer as projection on ZI_Customer {
  key customer,
  name,
  @UI.hidden: true Password,           " Hidden from UI
  @UI.hidden: true SSN,               " Hidden from UI
  @UI.hidden: true CreditCardNumber,  " Hidden from UI
  @UI.hidden: true ApiKey             " Hidden from UI
}
```

### 1.6 Unbounded queries and over-broad $expand/$select
**Risk:** Data scraping and DoS via deep, unpaged reads.

**❌ Insecure** — Service exposes everything with no limits:
```abap
service definition ZUI_Sales {
  expose ZC_SalesOrder as SalesOrders;
  expose ZC_SalesItem  as SalesItems;  " Deep $expand possible
}
" No pagination, no restrict in service binding
```

**✅ Secure fix** — Expose minimal projections and restrict operations; enforce paging in handlers:
```abap
service definition ZUI_Sales {
  expose ZC_SalesOrder as SalesOrders;
}
```

```abap
" In read handler
DATA(lo_paging) = io_request->get_paging( ).
DATA(lv_top)    = COND i( WHEN lo_paging IS BOUND THEN lo_paging->get_top( ) ELSE 0 ).
IF lv_top = 0 OR lv_top > 200.
  lv_top = 200.  " Server-side cap
ENDIF.
" Apply lv_top in your query build (example omitted for brevity)
```

---

## 2) Input Validation & Injection

### 2.1 Dynamic Open SQL from request parameters (SQL injection)
**Risk:** User-influenced fragments injected into `WHERE`.

**❌ Insecure**
```abap
DATA(lv_status) = io_request->get_parameter( )->get_value( 'status' ).
DATA(lv_where)  = |status = '{ lv_status }' OR customer = '{ lv_status }'|.
SELECT * FROM zso INTO TABLE @DATA(lt_so) WHERE (lv_where).  " Injection surface
```

**✅ Secure fix** — Whitelist and bind parameters; or let RAP handle filters:
```abap
DATA(lv_status) = io_request->get_parameter( )->get_value( 'status' ).
IF lv_status IS NOT INITIAL AND lv_status \IN VALUE stringtab( ( 'OPEN' ) ( 'CLOSED' ) ( 'HOLD' ) ).
  SELECT * FROM zso INTO TABLE @DATA(lt_so)
    WHERE status = @lv_status.  " Bound parameter
ELSE.
  CLEAR lt_so.
ENDIF.
```

Or parse `$filter` via RAP query API rather than building strings.

### 2.2 Trusting file paths/names (path traversal, Zip Slip)
**Risk:** Header injection and file path traversal in zips and downloads.

**❌ Insecure**
```abap
DATA(lv_name) = io_request->get_parameter( )->get_value( 'fileName' ).  " e.g., ../../etc/passwd
lo_resp->set_header_field( i_name = 'Content-Disposition'
                           i_value = |attachment; filename={ lv_name }| ).
lo_zip->add( name = lv_name content = lv_content ).  " Attacker path in entry
```

**✅ Secure fix** — Sanitize names and quote safely; disallow path separators:
```abap
DATA(lv_name_raw) = io_request->get_parameter( )->get_value( 'fileName' ).
DATA(lv_name) = lv_name_raw.
REPLACE ALL OCCURRENCES OF '\\' IN lv_name WITH ''.
REPLACE ALL OCCURRENCES OF '/'  IN lv_name WITH ''.
REPLACE ALL OCCURRENCES OF '..' IN lv_name WITH ''.
IF lv_name IS INITIAL.
  lv_name = 'download.zip'.
ENDIF.
lo_resp->set_header_field( i_name  = 'Content-Disposition'
                           i_value = |attachment; filename="{ lv_name }"| ).
lo_zip->add( name = lv_name content = lv_content ).
```

### 2.3 Blindly trusting action payloads
**Risk:** Arbitrary fields/values cause invalid state and bypass constraints.

**❌ Insecure**
```abap
METHOD submitorder.
  io_request->get_body( )->get_binary( IMPORTING data = DATA(lv_json) ).
  " Parses and applies updates without validation (omitted)
ENDMETHOD.
```

**✅ Secure fix** — Use strong types and validators; reject unknown fields:
```abap
METHOD submitorder.
  DATA ls_in TYPE zty_submitorder_in.
  io_request->get_body( )->get_json( CHANGING data = ls_in ).  " Strongly-typed
  IF ls_in.priority IS NOT INITIAL AND ls_in.priority \NOT IN VALUE stringtab( ( 'NORMAL' ) ( 'HIGH' ) ).
    " return message: invalid priority
    RETURN.
  ENDIF.
  " Perform updates only after validation
ENDMETHOD.
```

---

## 3) Concurrency & Data Integrity

### 3.1 Ignoring ETags / If-Match (lost updates)
**Risk:** Overwrites concurrent changes.

**❌ Insecure**
```abap
METHOD update.
  READ ENTITIES OF ZI_SalesOrder IN LOCAL MODE
    ENTITY SalesOrder
    ALL FIELDS WITH CORRESPONDING #( keys ) RESULT DATA(lt_so).

  MODIFY ENTITIES OF ZI_SalesOrder IN LOCAL MODE
    ENTITY SalesOrder
    UPDATE FIELDS ( grossamount customer ) WITH VALUE #( FOR so IN lt_so ( ... ) ).
ENDMETHOD.
```

**✅ Secure fix** — Respect ETags; fail on mismatch:
```abap
METHOD update.
  DATA(lv_if_match) = io_request->get_if_match_etag( ).
  " Retrieve current ETag of target (implementation-specific, e.g., from last_changed_at)
  READ ENTITIES OF ZI_SalesOrder IN LOCAL MODE ENTITY SalesOrder
    FIELDS ( last_changed_at ) WITH CORRESPONDING #( keys ) RESULT DATA(lt_so).
  LOOP AT lt_so INTO DATA(ls).
    IF lv_if_match IS INITIAL OR lv_if_match <> zcl_etag=>from_timestamp( ls-last_changed_at ).
      " report precondition failed (412)
      RETURN.
    ENDIF.
  ENDLOOP.
  " proceed with update
ENDMETHOD.
```

### 3.2 Side-effect actions in $batch without atomicity
**Risk:** Partial success leaves inconsistent state.

**❌ Insecure**
```abap
METHOD closeperiod.
  PERFORM post_accruals.
  PERFORM archive_data.
  PERFORM flip_flags.
ENDMETHOD.
```

**✅ Secure fix** — Make the action idempotent, small, or align with RAP SAVE sequence and compensate on failure. Example guard:
```abap
METHOD closeperiod.
  TRY.
      zcl_tx=>begin( ).
      post_accruals( ).
      archive_data( ).
      flip_flags( ).
      zcl_tx=>commit( ).
    CATCH cx_static_check INTO DATA(lx).
      zcl_tx=>rollback( ).
      " report error without exposing internals
  ENDTRY.
ENDMETHOD.
```

---

## 4) Secrets, Destinations & Connectivity

### 4.1 Hard-coded credentials and URLs
**Risk:** Credential leakage; bypasses platform security.

**❌ Insecure**
```abap
DATA(lv_user) = 'api-user'.
DATA(lv_pass) = 'S3cr3t!'.
DATA(lv_url)  = 'https://partner.example.com/api/orders'.
DATA(lo_client) = cl_web_http_client_manager=>create_by_url( lv_url ).
lo_client->get_http_request( )->set_authorization_basic( lv_user, lv_pass ).
```

**✅ Secure fix** — Use Communication Arrangements & Destinations:
```abap
DATA(lo_dest) = cl_http_destination_provider=>create_by_cloud_destination( i_name = 'PARTNER_API' ).
DATA(lo_client) = cl_web_http_client_manager=>create_by_http_destination( lo_dest ).
" Auth is configured in the destination; do not log or echo secrets
```

### 4.2 SSRF via user-controlled URL
**Risk:** Attacker forces calls to internal services.

**❌ Insecure**
```abap
DATA(lv_url) = io_request->get_parameter( )->get_value( 'callbackUrl' ).
DATA(lo_client) = cl_web_http_client_manager=>create_by_url( lv_url ).
lo_client->execute( if_web_http_client=>get( ) ).
```

**✅ Secure fix** — Only call predefined destinations; if dynamic, map to a whitelist key:
```abap
DATA(lv_target) = io_request->get_parameter( )->get_value( 'target' ).
CASE lv_target.
  WHEN 'PARTNER_A'. lv_target = 'DEST_PARTNER_A'.
  WHEN 'PARTNER_B'. lv_target = 'DEST_PARTNER_B'.
  WHEN OTHERS. RETURN. " reject
ENDCASE.
DATA(lo_dest) = cl_http_destination_provider=>create_by_cloud_destination( i_name = lv_target ).
DATA(lo_client) = cl_web_http_client_manager=>create_by_http_destination( lo_dest ).
```

---

## 5) Logging, Errors & Privacy

### 5.1 Logging PII and secrets
**Risk:** Sensitive data persists in logs and exports.

**❌ Insecure**
```abap
io_request->get_header_fields( IMPORTING fields = DATA(lt_headers) ).
WRITE: / 'Headers:', lt_headers.   " Authorization/JWT may leak
WRITE: / 'Payload:', lv_json.      " PII may leak
```

**✅ Secure fix** — Log minimal metadata; mask sensitive values:
```abap
DATA(lv_corr) = io_request->get_correlation_id( ).
WRITE: / |Request ID: { lv_corr }|.
" Avoid logging payloads and secrets; if needed, hash or mask them
```

### 5.2 Insecure logging implementation
**Risk:** Application logging frameworks may capture sensitive data in log variables.

**Implemented in Custom Rules:** `ABAP-STRUCTURAL-LOGGING-INSECURE`, `ABAP-CHARACTERIZATION-BALI-LOG`

**❌ Insecure** — BALI logging with sensitive data:
```abap
METHOD log_user_action.
  " Dangerous: logging sensitive data directly
  DATA(lo_msg) = cl_bali_message_setter=>create(
    severity    = if_bali_constants=>c_severity_information
    id          = 'ZMSG'
    number      = '001'
    variable_1  = |User: { lv_user }|
    variable_2  = |Password: { lv_password }|    " Sensitive data in log
    variable_3  = |API Key: { lv_api_key }|      " Sensitive data in log
  ).
  
  " Also dangerous: direct console logging
  out->write( |User login: { lv_user } with password { lv_password }| ).
ENDMETHOD.
```

**✅ Secure fix** — Implement data masking and avoid sensitive data in logs:
```abap
METHOD log_user_action.
  " Safe: mask sensitive data and log minimal information
  DATA(lv_masked_user) = zcl_data_mask=>mask_username( lv_user ).
  
  DATA(lo_msg) = cl_bali_message_setter=>create(
    severity    = if_bali_constants=>c_severity_information
    id          = 'ZMSG'
    number      = '001'
    variable_1  = |User: { lv_masked_user }|
    variable_2  = |Action: LOGIN_ATTEMPT|        " Generic action instead of sensitive data
    variable_3  = |Timestamp: { sy-datum }|      " Non-sensitive metadata
  ).
  
  " Safe console output without sensitive data
  out->write( |User login attempt logged for session { sy-sessid }| ).
ENDMETHOD.
```

### 5.3 Sensitive data in console output
**Risk:** Development tools console output may expose sensitive information.

**Implemented in Custom Rules:** `ABAP-DATAFLOW-SINK-CLASSRUN-WRITE`, `ABAP-DATAFLOW-SINK-CLASSRUN-OUT-WRITE`

**❌ Insecure** — Console output with sensitive data:
```abap
METHOD if_oo_adt_classrun~main.
  " Dangerous: exposing sensitive data in console
  DATA(ls_creds) = get_credentials( ).
  out->write( |Username: { ls_creds-username }| ).
  out->write( |Password: { ls_creds-password }| ).
  out->write( |API Token: { ls_creds-token }| ).
  
  " Also dangerous: exposing PII
  SELECT * FROM zcustomer INTO TABLE @DATA(lt_customers).
  LOOP AT lt_customers INTO DATA(ls_customer).
    out->write( |Customer SSN: { ls_customer-ssn }| ).
  ENDLOOP.
ENDMETHOD.
```

**✅ Secure fix** — Mask sensitive data or use generic messages:
```abap
METHOD if_oo_adt_classrun~main.
  " Safe: generic success messages without sensitive data
  DATA(ls_creds) = get_credentials( ).
  IF ls_creds IS NOT INITIAL.
    out->write( |Credentials loaded successfully| ).
  ELSE.
    out->write( |Failed to load credentials| ).
  ENDIF.
  
  " Safe: count or summary information instead of sensitive details
  SELECT COUNT(*) FROM zcustomer INTO @DATA(lv_count).
  out->write( |Processed { lv_count } customer records| ).
ENDMETHOD.
```

### 5.4 Sensitive data in MESSAGE statements
**Risk:** MESSAGE statements expose sensitive data to end users through UI.

**Implemented in Custom Rule:** `ABAP-DATAFLOW-SINK-MESSAGE`

**❌ Insecure** — MESSAGE with sensitive data:
```abap
METHOD process_payment.
  " Dangerous: exposing sensitive data in user-visible messages
  MESSAGE i001(zpay) WITH 'Payment processed for card' lv_credit_card_number.
  MESSAGE e002(zpay) WITH 'API call failed with key' lv_api_key.
  MESSAGE s003(zpay) WITH 'User' lv_username 'logged in with password' lv_password.
ENDMETHOD.
```

**✅ Secure fix** — Use generic messages; log details securely server-side:
```abap
METHOD process_payment.
  " Safe: generic user messages
  MESSAGE i001(zpay) WITH 'Payment processed successfully'.
  MESSAGE e002(zpay) WITH 'Payment processing failed - contact support'.
  MESSAGE s003(zpay) WITH 'User logged in successfully'.
  
  " Log detailed information securely for debugging (server-side only)
  zcl_secure_logger=>log_payment_details( 
    card_last4 = lv_credit_card_number+12(4)  " Only last 4 digits
    user = lv_username
    " Never log passwords or full card numbers
  ).
ENDMETHOD.
```

### 5.5 Over-detailed error messages
**Risk:** Reveals schema and SQL internals to attackers.

**❌ Insecure**
```abap
CATCH cx_sy_open_sql_db INTO DATA(lx).
APPEND VALUE #( id = 'DB_ERR' number = 001 v1 = lx->sqlmsg v2 = lx->get_text( ) ) TO reported-salesorder.
```

**✅ Secure fix** — Return generic messages to client; put details into protected logs:
```abap
CATCH cx_sy_open_sql_db INTO DATA(lx).
APPEND VALUE #( %msg = new_message_with_text( severity = if_abap_behv_message=>severity-error
                                             text     = 'Database error during update' ) )
       TO reported-salesorder.
" Write lx details to a secure server-side log only
```

---

## 6) RAP Behavior Pitfalls

### 6.1 Determination with raw SELECT bypassing auth
**Risk:** Reads outside of authorized scope; ignores DCL and instance auth.

**❌ Insecure**
```abap
METHOD determination~calculate_credit.
  SELECT * FROM zcustomer INTO TABLE @DATA(lt_cust) WHERE customer = @customer.
  " compute & update...
ENDMETHOD.
```

**✅ Secure fix** — Read via RAP entities or CDS that honors DCL; never `PRIVILEGED` unless justified:
```abap
METHOD determination~calculate_credit.
  READ ENTITIES OF ZI_Customer IN LOCAL MODE
    ENTITY Customer FIELDS ( credit_limit balance )
    WITH VALUE #( ( %tky = customer ) )
    RESULT DATA(lt_cust).
  " proceed with authorized data only
ENDMETHOD.
```

### 6.2 Missing restrict in service binding / exposing base views
**Risk:** Full surface published by accident, including sensitive fields and operations.

**❌ Insecure**
```abap
service definition ZUI_FullAccess {
  expose ZI_SalesOrder as SalesOrders;  " Interface view directly
  expose ZI_SalesItem  as SalesItems;
}
" Service binding left unrestricted
```

**✅ Secure fix** — Expose projections only and restrict operations per entity in the binding.
```abap
service definition ZUI_Sales {
  expose ZC_SalesOrder as SalesOrders;  " Projection
}
" In the service binding: restrict to READ only, disable unwanted $expand/actions
```

### 6.3 Broad actions without field control
**Risk:** Clients modify sensitive fields.

**❌ Insecure**
```abap
define behavior for ZI_SalesOrder alias SalesOrder
persistent table zso
lock master
{
  create; update; delete;
  action Approve result [1] $self;  " No field control
}
```

**✅ Secure fix** — Use field control and validations:
```abap
define behavior for ZI_SalesOrder alias SalesOrder
persistent table zso
lock master
{
  create; update; delete;
  field ( readonly ) grossamount, secret_internal_flag;
  validation validate_before_save on save { field customer, grossamount; }
  action Approve result [1] $self;
}
```

---

## 7) Performance / DoS

### 7.1 Unbounded queries and N+1 selects
**Risk:** Easy DoS and timeouts.

**❌ Insecure**
```abap
SELECT * FROM zso INTO TABLE @DATA(lt_so).  " no LIMIT
LOOP AT lt_so INTO DATA(ls_so).
  SELECT * FROM zso_item INTO TABLE @DATA(lt_items) WHERE so = @ls_so-salesorder.  " N+1
ENDLOOP.
```

**✅ Secure fix** — Page results and push work to DB; use associations/joins:
```abap
DATA(max_rows) = 200.
SELECT * FROM zso INTO TABLE @DATA(lt_so)
  UP TO @max_rows ROWS
  WHERE status = @lv_status.

SELECT FROM zso_item AS i
  INNER JOIN @lt_so AS s ON s~salesorder = i~so
  FIELDS i~*
  INTO TABLE @DATA(lt_items_all).
```

---

## 8) Unsafe / Disallowed APIs (Cloud Readiness)

### 8.1 Native SQL and OS calls
**Risk:** Injection and platform violations.

**❌ Insecure**
```abap
EXEC SQL.
  SELECT * FROM ZSO WHERE STATUS = :lv_status
ENDEXEC.

CALL 'SYSTEM' ID 'COMMAND' FIELD 'rm -rf /tmp/*'.
```

**✅ Secure fix** — Use Open SQL/CDS only and released Cloud APIs.
```abap
SELECT * FROM zso INTO TABLE @DATA(lt_so) WHERE status = @lv_status.
```

---

## 9) File/Content Handling in RAP

### 9.1 Insecure ZIP creation and serving
**Risk:** Zip Slip, header injection, and memory exhaustion.

**❌ Insecure**
```abap
LOOP AT lt_files INTO DATA(ls_file).
  lo_zip->add( name = ls_file-filename  " unsanitized
                content = ls_file-content ).
ENDLOOP.
lo_resp->set_header_field( i_name = 'Content-Disposition'
                           i_value = |attachment; filename={ ls_file-filename }| ).
lo_resp->set_body( lo_zip->get_bytes( ) ).  " loads entire zip to memory
```

**✅ Secure fix** — Sanitize names, set safe headers, and stream or cap sizes:
```abap
DATA(total) = 0.
LOOP AT lt_files INTO DATA(ls_file).
  DATA(name) = ls_file-filename.
  REPLACE ALL OCCURRENCES OF '/'  IN name WITH ''.
  REPLACE ALL OCCURRENCES OF '\\' IN name WITH ''.
  REPLACE ALL OCCURRENCES OF '..' IN name WITH ''.
  IF name IS INITIAL. CONTINUE. ENDIF.
  total += xstrlen( ls_file-content ).
  IF total > 10 * 1024 * 1024.  " 10 MB cap
    EXIT.
  ENDIF.
  lo_zip->add( name = name content = ls_file-content ).
ENDLOOP.
lo_resp->set_header_field( i_name = 'Content-Type'              i_value = 'application/zip' ).
lo_resp->set_header_field( i_name = 'X-Content-Type-Options'    i_value = 'nosniff' ).
lo_resp->set_header_field( i_name = 'Content-Disposition'       i_value = |attachment; filename="download.zip"| ).
lo_resp->set_body( lo_zip->get_bytes( ) ).
```

---

## 10) Testing & Governance Gaps

### 10.1 Suppressing ATC findings and skipping tests
**Risk:** Security issues remain undetected.

**❌ Insecure**
```abap
" #EC CI_NOWARN
" #EC NEEDED

CLASS ltcl_noop DEFINITION FOR TESTING RISK LEVEL HARMLESS DURATION SHORT.
  PRIVATE SECTION.
    METHODS dummy_test FOR TESTING.
ENDCLASS.

CLASS ltcl_noop IMPLEMENTATION.
  METHOD dummy_test.
    " no assert — always green
  ENDMETHOD.
ENDCLASS.
```

**✅ Secure fix** — Enable ATC in CI; write real unit & auth tests (example skeleton):
```abap
CLASS ltcl_authz_tests DEFINITION FOR TESTING RISK LEVEL HARMLESS DURATION SHORT.
  PRIVATE SECTION.
    METHODS update_denied_without_role FOR TESTING.
ENDCLASS.

CLASS ltcl_authz_tests IMPLEMENTATION.
  METHOD update_denied_without_role.
    " Arrange: test user without role
    " Act: attempt update
    " Assert: denied
  ENDMETHOD.
ENDCLASS.
```

---

## Quick Secure-by-Default Checklist (RAP)
- [ ] Behavior uses `authorization master (instance)` where required.
- [ ] CDS has DCL; projections hide sensitive fields; no wildcards.
- [ ] Service binding **restricts** operations and expansions.
- [ ] Server enforces **paging** and caps deep `$expand`.
- [ ] No dynamic SQL from user input; all values **bound**.
- [ ] Actions/validators perform strict **input validation**.
- [ ] ETags/`If-Match` respected to prevent **lost updates**.
- [ ] Outbound calls via **destinations**; no secrets in code or logs.
- [ ] Errors are generic to clients; details in protected logs.
- [ ] ATC + unit tests cover auth and negative paths.
- [ ] File handling sanitized; size and type caps; safe headers.
- [ ] **Database modifications include authorization checks**.
- [ ] **Bulk operations use WHERE conditions and limits**.
- [ ] **Logging frameworks mask sensitive data**.
- [ ] **Console output excludes sensitive information**.
- [ ] **MESSAGE statements use generic user-friendly text**.

---

## Fortify Custom Rules Coverage

The following security issues are covered by custom Implemented in Custom Rules in `custom_rules.xml`:

| **Issue** | **Rule ID** | **Rule Type** | **Severity** |
|-----------|-------------|---------------|--------------|
| Missing authorization in DML operations | `ABAP-STRUCTURAL-DML-AUTH-CHECK` | StructuralRule | 5.0 |
| Insecure logging implementation | `ABAP-STRUCTURAL-LOGGING-INSECURE` | StructuralRule | 3.0 |
| Bulk operations without restrictions | `ABAP-STRUCTURAL-DML-BULK-OPERATIONS` | StructuralRule | 3.0 |
| Sensitive data in console output (ADT) | `ABAP-DATAFLOW-SINK-CLASSRUN-WRITE` | DataflowSinkRule | 3.0 |
| Sensitive data in console output (generic) | `ABAP-DATAFLOW-SINK-CLASSRUN-OUT-WRITE` | DataflowSinkRule | 5.0 |
| Sensitive data in MESSAGE statements | `ABAP-DATAFLOW-SINK-MESSAGE` | DataflowSinkRule | 5.0 |
| BALI logging characterization | `ABAP-CHARACTERIZATION-BALI-LOG` | CharacterizationRule | 2.0 |
| MESSAGE passthrough for dataflow | `ABAP-DATAFLOW-PASSTHROUGH-MESSAGE` | DataflowPassthroughRule | - |
| WITH passthrough for dataflow | `ABAP-DATAFLOW-PASSTHROUGH-WITH` | DataflowPassthroughRule | - |
| Missing authorization in CDS views | `RAP-CDL-MISSING-AUTHORIZATION` | RegexRule | 4.0 |
| Sensitive field exposure in projections | `RAP-CDL-SENSITIVE-FIELD-EXPOSURE` | RegexRule | 2.0 |

---

**Note:** Exact APIs and annotations can vary by ABAP platform version. Align with ABAP Cloud **released APIs** and RAP framework guidance in your tenant.

---

## 📚 References & SAP Security Notes

- [ABAP Security Notes – SAP Help Portal](https://help.sap.com/doc/abapdocu_cp_index_htm/CLOUD/en-US/ABENABAP_SECURITY.html)
- [Authorization Control in RAP – SAP Help Portal](https://help.sap.com/docs/abap-cloud/abap-rap/authorization-control)
- [RAP Authorization – ABAP Keyword Documentation](https://help.sap.com/doc/abapdocu_cp_index_htm/CLOUD/en-US/ABENBDL_AUTHORIZATION.html)
- [Authorization Checks Cheat Sheet – GitHub](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/25_Authorization_Checks.md)
- [Implementing Input Field Validation in RAP](https://www.nevergiveuplearning.com/2025/05/implementing-input-field-validation-in.html)
- [SAP RAP Validation and Precheck – Best Practices](https://sachinartani.com/blog/sap-rap-validation-and-precheck)
- [RAP Code Snippets for Validations](https://blog.janschulz.info/rap/code-snippets-for-validations/)
- [Secure Coding in Modern SAP Custom Developments – SAP Community](https://community.sap.com/t5/application-development-and-automation-blog-posts/secure-coding-in-modern-sap-custom-developments/ba-p/13549101)
- [Enhance SAP Code Security – SecurityBridge](https://securitybridge.com/blog/enhancing-sap-code-security/)
- [ABAP RAP Model – SAP Help Portal](https://help.sap.com/docs/abap-cloud/abap-rap/abap-restful-application-programming-model)
- [RAP FAQ – SAP Community](https://community.sap.com/t5/technology-blog-posts-by-sap/abap-restful-application-programming-model-rap-faq/ba-p/13484489)
- [Secure By Default – SAP S/4HANA 2025](https://community.sap.com/t5/technology-blog-posts-by-sap/secure-by-default-sap-s-4hana-2025-the-security-journey-continues/ba-p/14258156)