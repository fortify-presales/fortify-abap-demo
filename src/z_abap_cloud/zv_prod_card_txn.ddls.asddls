@AccessControl.authorizationCheck: #NOT_REQUIRED
@Metadata.allowExtensions: true
@EndUserText.label: 'Products, Cards and Transactions'
define view entity zv_prod_card_txn as select from zfy_product_txn
  inner join zfy_product           on zfy_product_txn.product_id = zfy_product.product_id
  inner join zfy_card_txn  on zfy_product_txn.txn_id    = zfy_card_txn.txn_id
  inner join zfy_payment_card      on zfy_card_txn.card_id = zfy_payment_card.card_id
{
  key zfy_product_txn.txn_id,
  key zfy_product.product_id,
  key zfy_payment_card.card_id,
  zfy_card_txn.txn_date,
  zfy_card_txn.txn_time,
  zfy_card_txn.amount,
  zfy_card_txn.currency,
  zfy_card_txn.status,
  zfy_card_txn.description,
  zfy_product.name      as product_name,
  zfy_product.price,
  zfy_product.currency  as product_currency,
  zfy_product_txn.quantity,
  zfy_payment_card.cardholder_name
}
