CLASS zcl_demo_data_populator DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_oo_adt_classrun.
ENDCLASS.

CLASS zcl_demo_data_populator IMPLEMENTATION.

  METHOD if_oo_adt_classrun~main.

    " Remove existing demo data (optional: restrict to demo keys if needed)
    DELETE FROM zfy_product_txn.
    DELETE FROM zfy_card_txn.
    DELETE FROM zfy_payment_card.
    DELETE FROM zfy_product.

    DATA lt_product       TYPE STANDARD TABLE OF zfy_product.
    DATA lt_payment_card  TYPE STANDARD TABLE OF zfy_payment_card.
    DATA lt_card_txn      TYPE STANDARD TABLE OF zfy_card_txn.
    DATA lt_txn_product   TYPE STANDARD TABLE OF zfy_product_txn.

    DATA lv_encoded       TYPE string.
    DATA lv_plain_text    TYPE string.

    " Populate demo data
    APPEND VALUE #( product_id = '0000000001' name = 'Laptop'     description = 'High-end laptop'           price = '1200.00' currency = 'USD' created_on = sy-datum ) TO lt_product.
    APPEND VALUE #( product_id = '0000000002' name = 'Smartphone' description = 'Latest smartphone'         price = '800.00'  currency = 'USD' created_on = sy-datum ) TO lt_product.
    APPEND VALUE #( product_id = '0000000003' name = 'Headphones' description = 'Noise-cancelling headphones' price = '150.00'  currency = 'USD' created_on = sy-datum ) TO lt_product.

    lv_plain_text = '4111111111111111'.
    out->write( |Plain Card Number: { lv_plain_text }| ).
    lv_encoded = zcl_base64_utility=>encode_text_base64( iv_text = lv_plain_text ).
    out->write( |Encoded Card Number: { lv_encoded }| ).
    APPEND VALUE #( card_id = '0000000001' card_number = lv_encoded cardholder_name = 'Alice Smith' expiry_month = '12' expiry_year = '2025' card_type = 'VISA' created_on = sy-datum ) TO lt_payment_card.

    lv_plain_text = '5500000000000004'.
    out->write( |Plain Card Number: { lv_plain_text }| ).
    lv_encoded = zcl_base64_utility=>encode_text_base64( iv_text = lv_plain_text ).
    out->write( |Encoded Card Number: { lv_encoded }| ).
    APPEND VALUE #( card_id = '0000000002' card_number = lv_encoded cardholder_name = 'Bob Jones'   expiry_month = '06' expiry_year = '2026' card_type = 'MC'   created_on = sy-datum ) TO lt_payment_card.

    APPEND VALUE #( txn_id = '000000000001' card_id = '0000000001' amount = '1350.00' currency = 'USD' txn_date = sy-datum txn_time = sy-uzeit status = 'POSTED'  description = 'Order 1' ) TO lt_card_txn.
    APPEND VALUE #( txn_id = '000000000002' card_id = '0000000002' amount = '800.00'  currency = 'USD' txn_date = sy-datum txn_time = sy-uzeit status = 'PENDING' description = 'Order 2' ) TO lt_card_txn.

    APPEND VALUE #( txn_id = '000000000001' product_id = '0000000001' quantity = '1.00' ) TO lt_txn_product.
    APPEND VALUE #( txn_id = '000000000001' product_id = '0000000003' quantity = '1.00' ) TO lt_txn_product.
    APPEND VALUE #( txn_id = '000000000002' product_id = '0000000002' quantity = '1.00' ) TO lt_txn_product.

    INSERT zfy_product       FROM TABLE @lt_product.
    INSERT zfy_payment_card  FROM TABLE @lt_payment_card.
    INSERT zfy_card_txn      FROM TABLE @lt_card_txn.
    INSERT zfy_product_txn   FROM TABLE @lt_txn_product.

    out->write( |Demo data inserted into ZFY_PRODUCT, ZFY_PAYMENT_CARD, ZZFY_CARD_TXN, and ZFY_PRODUCT_TXN.| ).

  ENDMETHOD.

ENDCLASS.

