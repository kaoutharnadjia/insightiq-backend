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
        // If it's already in unified format (has _id, etc.), return it as-is
        if (item._id) return item;
        
        if (item.display_name) { // Product
          return {
            _id: item._id || item.id,
            name: item.display_name,
            category: item.category || item.categ_id?.[1] || 'Uncategorized',
            price: item.price || item.list_price,
            createdAt: item.createdAt || item.create_date
          };
        }
        if (item.qty_available !== undefined) { // Inventory
          return {
            _id: item._id || item.id,
            productId: item.productId || item.product_id?.[0],
            productName: item.productName || item.product_id?.[1] || 'Unknown Product',
            quantity: item.quantity || item.qty_available,
            reorderLevel: item.reorderLevel || item.reorder_trigger,
            updatedAt: item.updatedAt || item.write_date
          };
        }
        if (item.date_order) { // Sale
          return {
            _id: item._id || item.id,
            productId: item.productId || item.product_id?.[0],
            productName: item.productName || item.product_id?.[1] || 'Direct Sale',
            quantity: item.quantity || item.product_uom_qty,
            totalPrice: item.totalPrice || item.price_total,
            date: item.date || item.date_order,
            region: item.region || 'North'
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
        // If it's already in unified format (has _id, etc.), return it as-is
        if (item._id) return item;
        
        if (item.MaterialName) { // Product
          return {
            _id: item._id || item.MaterialID,
            name: item.name || item.MaterialName,
            category: item.category || item.ProductGroup || 'Uncategorized',
            price: item.price !== undefined ? item.price : item.NetPrice,
            createdAt: item.createdAt || item.CreationDate
          };
        }
        if (item.UnrestrictedStock !== undefined) { // Inventory
          return {
            _id: item._id || item.StockID,
            productId: item.productId || item.MaterialID,
            productName: item.productName || item.MaterialDescription || 'Unknown Product',
            quantity: item.quantity !== undefined ? item.quantity : item.UnrestrictedStock,
            reorderLevel: item.reorderLevel !== undefined ? item.reorderLevel : item.SafetyStock,
            updatedAt: item.updatedAt || item.LastUpdate
          };
        }
        if (item.SalesDate) { // Sale
          return {
            _id: item._id || item.SalesOrderID,
            productId: item.productId || item.MaterialID,
            productName: item.productName || item.MaterialName || 'Direct Sale',
            quantity: item.quantity !== undefined ? item.quantity : item.OrderQuantity,
            totalPrice: item.totalPrice !== undefined ? item.totalPrice : item.NetAmount,
            date: item.date || item.SalesDate,
            region: item.region || item.Region || 'North'
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
        // If it's already in unified format (has _id, etc.), return it as-is
        if (item._id) return item;
        
        if (item.item_description) { // Product
          return {
            _id: item._id || item.item_id,
            name: item.name || item.item_description,
            category: item.category || item.item_class || 'Uncategorized',
            price: item.price !== undefined ? item.price : item.unit_selling_price,
            createdAt: item.createdAt || item.creation_date
          };
        }
        if (item.on_hand_quantity !== undefined) { // Inventory
          return {
            _id: item._id || item.inv_item_id,
            productId: item.productId || item.inv_item_id,
            productName: item.productName || item.item_description || 'Unknown Product',
            quantity: item.quantity !== undefined ? item.quantity : item.on_hand_quantity,
            reorderLevel: item.reorderLevel !== undefined ? item.reorderLevel : item.reorder_point,
            updatedAt: item.updatedAt || item.last_update_date
          };
        }
        if (item.order_date) { // Sale
          return {
            _id: item._id || item.order_number,
            productId: item.productId || item.inventory_item_id,
            productName: item.productName || item.item_description || 'Direct Sale',
            quantity: item.quantity !== undefined ? item.quantity : item.ordered_quantity,
            totalPrice: item.totalPrice !== undefined ? item.totalPrice : item.extended_price,
            date: item.date || item.order_date,
            region: item.region || 'North'
          };
        }
        return item;
      });
    }
    return data;
  }
};

module.exports = normalizer;
