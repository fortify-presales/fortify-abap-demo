@EndUserText.label: 'Pet CDS View Entity'
@AccessControl.authorizationCheck: #NOT_REQUIRED
define root view entity ZI_Pet
  as select from zpet
  association [0..1] to ZI_PetCategory as _Category on zpet.id = _Category.pet_id
  association [0..*] to ZI_PetPhotoUrl as _PhotoUrls on zpet.id = _PhotoUrls.pet_id
  association [0..*] to ZI_PetTag as _Tags on zpet.id = _Tags.pet_id
{
  key id,
      name,
      status,
      _Category,
      _PhotoUrls,
      _Tags
}
