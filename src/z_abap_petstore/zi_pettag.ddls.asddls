@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Pet Tag CDS View Entity'
@Metadata.ignorePropagatedAnnotations: true
define view entity ZI_PetTag as select from zpet_tag
  association to ZI_PetTagType as _TagType on zpet_tag.tag_id = _TagType.tag_id

{
    
  key pet_id,
  key tag_id,
      _TagType
    
}
