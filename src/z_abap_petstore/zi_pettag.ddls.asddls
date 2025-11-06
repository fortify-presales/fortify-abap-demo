@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Pet Tag CDS View Entity'
define view entity ZI_PetTag as select from zpet_tag
  association to parent ZI_Pet as _Pet on $projection.pet_id = _Pet.id
  association [1..1] to ZI_PetTagType as _TagType on $projection.tag_id = _TagType.tag_id
{
  key pet_id,
  key tag_id,
      _Pet,
      _TagType
}
