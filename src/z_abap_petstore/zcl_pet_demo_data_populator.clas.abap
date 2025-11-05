CLASS zcl_pet_demo_data_populator DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_oo_adt_classrun.
ENDCLASS.

CLASS zcl_pet_demo_data_populator IMPLEMENTATION.

  METHOD if_oo_adt_classrun~main.

    " Optional: Clear existing demo data
    DELETE FROM zpet_category.
    DELETE FROM zpet_cat_type.
    DELETE FROM zpet_tag.
    DELETE FROM zpet_tag_type.
    DELETE FROM zpet_photo_url.
    DELETE FROM zpet.

    " Declare internal tables
    DATA lt_pet          TYPE STANDARD TABLE OF zpet.
    DATA lt_cat_type     TYPE STANDARD TABLE OF zpet_cat_type.
    DATA lt_pet_category TYPE STANDARD TABLE OF zpet_category.
    DATA lt_photo_url    TYPE STANDARD TABLE OF zpet_photo_url.
    DATA lt_tag_type     TYPE STANDARD TABLE OF zpet_tag_type.
    DATA lt_pet_tag      TYPE STANDARD TABLE OF zpet_tag.

    " Pet Category Types
    APPEND VALUE #( cat_id = 1 name = 'DOG' caturl = 'https://example.com/dog.jpg' ) TO lt_cat_type.
    APPEND VALUE #( cat_id = 2 name = 'CAT' caturl = 'https://example.com/cat.jpg' ) TO lt_cat_type.

    " Tag Types
    APPEND VALUE #( tag_id = 1 name = 'Friendly' ) TO lt_tag_type.
    APPEND VALUE #( tag_id = 2 name = 'Trained' ) TO lt_tag_type.
    APPEND VALUE #( tag_id = 3 name = 'Shy' ) TO lt_tag_type.

    " Pets
    APPEND VALUE #( id = 1 name = 'Buddy' status = 'available' category = 'DOG' ) TO lt_pet.
    APPEND VALUE #( id = 2 name = 'Whiskers' status = 'pending' category = 'CAT' ) TO lt_pet.

    " Photo URLs
    APPEND VALUE #( pet_id = 1 photo_id = 1 photoUrl = 'https://example.com/buddy1.jpg' ) TO lt_photo_url.
    APPEND VALUE #( pet_id = 1 photo_id = 2 photoUrl = 'https://example.com/buddy2.jpg' ) TO lt_photo_url.
    APPEND VALUE #( pet_id = 2 photo_id = 1 photoUrl = 'https://example.com/whiskers1.jpg' ) TO lt_photo_url.

    " Categories
    APPEND VALUE #( pet_id = 1 cat_id = 1 ) TO lt_pet_category.
    APPEND VALUE #( pet_id = 2 cat_id = 2 ) TO lt_pet_category.

    " Pet Tags
    APPEND VALUE #( pet_id = 1 tag_id = 1 ) TO lt_pet_tag.
    APPEND VALUE #( pet_id = 1 tag_id = 2 ) TO lt_pet_tag.
    APPEND VALUE #( pet_id = 2 tag_id = 3 ) TO lt_pet_tag.

    " Insert into database
    INSERT zpet              FROM TABLE @lt_pet.
    INSERT zpet_photo_url    FROM TABLE @lt_photo_url.
    INSERT zpet_cat_type     FROM TABLE @lt_cat_type.
    INSERT zpet_category     FROM TABLE @lt_pet_category.
    INSERT zpet_tag_type     FROM TABLE @lt_tag_type.
    INSERT zpet_tag          FROM TABLE @lt_pet_tag.

    out->write( |Demo data inserted into Pet tables.| ).

  ENDMETHOD.

ENDCLASS.
