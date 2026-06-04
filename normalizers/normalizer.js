/**
 * Normalization Layer
 * Converts ERP-specific formats back into the Unified Schema
 */
const normalizer = {
  normalize: (data, erpType) => {
    if (!erpType) return data; // Already unified
    
    switch (erpType.toLowerCase()) {
      case 'odoo':
        return normalizer.fromOdoo(data);
      case 'sap':
        return normalizer.fromSAP(data);
      case 'oracle':
        return normalizer.fromOracle(data);
      default:
        return data;
    }
  },

  fromOdoo: (data) => {
    // Logic to handle arrays of different types
    if (Array.isArray(data)) {
      return data.map(item => {
        if (item.display_name) { // Product
          return {
            _id: item.id,
            name: item.display_name,
            category: item.categ_id[1],
            price: item.list_price,
            createdAt: item.create_date
          };
        }
        if (item.qty_available !== undefined) { // Inventory
          return {
            _id: item.id,
            productId: item.product_id[0],
            productName: item.product_id[1],
            quantity: item.qty_available,
            reorderLevel: item.reorder_trigger,
            updatedAt: item.write_date
          };
        }
        if (item.date_order) { // Sale
          return {
            _id: item.id,
            productId: item.product_id[0],
            productName: item.product_id[1],
            quantity: item.product_uom_qty,
            totalPrice: item.price_total,
            date: item.date_order
          };
        }
        return item;
      });
    }
    return data;
  },

  fromSAP: (data) => {
    if (Array.isArray(data)) {
      return data.map(item => {
        if (item.MaterialName) { // Product
          return {
            _id: item.MaterialID,
            name: item.MaterialName,
            category: item.ProductGroup,
            price: item.NetPrice,
            createdAt: item.CreationDate
          };
        }
        if (item.UnrestrictedStock !== undefined) { // Inventory
          return {
            _id: item.StockID,
            productId: item.MaterialID,
            productName: item.MaterialDescription,
            quantity: item.UnrestrictedStock,
            reorderLevel: item.SafetyStock,
            updatedAt: item.LastUpdate
          };
        }
        if (item.SalesDate) { // Sale
          return {
            _id: item.SalesOrderID,
            productId: item.MaterialID,
            productName: item.MaterialName || 'Direct Sale',
            quantity: item.OrderQuantity,
            totalPrice: item.NetAmount,
            date: item.SalesDate,
            region: item.Region || 'North'
          };
        }
        return item;
      });
    }
    return data;
  },

  fromOracle: (data) => {
    if (Array.isArray(data)) {
      return data.map(item => {
        if (item.item_description) { // Product
          return {
            _id: item.item_id,
            name: item.item_description,
            category: item.item_class,
            price: item.unit_selling_price,
            createdAt: item.creation_date
          };
        }
        if (item.on_hand_quantity !== undefined) { // Inventory
          return {
            _id: item.inv_item_id,
            quantity: item.on_hand_quantity,
            reorderLevel: item.reorder_point,
            updatedAt: item.last_update_date
          };
        }
        if (item.order_date) { // Sale
          return {
            _id: item.order_number,
            productId: item.inventory_item_id,
            quantity: item.ordered_quantity,
            totalPrice: item.extended_price,
            date: item.order_date
          };
        }
        return item;
      });
    }
    return data;
  }
};

module.exports = normalizer;
